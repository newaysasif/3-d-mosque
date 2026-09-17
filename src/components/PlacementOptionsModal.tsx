import React, { useState } from 'react';
import {
  X,
  Maximize2,
  Move,
  Compass,
  Check,
  RotateCw,
  Sliders,
  Sparkles,
  Layers,
} from 'lucide-react';
import { FurnitureCatalogItem, PlacedFurnitureItem, RoomConfig } from '../types';

interface PlacementOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: FurnitureCatalogItem | PlacedFurnitureItem | null;
  roomConfig: RoomConfig;
  onStartCursorPlacement: (options: {
    dimensions: { width: number; depth: number; height: number };
    color: string;
    secondaryColor?: string;
    rotationY: number;
    elevation: number;
  }) => void;
  onPlaceAtCoordinates: (options: {
    position: [number, number, number];
    dimensions: { width: number; depth: number; height: number };
    color: string;
    secondaryColor?: string;
    rotationY: number;
  }) => void;
}

export const PlacementOptionsModal: React.FC<PlacementOptionsModalProps> = ({
  isOpen,
  onClose,
  item,
  roomConfig,
  onStartCursorPlacement,
  onPlaceAtCoordinates,
}) => {
  if (!isOpen || !item) return null;

  const isImperial = roomConfig.unitSystem === 'imperial';
  const toDisplayUnit = (m: number) => (isImperial ? (m * 3.28084).toFixed(2) : m.toFixed(2));
  const unitLabel = isImperial ? 'ft' : 'm';

  const defaultDims = item.dimensions || { width: 1.0, depth: 1.0, height: 1.0 };
  const [scaleFactor, setScaleFactor] = useState<number>(1.0);
  const [dimensions, setDimensions] = useState<{ width: number; depth: number; height: number }>({
    width: defaultDims.width,
    depth: defaultDims.depth,
    height: defaultDims.height,
  });

  const [selectedColor, setSelectedColor] = useState<string>(
    'defaultColor' in item ? item.defaultColor : item.color
  );
  const [rotationY, setRotationY] = useState<number>(
    'rotationY' in item ? item.rotationY : 0
  );
  const [elevation, setElevation] = useState<number>(0);

  // Coordinate placement inputs
  const [coordX, setCoordX] = useState<number>(0);
  const [coordZ, setCoordZ] = useState<number>(0);

  const applyScalePreset = (presetScale: number) => {
    setScaleFactor(presetScale);
    setDimensions({
      width: +(defaultDims.width * presetScale).toFixed(2),
      depth: +(defaultDims.depth * presetScale).toFixed(2),
      height: +(defaultDims.height * presetScale).toFixed(2),
    });
  };

  const handleDimensionChange = (axis: 'width' | 'depth' | 'height', val: number) => {
    const clamped = Math.max(0.1, Math.min(25.0, val));
    setDimensions((prev) => ({
      ...prev,
      [axis]: +clamped.toFixed(2),
    }));
  };

  const stepDimension = (axis: 'width' | 'depth' | 'height', delta: number) => {
    const current = dimensions[axis];
    handleDimensionChange(axis, current + delta);
  };

  const handleStartCursor = () => {
    onStartCursorPlacement({
      dimensions,
      color: selectedColor,
      secondaryColor: item.secondaryColor,
      rotationY,
      elevation,
    });
    onClose();
  };

  const handleCoordinatePlace = () => {
    onPlaceAtCoordinates({
      position: [coordX, elevation, coordZ],
      dimensions,
      color: selectedColor,
      secondaryColor: item.secondaryColor,
      rotationY,
    });
    onClose();
  };

  const colorOptions = 'colorOptions' in item && item.colorOptions?.length
    ? item.colorOptions
    : [selectedColor, '#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#1f2937'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl text-slate-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">{item.name}</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                  {item.category}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Choose custom sizes & select placement mode
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

        <div className="p-6 space-y-6">
          {/* SECTION 1: SIZES & DIMENSIONS OPTIONS */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Maximize2 className="w-4 h-4 text-emerald-400" />
                <span>Size & Dimensions Options</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>Units:</span>
                <span className="font-semibold text-emerald-400 uppercase">{unitLabel}</span>
              </div>
            </div>

            {/* Quick Size Presets */}
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-2">
                Size Presets
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Compact', scale: 0.75, desc: '75%' },
                  { label: 'Standard', scale: 1.0, desc: '100%' },
                  { label: 'Grand', scale: 1.25, desc: '125%' },
                  { label: 'Monumental', scale: 1.5, desc: '150%' },
                ].map((preset) => {
                  const isActive = Math.abs(scaleFactor - preset.scale) < 0.02;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => applyScalePreset(preset.scale)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        isActive
                          ? 'bg-blue-600/30 border-blue-500 text-white shadow-sm'
                          : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="text-xs font-semibold">{preset.label}</div>
                      <div className="text-[10px] text-slate-400">{preset.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Numeric Size Inputs */}
            <div className="grid grid-cols-3 gap-3">
              {/* Width */}
              <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-700/50">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Width (X)</span>
                  <span className="font-mono text-[10px] text-slate-500">
                    {toDisplayUnit(dimensions.width)} {unitLabel}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => stepDimension('width', -0.1)}
                    className="w-6 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="30"
                    value={dimensions.width}
                    onChange={(e) => handleDimensionChange('width', parseFloat(e.target.value) || 0.1)}
                    className="w-full bg-slate-800/90 text-center font-mono text-xs text-white rounded py-1 px-1 border border-slate-700 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => stepDimension('width', 0.1)}
                    className="w-6 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Depth */}
              <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-700/50">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Depth (Z)</span>
                  <span className="font-mono text-[10px] text-slate-500">
                    {toDisplayUnit(dimensions.depth)} {unitLabel}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => stepDimension('depth', -0.1)}
                    className="w-6 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="30"
                    value={dimensions.depth}
                    onChange={(e) => handleDimensionChange('depth', parseFloat(e.target.value) || 0.1)}
                    className="w-full bg-slate-800/90 text-center font-mono text-xs text-white rounded py-1 px-1 border border-slate-700 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => stepDimension('depth', 0.1)}
                    className="w-6 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Height */}
              <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-700/50">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Height (Y)</span>
                  <span className="font-mono text-[10px] text-slate-500">
                    {toDisplayUnit(dimensions.height)} {unitLabel}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => stepDimension('height', -0.1)}
                    className="w-6 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="30"
                    value={dimensions.height}
                    onChange={(e) => handleDimensionChange('height', parseFloat(e.target.value) || 0.1)}
                    className="w-full bg-slate-800/90 text-center font-mono text-xs text-white rounded py-1 px-1 border border-slate-700 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => stepDimension('height', 0.1)}
                    className="w-6 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Scale Slider & Reset */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Uniform Scale Factor</span>
                <span className="font-mono font-medium text-blue-400">
                  {Math.round(scaleFactor * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={scaleFactor}
                  onChange={(e) => applyScalePreset(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <button
                  onClick={() => applyScalePreset(1.0)}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 whitespace-nowrap"
                >
                  Reset Size
                </button>
              </div>
            </div>

            {/* Colors & Finish */}
            <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Material Finish / Color</span>
              <div className="flex items-center gap-1.5">
                {colorOptions.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`w-6 h-6 rounded-full border transition-transform ${
                      selectedColor === c ? 'scale-125 border-white ring-2 ring-blue-500' : 'border-slate-600'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: THE TWO PLACEMENT OPTIONS */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Select Placement Mode (Both Options Available)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* OPTION 1: MOVE WITH CURSOR & PLACE */}
              <div className="bg-gradient-to-br from-blue-950/40 to-slate-800/80 p-5 rounded-2xl border-2 border-blue-500/50 hover:border-blue-400 transition-all shadow-lg flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Option 1
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-blue-300 font-medium">
                      <Sparkles className="w-3.5 h-3.5" /> Interactive
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-semibold text-white flex items-center gap-2">
                      <Move className="w-5 h-5 text-blue-400" />
                      Move with Cursor
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Item follows your mouse in real-time with 3D ghost preview, footprint reticle, and live coordinates. Left-click anywhere on the floor to drop.
                    </p>
                  </div>

                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>• Left Click:</span>
                      <span className="text-slate-200">Drop & Place</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>• Press [R]:</span>
                      <span className="text-slate-200">Rotate 45°</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>• Press [Esc]:</span>
                      <span className="text-slate-200">Cancel</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleStartCursor}
                  className="mt-4 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-blue-600/30 transition-all"
                >
                  <Move className="w-4 h-4" />
                  Move with Cursor & Place
                </button>
              </div>

              {/* OPTION 2: PLACE AT EXACT COORDINATES */}
              <div className="bg-slate-800/70 p-5 rounded-2xl border border-slate-700/80 hover:border-slate-600 transition-all shadow-md flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-700 text-slate-300 border border-slate-600">
                      Option 2
                    </span>
                    <span className="text-[11px] text-slate-400">CAD Numeric</span>
                  </div>

                  <div>
                    <h4 className="text-base font-semibold text-white flex items-center gap-2">
                      <Compass className="w-5 h-5 text-emerald-400" />
                      Place at Coordinates
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Enter exact numeric floor coordinates (X, Z) and orientation angle.
                    </p>
                  </div>

                  {/* Coordinate inputs */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                      <label className="text-[10px] text-slate-400 block mb-0.5">X Position ({unitLabel})</label>
                      <input
                        type="number"
                        step="0.25"
                        value={coordX}
                        onChange={(e) => setCoordX(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-800 text-xs font-mono text-white rounded px-2 py-1 border border-slate-700"
                      />
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                      <label className="text-[10px] text-slate-400 block mb-0.5">Z Position ({unitLabel})</label>
                      <input
                        type="number"
                        step="0.25"
                        value={coordZ}
                        onChange={(e) => setCoordZ(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-800 text-xs font-mono text-white rounded px-2 py-1 border border-slate-700"
                      />
                    </div>
                  </div>

                  {/* Quick Position Presets */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setCoordX(0);
                        setCoordZ(0);
                      }}
                      className="text-[10px] py-1 px-2 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                    >
                      Center (0,0)
                    </button>
                    {roomConfig.masjidConfig?.isMasjid ? (
                      <button
                        onClick={() => {
                          setCoordX(0);
                          setCoordZ(-roomConfig.length * 0.35);
                        }}
                        className="text-[10px] py-1 px-2 rounded bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-700/50"
                      >
                        Near Mehrab
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setCoordX(0);
                          setCoordZ(-roomConfig.length * 0.3);
                        }}
                        className="text-[10px] py-1 px-2 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                      >
                        North Wall
                      </button>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleCoordinatePlace}
                  className="mt-4 w-full py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold flex items-center justify-center gap-2 border border-slate-600 transition-all"
                >
                  <Compass className="w-4 h-4 text-emerald-400" />
                  Place at Coordinates
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
