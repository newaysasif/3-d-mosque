import React, { useEffect, useState } from 'react';
import { PlacedFurnitureItem, RoomConfig, CADMeasurement, CameraMode, LiveDraftingState } from '../types';
import { SceneManager } from '../engine/SceneManager';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, Sparkles, Layers, Ruler } from 'lucide-react';

interface CADFloorPlanOverlayProps {
  roomConfig: RoomConfig;
  items: PlacedFurnitureItem[];
  cameraMode: CameraMode;
  sceneManagerRef: React.MutableRefObject<SceneManager | null>;
  measurements: CADMeasurement[];
  liveDrafting?: LiveDraftingState | null;
  isBiggerView?: boolean;
  onToggleBiggerView?: () => void;
}

export const CADFloorPlanOverlay: React.FC<CADFloorPlanOverlayProps> = ({
  roomConfig,
  items,
  cameraMode,
  sceneManagerRef,
  measurements,
  liveDrafting,
  isBiggerView,
  onToggleBiggerView,
}) => {
  const [, setTick] = useState(0);
  const [cleanView, setCleanView] = useState<boolean>(true);
  const [showStructuralTags, setShowStructuralTags] = useState<boolean>(false);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);

  // Re-render synchronously when camera moves or window resizes
  useEffect(() => {
    let animId: number;
    const update = () => {
      setTick((t) => (t + 1) % 1000);
      animId = requestAnimationFrame(update);
    };
    if (cameraMode === '2d-plan') {
      animId = requestAnimationFrame(update);
    }
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [cameraMode]);

  if (cameraMode !== '2d-plan' || !sceneManagerRef.current) {
    return null;
  }

  const sm = sceneManagerRef.current;

  // Filter architectural items
  const doors = items.filter(
    (it) =>
      it.category === 'architectural' &&
      (it.customData?.architecturalType === 'door' || it.modelType.includes('door'))
  );
  const windows = items.filter(
    (it) =>
      it.category === 'architectural' &&
      (it.customData?.architecturalType === 'window' || it.modelType.includes('window'))
  );
  const walls = items.filter(
    (it) =>
      it.category === 'architectural' &&
      (it.customData?.architecturalType === 'partition' ||
        it.modelType.includes('wall') ||
        it.modelType.includes('partition') ||
        it.modelType === 'pony-wall')
  );
  const columns = items.filter(
    (it) =>
      it.category === 'architectural' &&
      (it.customData?.architecturalType === 'column' ||
        it.modelType.startsWith('structural-column-') ||
        it.modelType === 'architectural-pillar' ||
        it.modelType === 'masjid-pillar')
  );

  const beams = items.filter(
    (it) =>
      it.category === 'architectural' &&
      (it.customData?.architecturalType === 'beam' ||
        it.modelType.startsWith('structural-beam') ||
        it.modelType === 'architectural-ceiling-beam')
  );

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-hidden select-none">
      {/* Floating 2D Viewport Controls & Declutter HUD */}
      <div className="absolute top-3.5 right-3.5 z-30 pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-2xl">
        {/* Bigger View / Fullscreen Toggle */}
        {onToggleBiggerView && (
          <button
            onClick={onToggleBiggerView}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isBiggerView
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-1 ring-blue-400'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
            }`}
            title={isBiggerView ? "Restore normal panels" : "Bigger View: Expand canvas and hide sidebars"}
          >
            {isBiggerView ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isBiggerView ? 'Normal View' : 'Bigger View'}</span>
          </button>
        )}

        <div className="h-4 w-[1px] bg-slate-700/80 mx-0.5" />

        {/* Clean Mode / Declutter Toggle */}
        <button
          onClick={() => {
            const next = !cleanView;
            setCleanView(next);
            if (next) setShowStructuralTags(false);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            cleanView
              ? 'bg-emerald-600/90 text-white shadow-md shadow-emerald-600/30'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
          title={cleanView ? "Clean View is ON: Labels hidden for clean editing. Click for detailed tags." : "Detailed Tags ON: Click to declutter view."}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>{cleanView ? 'Clean View' : 'All Tags'}</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-700/80 mx-0.5" />

        {/* Zoom In */}
        <button
          onClick={() => sm.zoom2D(0.85)}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
          title="Zoom In (or use mouse scroll)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={() => sm.zoom2D(1.18)}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
          title="Zoom Out (or use mouse scroll)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Fit to Screen */}
        <button
          onClick={() => sm.fitPlanToScreen(isBiggerView ? 1.15 : 1.3)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors text-xs font-medium"
          title="Fit Floor Plan to Screen"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Fit Plan</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-700/80 mx-0.5" />

        {/* Dimensions Toggle */}
        <button
          onClick={() => setShowDimensions(!showDimensions)}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            showDimensions ? 'bg-sky-950/80 border border-sky-600/60 text-sky-300' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title={showDimensions ? "Hide Dimension Strings" : "Show Dimension Strings"}
        >
          <Ruler className="w-3.5 h-3.5" />
          <span>Dims</span>
        </button>

        {/* Structural Tags Toggle */}
        <button
          onClick={() => {
            const next = !showStructuralTags;
            setShowStructuralTags(next);
            if (next && cleanView) setCleanView(false);
          }}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            showStructuralTags ? 'bg-indigo-950/80 border border-indigo-600/60 text-indigo-300' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title={showStructuralTags ? "Hide Column & Beam Badges" : "Show Column & Beam Badges"}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Tags</span>
        </button>
      </div>

      <svg className="w-full h-full pointer-events-none overflow-visible select-none">
      <defs>
        {/* Architectural hatch pattern for masonry & partition walls */}
        <pattern
          id="cad-wall-hatch"
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="8" stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.4" />
        </pattern>

        <pattern
          id="cad-column-hatch"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-45)"
        >
          <line x1="0" y1="0" x2="0" y2="6" stroke="#94a3b8" strokeWidth="1.5" strokeOpacity="0.6" />
        </pattern>

        <marker
          id="dim-arrow-start"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 5 L 10 0 L 10 10 z" fill="#38bdf8" />
        </marker>
        <marker
          id="dim-arrow-end"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
        </marker>
      </defs>

      {/* Render Sketched & Custom Walls with Hatch Fill, Outline & Dimension Tags */}
      {walls.map((wall) => {
        const x = wall.position[0];
        const z = wall.position[2];
        const len = wall.dimensions?.width || 2.0;
        const thick = wall.dimensions?.depth || 0.23;
        const rotRad = ((wall.rotationY || 0) * Math.PI) / 180;

        const halfL = len / 2;
        const halfT = thick / 2;

        const ux = Math.cos(rotRad);
        const uz = -Math.sin(rotRad);
        const nx = Math.sin(rotRad);
        const nz = Math.cos(rotRad);

        const p1_3D = { x: x - halfL * ux - halfT * nx, z: z - halfL * uz - halfT * nz };
        const p2_3D = { x: x + halfL * ux - halfT * nx, z: z + halfL * uz - halfT * nz };
        const p3_3D = { x: x + halfL * ux + halfT * nx, z: z + halfL * uz + halfT * nz };
        const p4_3D = { x: x - halfL * ux + halfT * nx, z: z - halfL * uz + halfT * nz };

        const s1 = sm.projectFloorCoordinatesToScreen(p1_3D.x, p1_3D.z);
        const s2 = sm.projectFloorCoordinatesToScreen(p2_3D.x, p2_3D.z);
        const s3 = sm.projectFloorCoordinatesToScreen(p3_3D.x, p3_3D.z);
        const s4 = sm.projectFloorCoordinatesToScreen(p4_3D.x, p4_3D.z);
        const sMid = sm.projectFloorCoordinatesToScreen(x, z);

        if (!s1 || !s2 || !s3 || !s4 || !sMid) return null;

        const lenFt = (len / 0.3048).toFixed(1);

        return (
          <g key={wall.id} className="cad-sketched-wall">
            {/* Solid Wall Body with Hatching */}
            <polygon
              points={`${s1.x},${s1.y} ${s2.x},${s2.y} ${s3.x},${s3.y} ${s4.x},${s4.y}`}
              fill="url(#cad-wall-hatch)"
              stroke="#38bdf8"
              strokeWidth="2"
              className="drop-shadow-sm"
            />
            {/* Centerline for drafting precision */}
            <line
              x1={(s1.x + s4.x) / 2}
              y1={(s1.y + s4.y) / 2}
              x2={(s2.x + s3.x) / 2}
              y2={(s2.y + s3.y) / 2}
              stroke="#38bdf8"
              strokeWidth="1"
              strokeDasharray="4 2"
              strokeOpacity="0.6"
            />
            {/* Wall Length Callout Badge */}
            {!cleanView && showDimensions && (
              <g transform={`translate(${sMid.x}, ${sMid.y})`}>
                <rect
                  x="-36"
                  y="-9"
                  width="72"
                  height="18"
                  rx="5"
                  fill="#0f172a"
                  fillOpacity="0.9"
                  stroke="#38bdf8"
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="3.5"
                  fill="#e0f2fe"
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {lenFt}' ({len.toFixed(1)}m)
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Render Structural Beams with Engineering Centerlines and B1, B2... Badges */}
      {beams.map((beam, idx) => {
        const x = beam.position[0];
        const z = beam.position[2];
        const len = beam.dimensions?.width || 6.0;
        const thick = beam.dimensions?.depth || 0.30;
        const rotRad = ((beam.rotationY || 0) * Math.PI) / 180;

        const halfL = len / 2;
        const halfT = thick / 2;

        const ux = Math.cos(rotRad);
        const uz = -Math.sin(rotRad);
        const nx = Math.sin(rotRad);
        const nz = Math.cos(rotRad);

        const p1_3D = { x: x - halfL * ux - halfT * nx, z: z - halfL * uz - halfT * nz };
        const p2_3D = { x: x + halfL * ux - halfT * nx, z: z + halfL * uz - halfT * nz };
        const p3_3D = { x: x + halfL * ux + halfT * nx, z: z + halfL * uz + halfT * nz };
        const p4_3D = { x: x - halfL * ux + halfT * nx, z: z - halfL * uz + halfT * nz };

        const s1 = sm.projectFloorCoordinatesToScreen(p1_3D.x, p1_3D.z);
        const s2 = sm.projectFloorCoordinatesToScreen(p2_3D.x, p2_3D.z);
        const s3 = sm.projectFloorCoordinatesToScreen(p3_3D.x, p3_3D.z);
        const s4 = sm.projectFloorCoordinatesToScreen(p4_3D.x, p4_3D.z);
        const sMid = sm.projectFloorCoordinatesToScreen(x, z);

        if (!s1 || !s2 || !s3 || !s4 || !sMid) return null;

        const beamTag = beam.customData?.structuralId || (beam.name.startsWith('B') ? beam.name.split(':')[0] : `B${idx + 1}`);

        return (
          <g key={beam.id} className="cad-beam-symbol opacity-90">
            {/* Beam Flange Outlines */}
            <polygon
              points={`${s1.x},${s1.y} ${s2.x},${s2.y} ${s3.x},${s3.y} ${s4.x},${s4.y}`}
              fill="#064e3b"
              fillOpacity="0.25"
              stroke="#10b981"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            {/* Centerline */}
            <line
              x1={(s1.x + s4.x) / 2}
              y1={(s1.y + s4.y) / 2}
              x2={(s2.x + s3.x) / 2}
              y2={(s2.y + s3.y) / 2}
              stroke="#34d399"
              strokeWidth="1.5"
            />
            {/* B1, B2... Callout Badge */}
            {!cleanView && showStructuralTags && (
              <g transform={`translate(${sMid.x}, ${sMid.y})`}>
                <rect
                  x="-26"
                  y="-10"
                  width="52"
                  height="20"
                  rx="5"
                  fill="#064e3b"
                  stroke="#34d399"
                  strokeWidth="1.5"
                  fillOpacity="0.95"
                />
                <text
                  x="0"
                  y="4"
                  fill="#a7f3d0"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {beamTag}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Render Structural Columns with Architectural Cross [X] Symbol and C1, C2... Badges */}
      {columns.map((col, idx) => {
        const x = col.position[0];
        const z = col.position[2];
        const w = col.dimensions?.width || 0.45;
        const d = col.dimensions?.depth || 0.45;
        const rotRad = ((col.rotationY || 0) * Math.PI) / 180;

        const halfW = w / 2;
        const halfD = d / 2;

        const ux = Math.cos(rotRad);
        const uz = -Math.sin(rotRad);
        const nx = Math.sin(rotRad);
        const nz = Math.cos(rotRad);

        const p1_3D = { x: x - halfW * ux - halfD * nx, z: z - halfW * uz - halfD * nz };
        const p2_3D = { x: x + halfW * ux - halfD * nx, z: z + halfW * uz - halfD * nz };
        const p3_3D = { x: x + halfW * ux + halfD * nx, z: z + halfW * uz + halfD * nz };
        const p4_3D = { x: x - halfW * ux + halfD * nx, z: z - halfW * uz + halfD * nz };

        const s1 = sm.projectFloorCoordinatesToScreen(p1_3D.x, p1_3D.z);
        const s2 = sm.projectFloorCoordinatesToScreen(p2_3D.x, p2_3D.z);
        const s3 = sm.projectFloorCoordinatesToScreen(p3_3D.x, p3_3D.z);
        const s4 = sm.projectFloorCoordinatesToScreen(p4_3D.x, p4_3D.z);
        const sMid = sm.projectFloorCoordinatesToScreen(x, z);

        if (!s1 || !s2 || !s3 || !s4 || !sMid) return null;

        const colTag = col.customData?.structuralId || (col.name.startsWith('C') ? col.name.split(':')[0] : `C${idx + 1}`);
        const gridCoord = col.customData?.gridCoordinate;

        return (
          <g key={col.id} className="cad-column-symbol">
            {/* Solid Column Footprint with Hatch */}
            <polygon
              points={`${s1.x},${s1.y} ${s2.x},${s2.y} ${s3.x},${s3.y} ${s4.x},${s4.y}`}
              fill="url(#cad-column-hatch)"
              stroke="#38bdf8"
              strokeWidth="2"
            />
            {/* Structural Cross [X] Lines */}
            <line x1={s1.x} y1={s1.y} x2={s3.x} y2={s3.y} stroke="#0284c7" strokeWidth="1.5" />
            <line x1={s2.x} y1={s2.y} x2={s4.x} y2={s4.y} stroke="#0284c7" strokeWidth="1.5" />

            {/* Prominent C1, C2... Column Badge */}
            {!cleanView && showStructuralTags && (
              <g transform={`translate(${sMid.x}, ${sMid.y - 18})`}>
                <rect
                  x="-24"
                  y="-10"
                  width="48"
                  height="19"
                  rx="5"
                  fill="#0f172a"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  fillOpacity="0.95"
                />
                <text
                  x="0"
                  y="3"
                  fill="#e0f2fe"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {colTag}
                </text>
                {gridCoord && (
                  <text
                    x="0"
                    y="16"
                    fill="#94a3b8"
                    fontSize="7.5"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {gridCoord}
                  </text>
                )}
              </g>
            )}
          </g>
        );
      })}

      {/* Render Architectural Doors with Classic CAD Swing Arcs */}
      {doors.map((door) => {
        const center = sm.projectFloorCoordinatesToScreen(door.position[0], door.position[2]);
        if (!center) return null;

        const w = door.dimensions?.width || 0.95;
        const halfW = w / 2;
        const rotRad = ((door.rotationY || 0) * Math.PI) / 180;

        const hingeX3D = door.position[0] - halfW * Math.cos(rotRad);
        const hingeZ3D = door.position[2] - halfW * Math.sin(rotRad);
        const latchX3D = door.position[0] + halfW * Math.cos(rotRad);
        const latchZ3D = door.position[2] + halfW * Math.sin(rotRad);

        const pHinge = sm.projectFloorCoordinatesToScreen(hingeX3D, hingeZ3D);
        const pLatch = sm.projectFloorCoordinatesToScreen(latchX3D, latchZ3D);
        if (!pHinge || !pLatch) return null;

        const dx = pLatch.x - pHinge.x;
        const dy = pLatch.y - pHinge.y;
        const radius = Math.sqrt(dx * dx + dy * dy);

        const openAngleDeg = door.customData?.openAngle || 45;
        const openAngleRad = (openAngleDeg * Math.PI) / 180;
        const leafAngle = Math.atan2(dy, dx) - openAngleRad;

        const leafEndX = pHinge.x + radius * Math.cos(leafAngle);
        const leafEndY = pHinge.y + radius * Math.sin(leafAngle);

        return (
          <g key={door.id} className="cad-door-symbol opacity-90">
            {/* Door Jamb / Threshold Line */}
            <line
              x1={pHinge.x}
              y1={pHinge.y}
              x2={pLatch.x}
              y2={pLatch.y}
              stroke="#94a3b8"
              strokeWidth="2"
              strokeDasharray="3 2"
            />
            {/* Door Leaf */}
            <line
              x1={pHinge.x}
              y1={pHinge.y}
              x2={leafEndX}
              y2={leafEndY}
              stroke="#38bdf8"
              strokeWidth="2.5"
            />
            {/* Door Swing Arc */}
            <path
              d={`M ${pLatch.x} ${pLatch.y} A ${radius} ${radius} 0 0 0 ${leafEndX} ${leafEndY}`}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              strokeOpacity="0.75"
            />
            {/* Hinge Pin */}
            <circle cx={pHinge.x} cy={pHinge.y} r="3" fill="#38bdf8" />
            {/* Door Tag */}
            {!cleanView && (
              <text
                x={center.x}
                y={center.y - 12}
                fill="#cbd5e1"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
                className="select-none font-bold"
              >
                D ({w}m)
              </text>
            )}
          </g>
        );
      })}

      {/* Render Architectural Windows with Double Glazing CAD lines */}
      {windows.map((win) => {
        const center = sm.projectFloorCoordinatesToScreen(win.position[0], win.position[2]);
        if (!center) return null;

        const w = win.dimensions?.width || 1.8;
        const halfW = w / 2;
        const rotRad = ((win.rotationY || 0) * Math.PI) / 180;

        const p1_3D = {
          x: win.position[0] - halfW * Math.cos(rotRad),
          z: win.position[2] - halfW * Math.sin(rotRad),
        };
        const p2_3D = {
          x: win.position[0] + halfW * Math.cos(rotRad),
          z: win.position[2] + halfW * Math.sin(rotRad),
        };

        const p1 = sm.projectFloorCoordinatesToScreen(p1_3D.x, p1_3D.z);
        const p2 = sm.projectFloorCoordinatesToScreen(p2_3D.x, p2_3D.z);
        if (!p1 || !p2) return null;

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const perpX = -dy / len;
        const perpY = dx / len;
        const frameOffset = 4;

        return (
          <g key={win.id} className="cad-window-symbol opacity-90">
            <line
              x1={p1.x + perpX * frameOffset}
              y1={p1.y + perpY * frameOffset}
              x2={p2.x + perpX * frameOffset}
              y2={p2.y + perpY * frameOffset}
              stroke="#60a5fa"
              strokeWidth="2"
            />
            <line
              x1={p1.x - perpX * frameOffset}
              y1={p1.y - perpY * frameOffset}
              x2={p2.x - perpX * frameOffset}
              y2={p2.y - perpY * frameOffset}
              stroke="#60a5fa"
              strokeWidth="2"
            />
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#38bdf8" strokeWidth="1.5" />
            <line
              x1={p1.x - perpX * (frameOffset + 2)}
              y1={p1.y - perpY * (frameOffset + 2)}
              x2={p1.x + perpX * (frameOffset + 2)}
              y2={p1.y + perpY * (frameOffset + 2)}
              stroke="#60a5fa"
              strokeWidth="2.5"
            />
            <line
              x1={p2.x - perpX * (frameOffset + 2)}
              y1={p2.y - perpY * (frameOffset + 2)}
              x2={p2.x + perpX * (frameOffset + 2)}
              y2={p2.y + perpY * (frameOffset + 2)}
              stroke="#60a5fa"
              strokeWidth="2.5"
            />
            {!cleanView && (
              <text
                x={center.x}
                y={center.y + 14}
                fill="#93c5fd"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
                className="select-none font-bold"
              >
                W ({w}m)
              </text>
            )}
          </g>
        );
      })}

      {/* Render Active CAD Tape Measurements */}
      {showDimensions && measurements.map((m) => {
        const p1 = sm.projectFloorCoordinatesToScreen(m.start[0], m.start[1]);
        const p2 = sm.projectFloorCoordinatesToScreen(m.end[0], m.end[1]);
        if (!p1 || !p2) return null;

        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        return (
          <g key={m.id} className="cad-measurement">
            <line
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="#38bdf8"
              strokeWidth="2"
              markerStart="url(#dim-arrow-start)"
              markerEnd="url(#dim-arrow-end)"
            />
            <circle cx={p1.x} cy={p1.y} r="4" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx={p2.x} cy={p2.y} r="4" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
            <g transform={`translate(${midX}, ${midY})`}>
              <rect
                x="-32"
                y="-11"
                width="64"
                height="22"
                rx="6"
                fill="#0f172a"
                stroke="#38bdf8"
                strokeWidth="1.5"
              />
              <text
                x="0"
                y="4"
                fill="#e0f2fe"
                fontSize="11"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                {m.distance} m
              </text>
            </g>
          </g>
        );
      })}

      {/* Coohom-Style Central Room Area Tag */}
      {(() => {
        const center = sm.projectFloorCoordinatesToScreen(0, 0);
        if (!center) return null;

        const isMasjid = roomConfig.masjidConfig?.isMasjid;
        const ft2m = 0.3048;
        let areaM2 = roomConfig.width * roomConfig.length;
        if (isMasjid && roomConfig.masjidConfig) {
          const mCfg = roomConfig.masjidConfig;
          const wQ = (mCfg.qiblaWallFeet || 40.9) * ft2m;
          const wB = (mCfg.backWallFeet || 63.2) * ft2m;
          const lAvg = (((mCfg.leftWallFeet || 73.5) + (mCfg.rightWallFeet || 69.1)) / 2) * ft2m;
          areaM2 = ((wQ + wB) / 2) * lAvg;
        }
        const areaSqFt = areaM2 * 10.7639;

        return (
          <g transform={`translate(${center.x}, ${center.y})`} className="coohom-room-area-tag">
            <rect
              x="-110"
              y="-28"
              width="220"
              height="56"
              rx="14"
              fill="#0f172a"
              fillOpacity="0.9"
              stroke="#38bdf8"
              strokeWidth="1.5"
              className="drop-shadow-lg"
            />
            <text
              x="0"
              y="-7"
              fill="#f8fafc"
              fontSize="13"
              fontWeight="bold"
              fontFamily="sans-serif"
              textAnchor="middle"
            >
              {isMasjid ? '🕌 Musalla (Main Prayer Hall)' : 'Main Floor & Area'}
            </text>
            <text
              x="0"
              y="14"
              fill="#38bdf8"
              fontSize="11.5"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              {areaM2.toFixed(1)} m² • {areaSqFt.toFixed(0)} sq ft
            </text>
          </g>
        );
      })()}

      {/* Real-time Live Drafting Rubber-band Guide */}
      {liveDrafting?.active && liveDrafting.startPoint && liveDrafting.currentPoint && (() => {
        const sStart = sm.projectFloorCoordinatesToScreen(liveDrafting.startPoint.x, liveDrafting.startPoint.z);
        const sCur = sm.projectFloorCoordinatesToScreen(liveDrafting.currentPoint.x, liveDrafting.currentPoint.z);
        if (!sStart || !sCur) return null;

        if (liveDrafting.tool === 'draw-wall' || liveDrafting.tool === 'split-area') {
          const midX = (sStart.x + sCur.x) / 2;
          const midY = (sStart.y + sCur.y) / 2;

          return (
            <g className="live-drafting-wall-guide">
              {/* Dynamic Dashed Wall Guide Line */}
              <line
                x1={sStart.x}
                y1={sStart.y}
                x2={sCur.x}
                y2={sCur.y}
                stroke="#38bdf8"
                strokeWidth="3"
                strokeDasharray="6 4"
                className="animate-pulse"
              />

              {/* Start Anchor Point */}
              <circle cx={sStart.x} cy={sStart.y} r="6" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
              <circle cx={sStart.x} cy={sStart.y} r="12" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />

              {/* Current Cursor Target Dot */}
              <circle
                cx={sCur.x}
                cy={sCur.y}
                r="6"
                fill={liveDrafting.isLoopClosing ? '#22c55e' : '#38bdf8'}
                stroke="#ffffff"
                strokeWidth="2"
              />

              {/* Live Length & Angle Readout Badge */}
              <g transform={`translate(${midX}, ${midY - 20})`}>
                <rect
                  x="-68"
                  y="-14"
                  width="136"
                  height="28"
                  rx="8"
                  fill="#0284c7"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  fillOpacity="0.95"
                />
                <text
                  x="0"
                  y="4"
                  fill="#ffffff"
                  fontSize="11.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {liveDrafting.lengthFeet.toFixed(1)}' ({liveDrafting.lengthMeters.toFixed(2)}m)
                  {liveDrafting.snappedAngle !== null ? ` • ${liveDrafting.snappedAngle}°` : ''}
                </text>
              </g>

              {/* Close Loop Indicator */}
              {liveDrafting.isLoopClosing && (
                <g transform={`translate(${sCur.x}, ${sCur.y + 24})`}>
                  <rect x="-60" y="-10" width="120" height="20" rx="6" fill="#15803d" stroke="#86efac" strokeWidth="1.5" />
                  <text x="0" y="4" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                    ✔ Close Room Loop
                  </text>
                </g>
              )}
            </g>
          );
        }

        if (liveDrafting.tool === 'draw-room') {
          const x1 = liveDrafting.startPoint.x;
          const z1 = liveDrafting.startPoint.z;
          const x2 = liveDrafting.currentPoint.x;
          const z2 = liveDrafting.currentPoint.z;

          const c1 = sm.projectFloorCoordinatesToScreen(x1, z1);
          const c2 = sm.projectFloorCoordinatesToScreen(x2, z1);
          const c3 = sm.projectFloorCoordinatesToScreen(x2, z2);
          const c4 = sm.projectFloorCoordinatesToScreen(x1, z2);

          if (!c1 || !c2 || !c3 || !c4) return null;

          const widthM = Math.abs(x2 - x1);
          const depthM = Math.abs(z2 - z1);
          const widthFt = (widthM / 0.3048).toFixed(1);
          const depthFt = (depthM / 0.3048).toFixed(1);

          return (
            <g className="live-drafting-room-guide">
              <polygon
                points={`${c1.x},${c1.y} ${c2.x},${c2.y} ${c3.x},${c3.y} ${c4.x},${c4.y}`}
                fill="#0284c7"
                fillOpacity="0.15"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeDasharray="6 4"
              />
              {/* Corner handles */}
              <circle cx={c1.x} cy={c1.y} r="5" fill="#38bdf8" />
              <circle cx={c3.x} cy={c3.y} r="5" fill="#38bdf8" />

              {/* Dimension callout */}
              <g transform={`translate(${(c1.x + c3.x) / 2}, ${(c1.y + c3.y) / 2})`}>
                <rect x="-65" y="-14" width="130" height="28" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="0" y="4" fill="#38bdf8" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  {widthFt}' × {depthFt}' ({widthM.toFixed(1)}×{depthM.toFixed(1)}m)
                </text>
              </g>
            </g>
          );
        }

        return null;
      })()}

      {/* Masjid Architectural Blueprint Overlay */}
      {roomConfig.masjidConfig?.isMasjid && (() => {
        const mCfg = roomConfig.masjidConfig;
        const ft2m = 0.3048;
        const wQ = (mCfg.qiblaWallFeet || 40.9) * ft2m;
        const wM = (mCfg.mehrabWidthFeet || 18.0) * ft2m;
        const dM = (mCfg.mehrabDepthFeet || 7.0) * ft2m;
        const wB = (mCfg.backWallFeet || 63.2) * ft2m;
        const lLeft = (mCfg.leftWallFeet || 73.5) * ft2m;
        const lRight = (mCfg.rightWallFeet || 69.1) * ft2m;
        const lengthAvg = (lLeft + lRight) / 2;
        const zNorth = -lengthAvg / 2;
        const zSouth = +lengthAvg / 2;
        const zMehrab = zNorth - dM;

        const sP0 = sm.projectFloorCoordinatesToScreen(-wQ / 2, zNorth);
        const sP1 = sm.projectFloorCoordinatesToScreen(-wM / 2, zNorth);
        const sP2 = sm.projectFloorCoordinatesToScreen(-wM / 2, zMehrab);
        const sP3 = sm.projectFloorCoordinatesToScreen(+wM / 2, zMehrab);
        const sP4 = sm.projectFloorCoordinatesToScreen(+wM / 2, zNorth);
        const sP5 = sm.projectFloorCoordinatesToScreen(+wQ / 2, zNorth);
        const sP6 = sm.projectFloorCoordinatesToScreen(+wB / 2, zSouth);
        const sP7 = sm.projectFloorCoordinatesToScreen(-wB / 2, zSouth);

        if (!sP0 || !sP1 || !sP2 || !sP3 || !sP4 || !sP5 || !sP6 || !sP7) return null;

        const dimBadge = (x: number, y: number, text: string, sub?: string, isGold?: boolean) => (
          <g transform={`translate(${x}, ${y})`}>
            <rect
              x="-56"
              y="-14"
              width="112"
              height={sub ? 28 : 22}
              rx="6"
              fill={isGold ? '#14382c' : '#0f172a'}
              stroke={isGold ? '#eab308' : '#38bdf8'}
              strokeWidth="1.5"
              fillOpacity="0.95"
            />
            <text
              x="0"
              y={sub ? -1 : 3}
              fill={isGold ? '#fef08a' : '#e0f2fe'}
              fontSize="11"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              {text}
            </text>
            {sub && (
              <text
                x="0"
                y="10"
                fill={isGold ? '#ca8a04' : '#7dd3fc'}
                fontSize="8.5"
                fontFamily="sans-serif"
                textAnchor="middle"
              >
                {sub}
              </text>
            )}
          </g>
        );

        return (
          <g className="masjid-blueprint-overlay">
            {/* Mehrab Alcove Dimension Callout (18' Width) */}
            <line
              x1={sP2.x}
              y1={sP2.y - 18}
              x2={sP3.x}
              y2={sP3.y - 18}
              stroke="#eab308"
              strokeWidth="1.5"
              markerStart="url(#dim-arrow-start)"
              markerEnd="url(#dim-arrow-end)"
            />
            {dimBadge((sP2.x + sP3.x) / 2, (sP2.y + sP3.y) / 2 - 32, "18' 0\" Mehrab", "9' H × 7' Deep Niche", true)}

            {/* Qibla Short Wall Dimension Callout (40.9') */}
            <line
              x1={sP0.x}
              y1={sP0.y + 22}
              x2={sP5.x}
              y2={sP5.y + 22}
              stroke="#22c55e"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
            {dimBadge((sP0.x + sP5.x) / 2, sP0.y + 36, "40' 9\" Qibla Wall", "Front Short Wall", true)}

            {/* West Wall Callout (73.5') */}
            {dimBadge((sP7.x + sP0.x) / 2 - 50, (sP7.y + sP0.y) / 2, "73' 6\" Wall", "Left Perimeter")}

            {/* East Wall Callout (69.1') */}
            {dimBadge((sP5.x + sP6.x) / 2 + 50, (sP5.y + sP6.y) / 2, "69' 1\" Wall", "Right Perimeter")}

            {/* South Entrance Wall Callout (63.2') */}
            {dimBadge((sP6.x + sP7.x) / 2, sP6.y + 26, "63' 2\" Wall", "Main Entrance Wall")}

            {/* Qibla Compass Heading Marker (North) */}
            <g transform={`translate(${(sP2.x + sP3.x) / 2}, ${sP2.y - 68})`}>
              <rect
                x="-85"
                y="-14"
                width="170"
                height="28"
                rx="14"
                fill="#052e16"
                stroke="#22c55e"
                strokeWidth="1.5"
                fillOpacity="0.95"
              />
              <text
                x="0"
                y="4"
                fill="#86efac"
                fontSize="11"
                fontWeight="bold"
                fontFamily="sans-serif"
                textAnchor="middle"
              >
                ▲ QIBLA DIRECTION (NORTH)
              </text>
            </g>

            {/* Clear-Span Structural Beams (450x900mm @ 5761mm) & Outer Columns CAD Overlay */}
            {mCfg.showStructuralGrid !== false && (() => {
              const numBeams = 6;
              const beamElements = [];
              for (let i = 0; i < numBeams; i++) {
                const t = i / (numBeams - 1);
                // Interpolate along West and East walls
                const leftX = sP7.x + (sP0.x - sP7.x) * (1 - t);
                const leftY = sP7.y + (sP0.y - sP7.y) * (1 - t);
                const rightX = sP6.x + (sP5.x - sP6.x) * (1 - t);
                const rightY = sP6.y + (sP5.y - sP6.y) * (1 - t);
                const midX = (leftX + rightX) / 2;
                const midY = (leftY + rightY) / 2;

                beamElements.push(
                  <g key={`masjid-beam-${i}`}>
                    {/* Clear-span beam line spanning across outer columns */}
                    <line
                      x1={leftX}
                      y1={leftY}
                      x2={rightX}
                      y2={rightY}
                      stroke="#818cf8"
                      strokeWidth="2.5"
                      strokeDasharray="6 3"
                      strokeOpacity="0.85"
                    />
                    {/* Outer Column Left Marker */}
                    <rect
                      x={leftX - 6}
                      y={leftY - 8}
                      width="12"
                      height="16"
                      fill="#f59e0b"
                      stroke="#78350f"
                      strokeWidth="1.5"
                      rx="1"
                    />
                    {/* Outer Column Right Marker */}
                    <rect
                      x={rightX - 6}
                      y={rightY - 8}
                      width="12"
                      height="16"
                      fill="#f59e0b"
                      stroke="#78350f"
                      strokeWidth="1.5"
                      rx="1"
                    />
                    {/* Beam Tag Callout */}
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x="-82"
                        y="-10"
                        width="164"
                        height="20"
                        rx="10"
                        fill="#1e1b4b"
                        stroke="#818cf8"
                        strokeWidth="1.2"
                        fillOpacity="0.92"
                      />
                      <text
                        x="0"
                        y="4"
                        fill="#c7d2fe"
                        fontSize="9.5"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {`B${i + 1}: 450×900mm @ 5761mm`}
                      </text>
                    </g>
                  </g>
                );
              }

              // 20 feet (6.096m) spacing between both center column lines (10 ft / 3.048m each side of center)
              const colSpacingFt = sm.roomConfig.masjidConfig?.columnSpacingFeet || 20;
              const halfSpacingM = (colSpacingFt * 0.3048) / 2; // 3.048m (10 ft)
              const xCadL = -halfSpacingM;
              const xCadR = +halfSpacingM;

              // Right Corner Main Gate calculations
              const isRightCornerGate = sm.roomConfig.masjidConfig?.gatePosition !== 'center';
              const isDiagonalGate = sm.roomConfig.masjidConfig?.isDiagonalGate ?? (sm.roomConfig.masjidConfig?.gatePosition === 'diagonal-corner');
              const gateDepthFt = sm.roomConfig.masjidConfig?.gateDepthFeet || 6.0;
              const gateDepthM = gateDepthFt * 0.3048;
              const diagLegM = gateDepthM * Math.SQRT2;

              const gateSpanM = (sm.roomConfig.masjidConfig?.gateWidthFeet || 12) * 0.3048;
              const rightPierW = 0.65;
              const xGateR_flat = +wB / 2 - rightPierW;
              const xGateL_flat = xGateR_flat - gateSpanM;
              const xGateExtraR_flat = +wB / 2 - 0.225;

              // Diagonal gate coordinates:
              const pGateSouth = { x: +wB / 2 - diagLegM, z: zSouth };
              const pGateEast = { x: +wB / 2, z: zSouth - diagLegM };
              const pCornerBoundary = { x: +wB / 2, z: zSouth };

              const xCadGateL = isDiagonalGate ? pGateSouth.x : (isRightCornerGate ? xGateL_flat : xCadL);
              const zCadGateL = isDiagonalGate ? pGateSouth.z : zSouth;
              const xCadGateR = isDiagonalGate ? pGateEast.x : (isRightCornerGate ? xGateR_flat : xCadR);
              const zCadGateR = isDiagonalGate ? pGateEast.z : zSouth;

              // Projected screen coordinates
              const sGateL = sm.projectFloorCoordinatesToScreen(xCadGateL, zCadGateL);
              const sGateR = sm.projectFloorCoordinatesToScreen(xCadGateR, zCadGateR);
              const sCornerBoundary = isDiagonalGate ? sm.projectFloorCoordinatesToScreen(pCornerBoundary.x, pCornerBoundary.z) : null;
              const sGateExtraR = isDiagonalGate ? sCornerBoundary : (isRightCornerGate ? sm.projectFloorCoordinatesToScreen(xGateExtraR_flat, zSouth) : null);
              const sQiblaL = sm.projectFloorCoordinatesToScreen(xCadL, zNorth);
              const sQiblaR = sm.projectFloorCoordinatesToScreen(xCadR, zNorth);

              return (
                <g id="cad-masjid-structural-clearance">
                  {beamElements}

                  {/* Gate Portal Header Beam (450x900mm @ 5761mm) */}
                  {sGateL && sGateR && (
                    <g key="cad-b-gate">
                      {isDiagonalGate && sCornerBoundary && (
                        // Triangular Porch Indentation Outline
                        <g key="cad-triangular-porch">
                          <polygon
                            points={`${sGateL.x},${sGateL.y} ${sCornerBoundary.x},${sCornerBoundary.y} ${sGateR.x},${sGateR.y}`}
                            fill="#0e7490"
                            fillOpacity="0.25"
                            stroke="#38bdf8"
                            strokeWidth="1.5"
                            strokeDasharray="4 3"
                          />
                          <g transform={`translate(${(sGateL.x + sCornerBoundary.x + sGateR.x) / 3}, ${(sGateL.y + sCornerBoundary.y + sGateR.y) / 3})`}>
                            <text
                              x="0"
                              y="3"
                              fill="#67e8f9"
                              fontSize="8"
                              fontFamily="monospace"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              6&apos; DEEP TRIANGULAR PORCH
                            </text>
                          </g>
                        </g>
                      )}
                      <line
                        x1={sGateL.x}
                        y1={sGateL.y}
                        x2={sGateR.x}
                        y2={sGateR.y}
                        stroke="#06b6d4"
                        strokeWidth="3.5"
                      />
                      <g transform={`translate(${(sGateL.x + sGateR.x) / 2}, ${(sGateL.y + sGateR.y) / 2 + 15})`}>
                        <rect
                          x="-78"
                          y="-9"
                          width="156"
                          height="18"
                          rx="9"
                          fill="#083344"
                          stroke="#06b6d4"
                          strokeWidth="1.2"
                          fillOpacity="0.95"
                        />
                        <text
                          x="0"
                          y="3.5"
                          fill="#67e8f9"
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {isDiagonalGate ? "B-Gate: 450×900 (Diag 6' In)" : "B-Gate: 450×900mm (20ft)"}
                        </text>
                      </g>
                    </g>
                  )}

                  {/* Qibla Header Beam (450x900mm @ 5761mm, 20 ft span) */}
                  {sQiblaL && sQiblaR && (
                    <g key="cad-b-qibla-head">
                      <line
                        x1={sQiblaL.x}
                        y1={sQiblaL.y}
                        x2={sQiblaR.x}
                        y2={sQiblaR.y}
                        stroke="#10b981"
                        strokeWidth="3"
                        strokeDasharray="4 2"
                      />
                    </g>
                  )}

                  {/* LEFT Longitudinal Beam (450x900mm @ 5761mm): Rests on Left Door & Left Qibla Columns */}
                  {sGateL && sQiblaL && (
                    <g key="cad-b-long-left">
                      <line
                        x1={sGateL.x}
                        y1={sGateL.y}
                        x2={sQiblaL.x}
                        y2={sQiblaL.y}
                        stroke="#10b981"
                        strokeWidth="3.5"
                      />
                      {/* Left beam badge */}
                      <g transform={`translate(${(sGateL.x + sQiblaL.x) / 2 - 35}, ${(sGateL.y + sQiblaL.y) / 2})`}>
                        <rect
                          x="-80"
                          y="-10"
                          width="160"
                          height="20"
                          rx="10"
                          fill="#064e3b"
                          stroke="#34d399"
                          strokeWidth="1.2"
                          fillOpacity="0.95"
                        />
                        <text
                          x="0"
                          y="3.5"
                          fill="#a7f3d0"
                          fontSize="8.5"
                          fontWeight="bold"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          B-Long-L: 450×900mm
                        </text>
                      </g>
                    </g>
                  )}

                  {/* RIGHT Longitudinal Beam (450x900mm @ 5761mm): Rests on Right Door & Right Qibla Columns */}
                  {sGateR && sQiblaR && (
                    <g key="cad-b-long-right">
                      <line
                        x1={sGateR.x}
                        y1={sGateR.y}
                        x2={sQiblaR.x}
                        y2={sQiblaR.y}
                        stroke="#10b981"
                        strokeWidth="3.5"
                      />
                      {/* Right beam badge */}
                      <g transform={`translate(${(sGateR.x + sQiblaR.x) / 2 + 35}, ${(sGateR.y + sQiblaR.y) / 2})`}>
                        <rect
                          x="-80"
                          y="-10"
                          width="160"
                          height="20"
                          rx="10"
                          fill="#064e3b"
                          stroke="#34d399"
                          strokeWidth="1.2"
                          fillOpacity="0.95"
                        />
                        <text
                          x="0"
                          y="3.5"
                          fill="#a7f3d0"
                          fontSize="8.5"
                          fontWeight="bold"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          B-Long-R: 450×900mm
                        </text>
                      </g>
                    </g>
                  )}

                  {/* 20 FEET SPACING DIMENSION LINE BETWEEN THE TWO LONGITUDINAL BEAM LINES */}
                  {sGateL && sGateR && sQiblaL && sQiblaR && (
                    <g key="cad-dim-20ft-spacing">
                      {(() => {
                        const midLeftX = (sGateL.x + sQiblaL.x) / 2;
                        const midLeftY = (sGateL.y + sQiblaL.y) / 2;
                        const midRightX = (sGateR.x + sQiblaR.x) / 2;
                        const midRightY = (sGateR.y + sQiblaR.y) / 2;
                        return (
                          <g>
                            <line
                              x1={midLeftX}
                              y1={midLeftY}
                              x2={midRightX}
                              y2={midRightY}
                              stroke="#f59e0b"
                              strokeWidth="1.5"
                              strokeDasharray="4 2"
                            />
                            {/* Arrowheads */}
                            <circle cx={midLeftX} cy={midLeftY} r="3" fill="#f59e0b" />
                            <circle cx={midRightX} cy={midRightY} r="3" fill="#f59e0b" />
                            <g transform={`translate(${(midLeftX + midRightX) / 2}, ${(midLeftY + midRightY) / 2 - 14})`}>
                              <rect
                                x="-82"
                                y="-9"
                                width="164"
                                height="18"
                                rx="9"
                                fill="#451a03"
                                stroke="#f59e0b"
                                strokeWidth="1.2"
                                fillOpacity="0.95"
                              />
                              <text
                                x="0"
                                y="3.5"
                                fill="#fde68a"
                                fontSize="9"
                                fontWeight="bold"
                                fontFamily="monospace"
                                textAnchor="middle"
                              >
                                ↔ 20&apos; 0&quot; (6.10m) SPAN
                              </text>
                            </g>
                          </g>
                        );
                      })()}
                    </g>
                  )}

                  {/* LEFT Qibla Wall Column (450mm x 450mm @ 5761mm) */}
                  {sQiblaL && (
                    <g key="cad-col-qibla-l" className="cad-column-qibla">
                      <rect
                        x={sQiblaL.x - 9}
                        y={sQiblaL.y - 9}
                        width="18"
                        height="18"
                        fill="#065f46"
                        stroke="#10b981"
                        strokeWidth="2"
                        rx="2"
                      />
                      <line
                        x1={sQiblaL.x - 9}
                        y1={sQiblaL.y - 9}
                        x2={sQiblaL.x + 9}
                        y2={sQiblaL.y + 9}
                        stroke="#34d399"
                        strokeWidth="1.2"
                      />
                      <line
                        x1={sQiblaL.x - 9}
                        y1={sQiblaL.y + 9}
                        x2={sQiblaL.x + 9}
                        y2={sQiblaL.y - 9}
                        stroke="#34d399"
                        strokeWidth="1.2"
                      />
                      {!cleanView && showStructuralTags && (
                        <g transform={`translate(${sQiblaL.x}, ${sQiblaL.y - 18})`}>
                          <rect
                            x="-58"
                            y="-9"
                            width="116"
                            height="18"
                            rx="5"
                            fill="#064e3b"
                            stroke="#10b981"
                            strokeWidth="1.2"
                            fillOpacity="0.95"
                          />
                          <text
                            x="0"
                            y="3"
                            fill="#a7f3d0"
                            fontSize="8.5"
                            fontFamily="monospace"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            C-Qibla-L (450×450)
                          </text>
                        </g>
                      )}
                    </g>
                  )}

                  {/* RIGHT Qibla Wall Column (450mm x 450mm @ 5761mm) */}
                  {sQiblaR && (
                    <g key="cad-col-qibla-r" className="cad-column-qibla">
                      <rect
                        x={sQiblaR.x - 9}
                        y={sQiblaR.y - 9}
                        width="18"
                        height="18"
                        fill="#065f46"
                        stroke="#10b981"
                        strokeWidth="2"
                        rx="2"
                      />
                      <line
                        x1={sQiblaR.x - 9}
                        y1={sQiblaR.y - 9}
                        x2={sQiblaR.x + 9}
                        y2={sQiblaR.y + 9}
                        stroke="#34d399"
                        strokeWidth="1.2"
                      />
                      <line
                        x1={sQiblaR.x - 9}
                        y1={sQiblaR.y + 9}
                        x2={sQiblaR.x + 9}
                        y2={sQiblaR.y - 9}
                        stroke="#34d399"
                        strokeWidth="1.2"
                      />
                      {!cleanView && showStructuralTags && (
                        <g transform={`translate(${sQiblaR.x}, ${sQiblaR.y - 18})`}>
                          <rect
                            x="-58"
                            y="-9"
                            width="116"
                            height="18"
                            rx="5"
                            fill="#064e3b"
                            stroke="#10b981"
                            strokeWidth="1.2"
                            fillOpacity="0.95"
                          />
                          <text
                            x="0"
                            y="3"
                            fill="#a7f3d0"
                            fontSize="8.5"
                            fontFamily="monospace"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            C-Qibla-R (450×450)
                          </text>
                        </g>
                      )}
                    </g>
                  )}

                  {/* LEFT Door / Gate Column (450mm x 450mm @ 5761mm) */}
                  {sGateL && (
                    <g key="cad-col-gate-l" className="cad-column-gate">
                      <rect
                        x={sGateL.x - 9}
                        y={sGateL.y - 9}
                        width="18"
                        height="18"
                        fill="#083344"
                        stroke="#06b6d4"
                        strokeWidth="2"
                        rx="2"
                      />
                      <line
                        x1={sGateL.x - 9}
                        y1={sGateL.y - 9}
                        x2={sGateL.x + 9}
                        y2={sGateL.y + 9}
                        stroke="#67e8f9"
                        strokeWidth="1.2"
                      />
                      <line
                        x1={sGateL.x - 9}
                        y1={sGateL.y + 9}
                        x2={sGateL.x + 9}
                        y2={sGateL.y - 9}
                        stroke="#67e8f9"
                        strokeWidth="1.2"
                      />
                      {!cleanView && showStructuralTags && (
                        <g transform={`translate(${sGateL.x}, ${sGateL.y + 18})`}>
                          <rect
                            x="-56"
                            y="-9"
                            width="112"
                            height="18"
                            rx="5"
                            fill="#083344"
                            stroke="#06b6d4"
                            strokeWidth="1.2"
                            fillOpacity="0.95"
                          />
                          <text
                            x="0"
                            y="3"
                            fill="#67e8f9"
                            fontSize="8.5"
                            fontFamily="monospace"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            C-Gate-L (450×450)
                          </text>
                        </g>
                      )}
                    </g>
                  )}

                  {/* RIGHT Door / Gate Column (450mm x 450mm @ 5761mm) */}
                  {sGateR && (
                    <g key="cad-col-gate-r" className="cad-column-gate">
                      <rect
                        x={sGateR.x - 9}
                        y={sGateR.y - 9}
                        width="18"
                        height="18"
                        fill="#083344"
                        stroke="#06b6d4"
                        strokeWidth="2"
                        rx="2"
                      />
                      <line
                        x1={sGateR.x - 9}
                        y1={sGateR.y - 9}
                        x2={sGateR.x + 9}
                        y2={sGateR.y + 9}
                        stroke="#67e8f9"
                        strokeWidth="1.2"
                      />
                      <line
                        x1={sGateR.x - 9}
                        y1={sGateR.y + 9}
                        x2={sGateR.x + 9}
                        y2={sGateR.y - 9}
                        stroke="#67e8f9"
                        strokeWidth="1.2"
                      />
                      {!cleanView && showStructuralTags && (
                        <g transform={`translate(${sGateR.x}, ${sGateR.y + 18})`}>
                          <rect
                            x="-56"
                            y="-9"
                            width="112"
                            height="18"
                            rx="5"
                            fill="#083344"
                            stroke="#06b6d4"
                            strokeWidth="1.2"
                            fillOpacity="0.95"
                          />
                          <text
                            x="0"
                            y="3"
                            fill="#67e8f9"
                            fontSize="8.5"
                            fontFamily="monospace"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            C-Gate-R (450×450)
                          </text>
                        </g>
                      )}
                    </g>
                  )}

                  {/* EXTRA COLUMN: Added to the right side of the building of main gate */}
                  {isRightCornerGate && sGateExtraR && mCfg.hasExtraGateRightColumn !== false && (
                    <g key="cad-col-gate-extra-r" className="cad-column-gate-extra">
                      {/* Tie beam from C-GATE-R to EXTRA COLUMN */}
                      {sGateR && (
                        <line
                          x1={sGateR.x}
                          y1={sGateR.y}
                          x2={sGateExtraR.x}
                          y2={sGateExtraR.y}
                          stroke="#06b6d4"
                          strokeWidth="2.5"
                          strokeDasharray="3 2"
                        />
                      )}
                      <rect
                        x={sGateExtraR.x - 9}
                        y={sGateExtraR.y - 9}
                        width="18"
                        height="18"
                        fill="#083344"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                        rx="2"
                      />
                      <line
                        x1={sGateExtraR.x - 9}
                        y1={sGateExtraR.y - 9}
                        x2={sGateExtraR.x + 9}
                        y2={sGateExtraR.y + 9}
                        stroke="#38bdf8"
                        strokeWidth="1.2"
                      />
                      <line
                        x1={sGateExtraR.x - 9}
                        y1={sGateExtraR.y + 9}
                        x2={sGateExtraR.x + 9}
                        y2={sGateExtraR.y - 9}
                        stroke="#38bdf8"
                        strokeWidth="1.2"
                      />
                      {!cleanView && showStructuralTags && (
                        <g transform={`translate(${sGateExtraR.x}, ${sGateExtraR.y + 36})`}>
                          <rect
                            x="-64"
                            y="-9"
                            width="128"
                            height="18"
                            rx="5"
                            fill="#082f49"
                            stroke="#38bdf8"
                            strokeWidth="1.2"
                            fillOpacity="0.95"
                          />
                          <text
                            x="0"
                            y="3"
                            fill="#7dd3fc"
                            fontSize="8"
                            fontFamily="monospace"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            C-Gate-Extra-R (450×450)
                          </text>
                        </g>
                      )}
                    </g>
                  )}

                  {/* UMBRELLA CORNER CANOPY: Raking cantilever beams meeting at outer corner */}
                  {isRightCornerGate && mCfg.hasExtraGateRightColumn === false && sGateExtraR && sGateL && sGateR && (
                    <g key="cad-umbrella-corner-canopy" className="cad-umbrella-canopy">
                      {/* Triangular canopy filled footprint with subtle tint and dashed outline */}
                      <polygon
                        points={`${sGateL.x},${sGateL.y} ${sGateR.x},${sGateR.y} ${sGateExtraR.x},${sGateExtraR.y}`}
                        fill="#0284c7"
                        fillOpacity={cleanView ? "0.12" : "0.22"}
                        stroke="#38bdf8"
                        strokeWidth="2"
                        strokeDasharray="6 3"
                      />
                      {/* Raking Beams from Door Columns to Outer Corner */}
                      <line
                        x1={sGateL.x}
                        y1={sGateL.y}
                        x2={sGateExtraR.x}
                        y2={sGateExtraR.y}
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                      />
                      <line
                        x1={sGateR.x}
                        y1={sGateR.y}
                        x2={sGateExtraR.x}
                        y2={sGateExtraR.y}
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                      />
                      {/* Outer Corner Apex Node */}
                      <circle
                        cx={sGateExtraR.x}
                        cy={sGateExtraR.y}
                        r="5"
                        fill="#0284c7"
                        stroke="#e0f2fe"
                        strokeWidth="2"
                      />
                      {!cleanView && showStructuralTags && (
                        <g transform={`translate(${sGateExtraR.x}, ${sGateExtraR.y + 26})`}>
                          <rect
                            x="-68"
                            y="-9"
                            width="136"
                            height="18"
                            rx="5"
                            fill="#082f49"
                            stroke="#38bdf8"
                            strokeWidth="1.2"
                            fillOpacity="0.95"
                          />
                          <text
                            x="0"
                            y="3"
                            fill="#7dd3fc"
                            fontSize="8"
                            fontFamily="monospace"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            ☂️ UMBRELLA CANOPY (350×450)
                          </text>
                        </g>
                      )}
                    </g>
                  )}

                  {/* Architectural Main Gate Opening & Double Door Swing graphic */}
                  {sGateL && sGateR && (
                    <g key="cad-main-gate-doorswing">
                      {/* Door swing arcs */}
                      {(() => {
                        const midX = (sGateL.x + sGateR.x) / 2;
                        const midY = (sGateL.y + sGateR.y) / 2;
                        const leafRadius = Math.abs(sGateR.x - sGateL.x) / 2;
                        return (
                          <g>
                            {/* Double door leafs */}
                            <line
                              x1={sGateL.x}
                              y1={sGateL.y}
                              x2={sGateL.x}
                              y2={sGateL.y + leafRadius * 0.6}
                              stroke="#06b6d4"
                              strokeWidth="1.8"
                            />
                            <line
                              x1={sGateR.x}
                              y1={sGateR.y}
                              x2={sGateR.x}
                              y2={sGateR.y + leafRadius * 0.6}
                              stroke="#06b6d4"
                              strokeWidth="1.8"
                            />
                            {/* Gate Banner Badge */}
                            {!cleanView && (
                              <g transform={`translate(${midX}, ${midY + 36})`}>
                                <rect
                                  x="-84"
                                  y="-10"
                                  width="168"
                                  height="20"
                                  rx="10"
                                  fill="#042f2e"
                                  stroke="#14b8a6"
                                  strokeWidth="1.2"
                                  fillOpacity="0.95"
                                />
                                <text
                                  x="0"
                                  y="3.5"
                                  fill="#5eead4"
                                  fontSize="8.5"
                                  fontWeight="bold"
                                  fontFamily="sans-serif"
                                  textAnchor="middle"
                                >
                                  {isDiagonalGate ? "🚪 DIAGONAL GATE (6' INNER CORNER)" : "🚪 MAIN GATE (RIGHT CORNER)"}
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })()}
                    </g>
                  )}

                  {/* Central Bay 20 ft Clearance Badge */}
                  {!cleanView && showStructuralTags && (
                    <g transform={`translate(${(sP0.x + sP5.x + sP6.x + sP7.x) / 4}, ${(sP0.y + sP5.y + sP6.y + sP7.y) / 4 + 40})`}>
                      <rect
                        x="-125"
                        y="-14"
                        width="250"
                        height="28"
                        rx="14"
                        fill="#064e3b"
                        stroke="#10b981"
                        strokeWidth="1.5"
                        fillOpacity="0.95"
                      />
                      <text
                        x="0"
                        y="4"
                        fill="#a7f3d0"
                        fontSize="9.5"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                        textAnchor="middle"
                      >
                        20 FT CENTRAL BAY • 2 SPINAL BEAMS
                      </text>
                    </g>
                  )}
                </g>
              );
            })()}
          </g>
        );
      })()}

      {/* Office & Structural Engineering Grid Lines and Bubble Identifiers */}
      {roomConfig.structuralGrid?.enabled && (() => {
        const sGrid = roomConfig.structuralGrid;
        const baysX = sGrid.baysX || 3;
        const baysY = sGrid.baysY || 3;
        const spanX = sGrid.spacingX || 6.0;
        const spanY = sGrid.spacingY || 6.0;
        const totalW = baysX * spanX;
        const totalL = baysY * spanY;
        const startX = -totalW / 2;
        const startZ = -totalL / 2;
        const bubbleMargin = 1.0;

        const linesX = [];
        for (let ix = 0; ix <= baysX; ix++) {
          const gx = startX + ix * spanX;
          const letter = String.fromCharCode(65 + ix);
          const pTop = sm.projectFloorCoordinatesToScreen(gx, startZ - bubbleMargin);
          const pBottom = sm.projectFloorCoordinatesToScreen(gx, startZ + totalL + bubbleMargin);
          if (pTop && pBottom) {
            linesX.push({ letter, pTop, pBottom, gx });
          }
        }

        const linesY = [];
        for (let iy = 0; iy <= baysY; iy++) {
          const gz = startZ + iy * spanY;
          const numberStr = (iy + 1).toString();
          const pLeft = sm.projectFloorCoordinatesToScreen(startX - bubbleMargin, gz);
          const pRight = sm.projectFloorCoordinatesToScreen(startX + totalW + bubbleMargin, gz);
          if (pLeft && pRight) {
            linesY.push({ numberStr, pLeft, pRight, gz });
          }
        }

        return (
          <g className="structural-grid-lines-and-bubbles opacity-85">
            {/* Grid Lines along Y (Grid Lines A, B, C...) */}
            {linesX.map((line) => (
              <g key={`grid-line-x-${line.letter}`}>
                <line
                  x1={line.pTop.x}
                  y1={line.pTop.y}
                  x2={line.pBottom.x}
                  y2={line.pBottom.y}
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                  strokeDasharray="6 3 2 3"
                  strokeOpacity="0.6"
                />
                {/* Top Bubble */}
                <circle cx={line.pTop.x} cy={line.pTop.y} r="13" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                <text x={line.pTop.x} y={line.pTop.y + 4} fill="#e0f2fe" fontSize="11" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">
                  {line.letter}
                </text>
                {/* Bottom Bubble */}
                <circle cx={line.pBottom.x} cy={line.pBottom.y} r="13" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                <text x={line.pBottom.x} y={line.pBottom.y + 4} fill="#e0f2fe" fontSize="11" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">
                  {line.letter}
                </text>
              </g>
            ))}

            {/* Grid Lines along X (Grid Lines 1, 2, 3...) */}
            {linesY.map((line) => (
              <g key={`grid-line-y-${line.numberStr}`}>
                <line
                  x1={line.pLeft.x}
                  y1={line.pLeft.y}
                  x2={line.pRight.x}
                  y2={line.pRight.y}
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                  strokeDasharray="6 3 2 3"
                  strokeOpacity="0.6"
                />
                {/* Left Bubble */}
                <circle cx={line.pLeft.x} cy={line.pLeft.y} r="13" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                <text x={line.pLeft.x} y={line.pLeft.y + 4} fill="#e0f2fe" fontSize="11" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">
                  {line.numberStr}
                </text>
                {/* Right Bubble */}
                <circle cx={line.pRight.x} cy={line.pRight.y} r="13" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                <text x={line.pRight.x} y={line.pRight.y + 4} fill="#e0f2fe" fontSize="11" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">
                  {line.numberStr}
                </text>
              </g>
            ))}
          </g>
        );
      })()}
    </svg>
    </div>
  );
};
