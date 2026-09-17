import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// High body limits to support image attachments (base64 encoded pictures)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Lazy GoogleGenAI client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// System instruction for interior design & structural AI
const SYSTEM_INSTRUCTION = `You are an expert AI Architectural Designer, Interior Stylist, and spatial planner for an interactive 3D Architectural Studio web application.
Your role is to understand user requests in natural language, analyze attached room images/photos/sketches, and return:
1. A conversational, clear, helpful response explaining your advice, how the user can do it themselves in the UI, or what you changed.
2. Concrete, executable actions to ADD or REMOVE furniture items, UPDATE_ROOM finishes, UPDATE_MASJID_STRUCTURAL framing parameters, or OPEN_STRUCTURAL_MODAL so the user can edit controls directly.

Structural / Architectural Framework capabilities:
- Center column spacing in feet (e.g. 20 ft clear span between left and right column lines, door columns, and Qibla columns).
- Main entrance door columns (C-Gate L & R) and Qibla wall columns (C-Qibla L & R) (default 450mm x 450mm).
- Two parallel longitudinal beams (B-Long L & R) (450mm width x 900mm depth) resting on door columns and Qibla columns at 5761mm elevation, tying all transverse roof beams (B1-B6) with 20 ft clear span.
- Tie beams at 13 ft elevation (150mm x 450mm).
- If the user asks how to do something themselves in the app, explain step-by-step:
  1) Click the 'Walls' or 'Columns & Beams' button in the top toolbar.
  2) In the modal, use the interactive sliders and number inputs for Column Spacing (e.g. 20 ft), Door/Qibla Columns (450x450mm), Longitudinal Beams (450x900mm @ 5761mm), and Tie Beams (13 ft).
  3) Changes update instantly in the 3D scene and 2D CAD blueprint!
  And include the action: { "type": "OPEN_STRUCTURAL_MODAL" }

Available catalog item modelTypes and categories:
- living: 'sectional-l-sofa', 'linear-couch-3seat', 'lounge-armchair', 'coffee-table-minimal', 'media-credenza-tv', 'open-bookshelf', 'arc-floor-lamp', 'area-rug-woven'
- bedroom: 'king-upholstered-bed', 'queen-platform-bed', 'nightstand-lamp', 'modern-wardrobe', 'vanity-mirror'
- dining: 'dining-table-wishbone', 'kitchen-island-stools', 'sink-cabinet', 'refrigerator-french'
- office: 'executive-desk-laptop', 'swivel-chair-mesh', 'low-credenza'
- decor: 'potted-monstera', 'fiddle-leaf-fig', 'abstract-gallery-canvas', 'halo-ring-chandelier', 'soaking-bathtub', 'picture-window', 'interior-door'

Flooring options: 'natural-oak', 'herringbone', 'dark-walnut', 'carrara-marble', 'polished-concrete', 'wool-carpet', 'terracotta'

You MUST respond strictly with a valid JSON object.`;

// Endpoint: Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Endpoint: AI Asking Bar (Text + Image query)
app.post('/api/ai/ask', async (req, res) => {
  try {
    const {
      message = '',
      image, // { data: string (base64), mimeType: string }
      roomConfig = {},
      currentItems = [],
      catalog = [],
    } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    const ai = getGenAI();

    const mCfg = roomConfig.masjidConfig || {};
    // Context summary for the model
    const roomContextText = `Current Room & Structural Framing:
- Dimensions: Width ${roomConfig.width || 7}m, Length ${roomConfig.length || 6}m, Height ${roomConfig.height || 2.8}m
- Flooring: ${roomConfig.flooring || 'natural-oak'}
- Base wall color: ${roomConfig.baseWallColor || '#f7f6f2'}
- Structural Framing / Masjid Parameters:
  * Central Column Spacing: ${mCfg.columnSpacingFeet || 20} ft (${((mCfg.columnSpacingFeet || 20) * 0.3048).toFixed(2)}m)
  * Door / Gate Columns: ${mCfg.hasGateColumns !== false ? 'Enabled' : 'Disabled'} (${mCfg.gateColumnWidthMm || 450}x${mCfg.gateColumnDepthMm || 450}mm @ 5761mm)
  * Qibla Wall Columns: ${mCfg.hasQiblaColumns !== false ? 'Enabled' : 'Disabled'} (${mCfg.qiblaColumnWidthMm || 450}x${mCfg.qiblaColumnDepthMm || 450}mm @ 5761mm)
  * Longitudinal Beams: ${mCfg.hasTwoLongitudinalBeams !== false ? 'Enabled (2 beams resting on door and Qibla columns)' : 'Disabled'} (${mCfg.longitudinalBeamWidthMm || 450}x${mCfg.longitudinalBeamDepthMm || 900}mm @ ${mCfg.mainBeamElevationMm || 5761}mm)
  * Transverse Roof Beams: ${mCfg.showMainBeams !== false ? 'Enabled (B1-B6)' : 'Disabled'} (${mCfg.mainBeamWidthMm || 450}x${mCfg.mainBeamDepthMm || 900}mm)
  * Tie Beams: ${mCfg.showTieBeams !== false ? 'Enabled' : 'Disabled'} (${mCfg.tieBeamWidthMm || 150}x${mCfg.tieBeamHeightMm || 450}mm @ ${mCfg.tieBeamHeightFt || 13}ft)
- Placed Furniture Items (${currentItems.length} total):
${
  currentItems.length === 0
    ? 'None (empty room)'
    : currentItems
        .map(
          (it: any) =>
            `- ID: "${it.id}", Name: "${it.name}", Type: "${it.modelType}", Category: "${it.category}", Position: [${it.position?.join(', ')}], Color: "${it.color}"`
        )
        .join('\n')
}`;

    // If Gemini API Key is available, try Gemini model
    if (ai && apiKey) {
      try {
        const parts: any[] = [];

        // If user attached an image, pass inlineData
        if (image && image.data) {
          // Strip data:image/...;base64, prefix if present
          let cleanBase64 = image.data;
          let mimeType = image.mimeType || 'image/jpeg';
          if (cleanBase64.includes(',')) {
            const split = cleanBase64.split(',');
            cleanBase64 = split[1];
            const match = split[0].match(/:(.*?);/);
            if (match) mimeType = match[1];
          }

          parts.push({
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          });
        }

        const promptText = `User Request: "${message || (image ? 'Please analyze this photo and update the room according to the style and furniture shown.' : 'Suggest improvements for this room.')}"

${roomContextText}

Respond with a JSON object in this exact schema:
{
  "reply": "Your conversational designer advice and clear explanation of changes or step-by-step guidance",
  "actions": [
    {
      "type": "ADD" | "REMOVE" | "UPDATE_ROOM" | "CLEAR_ALL" | "UPDATE_MASJID_STRUCTURAL" | "OPEN_STRUCTURAL_MODAL",
      "catalogItemId": "matching modelType ID from catalog",
      "name": "Display name of item",
      "position": [x, y, z],
      "rotationY": 0,
      "color": "#hexcolor",
      "targetItemId": "ID of item to remove (if type is REMOVE)",
      "targetItemName": "Name or pattern of item to remove",
      "roomUpdates": {
        "flooring": "flooring type",
        "baseWallColor": "#hex",
        "accentColor": "#hex"
      },
      "masjidUpdates": {
        "columnSpacingFeet": 20,
        "hasGateColumns": true,
        "gateColumnWidthMm": 450,
        "gateColumnDepthMm": 450,
        "hasQiblaColumns": true,
        "qiblaColumnWidthMm": 450,
        "qiblaColumnDepthMm": 450,
        "hasTwoLongitudinalBeams": true,
        "longitudinalBeamWidthMm": 450,
        "longitudinalBeamDepthMm": 900,
        "mainBeamElevationMm": 5761,
        "showMainBeams": true,
        "mainBeamWidthMm": 450,
        "mainBeamDepthMm": 900,
        "showTieBeams": true,
        "tieBeamHeightFt": 13,
        "tieBeamWidthMm": 150,
        "tieBeamHeightMm": 450
      }
    }
  ],
  "detectedStyleOrObjects": ["list", "of", "detected", "items", "or", "styles"]
}`;

        parts.push({ text: promptText });

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts }],
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });

        const responseText = response.text || '{}';
        try {
          const parsed = JSON.parse(responseText);
          return res.json({
            success: true,
            reply: parsed.reply || 'Here are the design updates for your room.',
            actions: parsed.actions || [],
            detectedStyleOrObjects: parsed.detectedStyleOrObjects || [],
          });
        } catch (parseErr) {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return res.json({
              success: true,
              reply: parsed.reply || 'Here are your requested changes.',
              actions: parsed.actions || [],
              detectedStyleOrObjects: parsed.detectedStyleOrObjects || [],
            });
          }
        }
      } catch (geminiErr: any) {
        console.warn('Gemini API call warning, continuing with local parser:', geminiErr?.message || geminiErr);
        // Do not throw; proceed down to smart local parser!
      }
    }

    // Smart Local Fallback Parser when API key is not yet set or during network fallback
    // Handles natural language commands like "how can I do it myself", "set column spacing to 20 feet", "add two longitudinal beams", etc.
    const lower = (message || '').toLowerCase();
    const actions: any[] = [];
    let reply = '';
    const detected: string[] = [];

    if (image) {
      detected.push('Attached Visual Reference');
    }

    // 1. Check if the user is asking HOW TO DO IT THEMSELVES
    if (
      lower.includes('my self') ||
      lower.includes('myself') ||
      lower.includes('by myself') ||
      lower.includes('how can i do') ||
      lower.includes('how to do') ||
      lower.includes('how do i') ||
      lower.includes('where to change') ||
      lower.includes('how to change') ||
      lower.includes('how can i edit') ||
      lower.includes('how to edit')
    ) {
      reply = `You can easily configure all structural framing elements yourself directly in the app!

1. Open Framing Suite: Click the 'Walls' button or 'Columns & Beams' button in the top navigation bar.
2. Center Column Spacing: Use the interactive slider or number input to set any clear span (e.g. 20 ft, 16 ft, 24 ft).
3. Door & Qibla Columns: Toggle or customize the dimensions (default 450mm × 450mm) for C-Gate and C-Qibla columns.
4. Two Longitudinal Beams: Enable/disable the two beams resting directly on the door and Qibla columns, and set width (450mm), depth (900mm), and elevation (5761mm).
5. 13 ft Tie Beams: Adjust the tie beam elevation (13 ft) and section sizes (150×450mm).

Click the button below to open the Structural Framing Editor right now, or simply ask me to adjust any parameter anytime!`;
      actions.push({ type: 'OPEN_STRUCTURAL_MODAL' });
    }
    // 2. Structural Column Spacing command (e.g. "change column spacing to 20 feet", "20 ft spacing", "set spacing 24 ft")
    else if (
      (lower.includes('spacing') || lower.includes('column') || lower.includes('bay')) &&
      (lower.includes('foot') || lower.includes('feet') || lower.includes('ft') || /\b\d+\s*ft\b/.test(lower) || /\b\d+\s*feet\b/.test(lower))
    ) {
      const match = lower.match(/(\d+(?:\.\d+)?)\s*(?:feet|foot|ft)/);
      const spacingFeet = match ? parseFloat(match[1]) : 20;
      actions.push({
        type: 'UPDATE_MASJID_STRUCTURAL',
        masjidUpdates: {
          columnSpacingFeet: spacingFeet,
          hasGateColumns: true,
          hasQiblaColumns: true,
          hasTwoLongitudinalBeams: true,
          hasCentralSpineBeam: true,
        },
      });
      reply = `I have set the central column spacing to ${spacingFeet} feet (${(spacingFeet * 0.3048).toFixed(2)}m) and aligned the door columns, Qibla columns, and longitudinal beams to this 20 ft clear span.`;
    }
    // 3. Longitudinal Beams command (e.g. "add two longitudinal beams", "beams resting on columns", "two beams on door and qibla")
    else if (
      (lower.includes('beam') || lower.includes('neam')) &&
      (lower.includes('longitudinal') || lower.includes('two beam') || lower.includes('2 beam') || lower.includes('rest') || lower.includes('qibla') || lower.includes('door') || lower.includes('gate'))
    ) {
      const is450x900 = lower.includes('450') || lower.includes('900');
      actions.push({
        type: 'UPDATE_MASJID_STRUCTURAL',
        masjidUpdates: {
          hasTwoLongitudinalBeams: true,
          hasCentralSpineBeam: true,
          hasGateColumns: true,
          hasQiblaColumns: true,
          longitudinalBeamWidthMm: 450,
          longitudinalBeamDepthMm: 900,
          mainBeamElevationMm: 5761,
          showMainBeams: true,
        },
      });
      reply = `I have configured the two longitudinal beams (450mm width × 900mm depth) resting on the two entrance door columns and two Qibla columns at 5761mm elevation, tying all transverse roof beams along the way.`;
    }
    // 4. Tie Beam command (e.g. "tie beam at 13 ft", "show tie beams", "13 feet tie beam")
    else if (lower.includes('tie beam') || (lower.includes('tie') && lower.includes('13'))) {
      actions.push({
        type: 'UPDATE_MASJID_STRUCTURAL',
        masjidUpdates: {
          showTieBeams: true,
          tieBeamHeightFt: 13,
          tieBeamWidthMm: 150,
          tieBeamHeightMm: 450,
        },
      });
      reply = `I have enabled the perimeter tie beams (150mm × 450mm) at 13 ft elevation tying all columns together.`;
    }
    // 5. Door & Qibla columns command (e.g. "add two columns on main gate", "columns on qibla")
    else if (
      (lower.includes('column') || lower.includes('pillar')) &&
      (lower.includes('gate') || lower.includes('door') || lower.includes('qibla'))
    ) {
      actions.push({
        type: 'UPDATE_MASJID_STRUCTURAL',
        masjidUpdates: {
          hasGateColumns: true,
          hasQiblaColumns: true,
          gateColumnWidthMm: 450,
          gateColumnDepthMm: 450,
          qiblaColumnWidthMm: 450,
          qiblaColumnDepthMm: 450,
        },
      });
      reply = `I have configured the two main entrance door columns (C-Gate L & R) and two Qibla wall columns (C-Qibla L & R) with 450mm × 450mm sections, separated by 20 ft.`;
    }
    // 6. Check for clear all
    if (lower.includes('clear all') || lower.includes('remove all') || lower.includes('empty room') || lower.includes('delete all')) {
      actions.push({ type: 'CLEAR_ALL' });
      reply = 'I have cleared all furniture items from your room layout so you can start fresh.';
    }
    // Check for specific removal
    else if (lower.includes('remove') || lower.includes('delete') || lower.includes('take away') || lower.includes('drop')) {
      const removedItems: string[] = [];
      currentItems.forEach((it: any) => {
        const itName = it.name.toLowerCase();
        const itCat = it.category.toLowerCase();
        const itType = it.modelType.toLowerCase();
        if (
          lower.includes(itName) ||
          lower.includes(itCat) ||
          lower.includes(itType) ||
          (lower.includes('sofa') && itType.includes('sofa')) ||
          (lower.includes('couch') && itType.includes('couch')) ||
          (lower.includes('chair') && (itType.includes('chair') || itType.includes('armchair'))) ||
          (lower.includes('table') && itType.includes('table')) ||
          (lower.includes('rug') && itType.includes('rug')) ||
          (lower.includes('plant') && (itType.includes('plant') || itType.includes('monstera') || itType.includes('fig'))) ||
          (lower.includes('lamp') && itType.includes('lamp')) ||
          (lower.includes('bed') && itType.includes('bed')) ||
          (lower.includes('window') && itType.includes('window')) ||
          (lower.includes('door') && itType.includes('door')) ||
          (lower.includes('partition') && itType.includes('partition'))
        ) {
          actions.push({
            type: 'REMOVE',
            targetItemId: it.id,
            targetItemName: it.name,
          });
          removedItems.push(it.name);
        }
      });

      if (actions.length > 0) {
        reply = `I have removed ${removedItems.join(', ')} from the room.`;
      } else {
        reply = `I couldn't find an item matching that in your room. Current items: ${currentItems.map((i: any) => i.name).join(', ')}.`;
      }
    }
    // Check for architectural tools / door / window requests or adding items
    else if (
      lower.includes('door') ||
      lower.includes('window') ||
      lower.includes('tool') ||
      lower.includes('add') ||
      lower.includes('place') ||
      lower.includes('put') ||
      lower.includes('insert') ||
      lower.includes('make') ||
      lower.includes('folder') ||
      lower.includes('product') ||
      image
    ) {
      const addedNames: string[] = [];

      // Check catalog & architectural matches
      const catalogMatches = [
        { key: 'door', id: 'interior-door', name: 'Architectural Timber Interior Door', pos: [2.0, 0, -2.85] },
        { key: 'french door', id: 'french-double-door', name: 'Double French Glass Doors', pos: [0, 0, -2.85] },
        { key: 'sliding door', id: 'sliding-barn-door', name: 'Modern Sliding Barn Door', pos: [-1.8, 0, -2.85] },
        { key: 'barn door', id: 'sliding-barn-door', name: 'Modern Sliding Barn Door', pos: [-1.8, 0, -2.85] },
        { key: 'window', id: 'picture-window', name: 'Black Steel Architectural Picture Window', pos: [-1.5, 0.4, -2.85] },
        { key: 'casement', id: 'casement-window', name: 'Double French Casement Window', pos: [1.5, 0.5, -2.85] },
        { key: 'panoramic', id: 'panoramic-glass-window', name: 'Floor-to-Ceiling Panoramic Glass Window', pos: [0, 0, -2.85] },
        { key: 'partition', id: 'fluted-wood-divider', name: 'Fluted Timber Room Divider Screen', pos: [0, 0, 0.5] },
        { key: 'divider', id: 'fluted-wood-divider', name: 'Fluted Timber Room Divider Screen', pos: [0, 0, 0.5] },
        { key: 'fireplace', id: 'modern-linear-fireplace', name: 'Modern Recessed Linear Fireplace', pos: [0, 0, -2.8] },
        { key: 'column', id: 'architectural-pillar', name: 'Architectural Structural Column', pos: [2.2, 0, 1.8] },
        { key: 'pillar', id: 'architectural-pillar', name: 'Architectural Structural Column', pos: [2.2, 0, 1.8] },
        { key: 'beam', id: 'architectural-ceiling-beam', name: 'Exposed Timber Ceiling Beam', pos: [0, 2.7, 0] },
        { key: 'sofa', id: 'sectional-l-sofa', name: 'Nordic L-Shape Sectional Sofa', pos: [0, 0, 0] },
        { key: 'couch', id: 'linear-couch-3seat', name: 'Linear 3-Seater Tailored Couch', pos: [0, 0, 0.5] },
        { key: 'armchair', id: 'lounge-armchair', name: 'Curved Shell Lounge Armchair', pos: [1.8, 0, 0] },
        { key: 'chair', id: 'lounge-armchair', name: 'Curved Shell Lounge Armchair', pos: [1.8, 0, 0] },
        { key: 'coffee table', id: 'coffee-table-minimal', name: 'Sculptural Marble Coffee Table', pos: [0, 0, 1.2] },
        { key: 'table', id: 'dining-table-wishbone', name: 'Solid Timber Dining Set & Chairs', pos: [0, 0, 0] },
        { key: 'rug', id: 'area-rug-woven', name: 'Artisan Textured Area Rug', pos: [0, 0, 0.6] },
        { key: 'lamp', id: 'arc-floor-lamp', name: 'Monumental Brass Arc Floor Lamp', pos: [-2.0, 0, -1.0] },
        { key: 'plant', id: 'potted-monstera', name: 'Potted Monstera Deliciosa', pos: [-2.2, 0, 1.8] },
        { key: 'monstera', id: 'potted-monstera', name: 'Potted Monstera Deliciosa', pos: [-2.2, 0, 1.8] },
        { key: 'tree', id: 'fiddle-leaf-fig', name: 'Fiddle Leaf Fig Tree', pos: [2.2, 0, -1.8] },
        { key: 'tv', id: 'media-credenza-tv', name: 'Fluted Media Credenza & OLED TV', pos: [0, 0, -2.4] },
        { key: 'credenza', id: 'media-credenza-tv', name: 'Fluted Media Credenza & OLED TV', pos: [0, 0, -2.4] },
        { key: 'bed', id: 'king-upholstered-bed', name: 'King Upholstered Wingback Bed', pos: [0, 0, -1.2] },
        { key: 'desk', id: 'executive-desk-laptop', name: 'Executive Timber Desk with Laptop', pos: [0, 0, 0] },
        { key: 'chandelier', id: 'halo-ring-chandelier', name: 'Floating Brass Halo Ring Chandelier', pos: [0, 2.2, 0] },
        { key: 'mirror', id: 'vanity-mirror', name: 'Dressing Vanity Table & Halo Mirror', pos: [2.2, 0, 0] },
        { key: 'art', id: 'abstract-gallery-canvas', name: 'Framed Abstract Gallery Canvas', pos: [0, 1.4, -2.8] },
        { key: 'painting', id: 'abstract-gallery-canvas', name: 'Framed Abstract Gallery Canvas', pos: [0, 1.4, -2.8] },
      ];

      for (const match of catalogMatches) {
        if (lower.includes(match.key)) {
          const jitterX = (Math.random() - 0.5) * 0.3;
          const jitterZ = (Math.random() - 0.5) * 0.3;
          actions.push({
            type: 'ADD',
            catalogItemId: match.id,
            name: match.name,
            position: [
              parseFloat((match.pos[0] + jitterX).toFixed(2)),
              match.pos[1],
              parseFloat((match.pos[2] + jitterZ).toFixed(2)),
            ],
            rotationY: 0,
          });
          addedNames.push(match.name);
        }
      }

      if (lower.includes('tools for making doors') || (lower.includes('door') && lower.includes('window') && actions.length === 0)) {
        actions.push(
          {
            type: 'ADD',
            catalogItemId: 'interior-door',
            name: 'Architectural Timber Interior Door',
            position: [2.0, 0, -2.85],
            rotationY: 0,
          },
          {
            type: 'ADD',
            catalogItemId: 'picture-window',
            name: 'Black Steel Architectural Picture Window',
            position: [-1.2, 0.4, -2.85],
            rotationY: 0,
          }
        );
        reply = 'I have placed an architectural door and picture window on the wall! You can also use the "Doors & Windows" architectural builder tool in the top toolbar to configure custom dimensions, mullions, and swing styles, or pick custom products from any folder.';
      } else if (actions.length > 0) {
        reply = `Added ${addedNames.join(' and ')} to your 3D room. You can also customize doors, windows, and architectural elements with the Doors & Windows tool, or import products from your computer's folders.`;
      } else if (image) {
        actions.push(
          {
            type: 'ADD',
            catalogItemId: 'lounge-armchair',
            name: 'Curved Shell Lounge Armchair',
            position: [1.8, 0, 0.4],
            rotationY: 315,
          },
          {
            type: 'ADD',
            catalogItemId: 'potted-monstera',
            name: 'Potted Monstera Deliciosa',
            position: [-2.2, 0, 1.5],
            rotationY: 0,
          }
        );
        reply = 'Based on your visual reference photo, I selected pieces that elevate organic textures and balanced focal points, adding an accent armchair and lush botanicals.';
      } else {
        reply = 'You can use the new "Doors & Windows" builder tool in the toolbar to create custom doors and windows, or click "Import Folder" to pick products from any folder on your computer and place them here!';
      }
    }
    // Room styling / finish updates
    else if (lower.includes('floor') || lower.includes('wall') || lower.includes('color') || lower.includes('paint')) {
      let newFlooring: string | undefined;
      let newWall: string | undefined;

      if (lower.includes('herringbone')) newFlooring = 'herringbone';
      else if (lower.includes('walnut') || lower.includes('dark wood')) newFlooring = 'dark-walnut';
      else if (lower.includes('marble')) newFlooring = 'carrara-marble';
      else if (lower.includes('concrete')) newFlooring = 'polished-concrete';
      else if (lower.includes('carpet')) newFlooring = 'wool-carpet';
      else if (lower.includes('terracotta') || lower.includes('tile')) newFlooring = 'terracotta';
      else if (lower.includes('oak')) newFlooring = 'natural-oak';

      if (lower.includes('sage') || lower.includes('green')) newWall = '#556b2f';
      else if (lower.includes('navy') || lower.includes('blue')) newWall = '#1e293b';
      else if (lower.includes('warm') || lower.includes('beige')) newWall = '#f5f0eb';
      else if (lower.includes('charcoal') || lower.includes('dark')) newWall = '#33383f';
      else if (lower.includes('white')) newWall = '#fafafa';

      if (newFlooring || newWall) {
        actions.push({
          type: 'UPDATE_ROOM',
          roomUpdates: {
            flooring: newFlooring,
            baseWallColor: newWall,
          },
        });
        reply = `Updated room finishes: ${[newFlooring ? `flooring to ${newFlooring}` : '', newWall ? `wall color to ${newWall}` : ''].filter(Boolean).join(' and ')}.`;
      } else {
        reply = 'You can change flooring to natural oak, herringbone, dark walnut, marble, concrete, or carpet, and set wall paint colors.';
      }
    } else {
      reply = `I am your AI Interior Designer. You can ask me to add or remove specific furniture pieces (e.g. "Add a coffee table and floor lamp", "Remove the rug"), change room finishes, or attach an inspirational photo for visual styling!`;
    }

    return res.json({
      success: true,
      reply,
      actions,
      detectedStyleOrObjects: detected,
    });
  } catch (error: any) {
    console.error('AI ask endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process AI design request',
      reply: 'Encountered an issue processing that request. Please try a different query or attach another image.',
      actions: [],
    });
  }
});

// Vite middleware for development & static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`3D Interior Design Studio server running on port ${PORT}`);
  });
}

startServer();
