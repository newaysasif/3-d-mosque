import React from 'react';
import { FlooringType, RoomConfig, WallDirection } from '../types';
import {
  X,
  Maximize2,
  Layers,
  Palette,
  Check,
  Compass,
  Sliders,
} from 'lucide-react';

interface RoomSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomConfig: RoomConfig;
  onUpdateConfig: (newConfig: RoomConfig) => void;
}

const FLOORING_OPTIONS: { id: FlooringType; name: string; tag: string; desc: string }[] = [
  { id: 'mosque-carpet-emerald', name: 'Emerald Mihrab Mosque Carpet', tag: 'Masjid', desc: 'Turkish emerald velvet with gold Saff prayer rows & pointed arch motifs' },
  { id: 'mosque-carpet-ruby', name: 'Imperial Ruby Mosque Carpet', tag: 'Masjid', desc: 'Deep crimson velvet with gold muqarnas Saff alignment borders' },
  { id: 'mosque-carpet-sand', name: 'Desert Sand Mosque Carpet', tag: 'Masjid', desc: 'Warm ivory & sand wool with subtle geometric Saff rows' },
  { id: 'natural-oak', name: 'Natural Oak Planks', tag: 'Scandinavian', desc: 'Light warm honey wood with longitudinal bevels' },
  { id: 'herringbone', name: 'European Herringbone', tag: 'Parquet', desc: '45° alternating chevron blocks with soft tonal variation' },
  { id: 'dark-walnut', name: 'Dark Walnut Hardwood', tag: 'Mid-Century', desc: 'Deep espresso tones with rich flowing grain lines' },
  { id: 'carrara-marble', name: 'Carrara Italian Marble', tag: 'Luxury', desc: 'Polished white stone with delicate cloudy grey veins' },
  { id: 'polished-concrete', name: 'Polished Concrete', tag: 'Industrial', desc: 'Micro-grit industrial trowel surface with subtle sheen' },
  { id: 'wool-carpet', name: 'Bouclé Wool Carpet', tag: 'Cozy', desc: 'Tactile loop-pile weave with soft woven border' },
  { id: 'terracotta', name: 'Tuscan Terracotta Tile', tag: 'Mediterranean', desc: 'Warm baked clay tiles separated by mortar grout' },
];

const BASE_WALL_PRESETS = [
  { name: 'Warm Alabaster', color: '#f7f6f2' },
  { name: 'Crisp Studio White', color: '#fafafa' },
  { name: 'Muted Plaster', color: '#ece8e1' },
  { name: 'Warm Clay Sand', color: '#e8dfd5' },
  { name: 'Charcoal Stone', color: '#2b2d30' },
];

const ACCENT_COLOR_PRESETS = [
  { name: 'Nordic Sage', color: '#3d4b41' },
  { name: 'Acoustic Oak', color: '#a67c52' },
  { name: 'Midnight Navy', color: '#1e293b' },
  { name: 'Tuscan Ochre', color: '#9e5b41' },
  { name: 'Deep Anthracite', color: '#18181b' },
];

export const RoomSettingsModal: React.FC<RoomSettingsModalProps> = ({
  isOpen,
  onClose,
  roomConfig,
  onUpdateConfig,
}) => {
  if (!isOpen) return null;

  const handleDimensionChange = (key: 'width' | 'length' | 'height', val: number) => {
    onUpdateConfig({
      ...roomConfig,
      [key]: Math.round(val * 10) / 10,
    });
  };

  const handleFlooringChange = (type: FlooringType) => {
    onUpdateConfig({ ...roomConfig, flooring: type });
  };

  const handleAccentWallToggle = (dir: WallDirection) => {
    const current = roomConfig.accentWalls[dir];
    onUpdateConfig({
      ...roomConfig,
      accentWalls: {
        ...roomConfig.accentWalls,
        [dir]: {
          ...current,
          enabled: !current.enabled,
        },
      },
    });
  };

  const handleAccentWallUpdate = (
    dir: WallDirection,
    updates: Partial<RoomConfig['accentWalls'][WallDirection]>
  ) => {
    const current = roomConfig.accentWalls[dir];
    onUpdateConfig({
      ...roomConfig,
      accentWalls: {
        ...roomConfig.accentWalls,
        [dir]: {
          ...current,
          ...updates,
        },
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        id="room-settings-modal"
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Room Architecture & Finishes</h2>
              <p className="text-xs text-slate-400">
                Custom room dimensions, procedural flooring textures, and directional accent walls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Dimensions */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-blue-400" /> Room Dimensions (Meters)
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Width (X)</span>
                  <span className="font-mono text-blue-400 font-bold">{roomConfig.width.toFixed(1)}m</span>
                </div>
                <input
                  type="range"
                  min="3.0"
                  max="12.0"
                  step="0.5"
                  value={roomConfig.width}
                  onChange={(e) => handleDimensionChange('width', parseFloat(e.target.value))}
                  className="w-full accent-blue-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Length (Z)</span>
                  <span className="font-mono text-blue-400 font-bold">{roomConfig.length.toFixed(1)}m</span>
                </div>
                <input
                  type="range"
                  min="3.0"
                  max="14.0"
                  step="0.5"
                  value={roomConfig.length}
                  onChange={(e) => handleDimensionChange('length', parseFloat(e.target.value))}
                  className="w-full accent-blue-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Ceiling Height (Y)</span>
                  <span className="font-mono text-blue-400 font-bold">{roomConfig.height.toFixed(1)}m</span>
                </div>
                <input
                  type="range"
                  min="2.4"
                  max="4.0"
                  step="0.1"
                  value={roomConfig.height}
                  onChange={(e) => handleDimensionChange('height', parseFloat(e.target.value))}
                  className="w-full accent-blue-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Procedural Flooring */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" /> Procedural Flooring Texture
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {FLOORING_OPTIONS.map((floor) => {
                const isSelected = roomConfig.flooring === floor.id;
                return (
                  <button
                    key={floor.id}
                    onClick={() => handleFlooringChange(floor.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start justify-between ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500 shadow-md'
                        : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-slate-100">{floor.name}</span>
                        <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.2 rounded bg-slate-700 text-slate-300">
                          {floor.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">{floor.desc}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0 ml-2 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Base Wall Paints & Moldings */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Palette className="w-4 h-4 text-amber-400" /> Base Wall Paint & Trim
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Wall paint palette */}
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-2">
                <span className="text-xs text-slate-300 font-medium block">Base Wall Paint</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {BASE_WALL_PRESETS.map((p) => (
                    <button
                      key={p.color}
                      onClick={() => onUpdateConfig({ ...roomConfig, baseWallColor: p.color })}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        roomConfig.baseWallColor === p.color
                          ? 'border-blue-400 scale-110 shadow ring-2 ring-blue-500/40'
                          : 'border-slate-600 hover:scale-105'
                      }`}
                      style={{ backgroundColor: p.color }}
                      title={p.name}
                    />
                  ))}
                  <input
                    type="color"
                    value={roomConfig.baseWallColor}
                    onChange={(e) => onUpdateConfig({ ...roomConfig, baseWallColor: e.target.value })}
                    className="w-7 h-7 rounded-full bg-transparent cursor-pointer border border-slate-600"
                    title="Custom color"
                  />
                </div>
              </div>

              {/* Baseboard molding */}
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-2">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Baseboard Height</span>
                  <span className="font-mono text-slate-200">
                    {Math.round((roomConfig.baseboardHeight || 0.12) * 100)} cm
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.25"
                  step="0.01"
                  value={roomConfig.baseboardHeight || 0.12}
                  onChange={(e) =>
                    onUpdateConfig({
                      ...roomConfig,
                      baseboardHeight: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-blue-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Directional Accent Walls */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Compass className="w-4 h-4 text-purple-400" /> Directional Feature Accent Walls
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {(['north', 'south', 'east', 'west'] as WallDirection[]).map((dir) => {
                const wall = roomConfig.accentWalls[dir];
                return (
                  <div
                    key={dir}
                    className={`p-3 rounded-xl border transition-all ${
                      wall.enabled
                        ? 'bg-slate-800/80 border-purple-500/50'
                        : 'bg-slate-800/40 border-slate-700/50 opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                        {dir} Wall
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={wall.enabled}
                          onChange={() => handleAccentWallToggle(dir)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    {wall.enabled && (
                      <div className="space-y-2 pt-1 border-t border-slate-700/60">
                        {/* Finish type */}
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-slate-400 text-[11px]">Finish:</span>
                          <select
                            value={wall.finish}
                            onChange={(e) =>
                              handleAccentWallUpdate(dir, {
                                finish: e.target.value as any,
                              })
                            }
                            className="bg-slate-700 text-slate-200 text-xs px-2 py-0.5 rounded border border-slate-600 focus:outline-none"
                          >
                            <option value="flat">Flat Paint</option>
                            <option value="wood-slats">Vertical Wood Slats</option>
                            <option value="fluted">Fluted Plaster</option>
                          </select>
                        </div>

                        {/* Color presets */}
                        <div className="flex items-center gap-1.5">
                          {ACCENT_COLOR_PRESETS.map((ac) => (
                            <button
                              key={ac.color}
                              onClick={() => handleAccentWallUpdate(dir, { color: ac.color })}
                              className={`w-5 h-5 rounded-full border ${
                                wall.color === ac.color
                                  ? 'border-purple-400 scale-110 ring-1 ring-purple-400'
                                  : 'border-slate-600'
                              }`}
                              style={{ backgroundColor: ac.color }}
                              title={ac.name}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Section 4: Islamic Masjid Musalla Architecture */}
          <div className="space-y-3 p-4 rounded-xl bg-emerald-950/25 border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                    Masjid Musalla & Mehrab Architecture
                  </h3>
                  <p className="text-[11px] text-emerald-400/80">
                    40.9' Qibla short wall with 18' × 7' protruding Mehrab niche & Saff lines
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  const currentIsMasjid = !!roomConfig.masjidConfig?.isMasjid;
                  onUpdateConfig({
                    ...roomConfig,
                    flooring: !currentIsMasjid ? 'mosque-carpet-emerald' : roomConfig.flooring,
                    masjidConfig: {
                      ...(roomConfig.masjidConfig || {}),
                      isMasjid: !currentIsMasjid,
                      qiblaWallFeet: 40.9,
                      leftWallFeet: 73.5,
                      rightWallFeet: 69.83,
                      backWallFeet: 63.2,
                      mehrabWidthFeet: 18.0,
                      mehrabDepthFeet: 7.0,
                      mehrabHeightFeet: 9.0,
                      showSaffLines: true,
                      saffSpacingMeters: 1.2,
                      saffColor: '#d4af37',
                      estimatedCapacity: 310,
                    } as any,
                  });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  roomConfig.masjidConfig?.isMasjid
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {roomConfig.masjidConfig?.isMasjid ? '✓ Masjid Mode Active' : 'Enable Masjid Mode'}
              </button>
            </div>

            {roomConfig.masjidConfig?.isMasjid && (
              <div className="pt-3 border-t border-emerald-800/40 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-emerald-600/30">
                    <span className="text-[11px] text-emerald-300 block mb-1 font-medium">
                      Qibla Short Wall
                    </span>
                    <span className="font-mono text-sm font-bold text-white">40.9 ft</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">North orientation</span>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-emerald-600/30">
                    <span className="text-[11px] text-emerald-300 block mb-1 font-medium">
                      Mehrab Niche Alcove
                    </span>
                    <span className="font-mono text-sm font-bold text-amber-300">18' W × 7' Deep</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">9' Niche height</span>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-emerald-600/30">
                    <span className="text-[11px] text-emerald-300 block mb-1 font-medium">
                      Musalla Capacity
                    </span>
                    <span className="font-mono text-sm font-bold text-emerald-400">~310 Persons</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Based on Saff rows</span>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-slate-200">
                      Show Visual Saff Prayer Rows on Floor
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onUpdateConfig({
                        ...roomConfig,
                        masjidConfig: {
                          ...roomConfig.masjidConfig!,
                          showSaffLines: !roomConfig.masjidConfig?.showSaffLines,
                        },
                      });
                    }}
                    className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                      roomConfig.masjidConfig?.showSaffLines ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                {/* Persian Iwan Three Side Walls Design Section */}
                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-teal-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-teal-300">
                          Three Side Walls Interior Design (Except Qibla)
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-900/80 text-teal-200 border border-teal-500/30 font-mono">
                          Persian Iwan Style
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Authentic Isfahan / Shah Mosque architectural elements on West, East &amp; South perimeter walls
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const currentVal = roomConfig.masjidConfig?.traditionalIslamicWalls !== false;
                        onUpdateConfig({
                          ...roomConfig,
                          masjidConfig: {
                            ...roomConfig.masjidConfig!,
                            traditionalIslamicWalls: !currentVal,
                            islamicWallStyle: 'persian-iwan',
                          },
                        });
                      }}
                      className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                        roomConfig.masjidConfig?.traditionalIslamicWalls !== false
                          ? 'bg-teal-500 justify-end'
                          : 'bg-slate-700 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                    </button>
                  </div>

                  {roomConfig.masjidConfig?.traditionalIslamicWalls !== false && (
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[11px]">
                      {/* Muqarnas Vaulting */}
                      <button
                        onClick={() => {
                          const pCfg = roomConfig.masjidConfig?.persianIwanConfig || {};
                          onUpdateConfig({
                            ...roomConfig,
                            masjidConfig: {
                              ...roomConfig.masjidConfig!,
                              islamicWallStyle: 'persian-iwan',
                              persianIwanConfig: {
                                ...pCfg,
                                showMuqarnasVaulting: pCfg.showMuqarnasVaulting === false,
                              },
                            },
                          });
                        }}
                        className={`p-2 rounded-lg border text-left flex items-center justify-between transition-colors ${
                          roomConfig.masjidConfig?.persianIwanConfig?.showMuqarnasVaulting !== false
                            ? 'bg-teal-950/40 border-teal-500/40 text-teal-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span>Muqarnas Vaulting (مقرنس)</span>
                        <Check className="w-3.5 h-3.5" />
                      </button>

                      {/* Orosi Stained Glass */}
                      <button
                        onClick={() => {
                          const pCfg = roomConfig.masjidConfig?.persianIwanConfig || {};
                          onUpdateConfig({
                            ...roomConfig,
                            masjidConfig: {
                              ...roomConfig.masjidConfig!,
                              islamicWallStyle: 'persian-iwan',
                              persianIwanConfig: {
                                ...pCfg,
                                showOrosiStainedGlass: pCfg.showOrosiStainedGlass === false,
                              },
                            },
                          });
                        }}
                        className={`p-2 rounded-lg border text-left flex items-center justify-between transition-colors ${
                          roomConfig.masjidConfig?.persianIwanConfig?.showOrosiStainedGlass !== false
                            ? 'bg-teal-950/40 border-teal-500/40 text-teal-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span>Orosi Glass &amp; Girih (پنجره ارسی)</span>
                        <Check className="w-3.5 h-3.5" />
                      </button>

                      {/* Taqcheh Quran Alcoves */}
                      <button
                        onClick={() => {
                          const pCfg = roomConfig.masjidConfig?.persianIwanConfig || {};
                          onUpdateConfig({
                            ...roomConfig,
                            masjidConfig: {
                              ...roomConfig.masjidConfig!,
                              islamicWallStyle: 'persian-iwan',
                              persianIwanConfig: {
                                ...pCfg,
                                showTaqchehQuranAlcoves: pCfg.showTaqchehQuranAlcoves === false,
                              },
                            },
                          });
                        }}
                        className={`p-2 rounded-lg border text-left flex items-center justify-between transition-colors ${
                          roomConfig.masjidConfig?.persianIwanConfig?.showTaqchehQuranAlcoves !== false
                            ? 'bg-teal-950/40 border-teal-500/40 text-teal-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span>Taqcheh Quran Alcoves (طاقچه)</span>
                        <Check className="w-3.5 h-3.5" />
                      </button>

                      {/* Persian Pierced Brass Lanterns */}
                      <button
                        onClick={() => {
                          const pCfg = roomConfig.masjidConfig?.persianIwanConfig || {};
                          onUpdateConfig({
                            ...roomConfig,
                            masjidConfig: {
                              ...roomConfig.masjidConfig!,
                              islamicWallStyle: 'persian-iwan',
                              persianIwanConfig: {
                                ...pCfg,
                                showPersianLamps: pCfg.showPersianLamps === false,
                              },
                            },
                          });
                        }}
                        className={`p-2 rounded-lg border text-left flex items-center justify-between transition-colors ${
                          roomConfig.masjidConfig?.persianIwanConfig?.showPersianLamps !== false
                            ? 'bg-teal-950/40 border-teal-500/40 text-teal-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span>Suspended Lanterns (چراغ)</span>
                        <Check className="w-3.5 h-3.5" />
                      </button>

                      {/* Marble Izareh Wainscot */}
                      <button
                        onClick={() => {
                          const pCfg = roomConfig.masjidConfig?.persianIwanConfig || {};
                          onUpdateConfig({
                            ...roomConfig,
                            masjidConfig: {
                              ...roomConfig.masjidConfig!,
                              islamicWallStyle: 'persian-iwan',
                              persianIwanConfig: {
                                ...pCfg,
                                showMarbleIzareh: pCfg.showMarbleIzareh === false,
                              },
                            },
                          });
                        }}
                        className={`p-2 rounded-lg border text-left flex items-center justify-between transition-colors ${
                          roomConfig.masjidConfig?.persianIwanConfig?.showMarbleIzareh !== false
                            ? 'bg-teal-950/40 border-teal-500/40 text-teal-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span>Alabaster Izareh (ازاره)</span>
                        <Check className="w-3.5 h-3.5" />
                      </button>

                      {/* Thuluth Katibeh Calligraphy */}
                      <button
                        onClick={() => {
                          const pCfg = roomConfig.masjidConfig?.persianIwanConfig || {};
                          onUpdateConfig({
                            ...roomConfig,
                            masjidConfig: {
                              ...roomConfig.masjidConfig!,
                              islamicWallStyle: 'persian-iwan',
                              persianIwanConfig: {
                                ...pCfg,
                                showPersianKatibehFrieze: pCfg.showPersianKatibehFrieze === false,
                              },
                            },
                          });
                        }}
                        className={`p-2 rounded-lg border text-left flex items-center justify-between transition-colors ${
                          roomConfig.masjidConfig?.persianIwanConfig?.showPersianKatibehFrieze !== false
                            ? 'bg-teal-950/40 border-teal-500/40 text-teal-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span>Katibeh Frieze (کتیبه ثلث)</span>
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-800/80 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
