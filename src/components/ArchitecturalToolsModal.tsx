import React, { useState } from 'react';
import {
  X,
  DoorClosed,
  AppWindow,
  Columns,
  Flame,
  Maximize2,
  Check,
  RotateCw,
  Eye,
  Layers,
  Sparkles,
  Compass,
} from 'lucide-react';
import {
  PlacedFurnitureItem,
  RoomConfig,
  WallDirection,
  ArchitecturalCustomData,
} from '../types';

interface ArchitecturalToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomConfig: RoomConfig;
  onAddArchitecturalItem: (item: PlacedFurnitureItem) => void;
}

type ArchTab = 'doors' | 'windows' | 'partitions';

export const ArchitecturalToolsModal: React.FC<ArchitecturalToolsModalProps> = ({
  isOpen,
  onClose,
  roomConfig,
  onAddArchitecturalItem,
}) => {
  const [activeTab, setActiveTab] = useState<ArchTab>('doors');

  // --- Doors State ---
  const [doorStyle, setDoorStyle] = useState<
    'interior-door' | 'french-double-door' | 'sliding-barn-door' | 'pivot-door'
  >('interior-door');
  const [doorWall, setDoorWall] = useState<WallDirection>('north');
  const [doorWallOffset, setDoorWallOffset] = useState<number>(0);
  const [doorWidth, setDoorWidth] = useState<number>(0.95);
  const [doorHeight, setDoorHeight] = useState<number>(2.15);
  const [doorOpenAngle, setDoorOpenAngle] = useState<number>(25);
  const [doorSlabColor, setDoorSlabColor] = useState<string>('#f8fafc');
  const [doorFrameColor, setDoorFrameColor] = useState<string>('#334155');
  const [doorHandleFinish, setDoorHandleFinish] = useState<'brass' | 'black' | 'chrome'>('brass');

  // --- Windows State ---
  const [windowStyle, setWindowStyle] = useState<
    'picture-window' | 'casement-window' | 'panoramic-glass-window' | 'arched-window' | 'clerestory-window'
  >('picture-window');
  const [windowWall, setWindowWall] = useState<WallDirection>('north');
  const [windowWallOffset, setWindowWallOffset] = useState<number>(0);
  const [windowSillHeight, setWindowSillHeight] = useState<number>(0.4);
  const [windowWidth, setWindowWidth] = useState<number>(2.2);
  const [windowHeight, setWindowHeight] = useState<number>(1.8);
  const [windowMullions, setWindowMullions] = useState<'none' | '2x2' | '3x3' | '4x2'>('2x2');
  const [windowFrameColor, setWindowFrameColor] = useState<string>('#18181b');
  const [windowGlassTint, setWindowGlassTint] = useState<'clear' | 'frosted' | 'warm' | 'cool'>('clear');
  const [windowBackdrop, setWindowBackdrop] = useState<'garden' | 'city' | 'sky' | 'mountains'>('sky');

  // --- Partitions & Structures State ---
  const [partitionStyle, setPartitionStyle] = useState<
    'fluted-wood-divider' | 'glass-steel-partition' | 'pony-wall' | 'modern-linear-fireplace' | 'architectural-pillar' | 'architectural-ceiling-beam'
  >('fluted-wood-divider');
  const [partWidth, setPartWidth] = useState<number>(1.6);
  const [partHeight, setPartHeight] = useState<number>(2.6);
  const [partDepth, setPartDepth] = useState<number>(0.15);
  const [partColor, setPartColor] = useState<string>('#b89063');
  const [partSecColor, setPartSecColor] = useState<string>('#3a2e25');

  if (!isOpen) return null;

  // Compute 3D [X, Y, Z] placement and rotation based on target wall & offsets
  const calculateWallPlacement = (
    wall: WallDirection,
    offsetAlongWall: number,
    elevationY: number,
    depthOffset = 0.05
  ): { position: [number, number, number]; rotationY: number } => {
    const halfW = roomConfig.width / 2;
    const halfL = roomConfig.length / 2;
    let pos: [number, number, number] = [0, elevationY, 0];
    let rotY = 0;

    switch (wall) {
      case 'north': // Z = -halfL
        pos = [
          Math.max(-halfW + 0.6, Math.min(halfW - 0.6, offsetAlongWall)),
          elevationY,
          -halfL + depthOffset,
        ];
        rotY = 0;
        break;
      case 'south': // Z = +halfL
        pos = [
          Math.max(-halfW + 0.6, Math.min(halfW - 0.6, offsetAlongWall)),
          elevationY,
          halfL - depthOffset,
        ];
        rotY = 180;
        break;
      case 'west': // X = -halfW
        pos = [
          -halfW + depthOffset,
          elevationY,
          Math.max(-halfL + 0.6, Math.min(halfL - 0.6, offsetAlongWall)),
        ];
        rotY = 90;
        break;
      case 'east': // X = +halfW
        pos = [
          halfW - depthOffset,
          elevationY,
          Math.max(-halfL + 0.6, Math.min(halfL - 0.6, offsetAlongWall)),
        ];
        rotY = 270;
        break;
    }

    return { position: pos, rotationY: rotY };
  };

  // -------------------------------------------------------------
  // Add Door
  // -------------------------------------------------------------
  const handleAddDoor = () => {
    const { position, rotationY } = calculateWallPlacement(doorWall, doorWallOffset, 0, 0.06);

    const doorNames: Record<string, string> = {
      'interior-door': 'Modern Paneled Interior Door',
      'french-double-door': 'Double French Glass Doors',
      'sliding-barn-door': 'Modern Sliding Barn Door',
      'pivot-door': 'Grand Architectural Pivot Door',
    };

    const customData: ArchitecturalCustomData = {
      architecturalType: 'door',
      doorStyle:
        doorStyle === 'french-double-door'
          ? 'double-french'
          : doorStyle === 'sliding-barn-door'
          ? 'sliding-barn'
          : doorStyle === 'pivot-door'
          ? 'pivot'
          : 'single',
      wallAttachment: doorWall,
      openAngle: doorOpenAngle,
      handleFinish: doorHandleFinish,
    };

    const newItem: PlacedFurnitureItem = {
      id: `door-${Date.now()}`,
      modelType: doorStyle,
      name: `${doorNames[doorStyle]} (${doorWall.toUpperCase()} Wall)`,
      category: 'architectural',
      position,
      rotationY,
      dimensions: {
        width: doorWidth,
        depth: 0.14,
        height: doorHeight,
      },
      color: doorSlabColor,
      secondaryColor: doorFrameColor,
      price: doorStyle === 'pivot-door' ? 2600 : doorStyle === 'french-double-door' ? 1850 : 850,
      customData,
    };

    onAddArchitecturalItem(newItem);
    onClose();
  };

  // -------------------------------------------------------------
  // Add Window
  // -------------------------------------------------------------
  const handleAddWindow = () => {
    const { position, rotationY } = calculateWallPlacement(
      windowWall,
      windowWallOffset,
      windowSillHeight,
      0.06
    );

    const windowNames: Record<string, string> = {
      'picture-window': 'Black Steel Architectural Picture Window',
      'casement-window': 'French Casement Divided Window',
      'panoramic-glass-window': 'Panoramic Floor-to-Ceiling Glass Window',
      'arched-window': 'Classic Palladian Arched Window',
      'clerestory-window': 'Clerestory Transom High Ribbon Window',
    };

    const customData: ArchitecturalCustomData = {
      architecturalType: 'window',
      windowStyle:
        windowStyle === 'casement-window'
          ? 'casement'
          : windowStyle === 'panoramic-glass-window'
          ? 'panoramic'
          : windowStyle === 'arched-window'
          ? 'arched'
          : windowStyle === 'clerestory-window'
          ? 'clerestory'
          : 'picture',
      wallAttachment: windowWall,
      mullionGrid: windowMullions,
      glassTint: windowGlassTint,
      outdoorBackdrop: windowBackdrop,
    };

    const newItem: PlacedFurnitureItem = {
      id: `win-${Date.now()}`,
      modelType: windowStyle,
      name: `${windowNames[windowStyle]} (${windowWall.toUpperCase()} Wall)`,
      category: 'architectural',
      position,
      rotationY,
      dimensions: {
        width: windowWidth,
        depth: 0.12,
        height: windowHeight,
      },
      color: windowFrameColor,
      secondaryColor: windowFrameColor,
      price: windowStyle === 'panoramic-glass-window' ? 3400 : 1600,
      customData,
    };

    onAddArchitecturalItem(newItem);
    onClose();
  };

  // -------------------------------------------------------------
  // Add Partition or Architectural Element
  // -------------------------------------------------------------
  const handleAddPartition = () => {
    const elemNames: Record<string, string> = {
      'fluted-wood-divider': 'Fluted Timber Slat Room Divider',
      'glass-steel-partition': 'Industrial Glass & Steel Partition',
      'pony-wall': 'Architectural Half-Height Pony Wall',
      'modern-linear-fireplace': 'Modern Recessed Linear Fireplace',
      'architectural-pillar': 'Architectural Structural Column',
      'architectural-ceiling-beam': 'Exposed Timber Ceiling Beam',
    };

    let posY = 0;
    if (partitionStyle === 'architectural-ceiling-beam') {
      posY = roomConfig.height - 0.1;
    }

    const newItem: PlacedFurnitureItem = {
      id: `arch-${Date.now()}`,
      modelType: partitionStyle,
      name: elemNames[partitionStyle] || 'Architectural Element',
      category: 'architectural',
      position: [0, posY, 0],
      rotationY: 0,
      dimensions: {
        width: partWidth,
        depth: partDepth,
        height: partHeight,
      },
      color: partColor,
      secondaryColor: partSecColor,
      price: partitionStyle === 'modern-linear-fireplace' ? 2900 : 1200,
    };

    onAddArchitecturalItem(newItem);
    onClose();
  };

  return (
    <div
      id="architectural-tools-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
                Architectural Builder: Doors, Windows & Openings
              </h2>
              <p className="text-xs text-slate-400">
                Craft custom wall openings, glass glazing systems, pivot doors, and structural room partitions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-800 flex gap-4 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('doors')}
            className={`py-3 px-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'doors'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DoorClosed className="w-4 h-4" />
            Doors Studio
          </button>
          <button
            onClick={() => setActiveTab('windows')}
            className={`py-3 px-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'windows'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AppWindow className="w-4 h-4" />
            Windows & Glazing
          </button>
          <button
            onClick={() => setActiveTab('partitions')}
            className={`py-3 px-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'partitions'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns className="w-4 h-4" />
            Partitions & Elements
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ========================================================= */}
          {/* TAB 1: DOORS STUDIO */}
          {/* ========================================================= */}
          {activeTab === 'doors' && (
            <div className="space-y-6">
              {/* Door Styles Selection */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 block">
                  Select Door Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'interior-door', label: 'Single Hinged Door', desc: 'Flush slab with jamb casing' },
                    { id: 'french-double-door', label: 'Double French Glass', desc: 'Dual divided pane doors' },
                    { id: 'sliding-barn-door', label: 'Sliding Barn Track', desc: 'Exposed black steel rollers' },
                    { id: 'pivot-door', label: 'Architectural Pivot', desc: 'Off-center axis & tall pull' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      onClick={() => {
                        setDoorStyle(style.id as any);
                        if (style.id === 'french-double-door') setDoorWidth(1.8);
                        else if (style.id === 'pivot-door') setDoorWidth(1.4);
                        else setDoorWidth(0.95);
                      }}
                      className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        doorStyle === style.id
                          ? 'bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500'
                          : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-sm">{style.label}</span>
                        {doorStyle === style.id && <Check className="w-4 h-4 text-blue-400" />}
                      </div>
                      <span className="text-xs text-slate-400">{style.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Wall Attachment & Position */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/30 p-4 rounded-xl border border-slate-800/60">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
                    Mounting Wall
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['north', 'south', 'west', 'east'] as WallDirection[]).map((w) => (
                      <button
                        key={w}
                        onClick={() => setDoorWall(w)}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold capitalize border transition-all ${
                          doorWall === w
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-700/60'
                        }`}
                      >
                        {w} Wall
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                    <span>Position Along Wall</span>
                    <span className="text-blue-400">{doorWallOffset > 0 ? `+${doorWallOffset}m` : `${doorWallOffset}m`}</span>
                  </div>
                  <input
                    type="range"
                    min={-2.5}
                    max={2.5}
                    step={0.1}
                    value={doorWallOffset}
                    onChange={(e) => setDoorWallOffset(parseFloat(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>Left Corner</span>
                    <span>Center</span>
                    <span>Right Corner</span>
                  </div>
                </div>
              </div>

              {/* Dimensions & Swing Angle */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-800/30 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                    <span>Door Width</span>
                    <span className="text-blue-400">{doorWidth.toFixed(2)} m</span>
                  </div>
                  <input
                    type="range"
                    min={0.7}
                    max={2.4}
                    step={0.05}
                    value={doorWidth}
                    onChange={(e) => setDoorWidth(parseFloat(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div className="bg-slate-800/30 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                    <span>Door Height</span>
                    <span className="text-blue-400">{doorHeight.toFixed(2)} m</span>
                  </div>
                  <input
                    type="range"
                    min={1.9}
                    max={2.6}
                    step={0.05}
                    value={doorHeight}
                    onChange={(e) => setDoorHeight(parseFloat(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div className="bg-slate-800/30 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                    <span>Swing / Open Angle</span>
                    <span className="text-blue-400">{doorOpenAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={90}
                    step={5}
                    value={doorOpenAngle}
                    onChange={(e) => setDoorOpenAngle(parseInt(e.target.value, 10))}
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>

              {/* Finishes & Materials */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
                    Door Slab Finish
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={doorSlabColor}
                      onChange={(e) => setDoorSlabColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <div className="flex gap-1.5">
                      {[
                        { color: '#f8fafc', label: 'White' },
                        { color: '#8c6d48', label: 'Oak' },
                        { color: '#3d2817', label: 'Walnut' },
                        { color: '#18181b', label: 'Black' },
                      ].map((preset) => (
                        <button
                          key={preset.color}
                          onClick={() => setDoorSlabColor(preset.color)}
                          className="w-7 h-7 rounded-md border border-slate-700"
                          style={{ backgroundColor: preset.color }}
                          title={preset.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
                    Frame & Trim Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={doorFrameColor}
                      onChange={(e) => setDoorFrameColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs text-slate-400 font-mono">{doorFrameColor}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
                    Handle Hardware
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['brass', 'black', 'chrome'] as const).map((h) => (
                      <button
                        key={h}
                        onClick={() => setDoorHandleFinish(h)}
                        className={`py-2 text-xs font-medium capitalize rounded-lg border transition-all ${
                          doorHandleFinish === h
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleAddDoor}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all"
                >
                  <DoorClosed className="w-4 h-4" />
                  Place Door on {doorWall.toUpperCase()} Wall
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: WINDOWS STUDIO */}
          {/* ========================================================= */}
          {activeTab === 'windows' && (
            <div className="space-y-6">
              {/* Window Styles Selection */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 block">
                  Select Window Glazing Style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { id: 'picture-window', label: 'Picture Window', desc: 'Framed landscape view' },
                    { id: 'casement-window', label: 'Casement Window', desc: 'Dual operable divided sashes' },
                    { id: 'panoramic-glass-window', label: 'Panoramic Wall', desc: 'Floor-to-ceiling modern glass' },
                    { id: 'arched-window', label: 'Palladian Arched', desc: 'Radial fanlight arch top' },
                    { id: 'clerestory-window', label: 'High Clerestory', desc: 'Horizontal ribbon light' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      onClick={() => {
                        setWindowStyle(style.id as any);
                        if (style.id === 'panoramic-glass-window') {
                          setWindowWidth(3.6);
                          setWindowHeight(2.6);
                          setWindowSillHeight(0);
                        } else if (style.id === 'clerestory-window') {
                          setWindowWidth(3.0);
                          setWindowHeight(0.65);
                          setWindowSillHeight(1.8);
                        } else {
                          setWindowWidth(2.2);
                          setWindowHeight(1.8);
                          setWindowSillHeight(0.4);
                        }
                      }}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        windowStyle === style.id
                          ? 'bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500'
                          : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-xs">{style.label}</span>
                        {windowStyle === style.id && <Check className="w-3.5 h-3.5 text-blue-400" />}
                      </div>
                      <span className="text-[11px] text-slate-400">{style.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mounting Wall & Position */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/30 p-4 rounded-xl border border-slate-800/60">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
                    Mounting Wall
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['north', 'south', 'west', 'east'] as WallDirection[]).map((w) => (
                      <button
                        key={w}
                        onClick={() => setWindowWall(w)}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold capitalize border transition-all ${
                          windowWall === w
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-700/60'
                        }`}
                      >
                        {w} Wall
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                    <span>Position Along Wall</span>
                    <span className="text-blue-400">{windowWallOffset > 0 ? `+${windowWallOffset}m` : `${windowWallOffset}m`}</span>
                  </div>
                  <input
                    type="range"
                    min={-2.5}
                    max={2.5}
                    step={0.1}
                    value={windowWallOffset}
                    onChange={(e) => setWindowWallOffset(parseFloat(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>Left</span>
                    <span>Center</span>
                    <span>Right</span>
                  </div>
                </div>
              </div>

              {/* Window Dimensions & Sill Elevation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-800/30 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                    <span>Window Width</span>
                    <span className="text-blue-400">{windowWidth.toFixed(2)} m</span>
                  </div>
                  <input
                    type="range"
                    min={0.8}
                    max={4.2}
                    step={0.1}
                    value={windowWidth}
                    onChange={(e) => setWindowWidth(parseFloat(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div className="bg-slate-800/30 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                    <span>Window Height</span>
                    <span className="text-blue-400">{windowHeight.toFixed(2)} m</span>
                  </div>
                  <input
                    type="range"
                    min={0.6}
                    max={2.6}
                    step={0.05}
                    value={windowHeight}
                    onChange={(e) => setWindowHeight(parseFloat(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div className="bg-slate-800/30 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                    <span>Sill Elevation (from floor)</span>
                    <span className="text-blue-400">{windowSillHeight.toFixed(2)} m</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={2.0}
                    step={0.05}
                    value={windowSillHeight}
                    onChange={(e) => setWindowSillHeight(parseFloat(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>

              {/* Mullion Grid & Frame Color & Glass Tint */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
                    Mullion Grid Pattern
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['none', '2x2', '3x3', '4x2'] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => setWindowMullions(g)}
                        className={`py-2 text-xs font-medium uppercase rounded-lg border transition-all ${
                          windowMullions === g
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
                        }`}
                      >
                        {g === 'none' ? 'Clear' : g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
                    Glass Tint & Privacy
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['clear', 'warm', 'cool', 'frosted'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setWindowGlassTint(t)}
                        className={`py-2 text-xs font-medium capitalize rounded-lg border transition-all ${
                          windowGlassTint === t
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
                    Outdoor View Horizon
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['sky', 'garden', 'city', 'mountains'] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => setWindowBackdrop(v)}
                        className={`py-2 text-xs font-medium capitalize rounded-lg border transition-all ${
                          windowBackdrop === v
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleAddWindow}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all"
                >
                  <AppWindow className="w-4 h-4" />
                  Place Window on {windowWall.toUpperCase()} Wall
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: PARTITIONS & OTHER ARCHITECTURAL ELEMENTS */}
          {/* ========================================================= */}
          {activeTab === 'partitions' && (
            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 block">
                  Select Architectural Element or Partition
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'fluted-wood-divider', label: 'Fluted Timber Slat Divider', icon: Columns, desc: 'Vertical oak spatial zoning screen' },
                    { id: 'glass-steel-partition', label: 'Glass & Steel Partition Wall', icon: Layers, desc: 'Industrial loft acoustic grid' },
                    { id: 'pony-wall', label: 'Half-Height Pony Wall', icon: Maximize2, desc: 'Low dividing wall with timber cap' },
                    { id: 'modern-linear-fireplace', label: 'Recessed Linear Fireplace', icon: Flame, desc: 'Floating mantle & glowing embers' },
                    { id: 'architectural-pillar', label: 'Structural Column (Pillar)', icon: Columns, desc: 'Classical round column plinth' },
                    { id: 'architectural-ceiling-beam', label: 'Exposed Timber Ceiling Beam', icon: Sparkles, desc: 'Solid wood ceiling accent' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setPartitionStyle(item.id as any);
                        if (item.id === 'modern-linear-fireplace') {
                          setPartWidth(2.2);
                          setPartHeight(1.2);
                          setPartDepth(0.38);
                        } else if (item.id === 'architectural-pillar') {
                          setPartWidth(0.35);
                          setPartHeight(roomConfig.height);
                          setPartDepth(0.35);
                        } else if (item.id === 'architectural-ceiling-beam') {
                          setPartWidth(roomConfig.width);
                          setPartHeight(0.24);
                          setPartDepth(0.18);
                        } else {
                          setPartWidth(1.8);
                          setPartHeight(2.6);
                          setPartDepth(0.12);
                        }
                      }}
                      className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        partitionStyle === item.id
                          ? 'bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500'
                          : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">{item.label}</span>
                        {partitionStyle === item.id && <Check className="w-4 h-4 text-blue-400" />}
                      </div>
                      <span className="text-xs text-slate-400">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-800/30 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                    <span>Width / Length</span>
                    <span className="text-blue-400">{partWidth.toFixed(2)} m</span>
                  </div>
                  <input
                    type="range"
                    min={0.3}
                    max={6.0}
                    step={0.1}
                    value={partWidth}
                    onChange={(e) => setPartWidth(parseFloat(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div className="bg-slate-800/30 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                    <span>Height</span>
                    <span className="text-blue-400">{partHeight.toFixed(2)} m</span>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={3.0}
                    step={0.05}
                    value={partHeight}
                    onChange={(e) => setPartHeight(parseFloat(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div className="bg-slate-800/30 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                    <span>Depth / Thickness</span>
                    <span className="text-blue-400">{partDepth.toFixed(2)} m</span>
                  </div>
                  <input
                    type="range"
                    min={0.08}
                    max={0.8}
                    step={0.02}
                    value={partDepth}
                    onChange={(e) => setPartDepth(parseFloat(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>

              {/* Material Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
                    Primary Finish Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={partColor}
                      onChange={(e) => setPartColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <div className="flex gap-1.5">
                      {[
                        { color: '#b89063', label: 'Oak' },
                        { color: '#3d2817', label: 'Walnut' },
                        { color: '#18181b', label: 'Black Metal' },
                        { color: '#f8fafc', label: 'White' },
                      ].map((preset) => (
                        <button
                          key={preset.color}
                          onClick={() => setPartColor(preset.color)}
                          className="w-7 h-7 rounded-md border border-slate-700"
                          style={{ backgroundColor: preset.color }}
                          title={preset.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
                    Secondary Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={partSecColor}
                      onChange={(e) => setPartSecColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs text-slate-400 font-mono">{partSecColor}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleAddPartition}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all"
                >
                  <Columns className="w-4 h-4" />
                  Place Architectural Element into Room
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
