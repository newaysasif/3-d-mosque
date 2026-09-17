import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Paperclip,
  Send,
  X,
  Camera,
  ChevronUp,
  ChevronDown,
  Trash2,
  CheckCircle2,
  PlusCircle,
  MinusCircle,
  Paintbrush,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  Minimize2,
  Hammer,
  Sliders,
  Columns,
} from 'lucide-react';
import { AIAction, ChatMessage, PlacedFurnitureItem, RoomConfig } from '../types';

interface AskingBarProps {
  roomConfig: RoomConfig;
  currentItems: PlacedFurnitureItem[];
  onExecuteActions: (actions: AIAction[], responseSummary: string) => void;
  onCaptureViewport?: () => string | null;
  onOpenStructuralEditor?: () => void;
}

const QUICK_PROMPTS = [
  '🛠️ How do I edit columns & beams myself?',
  '📐 Set column spacing to 20 feet',
  '🏛️ Configure 2 longitudinal beams (450x900mm)',
  '🚪 Set door & Qibla columns (450x450mm)',
  '🏗️ Show 13ft perimeter tie beams',
  '🛋️ Add a modern sectional sofa',
  '🪵 Change floor to herringbone',
  '🧹 Clear all furniture',
];

function parseQueryLocally(
  prompt: string,
  currentItems: PlacedFurnitureItem[],
  onOpenStructuralEditor?: () => void
): { reply: string; actions: AIAction[] } {
  const lower = prompt.toLowerCase();

  // Check self-service instructions
  if (
    lower.includes('my self') ||
    lower.includes('myself') ||
    lower.includes('by myself') ||
    lower.includes('how can i do') ||
    lower.includes('how to do') ||
    lower.includes('how do i') ||
    lower.includes('how to change') ||
    lower.includes('where to change') ||
    lower.includes('how can i edit')
  ) {
    if (onOpenStructuralEditor) {
      onOpenStructuralEditor();
    }
    return {
      reply: `You can easily adjust columns, beams, and spacing yourself directly in the app!

1. Open Framing Suite: Click the 'Walls' button or the hammer icon in the top toolbar (or right here in this chat).
2. Central Column Spacing: Use the slider or number box to set 20 ft (or any span from 12 ft to 36 ft).
3. Door & Qibla Columns: Adjust the section sizes (default 450mm × 450mm) and toggles.
4. Two Longitudinal Beams: Set the 450mm width × 900mm depth beams running continuously from the door columns to the Qibla columns at 5761mm elevation.
5. Tie Beams: Adjust perimeter tie beams at 13 ft elevation.

I have opened the Framing Suite for you right now so you can make direct adjustments!`,
      actions: [{ type: 'OPEN_STRUCTURAL_MODAL' }],
    };
  }

  // Check column spacing
  if (
    (lower.includes('spacing') || lower.includes('column') || lower.includes('bay')) &&
    (lower.includes('foot') || lower.includes('feet') || lower.includes('ft') || /\b\d+\s*ft\b/.test(lower) || /\b\d+\s*feet\b/.test(lower))
  ) {
    const match = lower.match(/(\d+(?:\.\d+)?)\s*(?:feet|foot|ft)/);
    const spacingFeet = match ? parseFloat(match[1]) : 20;
    return {
      reply: `I have updated the central column spacing to ${spacingFeet} feet (${(spacingFeet * 0.3048).toFixed(2)}m) and aligned the door columns, Qibla columns, and longitudinal beams to this 20 ft span.`,
      actions: [
        {
          type: 'UPDATE_MASJID_STRUCTURAL',
          masjidUpdates: {
            columnSpacingFeet: spacingFeet,
            hasGateColumns: true,
            hasQiblaColumns: true,
            hasTwoLongitudinalBeams: true,
            hasCentralSpineBeam: true,
          },
        },
      ],
    };
  }

  // Check beams
  if (
    (lower.includes('beam') || lower.includes('neam')) &&
    (lower.includes('longitudinal') || lower.includes('two beam') || lower.includes('2 beam') || lower.includes('rest') || lower.includes('door') || lower.includes('qibla') || lower.includes('gate'))
  ) {
    return {
      reply: 'Configured the two longitudinal beams (450mm width × 900mm depth) resting on the entrance door columns and Qibla columns at 5761mm elevation.',
      actions: [
        {
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
        },
      ],
    };
  }

  // Check tie beams
  if (lower.includes('tie beam') || (lower.includes('tie') && lower.includes('13'))) {
    return {
      reply: 'Enabled perimeter tie beams (150mm × 450mm) at 13 ft elevation.',
      actions: [
        {
          type: 'UPDATE_MASJID_STRUCTURAL',
          masjidUpdates: {
            showTieBeams: true,
            tieBeamHeightFt: 13,
            tieBeamWidthMm: 150,
            tieBeamHeightMm: 450,
          },
        },
      ],
    };
  }

  // Door & Qibla columns
  if (
    (lower.includes('column') || lower.includes('pillar')) &&
    (lower.includes('gate') || lower.includes('door') || lower.includes('qibla'))
  ) {
    return {
      reply: 'Configured two entrance door columns and two Qibla wall columns with 450mm × 450mm sections, separated by 20 ft.',
      actions: [
        {
          type: 'UPDATE_MASJID_STRUCTURAL',
          masjidUpdates: {
            hasGateColumns: true,
            hasQiblaColumns: true,
            gateColumnWidthMm: 450,
            gateColumnDepthMm: 450,
            qiblaColumnWidthMm: 450,
            qiblaColumnDepthMm: 450,
          },
        },
      ],
    };
  }

  // Clear all
  if (lower.includes('clear all') || lower.includes('remove all') || lower.includes('delete all')) {
    return {
      reply: 'Cleared all furniture items from your room.',
      actions: [{ type: 'CLEAR_ALL' }],
    };
  }

  return {
    reply: `You can ask me to adjust structural framing (e.g. "Set column spacing to 20 feet", "Add two longitudinal beams 450x900mm", "How do I do this myself?"), or add furniture and change finishes!`,
    actions: [],
  };
}

export const AskingBar: React.FC<AskingBarProps> = ({
  roomConfig,
  currentItems,
  onExecuteActions,
  onCaptureViewport,
  onOpenStructuralEditor,
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [attachedImage, setAttachedImage] = useState<{
    dataUrl: string;
    name: string;
    mimeType: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: 'Hello! I am your AI Architectural & Structural Assistant. You can ask me to adjust columns, beams, and 20ft central spacing, add furniture, or click the hammer icon to adjust any parameter manually yourself!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat history when messages change and drawer is expanded
  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  // Handle image file selection
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setAttachedImage({
        dataUrl,
        name: file.name,
        mimeType: file.type,
      });
      // Automatically expand history or focus input
      inputRef.current?.focus();
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
    // reset input value so re-uploading the same file triggers change
    if (e.target) e.target.value = '';
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Snap current 3D viewport and attach to prompt
  const handleCapture3DScene = () => {
    if (onCaptureViewport) {
      const snapshotUrl = onCaptureViewport();
      if (snapshotUrl) {
        setAttachedImage({
          dataUrl: snapshotUrl,
          name: 'Current_3D_Scene_Snapshot.png',
          mimeType: 'image/png',
        });
        inputRef.current?.focus();
      }
    }
  };

  // Send query to AI endpoint
  const handleSend = async (overridePrompt?: string) => {
    const promptToSend = (overridePrompt ?? inputMessage).trim();
    if (!promptToSend && !attachedImage) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: promptToSend || (attachedImage ? 'Analyze this image and update my room accordingly.' : ''),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      image: attachedImage
        ? {
            url: attachedImage.dataUrl,
            name: attachedImage.name,
          }
        : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    const currentAttached = attachedImage;
    setAttachedImage(null);
    setIsLoading(true);
    setIsExpanded(true); // Open panel to show conversation

    try {
      const payload: any = {
        message: promptToSend,
        roomConfig,
        currentItems: currentItems.map((it) => ({
          id: it.id,
          name: it.name,
          modelType: it.modelType,
          category: it.category,
          position: it.position,
          color: it.color,
        })),
      };

      if (currentAttached) {
        payload.image = {
          data: currentAttached.dataUrl,
          mimeType: currentAttached.mimeType,
        };
      }

      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok && !data.reply) {
        throw new Error(data.error || 'Failed to query AI');
      }

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'Processed your request.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: data.actions || [],
        detectedObjects: data.detectedStyleOrObjects || [],
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Execute the actions on the studio state
      if (Array.isArray(data.actions) && data.actions.length > 0) {
        onExecuteActions(data.actions, data.reply);
      }
    } catch (err: any) {
      console.warn('AskingBar AI fetch warning, activating instant local parser:', err);
      // Run the client-side local parser so the asking section never fails
      const fallbackResult = parseQueryLocally(promptToSend, currentItems, onOpenStructuralEditor);
      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: fallbackResult.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: fallbackResult.actions,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (fallbackResult.actions.length > 0) {
        onExecuteActions(fallbackResult.actions, fallbackResult.reply);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      id="ai-asking-bar-container"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[95vw] max-w-2xl transition-all duration-300"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Expanded Conversation History Drawer */}
      {isExpanded && (
        <div
          id="ai-chat-history-drawer"
          className="mb-2 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[380px] transition-all"
        >
          {/* Drawer Header */}
          <div className="px-4 py-2.5 bg-slate-800/80 border-b border-slate-700/70 flex items-center justify-between text-xs font-medium text-slate-300">
            <div className="flex items-center gap-2 text-blue-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="font-semibold text-slate-100">AI Design Assistant</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Gemini Multimodal
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setMessages([
                    {
                      id: 'welcome-msg',
                      sender: 'assistant',
                      text: 'Conversation cleared. How can I help with your room design?',
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    },
                  ])
                }
                title="Clear Chat History"
                className="p-1 hover:text-slate-100 hover:bg-slate-700/60 rounded-md transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                title="Collapse Panel"
                className="p-1 hover:text-slate-100 hover:bg-slate-700/60 rounded-md transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none'
                  }`}
                >
                  {/* Attached user image preview if present */}
                  {msg.image && (
                    <div className="mb-2 rounded-lg overflow-hidden border border-white/20 max-w-[200px] max-h-[140px] bg-black/40">
                      <img
                        src={msg.image.url}
                        alt="Attached reference"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Executed Action Badges */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex flex-wrap gap-1.5">
                      {msg.actions.map((act, i) => (
                        <span
                          key={i}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                            act.type === 'ADD'
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                              : act.type === 'REMOVE' || act.type === 'CLEAR_ALL'
                              ? 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                              : act.type === 'UPDATE_MASJID_STRUCTURAL'
                              ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                              : act.type === 'OPEN_STRUCTURAL_MODAL'
                              ? 'bg-blue-950/60 text-blue-300 border-blue-500/40'
                              : 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40'
                          }`}
                        >
                          {act.type === 'ADD' && <PlusCircle className="w-3 h-3 text-emerald-400" />}
                          {act.type === 'REMOVE' && <MinusCircle className="w-3 h-3 text-rose-400" />}
                          {act.type === 'CLEAR_ALL' && <MinusCircle className="w-3 h-3 text-rose-400" />}
                          {act.type === 'UPDATE_ROOM' && <Paintbrush className="w-3 h-3 text-indigo-400" />}
                          {act.type === 'UPDATE_MASJID_STRUCTURAL' && <Hammer className="w-3 h-3 text-amber-400" />}
                          {act.type === 'OPEN_STRUCTURAL_MODAL' && <Sliders className="w-3 h-3 text-blue-400" />}
                          <span>
                            {act.type === 'ADD'
                              ? `Added: ${act.name || 'Item'}`
                              : act.type === 'REMOVE'
                              ? `Removed: ${act.targetItemName || 'Item'}`
                              : act.type === 'CLEAR_ALL'
                              ? 'Cleared All Furniture'
                              : act.type === 'UPDATE_MASJID_STRUCTURAL'
                              ? act.masjidUpdates?.columnSpacingFeet
                                ? `Column Spacing: ${act.masjidUpdates.columnSpacingFeet} ft`
                                : act.masjidUpdates?.hasTwoLongitudinalBeams
                                ? 'Longitudinal Beams (450×900mm)'
                                : act.masjidUpdates?.showTieBeams
                                ? 'Tie Beams @ 13 ft'
                                : 'Framing Updated'
                              : act.type === 'OPEN_STRUCTURAL_MODAL'
                              ? 'Framing Suite Ready'
                              : 'Updated Finishes'}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Interactive Button to open structural modal directly from chat */}
                  {msg.sender === 'assistant' &&
                    onOpenStructuralEditor &&
                    (msg.actions?.some((a) => a.type === 'OPEN_STRUCTURAL_MODAL') ||
                      msg.text.toLowerCase().includes('framing') ||
                      msg.text.toLowerCase().includes('column') ||
                      msg.text.toLowerCase().includes('beam') ||
                      msg.text.toLowerCase().includes('spacing')) && (
                      <div className="mt-2.5 pt-2 border-t border-slate-700/50">
                        <button
                          onClick={onOpenStructuralEditor}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
                        >
                          <Hammer className="w-3.5 h-3.5" />
                          Open Framing & Column Suite
                        </button>
                      </div>
                    )}
                </div>

                <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs px-2 py-1">
                <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                <span>AI is analyzing spatial layout and adjusting furniture...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Carousel in Drawer */}
          <div className="p-2 bg-slate-800/50 border-t border-slate-700/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold px-1 whitespace-nowrap">
              Suggestions:
            </span>
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                disabled={isLoading}
                onClick={() => handleSend(prompt)}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-700/70 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-all hover:text-white border border-slate-600/50 flex-shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Asking Bar Dock */}
      <div
        className={`relative bg-slate-900/90 backdrop-blur-xl border ${
          isDragging ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-700/80'
        } rounded-2xl shadow-2xl p-2 transition-all`}
      >
        {/* Attached Picture Preview Pill (if user added an image) */}
        {attachedImage && (
          <div className="mb-2 flex items-center justify-between px-3 py-1.5 bg-slate-800/90 rounded-xl border border-blue-500/30 text-xs text-slate-200">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-600 flex-shrink-0 bg-slate-950">
                <img
                  src={attachedImage.dataUrl}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="overflow-hidden">
                <div className="font-medium truncate max-w-[280px] sm:max-w-md text-blue-300 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{attachedImage.name}</span>
                </div>
                <div className="text-[10px] text-slate-400">Attached for visual analysis</div>
              </div>
            </div>

            <button
              onClick={() => setAttachedImage(null)}
              className="p-1 hover:bg-slate-700 text-slate-400 hover:text-rose-300 rounded-md transition-colors"
              title="Remove attached photo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Controls Row */}
        <div className="flex items-center gap-1.5">
          {/* Toggle History Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-center ${
              isExpanded
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
            }`}
            title={isExpanded ? 'Collapse Conversation' : 'Expand Conversation'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {/* Multimodal Photo Attachment Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors flex items-center justify-center group relative"
            title="Attach room photo, sketch, or furniture inspiration (PNG, JPG, WEBP)"
          >
            <Paperclip className="w-4 h-4 group-hover:text-blue-400 transition-colors" />
          </button>

          {/* 3D Scene Viewport Snapshot Attachment Button */}
          {onCaptureViewport && (
            <button
              onClick={handleCapture3DScene}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors flex items-center justify-center group"
              title="Snap current 3D room canvas and attach for AI feedback"
            >
              <Camera className="w-4 h-4 group-hover:text-indigo-400 transition-colors" />
            </button>
          )}

          {/* Direct Manual Framing Suite Button */}
          {onOpenStructuralEditor && (
            <button
              onClick={onOpenStructuralEditor}
              className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/40 transition-colors flex items-center justify-center group"
              title="Open Manual Framing Suite (Columns, Beams, 20ft Spacing)"
            >
              <Hammer className="w-4 h-4 group-hover:scale-110 transition-transform text-amber-400" />
            </button>
          )}

          {/* Asking Prompt Input */}
          <div className="flex-1 relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder={
                attachedImage
                  ? 'Ask AI what to do with this attached photo...'
                  : 'Ask or command: "Set spacing to 20 feet", "How to edit myself", "Add sofa"...'
              }
              className="w-full bg-slate-800/80 text-slate-100 placeholder-slate-400 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-700/60 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 pr-10 transition-all shadow-inner"
            />

            {inputMessage && (
              <button
                onClick={() => setInputMessage('')}
                className="absolute right-3 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Submit / Action Button */}
          <button
            onClick={() => handleSend()}
            disabled={isLoading || (!inputMessage.trim() && !attachedImage)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md ${
              isLoading || (!inputMessage.trim() && !attachedImage)
                ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20 active:scale-95'
            }`}
            title="Send request to AI"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-blue-200" />
                <span className="hidden sm:inline">Ask AI</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
