import React from 'react';
import { PlacedFurnitureItem, RoomConfig } from '../types';
import { FURNITURE_CATALOG } from '../engine/catalogData';
import {
  RotateCw,
  RotateCcw,
  Copy,
  Trash2,
  Crosshair,
  ArrowUp,
  X,
  Maximize2,
  Move,
  Sliders,
  Compass,
} from 'lucide-react';

interface ItemInspectorProps {
  item: PlacedFurnitureItem | null;
  roomConfig: RoomConfig;
  onUpdateItem: (updated: PlacedFurnitureItem) => void;
  onDuplicateItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onCenterItem: (id: string) => void;
  onStartMoveWithCursor?: (item: PlacedFurnitureItem) => void;
  onClose: () => void;
}

export const ItemInspector: React.FC<ItemInspectorProps> = ({
  item,
  roomConfig,
  onUpdateItem,
  onDuplicateItem,
  onDeleteItem,
  onCenterItem,
  onStartMoveWithCursor,
  onClose,
}) => {
  if (!item) return null;

  // Find catalog item to get designer color options and default dimensions
  const catalogItem = FURNITURE_CATALOG.find((c) => c.modelType === item.modelType);
  const defaultDimensions = catalogItem?.dimensions || { width: 1.0, depth: 1.0, height: 1.0 };
  const colorOptions = catalogItem?.colorOptions || [
    item.color,
    '#e5e2dc',
    '#3f444c',
    '#b08a60',
    '#5c4033',
    '#2c3539',
    '#f8fafc',
  ];

  const isImperial = roomConfig.unitSystem === 'imperial';
  const unitLabel = isImperial ? 'ft' : 'm';
  const toDisplay = (m: number) => (isImperial ? (m * 3.28084).toFixed(2) : m.toFixed(2));

  const handleRotateDelta = (deltaDegrees: number) => {
    let newRot = (item.rotationY + deltaDegrees) % 360;
    if (newRot < 0) newRot += 360;
    onUpdateItem({ ...item, rotationY: Math.round(newRot) });
  };

  const handleRotationChange = (val: number) => {
    onUpdateItem({ ...item, rotationY: val });
  };

  const handleElevationChange = (val: number) => {
    onUpdateItem({
      ...item,
      position: [item.position[0], val, item.position[2]],
    });
  };

  const handlePositionChange = (axisIndex: 0 | 2, val: number) => {
    const newPos = [...item.position] as [number, number, number];
    newPos[axisIndex] = +val.toFixed(2);
    onUpdateItem({
      ...item,
      position: newPos,
    });
  };

  const stepPosition = (axisIndex: 0 | 2, delta: number) => {
    const current = item.position[axisIndex];
    handlePositionChange(axisIndex, current + delta);
  };

  const handleDimensionChange = (axis: 'width' | 'depth' | 'height', val: number) => {
    const clamped = Math.max(0.1, Math.min(25.0, val));
    onUpdateItem({
      ...item,
      dimensions: {
        ...item.dimensions,
        [axis]: +clamped.toFixed(2),
      },
    });
  };

  const stepDimension = (axis: 'width' | 'depth' | 'height', delta: number) => {
    const current = item.dimensions[axis];
    handleDimensionChange(axis, current + delta);
  };

  const applyScalePreset = (factor: number) => {
    onUpdateItem({
      ...item,
      dimensions: {
        width: +(defaultDimensions.width * factor).toFixed(2),
        depth: +(defaultDimensions.depth * factor).toFixed(2),
        height: +(defaultDimensions.height * factor).toFixed(2),
      },
    });
  };

  const handleColorSelect = (hex: string) => {
    onUpdateItem({ ...item, color: hex });
  };

  // Calculate current scale factor relative to default
  const currentScale = defaultDimensions.width > 0
    ? +(item.dimensions.width / defaultDimensions.width).toFixed(2)
    : 1.0;

  return (
    <div
      id="floating-item-inspector"
      className="absolute top-4 right-4 z-20 w-84 max-h-[92vh] overflow-y-auto bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-4 text-slate-100 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-600/30 text-blue-300 border border-blue-500/30">
              {item.category}
            </span>
            {item.customData?.structuralId && (
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600/30 text-emerald-300 border border-emerald-500/30">
                {item.customData.structuralId}
              </span>
            )}
            <span className="text-xs text-slate-400">
              ${item.price.toLocaleString()}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-white mt-1 truncate max-w-[210px]">
            {item.name}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Deselect item"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Structural Tag & Name Quick Editor (C1, C2... & B1, B2...) */}
      {(item.customData?.structuralId ||
        item.modelType.startsWith('structural-column-') ||
        item.modelType.startsWith('structural-beam') ||
        item.customData?.architecturalType === 'column' ||
        item.customData?.architecturalType === 'beam') && (
        <div className="py-2.5 px-3 bg-blue-950/30 border border-blue-800/50 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-300 flex items-center gap-1.5">
              <span>🏗️</span>
              <span>
                {item.customData?.architecturalType === 'beam' || item.modelType.includes('beam')
                  ? 'Structural Beam (B#)'
                  : 'Structural Column (C#)'}
              </span>
            </span>
            {item.customData?.gridCoordinate && (
              <span className="font-mono text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                Grid: {item.customData.gridCoordinate}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <label className="text-[10px] text-slate-400 block mb-0.5">Tag</label>
              <input
                type="text"
                value={item.customData?.structuralId || item.name.split(':')[0] || ''}
                onChange={(e) => {
                  const newTag = e.target.value.trim();
                  onUpdateItem({
                    ...item,
                    name: `${newTag}: ${item.name.includes(':') ? item.name.split(':')[1].trim() : item.name}`,
                    customData: {
                      ...item.customData,
                      structuralId: newTag,
                    },
                  });
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono font-bold text-xs"
                placeholder="C1 or B1"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] text-slate-400 block mb-0.5">Label / Description</label>
              <input
                type="text"
                value={item.name}
                onChange={(e) => onUpdateItem({ ...item, name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* MOVE WITH CURSOR & POSITION SECTION */}
      <div className="py-3 border-b border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-medium text-slate-300">
          <span className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-blue-400" /> Placement & Movement
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            X:{item.position[0].toFixed(2)}m, Z:{item.position[2].toFixed(2)}m
          </span>
        </div>

        {/* Option 1: Move with Cursor Button */}
        {onStartMoveWithCursor && (
          <button
            onClick={() => onStartMoveWithCursor(item)}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all"
            title="Move this item freely across the floor with your mouse cursor"
          >
            <Move className="w-3.5 h-3.5" />
            Move with Cursor & Place
          </button>
        )}

        {/* Option 2: Coordinate Steppers */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>X Position</span>
              <span className="font-mono text-slate-300">{toDisplay(item.position[0])} {unitLabel}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => stepPosition(0, -0.25)}
                className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 text-xs font-bold"
              >
                -
              </button>
              <input
                type="number"
                step="0.1"
                value={item.position[0]}
                onChange={(e) => handlePositionChange(0, parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 text-center font-mono text-xs rounded py-0.5 border border-slate-700"
              />
              <button
                onClick={() => stepPosition(0, 0.25)}
                className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 text-xs font-bold"
              >
                +
              </button>
            </div>
          </div>

          <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Z Position</span>
              <span className="font-mono text-slate-300">{toDisplay(item.position[2])} {unitLabel}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => stepPosition(2, -0.25)}
                className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 text-xs font-bold"
              >
                -
              </button>
              <input
                type="number"
                step="0.1"
                value={item.position[2]}
                onChange={(e) => handlePositionChange(2, parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 text-center font-mono text-xs rounded py-0.5 border border-slate-700"
              />
              <button
                onClick={() => stepPosition(2, 0.25)}
                className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 text-xs font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SIZES & DIMENSIONS CUSTOMIZATION */}
      <div className="py-3 border-b border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-1.5 font-medium">
            <Maximize2 className="w-3.5 h-3.5 text-emerald-400" /> Size & Dimensions
          </span>
          <span className="font-mono text-[11px] text-emerald-400">
            {Math.round(currentScale * 100)}% scale
          </span>
        </div>

        {/* Quick Scale Presets */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: '0.75x', factor: 0.75 },
            { label: '1.0x', factor: 1.0 },
            { label: '1.25x', factor: 1.25 },
            { label: '1.5x', factor: 1.5 },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyScalePreset(preset.factor)}
              className={`py-1 text-xs rounded-lg border text-center transition-all ${
                Math.abs(currentScale - preset.factor) < 0.05
                  ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200 font-semibold'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Numeric Dimension Inputs (W, D, H) */}
        <div className="grid grid-cols-3 gap-1.5">
          {/* Width */}
          <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
              <span>Width (W)</span>
              <span className="font-mono text-slate-300">{toDisplay(item.dimensions.width)}{unitLabel}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => stepDimension('width', -0.1)}
                className="w-5 h-6 rounded bg-slate-700 hover:bg-slate-600 text-xs font-bold text-slate-300"
              >
                -
              </button>
              <input
                type="number"
                step="0.05"
                min="0.1"
                value={item.dimensions.width}
                onChange={(e) => handleDimensionChange('width', parseFloat(e.target.value) || 0.1)}
                className="w-full bg-slate-900 text-center font-mono text-[11px] text-white rounded py-0.5 border border-slate-700"
              />
              <button
                onClick={() => stepDimension('width', 0.1)}
                className="w-5 h-6 rounded bg-slate-700 hover:bg-slate-600 text-xs font-bold text-slate-300"
              >
                +
              </button>
            </div>
          </div>

          {/* Depth */}
          <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
              <span>Depth (D)</span>
              <span className="font-mono text-slate-300">{toDisplay(item.dimensions.depth)}{unitLabel}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => stepDimension('depth', -0.1)}
                className="w-5 h-6 rounded bg-slate-700 hover:bg-slate-600 text-xs font-bold text-slate-300"
              >
                -
              </button>
              <input
                type="number"
                step="0.05"
                min="0.1"
                value={item.dimensions.depth}
                onChange={(e) => handleDimensionChange('depth', parseFloat(e.target.value) || 0.1)}
                className="w-full bg-slate-900 text-center font-mono text-[11px] text-white rounded py-0.5 border border-slate-700"
              />
              <button
                onClick={() => stepDimension('depth', 0.1)}
                className="w-5 h-6 rounded bg-slate-700 hover:bg-slate-600 text-xs font-bold text-slate-300"
              >
                +
              </button>
            </div>
          </div>

          {/* Height */}
          <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
              <span>Height (H)</span>
              <span className="font-mono text-slate-300">{toDisplay(item.dimensions.height)}{unitLabel}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => stepDimension('height', -0.1)}
                className="w-5 h-6 rounded bg-slate-700 hover:bg-slate-600 text-xs font-bold text-slate-300"
              >
                -
              </button>
              <input
                type="number"
                step="0.05"
                min="0.1"
                value={item.dimensions.height}
                onChange={(e) => handleDimensionChange('height', parseFloat(e.target.value) || 0.1)}
                className="w-full bg-slate-900 text-center font-mono text-[11px] text-white rounded py-0.5 border border-slate-700"
              />
              <button
                onClick={() => stepDimension('height', 0.1)}
                className="w-5 h-6 rounded bg-slate-700 hover:bg-slate-600 text-xs font-bold text-slate-300"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Uniform scale slider */}
        <div className="pt-1 flex items-center justify-between gap-2">
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.05"
            value={currentScale}
            onChange={(e) => applyScalePreset(parseFloat(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <button
            onClick={() => applyScalePreset(1.0)}
            className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 whitespace-nowrap"
          >
            Reset Size
          </button>
        </div>
      </div>

      {/* Rotation Controls */}
      <div className="py-3 border-b border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
          <span className="flex items-center gap-1.5 font-medium">
            <RotateCw className="w-3.5 h-3.5 text-blue-400" /> Rotation
          </span>
          <span className="font-mono text-blue-300">{item.rotationY}°</span>
        </div>

        {/* Quick Angle Buttons */}
        <div className="grid grid-cols-4 gap-1.5 mb-2">
          <button
            onClick={() => handleRotateDelta(-45)}
            className="py-1 px-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-200 flex items-center justify-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" /> -45°
          </button>
          <button
            onClick={() => handleRotateDelta(45)}
            className="py-1 px-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-200 flex items-center justify-center gap-1 transition-colors"
          >
            <RotateCw className="w-3 h-3 text-slate-400" /> +45°
          </button>
          <button
            onClick={() => handleRotateDelta(90)}
            className="py-1 px-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-200 transition-colors"
          >
            90°
          </button>
          <button
            onClick={() => handleRotateDelta(180)}
            className="py-1 px-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-200 transition-colors"
          >
            180°
          </button>
        </div>

        {/* Continuous Rotation Slider */}
        <input
          type="range"
          min="0"
          max="359"
          value={item.rotationY}
          onChange={(e) => handleRotationChange(Number(e.target.value))}
          className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
      </div>

      {/* Elevation (Y-Axis) Adjustment */}
      <div className="py-3 border-b border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
          <span className="flex items-center gap-1.5 font-medium">
            <ArrowUp className="w-3.5 h-3.5 text-emerald-400" /> Elevation (Height Y)
          </span>
          <span className="font-mono text-emerald-300">{item.position[1].toFixed(2)}m</span>
        </div>
        <input
          type="range"
          min="0"
          max={roomConfig.height}
          step="0.05"
          value={item.position[1]}
          onChange={(e) => handleElevationChange(Number(e.target.value))}
          className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          <button
            onClick={() => handleElevationChange(0)}
            className="hover:text-emerald-300 transition-colors"
          >
            Floor (0.0m)
          </button>
          <button
            onClick={() => handleElevationChange(0.75)}
            className="hover:text-emerald-300 transition-colors"
          >
            Tabletop (0.75m)
          </button>
          <button
            onClick={() => handleElevationChange(roomConfig.height - 0.5)}
            className="hover:text-emerald-300 transition-colors"
          >
            Ceiling ({roomConfig.height.toFixed(1)}m)
          </button>
        </div>
      </div>

      {/* Designer Material & Color Swatches */}
      <div className="py-3 border-b border-slate-800">
        <span className="text-xs text-slate-300 font-medium block mb-2">
          Finish & Material Swatches
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {colorOptions.map((hex) => (
            <button
              key={hex}
              onClick={() => handleColorSelect(hex)}
              className={`w-7 h-7 rounded-full border-2 transition-transform ${
                item.color.toLowerCase() === hex.toLowerCase()
                  ? 'border-blue-400 scale-110 shadow-md ring-2 ring-blue-500/50'
                  : 'border-slate-600 hover:scale-105'
              }`}
              style={{ backgroundColor: hex }}
              title={`Finish ${hex}`}
            />
          ))}
        </div>
      </div>

      {/* Object Actions: Duplicate, Center, Delete */}
      <div className="pt-3 flex items-center gap-2">
        <button
          onClick={() => onDuplicateItem(item.id)}
          className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
          title="Duplicate item"
        >
          <Copy className="w-3.5 h-3.5 text-blue-400" /> Duplicate
        </button>
        <button
          onClick={() => onCenterItem(item.id)}
          className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
          title="Center in room"
        >
          <Crosshair className="w-3.5 h-3.5 text-slate-400" /> Center
        </button>
        <button
          onClick={() => onDeleteItem(item.id)}
          className="py-1.5 px-2.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 hover:text-red-200 rounded-lg text-xs font-medium flex items-center justify-center transition-colors"
          title="Delete item"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
