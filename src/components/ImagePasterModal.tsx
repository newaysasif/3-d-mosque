import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Image as ImageIcon,
  Upload,
  Clipboard,
  Sparkles,
  Check,
  Layers,
  Ruler,
  Maximize2,
  Eye,
  Trash2,
  Sliders,
  Move,
  SunMedium,
  Palette,
  Compass,
} from 'lucide-react';
import { PlacedFurnitureItem, RoomConfig, WallDirection } from '../types';

interface ImagePasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomConfig: RoomConfig;
  placedItems: PlacedFurnitureItem[];
  onAddDirectItem: (item: PlacedFurnitureItem) => void;
  onStartCursorPlacement: (item: any, options?: any) => void;
  onRemoveItem: (id: string) => void;
  onSelectItem?: (id: string) => void;
}

interface ImagePreset {
  id: string;
  name: string;
  category: 'contemporary' | 'calligraphy' | 'mashrabiya' | 'holy-sites';
  imageUrl: string;
  description: string;
  suggestedWidth: number;
  suggestedHeight: number;
  suggestedFrame: 'walnut-frame' | 'backlit-floating' | 'gold-frame' | 'black-frame' | 'frameless';
}

const PRESET_ARTWORKS: ImagePreset[] = [
  {
    id: 'preset-contemporary-mashrabiya',
    name: 'Contemporary Travertine & Walnut Mashrabiya',
    category: 'contemporary',
    imageUrl: '', // Uses high-res procedural generation fallback
    description: 'Luxury Travertine Ashlar & Walnut Portal with 12-point Mashrabiya Screen',
    suggestedWidth: 2.4,
    suggestedHeight: 2.8,
    suggestedFrame: 'walnut-frame',
  },
  {
    id: 'preset-bronze-thuluth-ayah',
    name: 'Floating 3D Bronze Calligraphy (وَمَن تَطَوَّعَ خَيْرًا)',
    category: 'calligraphy',
    imageUrl: '',
    description: '3D Sculpted Metallic Bronze Quranic Script on Honed Travertine',
    suggestedWidth: 3.2,
    suggestedHeight: 1.0,
    suggestedFrame: 'backlit-floating',
  },
  {
    id: 'preset-ayatul-kursi-medallion',
    name: 'Ayatul Kursi Sculpted Gold & Bronze Medallion',
    category: 'calligraphy',
    imageUrl: '',
    description: 'Circular Architectural Calligraphy Bas-Relief with Golden Highlights',
    suggestedWidth: 1.6,
    suggestedHeight: 1.6,
    suggestedFrame: 'backlit-floating',
  },
  {
    id: 'preset-mashrabiya-jali-lattice',
    name: '12-Point Star Islamic Mashrabiya Lattice',
    category: 'mashrabiya',
    imageUrl: '',
    description: 'Intricate Carved Timber Jali Screen with Warm Ambient Backlight',
    suggestedWidth: 1.8,
    suggestedHeight: 2.4,
    suggestedFrame: 'walnut-frame',
  },
  {
    id: 'preset-asma-ul-husna',
    name: 'Asma ul-Husna (99 Names of Allah) Bronze Panel',
    category: 'calligraphy',
    imageUrl: '',
    description: 'Sculpted Bronze & Gold Thuluth Inscription Matrix',
    suggestedWidth: 2.6,
    suggestedHeight: 1.6,
    suggestedFrame: 'gold-frame',
  },
];

export const ImagePasterModal: React.FC<ImagePasterModalProps> = ({
  isOpen,
  onClose,
  roomConfig,
  placedItems,
  onAddDirectItem,
  onStartCursorPlacement,
  onRemoveItem,
  onSelectItem,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('preset-contemporary-mashrabiya');
  const [customImageUrl, setCustomImageUrl] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'presets' | 'url' | 'manage'>('upload');

  // Attachment and placement settings
  const [targetWall, setTargetWall] = useState<WallDirection | 'custom-partition'>('west');
  const [frameStyle, setFrameStyle] = useState<'walnut-frame' | 'backlit-floating' | 'gold-frame' | 'black-frame' | 'frameless'>('walnut-frame');
  const [widthFt, setWidthFt] = useState<number>(6.5);
  const [heightFt, setHeightFt] = useState<number>(4.5);
  const [elevationFt, setElevationFt] = useState<number>(5.0); // Eye level (~1.5m)
  const [wallOffsetNormalized, setWallOffsetNormalized] = useState<number>(0.5); // 0 (left) to 1 (right)

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keyboard paste listener (Ctrl+V or Cmd+V)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (loadEvt) => {
              const dataUrl = loadEvt.target?.result as string;
              setImagePreview(dataUrl);
              setCustomImageUrl(dataUrl);
              setActiveTab('upload');
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const ft2m = 0.3048;
  const m2ft = 3.28084;
  const widthM = Math.round(widthFt * ft2m * 100) / 100;
  const heightM = Math.round(heightFt * ft2m * 100) / 100;
  const elevationM = Math.round(elevationFt * ft2m * 100) / 100;

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const dataUrl = loadEvt.target?.result as string;
        setImagePreview(dataUrl);
        setCustomImageUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Clipboard Paste API button click
  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find((t) => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            const reader = new FileReader();
            reader.onload = (loadEvt) => {
              const dataUrl = loadEvt.target?.result as string;
              setImagePreview(dataUrl);
              setCustomImageUrl(dataUrl);
            };
            reader.readAsDataURL(blob);
            return;
          }
        }
      }
    } catch {
      // Fallback
    }
    // If browser permission denied or no image in clipboard, prompt URL
    const promptUrl = window.prompt('Paste Image URL (or use Ctrl+V / Cmd+V with image copied in clipboard):');
    if (promptUrl) {
      setCustomImageUrl(promptUrl);
      setImagePreview(promptUrl);
    }
  };

  // Build and mount item onto selected wall
  const handleMountOnWall = () => {
    const activeUrl = activeTab === 'presets' ? '' : customImageUrl;
    const selectedPreset = PRESET_ARTWORKS.find((p) => p.id === selectedPresetId);
    const itemName = activeTab === 'presets'
      ? selectedPreset?.name || 'Architectural Wall Art'
      : 'Pasted Interior Wall Art';

    const mCfg = roomConfig.masjidConfig;
    const rw = roomConfig.width;
    const rl = roomConfig.length;

    let posX = 0;
    let posZ = 0;
    let rotY = 0;

    // Calculate exact coordinates along selected wall
    if (mCfg) {
      // Mosque structural polygon coordinates
      const P_qibla_left = { x: -rw / 2, z: -rl / 2 };
      const P_qibla_right = { x: rw / 2, z: -rl / 2 };
      const P_back_left = { x: -rw / 2, z: rl / 2 };
      const P_gate_east = { x: rw / 2, z: rl / 2 - 2.0 };

      if (targetWall === 'west') {
        // West long wall
        const t = wallOffsetNormalized;
        posX = P_qibla_left.x * (1 - t) + P_back_left.x * t + 0.12; // slightly inside
        posZ = P_qibla_left.z * (1 - t) + P_back_left.z * t;
        rotY = Math.PI / 2; // facing East into musalla
      } else if (targetWall === 'east') {
        // East long wall
        const t = wallOffsetNormalized;
        posX = P_qibla_right.x * (1 - t) + P_gate_east.x * t - 0.12;
        posZ = P_qibla_right.z * (1 - t) + P_gate_east.z * t;
        rotY = -Math.PI / 2; // facing West into musalla
      } else if (targetWall === 'south') {
        // South rear wall
        const t = wallOffsetNormalized;
        posX = -rw / 2 * (1 - t) + (rw / 2 - 2.0) * t;
        posZ = rl / 2 - 0.12;
        rotY = Math.PI; // facing North
      } else {
        // North Qibla wall
        const t = wallOffsetNormalized;
        posX = -rw / 2 * (1 - t) + (rw / 2) * t;
        posZ = -rl / 2 + 0.12;
        rotY = 0; // facing South
      }
    } else {
      // Standard rectangular room
      if (targetWall === 'west') {
        posX = -rw / 2 + 0.1;
        posZ = -rl / 2 + rl * wallOffsetNormalized;
        rotY = Math.PI / 2;
      } else if (targetWall === 'east') {
        posX = rw / 2 - 0.1;
        posZ = -rl / 2 + rl * wallOffsetNormalized;
        rotY = -Math.PI / 2;
      } else if (targetWall === 'south') {
        posX = -rw / 2 + rw * wallOffsetNormalized;
        posZ = rl / 2 - 0.1;
        rotY = Math.PI;
      } else {
        posX = -rw / 2 + rw * wallOffsetNormalized;
        posZ = -rl / 2 + 0.1;
        rotY = 0;
      }
    }

    const newItem: PlacedFurnitureItem = {
      id: `pasted_image_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${itemName} (${widthFt}x${heightFt} ft)`,
      category: 'decor',
      modelType: 'wall-image-poster',
      position: [posX, elevationM, posZ],
      rotationY: rotY,
      dimensions: {
        width: widthM,
        height: heightM,
        depth: 0.05,
      },
      color: '#d4af37',
      secondaryColor: '#1e293b',
      price: 150,
      customData: {
        imageUrl: activeUrl,
        isPastedImage: true,
        frameStyle: frameStyle,
        attachedWall: targetWall,
        elevationOffFloor: elevationM,
      },
    };

    onAddDirectItem(newItem);
    onClose();
  };

  // Start 3D Cursor Placement Mode
  const handleStartCursorPlacement = () => {
    const activeUrl = activeTab === 'presets' ? '' : customImageUrl;
    const selectedPreset = PRESET_ARTWORKS.find((p) => p.id === selectedPresetId);
    const itemName = activeTab === 'presets'
      ? selectedPreset?.name || 'Architectural Wall Art'
      : 'Pasted Interior Wall Art';

    const catalogItem: any = {
      id: `wall-art-placement-${Date.now()}`,
      name: `${itemName} (${widthFt}x${heightFt} ft)`,
      category: 'decor',
      modelType: 'wall-image-poster',
      description: 'Wall mounted architectural artwork poster or decal',
      defaultColor: '#d4af37',
      colorOptions: ['#d4af37', '#1e293b', '#3a2416', '#ffffff'],
      price: 150,
      dimensions: {
        width: widthM,
        height: heightM,
        depth: 0.05,
      },
      customData: {
        imageUrl: activeUrl,
        isPastedImage: true,
        frameStyle: frameStyle,
        attachedWall: targetWall,
        elevationOffFloor: elevationM,
      },
    };

    onStartCursorPlacement(catalogItem, {
      lockElevation: elevationM,
      wallSnap: true,
    });
    onClose();
  };

  // Filter already pasted image items
  const pastedItemsList = placedItems.filter(
    (it) => it.modelType === 'wall-image-poster' || it.customData?.isPastedImage
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/25 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Interior Wall Image & Artwork Paster</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-normal border border-amber-500/30">
                  Ctrl+V Supported
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Mount photos, architectural artwork, reference drawings, and Islamic calligraphy directly onto walls.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'upload'
                ? 'border-amber-400 text-amber-300 bg-slate-800/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload or Paste (Ctrl+V)</span>
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'presets'
                ? 'border-amber-400 text-amber-300 bg-slate-800/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Islamic & Architectural Presets</span>
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'url'
                ? 'border-amber-400 text-amber-300 bg-slate-800/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Image URL Link</span>
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ml-auto ${
              activeTab === 'manage'
                ? 'border-amber-400 text-amber-300 bg-slate-800/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Mounted Images ({pastedItemsList.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-amber-500/70 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-800/40 hover:bg-slate-800/70 transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 transition-colors">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  Click to Browse Image or Drag & Drop File
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mb-4">
                  Supports JPG, PNG, WebP images. You can also press{' '}
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 font-mono text-[11px]">
                    Ctrl+V
                  </kbd>{' '}
                  anywhere on this screen to paste an image directly from your clipboard!
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePasteFromClipboard();
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium flex items-center gap-2 border border-slate-600 transition-colors shadow-sm"
                >
                  <Clipboard className="w-4 h-4 text-amber-300" />
                  <span>Paste from Clipboard</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {imagePreview && (
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center gap-4">
                  <div className="w-20 h-16 rounded-lg overflow-hidden bg-black/40 border border-slate-600 shrink-0">
                    <img
                      src={imagePreview}
                      alt="Upload preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> Image Loaded Successfully
                    </span>
                    <p className="text-xs text-slate-300 truncate mt-0.5">
                      Ready to mount with selected frame & dimensions.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setImagePreview(null);
                      setCustomImageUrl('');
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-700"
                    title="Remove image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PRESET_ARTWORKS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => {
                      setSelectedPresetId(preset.id);
                      setWidthFt(Math.round(preset.suggestedWidth * m2ft * 10) / 10);
                      setHeightFt(Math.round(preset.suggestedHeight * m2ft * 10) / 10);
                      setFrameStyle(preset.suggestedFrame);
                    }}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/70 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{preset.name}</span>
                        </h4>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed mb-3">
                        {preset.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span className="px-2 py-0.5 rounded bg-slate-700/60">
                        {Math.round(preset.suggestedWidth * m2ft * 10) / 10} ×{' '}
                        {Math.round(preset.suggestedHeight * m2ft * 10) / 10} ft
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-700/60 capitalize">
                        {preset.suggestedFrame.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Direct Image Web URL (HTTPS)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customImageUrl}
                    onChange={(e) => {
                      setCustomImageUrl(e.target.value);
                      setImagePreview(e.target.value);
                    }}
                    placeholder="https://example.com/artwork.jpg"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => setImagePreview(customImageUrl)}
                    className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-xs font-medium rounded-xl text-white transition-colors"
                  >
                    Test Preview
                  </button>
                </div>
              </div>

              {imagePreview && (
                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 flex items-center gap-4">
                  <div className="w-20 h-16 rounded-lg overflow-hidden bg-black/40 border border-slate-600 shrink-0">
                    <img
                      src={imagePreview}
                      alt="URL preview"
                      className="w-full h-full object-cover"
                      onError={() => {
                        setImagePreview(null);
                        alert('Could not load image from URL. Please ensure the link is direct and public.');
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Direct URL Verified
                    </span>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{customImageUrl}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="space-y-3">
              {pastedItemsList.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40 text-amber-400" />
                  <p className="text-xs">No images or wall decals mounted in this project yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-800/40">
                  {pastedItemsList.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 flex items-center justify-between hover:bg-slate-800/80 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-700 overflow-hidden border border-slate-600 flex items-center justify-center shrink-0">
                          {item.customData?.imageUrl ? (
                            <img
                              src={item.customData.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Sparkles className="w-4 h-4 text-amber-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{item.name}</h4>
                          <p className="text-[11px] text-slate-400">
                            Attached:{' '}
                            <span className="capitalize text-slate-300 font-medium">
                              {item.customData?.attachedWall || 'Wall'}
                            </span>{' '}
                            • Frame: {item.customData?.frameStyle || 'walnut-frame'} • Elev:{' '}
                            {Math.round((item.position[1] || 1.5) * m2ft * 10) / 10} ft
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {onSelectItem && (
                          <button
                            onClick={() => {
                              onSelectItem(item.id);
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-600/30 text-blue-300 hover:bg-blue-600/50 text-xs transition-colors"
                          >
                            Select & Move
                          </button>
                        )}
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Delete from scene"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab !== 'manage' && (
            <div className="pt-4 border-t border-slate-800 space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5" />
                <span>Wall Mounting & Framing Specifications</span>
              </h3>

              {/* Target Wall & Frame Style */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target Wall Attachment
                  </label>
                  <select
                    value={targetWall}
                    onChange={(e) => setTargetWall(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="west">West Long Wall (Interior Musalla)</option>
                    <option value="east">East Long Wall (Interior Musalla)</option>
                    <option value="south">South Rear Wall</option>
                    <option value="north">North Qibla Wall</option>
                    <option value="custom-partition">Interior Partition / Custom Wall</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Frame & Architectural Border
                  </label>
                  <select
                    value={frameStyle}
                    onChange={(e) => setFrameStyle(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="walnut-frame">Rich Dark Walnut Timber Frame (Portal Wood)</option>
                    <option value="backlit-floating">Backlit Floating LED Halo (Warm Glow)</option>
                    <option value="gold-frame">Luxury Brushed Gold Frame</option>
                    <option value="black-frame">Modern Matte Black Aluminum Frame</option>
                    <option value="frameless">Frameless Direct Canvas / Wall Decal</option>
                  </select>
                </div>
              </div>

              {/* Dimension Controls */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Width: <span className="text-white font-mono">{widthFt} ft</span>{' '}
                    <span className="text-slate-500">({widthM} m)</span>
                  </label>
                  <input
                    type="range"
                    min={2}
                    max={18}
                    step={0.5}
                    value={widthFt}
                    onChange={(e) => setWidthFt(parseFloat(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Height: <span className="text-white font-mono">{heightFt} ft</span>{' '}
                    <span className="text-slate-500">({heightM} m)</span>
                  </label>
                  <input
                    type="range"
                    min={1.5}
                    max={12}
                    step={0.5}
                    value={heightFt}
                    onChange={(e) => setHeightFt(parseFloat(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Elevation: <span className="text-white font-mono">{elevationFt} ft</span>{' '}
                    <span className="text-slate-500">({elevationM} m)</span>
                  </label>
                  <input
                    type="range"
                    min={0.5}
                    max={16}
                    step={0.5}
                    value={elevationFt}
                    onChange={(e) => setElevationFt(parseFloat(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>
              </div>

              {/* Horizontal Position Along Wall */}
              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="font-medium text-slate-400">Position Along Wall</span>
                  <span className="font-mono text-slate-300">
                    {Math.round(wallOffsetNormalized * 100)}% ({wallOffsetNormalized < 0.35 ? 'Left' : wallOffsetNormalized > 0.65 ? 'Right' : 'Center'})
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={0.9}
                  step={0.02}
                  value={wallOffsetNormalized}
                  onChange={(e) => setWallOffsetNormalized(parseFloat(e.target.value))}
                  className="w-full accent-amber-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {activeTab !== 'manage' && (
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-850 flex items-center justify-between gap-3">
            <button
              onClick={handleStartCursorPlacement}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-2 transition-colors"
              title="Click in 3D scene to place this framed artwork at exact point"
            >
              <Move className="w-3.5 h-3.5 text-amber-400" />
              <span>Place with 3D Cursor</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMountOnWall}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold shadow-lg shadow-amber-600/30 flex items-center gap-2 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Paste & Mount on Wall in 3D</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
