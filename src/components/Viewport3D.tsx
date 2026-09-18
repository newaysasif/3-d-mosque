import React, { useEffect, useRef } from 'react';
import { CameraMode, PlacedFurnitureItem, RoomConfig } from '../types';
import { SceneManager } from '../engine/SceneManager';
import { ItemInspector } from './ItemInspector';
import {
  RotateCcw,
  Grid,
  Footprints,
  Eye,
  Maximize2,
  Compass,
  Move,
  RotateCw,
  X,
} from 'lucide-react';

interface Viewport3DProps {
  roomConfig: RoomConfig;
  items: PlacedFurnitureItem[];
  selectedItem: PlacedFurnitureItem | null;
  cameraMode: CameraMode;
  sceneManagerRef: React.MutableRefObject<SceneManager | null>;
  cursorPlacementInfo?: {
    active: boolean;
    itemName: string;
    dimensions: { width: number; depth: number; height: number };
    hoverCoords: { x: number; z: number } | null;
    rotationY: number;
  } | null;
  onSelectItem: (item: PlacedFurnitureItem | null) => void;
  onUpdateItem: (item: PlacedFurnitureItem) => void;
  onDuplicateItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onCenterItem: (id: string) => void;
  onStartMoveWithCursor?: (item: PlacedFurnitureItem) => void;
  onRotatePlacementGhost?: (delta: number) => void;
  onCancelCursorPlacement?: () => void;
  onToggleGridSnap: () => void;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  roomConfig,
  items,
  selectedItem,
  cameraMode,
  sceneManagerRef,
  cursorPlacementInfo,
  onSelectItem,
  onUpdateItem,
  onDuplicateItem,
  onDeleteItem,
  onCenterItem,
  onStartMoveWithCursor,
  onRotatePlacementGhost,
  onCancelCursorPlacement,
  onToggleGridSnap,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [initError, setInitError] = React.useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      const manager = new SceneManager(
        containerRef.current,
        roomConfig,
        items,
        {
          onItemSelected: (it) => onSelectItem(it),
          onItemMoved: (it) => onUpdateItem(it),
        }
      );

      sceneManagerRef.current = manager;
      setInitError(null);

      return () => {
        manager.dispose();
        sceneManagerRef.current = null;
      };
    } catch (err: any) {
      console.error('Failed to initialize 3D WebGL SceneManager:', err);
      setInitError(err?.message || 'WebGL 3D Context could not be initialized.');
    }
  }, []); // Run once on mount

  // Sync updates to manager when dependencies change
  useEffect(() => {
    if (sceneManagerRef.current) {
      try {
        sceneManagerRef.current.syncFurnitureItems(items);
      } catch (err) {
        console.error('Error syncing items:', err);
      }
    }
  }, [items]);

  useEffect(() => {
    if (sceneManagerRef.current) {
      try {
        sceneManagerRef.current.updateRoomConfig(roomConfig);
      } catch (err) {
        console.error('Error updating roomConfig:', err);
      }
    }
  }, [roomConfig]);

  useEffect(() => {
    if (sceneManagerRef.current) {
      try {
        sceneManagerRef.current.setCameraMode(cameraMode);
      } catch (err) {
        console.error('Error setting camera mode:', err);
      }
    }
  }, [cameraMode]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-950">
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* WebGL Init Error Fallback */}
      {initError && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur flex items-center justify-center p-6 z-40">
          <div className="max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
            <h3 className="text-lg font-bold text-white">3D Canvas Initializing</h3>
            <p className="text-xs text-slate-400">
              {initError}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
            >
              Reload Studio
            </button>
          </div>
        </div>
      )}

      {/* Floating Item Inspector */}
      {selectedItem && (
        <ItemInspector
          item={selectedItem}
          roomConfig={roomConfig}
          onUpdateItem={onUpdateItem}
          onDuplicateItem={onDuplicateItem}
          onDeleteItem={onDeleteItem}
          onCenterItem={onCenterItem}
          onStartMoveWithCursor={onStartMoveWithCursor}
          onClose={() => onSelectItem(null)}
        />
      )}

      {/* Live Cursor Placement Mode Top HUD Banner */}
      {cursorPlacementInfo?.active && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="bg-slate-900/95 backdrop-blur-md border-2 border-blue-500/80 rounded-2xl shadow-2xl px-5 py-3 text-slate-100 flex items-center gap-4">
            <div className="flex items-center gap-2.5 border-r border-slate-700 pr-4">
              <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500 flex items-center justify-center text-blue-400 animate-pulse">
                <Move className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">
                    {cursorPlacementInfo.itemName}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-600/30 text-blue-300 font-mono">
                    Move & Place
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                  <span>
                    {cursorPlacementInfo.dimensions.width.toFixed(2)}m × {cursorPlacementInfo.dimensions.depth.toFixed(2)}m × {cursorPlacementInfo.dimensions.height.toFixed(2)}m
                  </span>
                  {cursorPlacementInfo.hoverCoords && (
                    <span className="text-emerald-400">
                      [X: {cursorPlacementInfo.hoverCoords.x.toFixed(2)}m, Z: {cursorPlacementInfo.hoverCoords.z.toFixed(2)}m]
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* In-HUD Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onRotatePlacementGhost && onRotatePlacementGhost(45)}
                className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Rotate 45 degrees (or press R)"
              >
                <RotateCw className="w-3.5 h-3.5 text-blue-400" />
                <span>Rotate [R]</span>
                <span className="font-mono text-[10px] text-slate-400">
                  {cursorPlacementInfo.rotationY}°
                </span>
              </button>

              <button
                onClick={onCancelCursorPlacement}
                className="py-1.5 px-2.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 text-xs font-medium flex items-center gap-1 transition-colors"
                title="Cancel placement (or press Esc)"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel [Esc]</span>
              </button>
            </div>

            <div className="hidden md:block pl-2 border-l border-slate-700 text-[11px] text-slate-400">
              Left-click floor to place
            </div>
          </div>
        </div>
      )}

      {/* 2D CAD Plan Dimension Overlay (Active in 2D Plan mode) */}
      {cameraMode === '2d-plan' && (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
          {/* Top dimension ruler */}
          <div className="flex flex-col items-center">
            <div className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur border border-blue-500/40 text-blue-300 font-mono text-xs flex items-center gap-1.5 shadow-lg">
              <span className="text-slate-400">Width:</span> {roomConfig.width.toFixed(2)} m
            </div>
            <div className="w-48 h-px bg-blue-500/40 mt-1 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 border-l border-b border-blue-400 rotate-45" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-r border-t border-blue-400 rotate-45" />
            </div>
          </div>

          {/* Side dimension ruler */}
          <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center">
            <div className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur border border-blue-500/40 text-blue-300 font-mono text-xs shadow-lg rotate-[-90deg]">
              <span className="text-slate-400">Length:</span> {roomConfig.length.toFixed(2)} m
            </div>
          </div>

          {/* Bottom scale indicator */}
          <div className="flex justify-end">
            <div className="px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur border border-slate-700 text-[11px] text-slate-300 font-mono flex items-center gap-2 shadow-lg">
              <span>Grid: {roomConfig.gridSnap ? `${roomConfig.gridSnapSize}m snap` : 'Continuous'}</span>
              <span className="text-slate-500">•</span>
              <span>CAD Top-Down View</span>
            </div>
          </div>
        </div>
      )}

      {/* Walkthrough Controls Guide & Reticle (Active in Walkthrough mode) */}
      {cameraMode === 'walkthrough' && (
        <>
          {/* Center reticle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white/70 shadow" />
          </div>

          {/* Bottom HUD instructions */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="px-4 py-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl text-slate-200 text-xs flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-blue-400">W</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-blue-400">A</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-blue-400">S</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-blue-400">D</span>
                <span className="text-slate-400 ml-1">to walk</span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-slate-400">Click & drag to look</span>
              </div>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400 font-mono">Eye-level 1.65m</span>
            </div>
          </div>
        </>
      )}

      {/* Bottom-left Viewport Utility Controls */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
        {/* Reset Camera Orbit */}
        {cameraMode === '3d-orbit' && (
          <button
            onClick={() => sceneManagerRef.current?.resetOrbitView()}
            className="py-1.5 px-3 bg-slate-900/80 hover:bg-slate-800/90 backdrop-blur border border-slate-700 rounded-xl text-xs font-medium text-slate-200 flex items-center gap-1.5 shadow-lg transition-colors"
            title="Reset 3D camera angle"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-400" /> Reset View
          </button>
        )}

        {/* Snap to Grid Toggle */}
        <button
          onClick={onToggleGridSnap}
          className={`py-1.5 px-3 backdrop-blur border rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-lg transition-colors ${
            roomConfig.gridSnap
              ? 'bg-blue-600/30 border-blue-500/50 text-blue-300'
              : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle 0.25m Grid Snapping"
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Snap {roomConfig.gridSnap ? '0.25m' : 'Off'}</span>
        </button>

        {/* Total Items Indicator */}
        <div className="py-1.5 px-3 bg-slate-900/80 backdrop-blur border border-slate-700 rounded-xl text-xs text-slate-400 font-mono shadow-lg">
          {items.length} items
        </div>
      </div>
    </div>
  );
};
