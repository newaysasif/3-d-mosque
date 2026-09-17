import React, { useState } from 'react';
import {
  X,
  Layers,
  Trash2,
  Plus,
  Move,
  Eye,
  EyeOff,
  Sliders,
  Ruler,
  Check,
  Building,
  Columns as ColumnsIcon,
  Maximize2,
  Box,
} from 'lucide-react';
import {
  RoomConfig,
  PlacedFurnitureItem,
  WallVisibilityConfig,
} from '../types';

interface WallManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomConfig: RoomConfig;
  onUpdateConfig: (newConfig: RoomConfig) => void;
  placedItems: PlacedFurnitureItem[];
  onRemoveItem: (id: string) => void;
  onStartCursorPlacement: (item: any, options?: any) => void;
  onAddDirectWall: (wallItem: PlacedFurnitureItem) => void;
  onOpenOfficeGrid?: () => void;
}

type TabType = 'make-wall' | 'remove-walls' | 'wall-sizes' | 'structural-grid';

export const WallManagerModal: React.FC<WallManagerModalProps> = ({
  isOpen,
  onClose,
  roomConfig,
  onUpdateConfig,
  placedItems,
  onRemoveItem,
  onStartCursorPlacement,
  onAddDirectWall,
  onOpenOfficeGrid,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('make-wall');

  // "Make Wall" State
  const [wallType, setWallType] = useState<'custom-masonry-wall' | 'drywall-partition' | 'glass-steel-partition' | 'pony-wall'>('custom-masonry-wall');
  const [wallLengthFt, setWallLengthFt] = useState<number>(15);
  const [wallHeightFt, setWallHeightFt] = useState<number>(19);
  const [wallThickMm, setWallThickMm] = useState<number>(230); // 230 mm = 9"
  const [wallColor, setWallColor] = useState<string>('#ece8e1');

  if (!isOpen) return null;

  const ft2m = 0.3048;
  const mCfg = roomConfig.masjidConfig || {};

  const wallVis: WallVisibilityConfig = roomConfig.wallVisibility || {
    north: true,
    south: true,
    east: true,
    west: true,
    extension: true,
  };

  const currentWallHeightM = roomConfig.wallHeightMeters || (mCfg.mainBeamHeightFt ? mCfg.mainBeamHeightFt * ft2m : roomConfig.height);
  const currentWallThickM = roomConfig.wallThicknessMeters || 0.23;

  const toggleWallVis = (key: keyof WallVisibilityConfig) => {
    const updated: WallVisibilityConfig = {
      ...wallVis,
      [key]: !wallVis[key],
    };
    onUpdateConfig({
      ...roomConfig,
      wallVisibility: updated,
    });
  };

  const handleCreateCustomWall = (mode: 'cursor' | 'center') => {
    const widthMeters = Math.round(wallLengthFt * ft2m * 100) / 100;
    const heightMeters = Math.round(wallHeightFt * ft2m * 100) / 100;
    const depthMeters = Math.round((wallThickMm / 1000) * 100) / 100;

    const wallItem: PlacedFurnitureItem = {
      id: `wall_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: `${wallType === 'custom-masonry-wall' ? 'Solid Masonry Wall' : wallType === 'drywall-partition' ? 'Drywall Stud Partition' : wallType === 'glass-steel-partition' ? 'Glass & Steel Partition' : 'Architectural Pony Wall'} (${wallLengthFt} ft)`,
      category: 'architectural',
      modelType: wallType,
      position: [0, 0, 0],
      rotationY: 0,
      dimensions: {
        width: widthMeters,
        height: heightMeters,
        depth: depthMeters,
      },
      color: wallColor,
      price: 0,
    };

    if (mode === 'cursor') {
      onClose();
      onStartCursorPlacement(wallItem, {
        width: widthMeters,
        height: heightMeters,
        depth: depthMeters,
        color: wallColor,
      });
    } else {
      onAddDirectWall(wallItem);
      onClose();
    }
  };

  // Filter custom placed walls in room
  const placedWalls = placedItems.filter(
    (it) =>
      it.modelType === 'custom-masonry-wall' ||
      it.modelType === 'custom-wall' ||
      it.modelType === 'drywall-partition' ||
      it.modelType === 'glass-steel-partition' ||
      it.modelType === 'pony-wall' ||
      it.name.toLowerCase().includes('wall')
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Wall & Structural Manager
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                  CAD Precision
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Make, remove, resize walls and control the 26-column structural grid
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 gap-2 pt-2">
          {[
            { id: 'make-wall', label: 'Make Wall', icon: Plus },
            { id: 'remove-walls', label: 'Remove Walls', icon: Trash2 },
            { id: 'wall-sizes', label: 'Wall Sizes & Perimeter', icon: Sliders },
            { id: 'structural-grid', label: 'Columns & Beams', icon: ColumnsIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-sm font-medium transition-all ${
                  active
                    ? 'border-amber-500 text-amber-400 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* TAB 1: MAKE WALL */}
          {activeTab === 'make-wall' && (
            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                  Select Wall Type to Construct
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {
                      id: 'custom-masonry-wall',
                      name: 'Solid Masonry Wall',
                      desc: 'Standard brick/block wall with baseboards & coping',
                      defaultThick: 230,
                    },
                    {
                      id: 'drywall-partition',
                      name: 'Drywall Partition',
                      desc: 'Lightweight interior partition with bottom trims',
                      defaultThick: 120,
                    },
                    {
                      id: 'glass-steel-partition',
                      name: 'Glass & Steel Screen',
                      desc: 'Modern transparent divider with acoustic glazing',
                      defaultThick: 80,
                    },
                    {
                      id: 'pony-wall',
                      name: 'Half-Height Pony Wall',
                      desc: '4 ft low dividing wall with hardwood ledge cap',
                      defaultThick: 150,
                    },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => {
                        setWallType(type.id as any);
                        setWallThickMm(type.defaultThick);
                        if (type.id === 'pony-wall') setWallHeightFt(4);
                      }}
                      className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        wallType === type.id
                          ? 'bg-amber-600/15 border-amber-500 text-white ring-1 ring-amber-500'
                          : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <span className="font-semibold text-sm block mb-1">{type.name}</span>
                        <p className="text-xs text-slate-400 leading-relaxed">{type.desc}</p>
                      </div>
                      {wallType === type.id && (
                        <div className="mt-3 flex items-center gap-1 text-xs text-amber-400 font-medium">
                          <Check className="w-3.5 h-3.5" /> Selected
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sizing Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Length */}
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                    <span>Wall Length</span>
                    <span className="text-amber-400 font-mono">
                      {wallLengthFt} ft ({(wallLengthFt * ft2m).toFixed(2)} m)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={80}
                    step={1}
                    value={wallLengthFt}
                    onChange={(e) => setWallLengthFt(parseFloat(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <div className="flex gap-1.5 flex-wrap pt-1">
                    {[8, 12, 18, 40.9, 63.2].map((val) => (
                      <button
                        key={val}
                        onClick={() => setWallLengthFt(val)}
                        className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                          wallLengthFt === val
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        {val} ft
                      </button>
                    ))}
                  </div>
                </div>

                {/* Height */}
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                    <span>Wall Height</span>
                    <span className="text-amber-400 font-mono">
                      {wallHeightFt} ft ({(wallHeightFt * ft2m).toFixed(2)} m)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={25}
                    step={0.5}
                    value={wallHeightFt}
                    onChange={(e) => setWallHeightFt(parseFloat(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <div className="flex gap-1.5 flex-wrap pt-1">
                    {[
                      { label: '4 ft (Half)', val: 4 },
                      { label: '13 ft (Tie Beam)', val: 13 },
                      { label: '19 ft (Roof Beam)', val: 19 },
                    ].map((h) => (
                      <button
                        key={h.val}
                        onClick={() => setWallHeightFt(h.val)}
                        className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                          wallHeightFt === h.val
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        {h.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Thickness */}
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                    <span>Wall Thickness</span>
                    <span className="text-amber-400 font-mono">
                      {wallThickMm} mm ({(wallThickMm / 25.4).toFixed(1)}")
                    </span>
                  </div>
                  <input
                    type="range"
                    min={80}
                    max={600}
                    step={10}
                    value={wallThickMm}
                    onChange={(e) => setWallThickMm(parseInt(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <div className="flex gap-1.5 flex-wrap pt-1">
                    {[
                      { label: '115mm (4.5")', val: 115 },
                      { label: '150mm (6")', val: 150 },
                      { label: '230mm (9")', val: 230 },
                      { label: '450mm (18")', val: 450 },
                    ].map((th) => (
                      <button
                        key={th.val}
                        onClick={() => setWallThickMm(th.val)}
                        className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                          wallThickMm === th.val
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        {th.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Color Finish */}
              <div className="flex items-center gap-4 bg-slate-800/30 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Wall Finish Palette:
                </span>
                <div className="flex gap-2 items-center">
                  {[
                    { color: '#ece8e1', name: 'Muted Plaster' },
                    { color: '#f7f6f2', name: 'Warm Alabaster' },
                    { color: '#0d4a36', name: 'Emerald Green' },
                    { color: '#e0ddd5', name: 'Concrete Stone' },
                    { color: '#2b2d30', name: 'Dark Charcoal' },
                  ].map((p) => (
                    <button
                      key={p.color}
                      onClick={() => setWallColor(p.color)}
                      className={`w-7 h-7 rounded-lg border transition-all ${
                        wallColor === p.color ? 'ring-2 ring-amber-400 scale-110 border-white' : 'border-slate-700'
                      }`}
                      style={{ backgroundColor: p.color }}
                      title={p.name}
                    />
                  ))}
                  <input
                    type="color"
                    value={wallColor}
                    onChange={(e) => setWallColor(e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer bg-transparent border-0 ml-1"
                  />
                </div>
              </div>

              {/* Placement Trigger Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-800">
                <button
                  onClick={() => handleCreateCustomWall('cursor')}
                  className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition-all"
                >
                  <Move className="w-4 h-4" />
                  Move with Cursor & Place Anywhere on Plan
                </button>
                <button
                  onClick={() => handleCreateCustomWall('center')}
                  className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all"
                >
                  <Building className="w-4 h-4" />
                  Place at Room Center
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: REMOVE WALLS */}
          {activeTab === 'remove-walls' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  Perimeter Wall Removal & Visibility
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Turn perimeter walls off to create open verandahs, grand archway colonnades, or connect neighboring courtyards.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      key: 'north' as const,
                      label: 'North Qibla Wall',
                      desc: '40.9 ft front grid wall + 18 ft x 7 ft Mehrab alcove',
                      grid: '40.9 ft',
                    },
                    {
                      key: 'south' as const,
                      label: 'South Back Wall',
                      desc: '63.2 ft main rear wall',
                      grid: '63.2 ft',
                    },
                    {
                      key: 'east' as const,
                      label: 'East Right Wall',
                      desc: '69.1 ft side wall',
                      grid: '69.1 ft',
                    },
                    {
                      key: 'west' as const,
                      label: 'West Left Wall',
                      desc: '73.5 ft side wall',
                      grid: '73.5 ft',
                    },
                    {
                      key: 'extension' as const,
                      label: 'Front Extension Boundary',
                      desc: '40.9 ft x 8 ft front extension walls',
                      grid: '40.9 x 8 ft',
                    },
                  ].map((w) => {
                    const isVisible = wallVis[w.key];
                    return (
                      <div
                        key={w.key}
                        className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                          isVisible
                            ? 'bg-slate-800/60 border-slate-700'
                            : 'bg-rose-950/20 border-rose-900/50'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-white">{w.label}</span>
                            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-700/50 text-slate-300 font-mono">
                              {w.grid}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{w.desc}</p>
                          <span
                            className={`text-[11px] font-semibold inline-block pt-1 ${
                              isVisible ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isVisible ? '• Standing (Made)' : '• Removed (Open)'}
                          </span>
                        </div>

                        <button
                          onClick={() => toggleWallVis(w.key)}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            isVisible
                              ? 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-600/30'
                              : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-600/30'
                          }`}
                        >
                          {isVisible ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" /> Remove Wall
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" /> Rebuild Wall
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Placed Interior Walls Removal */}
              <div className="pt-4 border-t border-slate-800">
                <h3 className="text-sm font-semibold text-white mb-1">
                  Custom Interior Walls & Partitions ({placedWalls.length})
                </h3>
                <p className="text-xs text-slate-400 mb-3">
                  Individually delete any custom drywall partitions, masonry walls, or dividers placed in the hall.
                </p>

                {placedWalls.length === 0 ? (
                  <div className="p-5 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                    No custom interior partition walls placed yet. Use the "Make Wall" tab to place one!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {placedWalls.map((wall) => (
                      <div
                        key={wall.id}
                        className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold text-xs text-slate-200 block">
                            {wall.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {wall.dimensions
                              ? `${(wall.dimensions.width / ft2m).toFixed(1)}' L x ${(wall.dimensions.height / ft2m).toFixed(1)}' H x ${Math.round(wall.dimensions.depth * 1000)}mm thick`
                              : 'Standard dimensions'}
                          </span>
                        </div>
                        <button
                          onClick={() => onRemoveItem(wall.id)}
                          className="px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Wall
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: WALL SIZES & PERIMETER */}
          {activeTab === 'wall-sizes' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  Perimeter Wall Heights & Thickness
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Adjust the structural wall sizing across the entire Musalla perimeter.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Height Slider */}
                  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                      <span>Perimeter Wall Height</span>
                      <span className="text-amber-400 font-mono text-sm">
                        {(currentWallHeightM / ft2m).toFixed(1)} ft ({currentWallHeightM.toFixed(2)} m)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2.5}
                      max={7.5}
                      step={0.1}
                      value={currentWallHeightM}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onUpdateConfig({
                          ...roomConfig,
                          wallHeightMeters: val,
                          height: val,
                        });
                      }}
                      className="w-full accent-amber-500"
                    />
                    <div className="flex gap-1.5 flex-wrap">
                      {[
                        { label: '13 ft (Tie Beam)', val: 13 * ft2m },
                        { label: '16 ft', val: 16 * ft2m },
                        { label: '19 ft (Main Beam)', val: 19 * ft2m },
                        { label: '22 ft', val: 22 * ft2m },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          onClick={() => {
                            onUpdateConfig({
                              ...roomConfig,
                              wallHeightMeters: preset.val,
                              height: preset.val,
                            });
                          }}
                          className={`text-xs px-2 py-1 rounded border transition-colors ${
                            Math.abs(currentWallHeightM - preset.val) < 0.1
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Thickness Slider */}
                  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                      <span>Perimeter Wall Thickness</span>
                      <span className="text-amber-400 font-mono text-sm">
                        {Math.round(currentWallThickM * 1000)} mm ({(currentWallThickM / 0.0254).toFixed(1)}")
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.15}
                      max={0.5}
                      step={0.01}
                      value={currentWallThickM}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onUpdateConfig({
                          ...roomConfig,
                          wallThicknessMeters: val,
                        });
                      }}
                      className="w-full accent-amber-500"
                    />
                    <div className="flex gap-1.5 flex-wrap">
                      {[
                        { label: '150mm (6")', val: 0.15 },
                        { label: '200mm (8")', val: 0.20 },
                        { label: '230mm (9" Standard)', val: 0.23 },
                        { label: '300mm (12")', val: 0.30 },
                        { label: '450mm (18")', val: 0.45 },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          onClick={() => {
                            onUpdateConfig({
                              ...roomConfig,
                              wallThicknessMeters: preset.val,
                            });
                          }}
                          className={`text-xs px-2 py-1 rounded border transition-colors ${
                            Math.abs(currentWallThickM - preset.val) < 0.01
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid Reference Summary */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
                  Current Masjid Architectural Grid Dimensions
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">First / Front Grid</span>
                    <span className="font-bold text-white font-mono text-sm">40.9 ft</span>
                    <span className="text-[10px] text-slate-500 block">12.47 m</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Right Side Grid</span>
                    <span className="font-bold text-white font-mono text-sm">69.1 ft</span>
                    <span className="text-[10px] text-slate-500 block">21.06 m</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Left Side Grid</span>
                    <span className="font-bold text-white font-mono text-sm">73.5 ft</span>
                    <span className="text-[10px] text-slate-500 block">22.40 m</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Main / Back Grid</span>
                    <span className="font-bold text-white font-mono text-sm">63.2 ft</span>
                    <span className="text-[10px] text-slate-500 block">19.26 m</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STRUCTURAL GRID */}
          {activeTab === 'structural-grid' && (
            <div className="space-y-6">
              {onOpenOfficeGrid && (
                <div className="p-4 bg-gradient-to-r from-blue-950/70 to-slate-900 border border-blue-500/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base">🏢</span>
                      <h4 className="text-sm font-bold text-white">
                        Office Structural Grid & Framing (C1, C2... & B1, B2...)
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 font-mono font-bold border border-blue-400/30">
                        C1/B1
                      </span>
                    </div>
                    <p className="text-xs text-blue-200/80 mt-1">
                      Configure custom office grid spans, automatic column (C1, C2...) & beam (B1, B2...) placement, framing profiles, and sequential renumbering.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenOfficeGrid();
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 shrink-0"
                  >
                    <span>Open Office Grid Tool</span>
                    <span>→</span>
                  </button>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-white">
                    Structural Columns & Beams Framework
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Clear Span @ 5761mm Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Center columns removed for an unobstructed prayer hall. Clear-span beams (450×900mm) rest directly on the outer perimeter columns at 5761mm from ground level.
                </p>

                {/* Primary Clearance Status Card */}
                <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-850 to-slate-900 border border-emerald-500/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="font-bold text-sm text-white">Hall Center Clearance</span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                          {mCfg.removeCenterColumns !== false ? 'Zero Center Columns' : 'Columns in Center'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        {mCfg.removeCenterColumns !== false
                          ? 'All columns removed from hall center. Transverse beams (450×900mm) rest on outer columns at 5761mm elevation.'
                          : 'Standard 22-column grid with interior columns enabled.'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const newRemove = mCfg.removeCenterColumns === false;
                        onUpdateConfig({
                          ...roomConfig,
                          wallHeightMeters: 5.761,
                          masjidConfig: {
                            ...mCfg,
                            removeCenterColumns: newRemove,
                            mainColumnCount: newRemove ? 12 : 22,
                            mainBeamElevationMm: 5761,
                            mainBeamWidthMm: 450,
                            mainBeamDepthMm: 900,
                          },
                        });
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        mCfg.removeCenterColumns !== false
                          ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/30'
                          : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                      }`}
                    >
                      {mCfg.removeCenterColumns !== false ? '✓ Center Cleared (Active)' : 'Clear Center Columns'}
                    </button>
                  </div>

                  {/* Beam & Column Specs Grid */}
                  <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Beam Width</div>
                      <div className="font-mono font-bold text-emerald-300 mt-0.5">
                        {mCfg.mainBeamWidthMm || 450} mm
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Beam Height</div>
                      <div className="font-mono font-bold text-emerald-300 mt-0.5">
                        {mCfg.mainBeamDepthMm || 900} mm
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Resting Elevation</div>
                      <div className="font-mono font-bold text-amber-300 mt-0.5">
                        {mCfg.mainBeamElevationMm || 5761} mm
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Outer Columns</div>
                      <div className="font-mono font-bold text-blue-300 mt-0.5">
                        {mCfg.removeCenterColumns !== false ? '12 Outer' : '22 Total'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Outer Columns */}
                  <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">
                          {mCfg.removeCenterColumns !== false ? '12 Outer Columns' : '22 Columns'}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                          650mm x 900mm
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Outer perimeter columns along Left & Right walls, height 5761mm (5.761m)
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        onUpdateConfig({
                          ...roomConfig,
                          masjidConfig: {
                            ...mCfg,
                            showColumns: mCfg.showColumns === false ? true : false,
                          },
                        });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        mCfg.showColumns !== false
                          ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-600/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {mCfg.showColumns !== false ? 'Enabled' : 'Hidden'}
                    </button>
                  </div>

                  {/* Clear Span Main Beams (450mm x 900mm @ 5761mm) */}
                  <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white">Transverse Roof Beams (B1–B6)</span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                            {mCfg.mainBeamWidthMm || 450}mm × {mCfg.mainBeamDepthMm || 900}mm
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Placed at 5761mm from ground level resting on outer columns and longitudinal beams
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          onUpdateConfig({
                            ...roomConfig,
                            masjidConfig: {
                              ...mCfg,
                              showMainBeams: mCfg.showMainBeams === false ? true : false,
                            },
                          });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          mCfg.showMainBeams !== false
                            ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {mCfg.showMainBeams !== false ? 'Enabled' : 'Hidden'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-purple-500/20">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Beam Width (mm)</label>
                        <input
                          type="number"
                          step="10"
                          value={mCfg.mainBeamWidthMm || 450}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 450;
                            onUpdateConfig({
                              ...roomConfig,
                              masjidConfig: { ...mCfg, mainBeamWidthMm: val },
                            });
                          }}
                          className="w-full bg-slate-900 border border-purple-500/40 rounded-lg px-2.5 py-1 text-xs font-mono text-purple-200"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Beam Depth (mm)</label>
                        <input
                          type="number"
                          step="10"
                          value={mCfg.mainBeamDepthMm || 900}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 900;
                            onUpdateConfig({
                              ...roomConfig,
                              masjidConfig: { ...mCfg, mainBeamDepthMm: val },
                            });
                          }}
                          className="w-full bg-slate-900 border border-purple-500/40 rounded-lg px-2.5 py-1 text-xs font-mono text-purple-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2 Extension Columns */}
                  <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">Front Extension Columns</span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                          150mm x 200mm
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Outer corner columns at front 8 ft extension (center clear)
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        onUpdateConfig({
                          ...roomConfig,
                          masjidConfig: {
                            ...mCfg,
                            showColumns: mCfg.showColumns === false ? true : false,
                          },
                        });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        mCfg.showColumns !== false
                          ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-600/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {mCfg.showColumns !== false ? 'Enabled' : 'Hidden'}
                    </button>
                  </div>

                  {/* Tie Beam at 13 ft */}
                  <div className="p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white">Tie Beam at 13 ft</span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                            {mCfg.tieBeamWidthMm || 150}mm × {mCfg.tieBeamHeightMm || 450}mm
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                            @ {mCfg.tieBeamHeightFt || 13} ft
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Structural perimeter bracing beam tying columns at 13 ft elevation
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          onUpdateConfig({
                            ...roomConfig,
                            masjidConfig: {
                              ...mCfg,
                              showTieBeams: mCfg.showTieBeams === false ? true : false,
                            },
                          });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          mCfg.showTieBeams !== false
                            ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {mCfg.showTieBeams !== false ? 'Enabled' : 'Hidden'}
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-indigo-500/20">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Elevation (ft)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={mCfg.tieBeamHeightFt || 13}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 13;
                            onUpdateConfig({
                              ...roomConfig,
                              masjidConfig: { ...mCfg, tieBeamHeightFt: val },
                            });
                          }}
                          className="w-full bg-slate-900 border border-indigo-500/40 rounded-lg px-2.5 py-1 text-xs font-mono text-indigo-200"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Width (mm)</label>
                        <input
                          type="number"
                          step="10"
                          value={mCfg.tieBeamWidthMm || 150}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 150;
                            onUpdateConfig({
                              ...roomConfig,
                              masjidConfig: { ...mCfg, tieBeamWidthMm: val },
                            });
                          }}
                          className="w-full bg-slate-900 border border-indigo-500/40 rounded-lg px-2.5 py-1 text-xs font-mono text-indigo-200"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Height (mm)</label>
                        <input
                          type="number"
                          step="10"
                          value={mCfg.tieBeamHeightMm || 450}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 450;
                            onUpdateConfig({
                              ...roomConfig,
                              masjidConfig: { ...mCfg, tieBeamHeightMm: val },
                            });
                          }}
                          className="w-full bg-slate-900 border border-indigo-500/40 rounded-lg px-2.5 py-1 text-xs font-mono text-indigo-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Center Bay Column Spacing (Interactive Slider & Inputs) */}
                  <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl sm:col-span-2 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white">Center Column Spacing & Beam Span</span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                            {mCfg.columnSpacingFeet || 20}&apos; 0&quot; ({((mCfg.columnSpacingFeet || 20) * 0.3048).toFixed(2)}m)
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Controls the distance between Left & Right door columns, Qibla columns, and longitudinal beams.
                        </p>
                      </div>

                      {/* Numeric direct input */}
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-300 font-medium">Spacing (ft):</label>
                        <input
                          type="number"
                          min="10"
                          max="40"
                          step="0.5"
                          value={mCfg.columnSpacingFeet || 20}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 20;
                            onUpdateConfig({
                              ...roomConfig,
                              masjidConfig: {
                                ...mCfg,
                                columnSpacingFeet: Math.max(8, Math.min(val, 50)),
                              },
                            });
                          }}
                          className="w-20 bg-slate-900 border border-amber-500/40 rounded-lg px-2 py-1 text-sm font-mono font-bold text-amber-300 text-center focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    {/* Interactive Slider */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-mono">10&apos;</span>
                      <input
                        type="range"
                        min="10"
                        max="35"
                        step="0.5"
                        value={mCfg.columnSpacingFeet || 20}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          onUpdateConfig({
                            ...roomConfig,
                            masjidConfig: {
                              ...mCfg,
                              columnSpacingFeet: val,
                            },
                          });
                        }}
                        className="flex-1 accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                      />
                      <span className="text-xs text-slate-400 font-mono">35&apos;</span>
                    </div>

                    {/* Quick Span Presets */}
                    <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                      <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">Quick Presets:</span>
                      {[16, 18, 20, 22, 24, 28].map((ft) => (
                        <button
                          key={ft}
                          type="button"
                          onClick={() => {
                            onUpdateConfig({
                              ...roomConfig,
                              masjidConfig: {
                                ...mCfg,
                                columnSpacingFeet: ft,
                              },
                            });
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                            (mCfg.columnSpacingFeet || 20) === ft
                              ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {ft}&apos; {ft === 20 ? '(Default)' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Main Door Columns (2x) - Interactive Controls */}
                  <div className="p-4 bg-cyan-950/20 border border-cyan-500/30 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white">Main Door Columns</span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                            C-Gate L & R
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Two columns flanking South entrance door @ 5761mm
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          onUpdateConfig({
                            ...roomConfig,
                            masjidConfig: {
                              ...mCfg,
                              hasGateColumns: mCfg.hasGateColumns === false ? true : false,
                            },
                          });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          mCfg.hasGateColumns !== false
                            ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {mCfg.hasGateColumns !== false ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>

                    {/* Width & Depth Inputs */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-cyan-500/20">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Width (mm)</label>
                        <input
                          type="number"
                          step="10"
                          value={mCfg.gateColumnWidthMm || 450}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 450;
                            onUpdateConfig({
                              ...roomConfig,
                              masjidConfig: { ...mCfg, gateColumnWidthMm: val },
                            });
                          }}
                          className="w-full bg-slate-900 border border-cyan-500/40 rounded-lg px-2.5 py-1 text-xs font-mono text-cyan-200"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Depth (mm)</label>
                        <input
                          type="number"
                          step="10"
                          value={mCfg.gateColumnDepthMm || 450}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 450;
                            onUpdateConfig({
                              ...roomConfig,
                              masjidConfig: { ...mCfg, gateColumnDepthMm: val },
                            });
                          }}
                          className="w-full bg-slate-900 border border-cyan-500/40 rounded-lg px-2.5 py-1 text-xs font-mono text-cyan-200"
                        />
                      </div>
                    </div>

                    {/* Gate Placement Location & Extra Column Selector */}
                    <div className="pt-2 border-t border-cyan-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-cyan-300">Gate Location</label>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              onUpdateConfig({
                                ...roomConfig,
                                masjidConfig: {
                                  ...mCfg,
                                  gatePosition: 'right-corner',
                                  hasExtraGateRightColumn: true,
                                },
                              });
                            }}
                            className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                              mCfg.gatePosition !== 'center'
                                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            Right Corner (Active)
                          </button>
                          <button
                            onClick={() => {
                              onUpdateConfig({
                                ...roomConfig,
                                masjidConfig: {
                                  ...mCfg,
                                  gatePosition: 'center',
                                },
                              });
                            }}
                            className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                              mCfg.gatePosition === 'center'
                                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            Center
                          </button>
                        </div>
                      </div>

                      {/* Extra Column Added to Right Side of Building */}
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <span className="text-[11px] font-medium text-slate-200 block">Extra Right Column</span>
                          <span className="text-[10px] text-slate-400">Added to right side of building (C-GATE-EXTRA-R)</span>
                        </div>
                        <button
                          onClick={() => {
                            onUpdateConfig({
                              ...roomConfig,
                              masjidConfig: {
                                ...mCfg,
                                hasExtraGateRightColumn: mCfg.hasExtraGateRightColumn === false ? true : false,
                              },
                            });
                          }}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                            mCfg.hasExtraGateRightColumn !== false
                              ? 'bg-sky-500/30 text-sky-200 border border-sky-400/50'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {mCfg.hasExtraGateRightColumn !== false ? 'Enabled (450×450)' : 'Disabled'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Qibla Wall Columns (2x) - Interactive Controls */}
                  <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white">Qibla Wall Columns</span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                            C-Qibla L & R
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Two columns on North Qibla wall @ 5761mm
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          onUpdateConfig({
                            ...roomConfig,
                            masjidConfig: {
                              ...mCfg,
                              hasQiblaColumns: mCfg.hasQiblaColumns === false ? true : false,
                            },
                          });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          mCfg.hasQiblaColumns !== false
                            ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {mCfg.hasQiblaColumns !== false ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>

                    {/* Width & Depth Inputs */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-500/20">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Width (mm)</label>
                        <input
                          type="number"
                          step="10"
                          value={mCfg.qiblaColumnWidthMm || 450}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 450;
                            onUpdateConfig({
                              ...roomConfig,
                              masjidConfig: {
                                ...mCfg,
                                qiblaColumnWidthMm: val,
                                qiblaCenterColumnWidthMm: val,
                              },
                            });
                          }}
                          className="w-full bg-slate-900 border border-emerald-500/40 rounded-lg px-2.5 py-1 text-xs font-mono text-emerald-200"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Depth (mm)</label>
                        <input
                          type="number"
                          step="10"
                          value={mCfg.qiblaColumnDepthMm || 450}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 450;
                            onUpdateConfig({
                              ...roomConfig,
                              masjidConfig: {
                                ...mCfg,
                                qiblaColumnDepthMm: val,
                                qiblaCenterColumnDepthMm: val,
                              },
                            });
                          }}
                          className="w-full bg-slate-900 border border-emerald-500/40 rounded-lg px-2.5 py-1 text-xs font-mono text-emerald-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Two Longitudinal Beams - Interactive Controls */}
                  <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl sm:col-span-2 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white">Two Longitudinal Beams (Left & Right)</span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                            {mCfg.longitudinalBeamWidthMm || 450}mm W × {mCfg.longitudinalBeamDepthMm || 900}mm H
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                            @ {mCfg.mainBeamElevationMm || 5761}mm
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Two parallel beams resting directly on door & Qibla columns, securely tying all transverse roof beams (B1–B6).
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          onUpdateConfig({
                            ...roomConfig,
                            masjidConfig: {
                              ...mCfg,
                              hasTwoLongitudinalBeams: mCfg.hasTwoLongitudinalBeams === false ? true : false,
                              hasCentralSpineBeam: mCfg.hasTwoLongitudinalBeams === false ? true : false,
                            },
                          });
                        }}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          mCfg.hasTwoLongitudinalBeams !== false
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {mCfg.hasTwoLongitudinalBeams !== false ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>

                    {/* Beam Dimension Inputs */}
                    <div className="grid grid-cols-3 gap-3 pt-2 border-t border-emerald-500/20">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Beam Width (mm)</label>
                        <input
                          type="number"
                          step="10"
                          value={mCfg.longitudinalBeamWidthMm || 450}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 450;
                            onUpdateConfig({
                              ...roomConfig,
                              masjidConfig: {
                                ...mCfg,
                                longitudinalBeamWidthMm: val,
                                centralSpineBeamWidthMm: val,
                              },
                            });
                          }}
                          className="w-full bg-slate-900 border border-emerald-500/40 rounded-lg px-2.5 py-1 text-xs font-mono text-emerald-200"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Beam Depth/Height (mm)</label>
                        <input
                          type="number"
                          step="10"
                          value={mCfg.longitudinalBeamDepthMm || 900}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 900;
                            onUpdateConfig({
                              ...roomConfig,
                              masjidConfig: {
                                ...mCfg,
                                longitudinalBeamDepthMm: val,
                                centralSpineBeamDepthMm: val,
                              },
                            });
                          }}
                          className="w-full bg-slate-900 border border-emerald-500/40 rounded-lg px-2.5 py-1 text-xs font-mono text-emerald-200"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Elevation (mm / ft)</label>
                        <input
                          type="number"
                          step="10"
                          value={mCfg.mainBeamElevationMm || 5761}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 5761;
                            onUpdateConfig({
                              ...roomConfig,
                              masjidConfig: {
                                ...mCfg,
                                mainBeamElevationMm: val,
                                mainBeamHeightFt: parseFloat((val / 304.8).toFixed(2)),
                              },
                            });
                          }}
                          className="w-full bg-slate-900 border border-emerald-500/40 rounded-lg px-2.5 py-1 text-xs font-mono text-emerald-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Saff Prayer Lines */}
              <div className="p-4 bg-slate-800/30 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-semibold text-sm text-white block">
                    Gold Saff Prayer Row Lines
                  </span>
                  <p className="text-xs text-slate-400">
                    Precision 1.2m aligned prayer rows across the entire Musalla hall carpet
                  </p>
                </div>
                <button
                  onClick={() => {
                    onUpdateConfig({
                      ...roomConfig,
                      masjidConfig: {
                        ...mCfg,
                        showSaffLines: !mCfg.showSaffLines,
                      },
                    });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    mCfg.showSaffLines
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {mCfg.showSaffLines ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
