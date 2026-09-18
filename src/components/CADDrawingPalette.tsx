import React, { useState, useEffect, useRef } from 'react';
import {
  DrawingToolType,
  DoorDrawStyle,
  WindowDrawStyle,
  WallDrawStyle,
  ColumnDrawStyle,
  RoomConfig,
  PlacedFurnitureItem,
  CADMeasurement,
  WallDirection,
  LiveDraftingState,
} from '../types';
import { SceneManager } from '../engine/SceneManager';
import {
  MousePointer,
  DoorClosed,
  AppWindow,
  Ruler,
  Split,
  Box,
  Columns,
  Square,
  Sparkles,
  RotateCw,
  Trash2,
  Check,
  X,
  Compass,
  Layers,
  ArrowRight,
  GripVertical,
  ChevronUp,
  ChevronDown,
  PenTool,
  Image as ImageIcon,
} from 'lucide-react';

interface CADDrawingPaletteProps {
  roomConfig: RoomConfig;
  items: PlacedFurnitureItem[];
  activeTool: DrawingToolType;
  onChangeTool: (tool: DrawingToolType) => void;
  onAddItem: (item: PlacedFurnitureItem) => void;
  onDeleteCustomWalls?: () => void;
  sceneManagerRef: React.MutableRefObject<SceneManager | null>;
  measurements: CADMeasurement[];
  onAddMeasurement: (m: CADMeasurement) => void;
  onClearMeasurements: () => void;
  onUpdateDraftingState?: (state: LiveDraftingState | null) => void;
  onGenerate3D: () => void;
  onClosePalette?: () => void;
  onOpenImagePaster?: () => void;
}

export const CADDrawingPalette: React.FC<CADDrawingPaletteProps> = ({
  roomConfig,
  items,
  activeTool,
  onChangeTool,
  onAddItem,
  onDeleteCustomWalls,
  sceneManagerRef,
  measurements,
  onAddMeasurement,
  onClearMeasurements,
  onUpdateDraftingState,
  onGenerate3D,
  onClosePalette,
  onOpenImagePaster,
}) => {
  // Wall / Partition tool config
  const [wallStyle, setWallStyle] = useState<WallDrawStyle>('custom-masonry-wall');
  const [wallHeightFt, setWallHeightFt] = useState<number>(19.0); // 19 ft user spec
  const [wallThicknessMm, setWallThicknessMm] = useState<number>(230); // 230 mm (9") masonry
  const [wallColor, setWallColor] = useState<string>('#f8fafc');

  // Column tool config
  const [columnStyle, setColumnStyle] = useState<ColumnDrawStyle>('structural-column-650x900');
  const [columnHeightFt, setColumnHeightFt] = useState<number>(19.0);

  // Door tool config
  const [doorStyle, setDoorStyle] = useState<DoorDrawStyle>('interior-door');
  const [doorWidth, setDoorWidth] = useState<number>(0.95);
  const [doorOpenAngle, setDoorOpenAngle] = useState<number>(30);
  const [doorOrientation, setDoorOrientation] = useState<number>(0);

  // Window tool config
  const [windowStyle, setWindowStyle] = useState<WindowDrawStyle>('picture-window');
  const [windowWidth, setWindowWidth] = useState<number>(1.8);
  const [windowSillHeight, setWindowSillHeight] = useState<number>(0.9);
  const [windowOrientation, setWindowOrientation] = useState<number>(0);

  // Interactive Drafting State
  const [wallChainStart, setWallChainStart] = useState<{ x: number; z: number } | null>(null);
  const [firstWallOrigin, setFirstWallOrigin] = useState<{ x: number; z: number } | null>(null);
  const [roomRectStart, setRoomRectStart] = useState<{ x: number; z: number } | null>(null);
  const [measureStart, setMeasureStart] = useState<{ x: number; z: number } | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; z: number } | null>(null);

  // Movable / Draggable & Foldable state
  const [isFolded, setIsFolded] = useState<boolean>(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });
  const paletteRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    const rect = paletteRef.current?.getBoundingClientRect();
    const currentX = rect ? rect.left : window.innerWidth / 2 - 250;
    const currentY = rect ? rect.top : 16;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: currentX,
      initialY: currentY,
    };
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;
      const newX = Math.max(10, Math.min(window.innerWidth - 180, dragStartRef.current.initialX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 80, dragStartRef.current.initialY + dy));
      setPosition({ x: newX, y: newY });
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Refs for current values inside event listeners
  const wallChainStartRef = useRef(wallChainStart);
  wallChainStartRef.current = wallChainStart;
  const firstWallOriginRef = useRef(firstWallOrigin);
  firstWallOriginRef.current = firstWallOrigin;
  const roomRectStartRef = useRef(roomRectStart);
  roomRectStartRef.current = roomRectStart;
  const measureStartRef = useRef(measureStart);
  measureStartRef.current = measureStart;

  // Reset interactive points when changing tools
  useEffect(() => {
    setWallChainStart(null);
    setFirstWallOrigin(null);
    setRoomRectStart(null);
    setMeasureStart(null);
    if (onUpdateDraftingState) {
      onUpdateDraftingState(null);
    }
  }, [activeTool]);

  // Handle escape key to cancel / finish current wall chain
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setWallChainStart(null);
        setFirstWallOrigin(null);
        setRoomRectStart(null);
        setMeasureStart(null);
        if (onUpdateDraftingState) onUpdateDraftingState(null);
      } else if (e.key === 'w' || e.key === 'W') {
        if (!(e.target instanceof HTMLInputElement)) onChangeTool('draw-wall');
      } else if (e.key === 'r' || e.key === 'R') {
        if (!(e.target instanceof HTMLInputElement)) onChangeTool('draw-room');
      } else if (e.key === 's' || e.key === 'S') {
        if (!(e.target instanceof HTMLInputElement)) onChangeTool('split-area');
      } else if (e.key === 'c' || e.key === 'C') {
        if (!(e.target instanceof HTMLInputElement)) onChangeTool('place-column');
      } else if (e.key === 'd' || e.key === 'D') {
        if (!(e.target instanceof HTMLInputElement)) onChangeTool('draw-door');
      } else if (e.key === 'm' || e.key === 'M') {
        if (!(e.target instanceof HTMLInputElement)) onChangeTool('measure');
      } else if (e.key === 'v' || e.key === 'V') {
        if (!(e.target instanceof HTMLInputElement)) onChangeTool('select');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onChangeTool, onUpdateDraftingState]);

  // Helper to place a single wall segment between (x1, z1) and (x2, z2)
  const addWallSegment = (x1: number, z1: number, x2: number, z2: number) => {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.15) return; // Too short to place

    const midX = (x1 + x2) / 2;
    const midZ = (z1 + z2) / 2;

    // In Three.js, local vector (1, 0, 0) rotated by rotY has dx = len*cos(rotY), dz = -len*sin(rotY)
    const rotRad = Math.atan2(-dz, dx);
    const rotDeg = (rotRad * 180) / Math.PI;

    const ft2m = 0.3048;
    const h = wallHeightFt * ft2m;
    const thick = wallThicknessMm / 1000;

    let name = 'Architectural Masonry Wall';
    let modelType = wallStyle;
    let secColor = '#cbd5e1';
    let pColor = wallColor;

    if (wallStyle === 'travertine-ashlar-wall') {
      name = 'Honed Travertine Ashlar Wall';
      modelType = 'custom-masonry-wall';
      pColor = '#faf6ec';
      secColor = '#e8dfcc';
    } else if (wallStyle === 'walnut-timber-wall') {
      name = 'Architectural Walnut Timber Wall';
      modelType = 'custom-masonry-wall';
      pColor = '#3a2416';
      secColor = '#24140a';
    } else if (wallStyle === 'glass-steel-partition') {
      name = 'Glass & Steel Partition Wall';
      secColor = '#1e293b';
    } else if (wallStyle === 'fluted-wood-divider') {
      name = 'Fluted Timber Partition Divider';
      secColor = '#3b2314';
    } else if (wallStyle === 'pony-wall') {
      name = 'Half-Height Pony Wall';
    }

    const newWall: PlacedFurnitureItem = {
      id: `wall-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      modelType,
      name,
      category: 'architectural',
      position: [midX, 0, midZ],
      rotationY: parseFloat(rotDeg.toFixed(2)),
      dimensions: {
        width: parseFloat(len.toFixed(2)),
        depth: parseFloat(thick.toFixed(2)),
        height: parseFloat(h.toFixed(2)),
      },
      color: pColor,
      secondaryColor: secColor,
      price: Math.round(len * 120),
      customData: {
        architecturalType: 'partition',
        isSketchedWall: true,
        startPoint: [x1, z1],
        endPoint: [x2, z2],
      },
    };

    onAddItem(newWall);
  };

  // Helper to place a structural column at (x, z)
  const placeColumnAt = (x: number, z: number) => {
    const ft2m = 0.3048;
    const h = columnHeightFt * ft2m;

    let w = 0.65;
    let d = 0.9;
    let name = 'Main Structural Column (650mm × 900mm)';

    if (columnStyle === 'structural-column-150x200') {
      w = 0.15;
      d = 0.2;
      name = 'Extension Column (150mm × 200mm)';
    } else if (columnStyle === 'architectural-pillar' || columnStyle === 'masjid-pillar') {
      w = 0.35;
      d = 0.35;
      name = 'Octagonal Architectural Pillar';
    }

    const newCol: PlacedFurnitureItem = {
      id: `col-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      modelType: columnStyle,
      name,
      category: 'architectural',
      position: [x, 0, z],
      rotationY: 0,
      dimensions: { width: w, depth: d, height: h },
      color: '#94a3b8',
      secondaryColor: '#64748b',
      price: 350,
      customData: { architecturalType: 'column', columnStyle },
    };

    onAddItem(newCol);
  };

  // Place Door Helper
  const placeDoorAt = (x: number, z: number, rotY: number, wallDir?: WallDirection) => {
    let name = 'Single Interior Passage Door';
    let price = 320;
    let color = '#475569';
    let secColor = '#cbd5e1';

    if (doorStyle === 'french-double-door') {
      name = 'Grand French Double Door';
      price = 780;
      color = '#1e293b';
      secColor = '#94a3b8';
    } else if (doorStyle === 'sliding-barn-door') {
      name = 'Modern Pocket Sliding Door';
      price = 560;
      color = '#78350f';
      secColor = '#1f2937';
    } else if (doorStyle === 'pivot-door') {
      name = 'Architectural Glass Pivot Door';
      price = 1150;
      color = '#0f172a';
      secColor = '#38bdf8';
    }

    const newItem: PlacedFurnitureItem = {
      id: `door-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      modelType: doorStyle,
      name,
      category: 'architectural',
      position: [x, 0, z],
      rotationY: rotY,
      dimensions: {
        width: doorWidth,
        depth: 0.15,
        height: doorStyle === 'french-double-door' ? 2.4 : 2.1,
      },
      color,
      secondaryColor: secColor,
      price,
      customData: {
        architecturalType: 'door',
        doorStyle,
        openAngle: doorOpenAngle,
        wallAttachment: wallDir || 'freestanding',
      },
    };

    onAddItem(newItem);
  };

  // Place Window Helper
  const placeWindowAt = (x: number, z: number, rotY: number, wallDir?: WallDirection) => {
    let name = 'Architectural Picture Window';
    let price = 480;
    let color = '#1e293b';
    let secColor = '#94a3b8';

    if (windowStyle === 'casement-window') {
      name = 'Twin Casement Glass Window';
      price = 580;
    } else if (windowStyle === 'panoramic-glass-window') {
      name = 'Floor-to-Ceiling Panoramic Window';
      price = 1450;
    } else if (windowStyle === 'clerestory-window') {
      name = 'High Clerestory Ribbon Window';
      price = 620;
    } else if (windowStyle === 'arched-window') {
      name = 'Islamic Pointed Arch Window';
      price = 850;
      color = '#f8fafc';
      secColor = '#cbd5e1';
    }

    const newItem: PlacedFurnitureItem = {
      id: `win-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      modelType: windowStyle,
      name,
      category: 'architectural',
      position: [x, windowSillHeight, z],
      rotationY: rotY,
      dimensions: {
        width: windowWidth,
        depth: 0.12,
        height:
          windowStyle === 'clerestory-window'
            ? 0.65
            : windowStyle === 'panoramic-glass-window'
            ? 2.6
            : 1.6,
      },
      color,
      secondaryColor: secColor,
      price,
      customData: {
        architecturalType: 'window',
        windowStyle,
        wallAttachment: wallDir || 'freestanding',
        glassTint: 'clear',
      },
    };

    onAddItem(newItem);
  };

  // Floor interaction handlers
  useEffect(() => {
    const handleCanvasClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('#cad-drawing-palette') ||
        target.closest('header') ||
        target.closest('#item-inspector') ||
        target.closest('button')
      ) {
        return;
      }

      if (!sceneManagerRef.current) return;
      const coords = sceneManagerRef.current.getFloorCoordinates(e.clientX, e.clientY);
      if (!coords) return;

      let { x, z } = coords;
      if (roomConfig.gridSnap) {
        const snap = roomConfig.gridSnapSize || 0.25;
        x = Math.round(x / snap) * snap;
        z = Math.round(z / snap) * snap;
      }

      // 1. Draw Wall (Continuous Click-to-Click)
      if (activeTool === 'draw-wall') {
        const curStart = wallChainStartRef.current;
        const curOrigin = firstWallOriginRef.current;

        if (!curStart) {
          // Set start of first wall
          setWallChainStart({ x, z });
          setFirstWallOrigin({ x, z });
        } else {
          // Check if clicking near origin to close loop
          let finalX = x;
          let finalZ = z;
          let closedLoop = false;

          if (curOrigin) {
            const distToOrigin = Math.hypot(x - curOrigin.x, z - curOrigin.z);
            if (distToOrigin < 0.45) {
              finalX = curOrigin.x;
              finalZ = curOrigin.z;
              closedLoop = true;
            }
          }

          // Add wall segment
          addWallSegment(curStart.x, curStart.z, finalX, finalZ);

          if (closedLoop) {
            // Loop is closed! Finish wall chain
            setWallChainStart(null);
            setFirstWallOrigin(null);
            if (onUpdateDraftingState) onUpdateDraftingState(null);
          } else {
            // Chain to next wall segment
            setWallChainStart({ x: finalX, z: finalZ });
          }
        }
      }

      // 2. Draw Room (Rectangle Tool)
      else if (activeTool === 'draw-room') {
        const curStart = roomRectStartRef.current;
        if (!curStart) {
          setRoomRectStart({ x, z });
        } else {
          const x1 = curStart.x;
          const z1 = curStart.z;
          const x2 = x;
          const z2 = z;

          if (Math.abs(x2 - x1) > 0.5 && Math.abs(z2 - z1) > 0.5) {
            // Create 4 enclosing walls
            addWallSegment(x1, z1, x2, z1);
            addWallSegment(x2, z1, x2, z2);
            addWallSegment(x2, z2, x1, z2);
            addWallSegment(x1, z2, x1, z1);
          }
          setRoomRectStart(null);
          if (onUpdateDraftingState) onUpdateDraftingState(null);
        }
      }

      // 3. Split Area / Partition
      else if (activeTool === 'split-area') {
        const curStart = wallChainStartRef.current;
        if (!curStart) {
          setWallChainStart({ x, z });
        } else {
          addWallSegment(curStart.x, curStart.z, x, z);
          setWallChainStart(null);
          if (onUpdateDraftingState) onUpdateDraftingState(null);
        }
      }

      // 4. Place Structural Column
      else if (activeTool === 'place-column') {
        placeColumnAt(x, z);
      }

      // 5. Draw Door
      else if (activeTool === 'draw-door') {
        placeDoorAt(x, z, doorOrientation);
      }

      // 6. Draw Window
      else if (activeTool === 'draw-window') {
        placeWindowAt(x, z, windowOrientation);
      }

      // 7. Measure
      else if (activeTool === 'measure') {
        const curStart = measureStartRef.current;
        if (!curStart) {
          setMeasureStart({ x, z });
        } else {
          const dist = Math.hypot(x - curStart.x, z - curStart.z);
          onAddMeasurement({
            id: `meas-${Date.now()}`,
            start: [curStart.x, curStart.z],
            end: [x, z],
            distance: parseFloat(dist.toFixed(2)),
          });
          setMeasureStart(null);
        }
      }
    };

    const handleCanvasMouseMove = (e: MouseEvent) => {
      if (!sceneManagerRef.current) return;
      const coords = sceneManagerRef.current.getFloorCoordinates(e.clientX, e.clientY);
      if (!coords) {
        setCursorPos(null);
        if (onUpdateDraftingState) onUpdateDraftingState(null);
        return;
      }

      let { x, z } = coords;
      if (roomConfig.gridSnap) {
        const snap = roomConfig.gridSnapSize || 0.25;
        x = Math.round(x / snap) * snap;
        z = Math.round(z / snap) * snap;
      }

      setCursorPos({ x: parseFloat(x.toFixed(2)), z: parseFloat(z.toFixed(2)) });

      // Calculate live drafting stats for rubber band
      const activeStart =
        activeTool === 'draw-wall' || activeTool === 'split-area'
          ? wallChainStartRef.current
          : activeTool === 'draw-room'
          ? roomRectStartRef.current
          : null;

      if (activeStart && onUpdateDraftingState) {
        const dx = x - activeStart.x;
        const dz = z - activeStart.z;
        const lenM = Math.hypot(dx, dz);
        const lenFt = lenM / 0.3048;

        let angle = (Math.atan2(dz, dx) * 180) / Math.PI;
        if (angle < 0) angle += 360;

        // Angle snap
        let snappedAngle: number | null = null;
        const snapTargets = [0, 45, 90, 135, 180, 225, 270, 315, 360];
        for (const target of snapTargets) {
          if (Math.abs(angle - target) < 4.5 || Math.abs(angle - target) > 355.5) {
            snappedAngle = target % 360;
            break;
          }
        }

        // Check if loop is closing
        const orig = firstWallOriginRef.current;
        const isLoopClosing = !!(orig && Math.hypot(x - orig.x, z - orig.z) < 0.45);

        onUpdateDraftingState({
          active: true,
          tool: activeTool,
          startPoint: activeStart,
          currentPoint: { x, z },
          lengthFeet: lenFt,
          lengthMeters: lenM,
          angleDeg: Math.round(angle),
          snappedAngle,
          isLoopClosing,
        });
      }
    };

    window.addEventListener('click', handleCanvasClick);
    window.addEventListener('mousemove', handleCanvasMouseMove);
    return () => {
      window.removeEventListener('click', handleCanvasClick);
      window.removeEventListener('mousemove', handleCanvasMouseMove);
    };
  }, [
    activeTool,
    wallStyle,
    wallHeightFt,
    wallThicknessMm,
    wallColor,
    columnStyle,
    columnHeightFt,
    doorStyle,
    doorWidth,
    doorOpenAngle,
    doorOrientation,
    windowStyle,
    windowWidth,
    windowSillHeight,
    windowOrientation,
    roomConfig.gridSnap,
    roomConfig.gridSnapSize,
  ]);

  if (isFolded) {
    return (
      <div
        id="cad-drawing-palette-folded"
        ref={paletteRef}
        style={
          position
            ? { top: `${position.y}px`, left: `${position.x}px`, transform: 'none' }
            : { top: '16px', left: '50%', transform: 'translateX(-50%)' }
        }
        className="absolute z-30 flex items-center gap-2 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl px-2.5 py-1.5 shadow-2xl pointer-events-auto select-none transition-shadow hover:shadow-blue-500/20"
      >
        {/* Drag Handle to move around */}
        <div
          onMouseDown={handleDragStart}
          className="cursor-move text-slate-400 hover:text-slate-200 p-1 -ml-1 rounded transition-colors"
          title="Drag 2D sketch palette anywhere"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        <div
          onClick={() => setIsFolded(false)}
          className="flex items-center gap-2 cursor-pointer hover:opacity-90 pr-1"
          title="Click to unfold 2D sketch options"
        >
          <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <PenTool className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-white leading-tight">2D Sketch</span>
            <span className="text-[10px] text-slate-400 capitalize font-mono">
              {activeTool.replace('draw-', '').replace('place-', '')}
            </span>
          </div>
        </div>

        <div className="w-px h-5 bg-slate-700 mx-1" />

        {/* Unfold button */}
        <button
          onClick={() => setIsFolded(false)}
          className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-all"
          title="Open / Unfold 2D Sketch Option"
        >
          <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
          <span>Open</span>
        </button>

        {/* Quick 3D Generation */}
        <button
          onClick={onGenerate3D}
          className="px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-md shadow-emerald-600/25 transition-all"
          title="Generate full 3D architectural model"
        >
          <Sparkles className="w-3 h-3 text-yellow-300" />
          <span>3D</span>
        </button>

        {onClosePalette && (
          <button
            onClick={onClosePalette}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Close 2D Sketching"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      id="cad-drawing-palette"
      ref={paletteRef}
      style={
        position
          ? { top: `${position.y}px`, left: `${position.x}px`, transform: 'none' }
          : { top: '16px', left: '50%', transform: 'translateX(-50%)' }
      }
      className="absolute z-30 flex flex-col items-center gap-2.5 pointer-events-auto select-none"
    >
      {/* Primary Coohom-Style Sketching Toolbar */}
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl flex items-center gap-1">
        {/* Drag Handle to move around */}
        <div
          onMouseDown={handleDragStart}
          className="cursor-move text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          title="Drag 2D sketch palette anywhere"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Select (V) */}
        <button
          onClick={() => onChangeTool('select')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTool === 'select'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-blue-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Select & Move (V)"
        >
          <MousePointer className="w-3.5 h-3.5" />
          <span>Select</span>
        </button>

        {/* Draw Wall (W) */}
        <button
          onClick={() => onChangeTool('draw-wall')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTool === 'draw-wall'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-blue-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Continuous Wall Drawing (W)"
        >
          <Split className="w-3.5 h-3.5" />
          <span>Draw Wall</span>
        </button>

        {/* Draw Room / Rect (R) */}
        <button
          onClick={() => onChangeTool('draw-room')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTool === 'draw-room'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-blue-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Draw Rectangular Room (R)"
        >
          <Square className="w-3.5 h-3.5" />
          <span>Draw Room</span>
        </button>

        {/* Split Area (S) */}
        <button
          onClick={() => onChangeTool('split-area')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTool === 'split-area'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-blue-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Split Area / Partition Wall (S)"
        >
          <Columns className="w-3.5 h-3.5" />
          <span>Split Area</span>
        </button>

        {/* Place Column (C) */}
        <button
          onClick={() => onChangeTool('place-column')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTool === 'place-column'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-blue-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Place Structural Column (C)"
        >
          <Box className="w-3.5 h-3.5" />
          <span>Column</span>
        </button>

        {/* Door (D) */}
        <button
          onClick={() => onChangeTool('draw-door')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTool === 'draw-door'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-blue-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Place Door with Opening Arc (D)"
        >
          <DoorClosed className="w-3.5 h-3.5" />
          <span>Door</span>
        </button>

        {/* Window */}
        <button
          onClick={() => onChangeTool('draw-window')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTool === 'draw-window'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-blue-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Place Architectural Window"
        >
          <AppWindow className="w-3.5 h-3.5" />
          <span>Window</span>
        </button>

        {/* Measure (M) */}
        <button
          onClick={() => onChangeTool('measure')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTool === 'measure'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-blue-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Tape Measure / Dimension Line (M)"
        >
          <Ruler className="w-3.5 h-3.5" />
          <span>Measure</span>
        </button>

        {/* Paste Image / Artwork Decal */}
        {onOpenImagePaster && (
          <button
            onClick={onOpenImagePaster}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30"
            title="Paste Image / Calligraphy / Tile Pattern onto Walls (Ctrl+V)"
          >
            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>Paste Image</span>
          </button>
        )}

        <div className="w-px h-5 bg-slate-700 mx-1" />

        {/* THE HIGHEST PRIORITY USER ACTION: GENERATE 3D AFTER SKETCHING */}
        <button
          onClick={onGenerate3D}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-600/30 transition-all transform active:scale-95"
          title="Generate full 3D architectural model from your 2D sketch!"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin-slow" />
          <span>Generate 3D</span>
        </button>

        <div className="w-px h-5 bg-slate-700 mx-1" />

        {/* Fold Button - Minimizes into a movable pill */}
        <button
          onClick={() => setIsFolded(true)}
          className="px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          title="Fold 2D sketch options (minimize to pill)"
        >
          <ChevronUp className="w-3.5 h-3.5 text-blue-400" />
          <span>Fold</span>
        </button>

        {/* Close Button */}
        {onClosePalette && (
          <button
            onClick={onClosePalette}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Close 2D sketch mode"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Sub-toolbar Controls: Dynamic per active tool */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-4 py-2 text-xs text-slate-300 shadow-xl flex items-center gap-3">
        {/* Draw Wall Context Settings */}
        {(activeTool === 'draw-wall' || activeTool === 'split-area' || activeTool === 'draw-room') && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Height:</span>
              <select
                value={wallHeightFt}
                onChange={(e) => setWallHeightFt(parseFloat(e.target.value))}
                className="bg-slate-800 text-slate-200 rounded px-2 py-0.5 border border-slate-700 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
              >
                <option value={19.0}>19.0 ft (Main Beam Level)</option>
                <option value={13.0}>13.0 ft (Tie Beam Level)</option>
                <option value={10.0}>10.0 ft (Standard Ceiling)</option>
                <option value={9.0}>9.0 ft (Mehrab Niche)</option>
                <option value={3.6}>3.6 ft (Pony Divider Wall)</option>
              </select>
            </div>

            <div className="w-px h-4 bg-slate-700" />

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Thickness:</span>
              <select
                value={wallThicknessMm}
                onChange={(e) => setWallThicknessMm(parseInt(e.target.value))}
                className="bg-slate-800 text-slate-200 rounded px-2 py-0.5 border border-slate-700 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
              >
                <option value={230}>230 mm (9" Masonry Brick)</option>
                <option value={150}>150 mm (Tie Beam Wall)</option>
                <option value={120}>120 mm (Drywall Stud)</option>
                <option value={80}>80 mm (Glass Partition)</option>
              </select>
            </div>

            <div className="w-px h-4 bg-slate-700" />

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Style:</span>
              <select
                value={wallStyle}
                onChange={(e) => setWallStyle(e.target.value as WallDrawStyle)}
                className="bg-slate-800 text-slate-200 rounded px-2 py-0.5 border border-slate-700 focus:outline-none focus:border-blue-500 text-[11px]"
              >
                <option value="custom-masonry-wall">Masonry Solid Wall</option>
                <option value="travertine-ashlar-wall">Travertine Ashlar Wall (Luxury)</option>
                <option value="walnut-timber-wall">Walnut Timber Wall (Luxury)</option>
                <option value="drywall-partition">Drywall Partition</option>
                <option value="glass-steel-partition">Glass & Steel</option>
                <option value="fluted-wood-divider">Fluted Wood</option>
                <option value="pony-wall">Half-Height Pony Wall</option>
              </select>
            </div>

            {wallChainStart && (
              <>
                <div className="w-px h-4 bg-slate-700" />
                <button
                  onClick={() => {
                    setWallChainStart(null);
                    setFirstWallOrigin(null);
                    if (onUpdateDraftingState) onUpdateDraftingState(null);
                  }}
                  className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 text-[11px] font-medium"
                >
                  Finish Chain [Esc]
                </button>
              </>
            )}
          </>
        )}

        {/* Place Column Context Settings */}
        {activeTool === 'place-column' && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Column Size:</span>
              <select
                value={columnStyle}
                onChange={(e) => setColumnStyle(e.target.value as ColumnDrawStyle)}
                className="bg-slate-800 text-slate-200 rounded px-2 py-0.5 border border-slate-700 focus:outline-none focus:border-blue-500 text-[11px]"
              >
                <option value="structural-column-650x900">22 Main Columns (650 × 900 mm)</option>
                <option value="structural-column-150x200">4 Extension Columns (150 × 200 mm)</option>
                <option value="architectural-pillar">Round Architectural Pillar (350 mm)</option>
                <option value="masjid-pillar">Octagonal Masjid Pillar</option>
              </select>
            </div>

            <div className="w-px h-4 bg-slate-700" />

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Height:</span>
              <select
                value={columnHeightFt}
                onChange={(e) => setColumnHeightFt(parseFloat(e.target.value))}
                className="bg-slate-800 text-slate-200 rounded px-2 py-0.5 border border-slate-700 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
              >
                <option value={19.0}>19.0 ft (Full Roof Beam Height)</option>
                <option value={13.0}>13.0 ft (Tie Beam Height)</option>
              </select>
            </div>

            <span className="text-[11px] text-blue-400 font-medium">Click floor to drop</span>
          </>
        )}

        {/* Door Settings */}
        {activeTool === 'draw-door' && (
          <>
            <select
              value={doorStyle}
              onChange={(e) => setDoorStyle(e.target.value as DoorDrawStyle)}
              className="bg-slate-800 text-slate-200 rounded px-2 py-0.5 border border-slate-700 text-[11px]"
            >
              <option value="interior-door">Single Swing (0.95m)</option>
              <option value="french-double-door">French Double (1.8m)</option>
              <option value="sliding-barn-door">Pocket Sliding (1.2m)</option>
              <option value="pivot-door">Glass Pivot (1.2m)</option>
            </select>
            <button
              onClick={() => setDoorOrientation((prev) => (prev + 90) % 360)}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px]"
            >
              <RotateCw className="w-3 h-3 text-blue-400" />
              <span>Rotate ({doorOrientation}°)</span>
            </button>
          </>
        )}

        {/* Window Settings */}
        {activeTool === 'draw-window' && (
          <>
            <select
              value={windowStyle}
              onChange={(e) => setWindowStyle(e.target.value as WindowDrawStyle)}
              className="bg-slate-800 text-slate-200 rounded px-2 py-0.5 border border-slate-700 text-[11px]"
            >
              <option value="picture-window">Picture Window (1.8m)</option>
              <option value="casement-window">Casement Window (1.4m)</option>
              <option value="panoramic-glass-window">Panoramic (3.2m)</option>
              <option value="arched-window">Islamic Arched Window (1.5m)</option>
            </select>
            <button
              onClick={() => setWindowOrientation((prev) => (prev + 90) % 360)}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px]"
            >
              <RotateCw className="w-3 h-3 text-blue-400" />
              <span>Rotate ({windowOrientation}°)</span>
            </button>
          </>
        )}

        {/* Status / Instructions Bar */}
        <div className="pl-2 border-l border-slate-700 text-[11px] text-slate-400 flex items-center gap-2">
          {activeTool === 'draw-wall' && (
            <span>
              {wallChainStart
                ? '📍 Click next point to place wall • Click origin to close loop • Esc to finish'
                : 'Click canvas to start wall'}
            </span>
          )}
          {activeTool === 'draw-room' && (
            <span>
              {roomRectStart ? '📍 Click opposite corner to create 4 walls' : 'Click corner to start room box'}
            </span>
          )}
          {activeTool === 'select' && <span>Click objects to inspect, move or rotate</span>}
          {cursorPos && (
            <span className="font-mono text-emerald-400">
              [X: {cursorPos.x}m, Z: {cursorPos.z}m]
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
