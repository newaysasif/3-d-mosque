import React, { useState } from 'react';
import {
  RoomConfig,
  PlacedFurnitureItem,
  StructuralGridConfig,
} from '../types';
import {
  Grid,
  X,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  Columns,
  Layers,
  Check,
  Link,
  ChevronRight,
  Maximize2,
  Building2,
  Briefcase,
  Sliders,
} from 'lucide-react';

interface OfficeStructuralGridModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomConfig: RoomConfig;
  items: PlacedFurnitureItem[];
  onUpdateConfig: (newConfig: RoomConfig) => void;
  onUpdateItems: (newItems: PlacedFurnitureItem[]) => void;
  onSelectItemId?: (id: string | null) => void;
  showToast: (msg: string) => void;
}

export const OfficeStructuralGridModal: React.FC<OfficeStructuralGridModalProps> = ({
  isOpen,
  onClose,
  roomConfig,
  items,
  onUpdateConfig,
  onUpdateItems,
  onSelectItemId,
  showToast,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'presets' | 'custom-grid' | 'columns-list' | 'beams-list'>('presets');

  // Custom grid parameters
  const [baysX, setBaysX] = useState<number>(3);
  const [baysY, setBaysY] = useState<number>(3);
  const [spacingX, setSpacingX] = useState<number>(6.0); // meters (typical office span)
  const [spacingY, setSpacingY] = useState<number>(6.0);
  const [columnProfile, setColumnProfile] = useState<'square-concrete' | 'rect-concrete' | 'steel-h' | 'round-concrete'>('square-concrete');
  const [columnHeight, setColumnHeight] = useState<number>(3.5); // meters
  const [beamProfile, setBeamProfile] = useState<'concrete' | 'steel' | 'timber'>('concrete');
  const [beamElevation, setBeamElevation] = useState<number>(3.5);
  const [includeBeams, setIncludeBeams] = useState<boolean>(true);
  const [resizeRoomWalls, setResizeRoomWalls] = useState<boolean>(true);

  // Manual beam connector state
  const [connectColA, setConnectColA] = useState<string>('');
  const [connectColB, setConnectColB] = useState<string>('');

  // Find existing structural columns and beams
  const structuralColumns = items.filter(
    (it) =>
      it.category === 'architectural' &&
      (it.customData?.architecturalType === 'column' ||
        it.modelType.startsWith('structural-column-') ||
        it.modelType === 'architectural-pillar')
  );

  const structuralBeams = items.filter(
    (it) =>
      it.category === 'architectural' &&
      (it.customData?.architecturalType === 'beam' ||
        it.modelType.startsWith('structural-beam') ||
        it.modelType === 'architectural-ceiling-beam')
  );

  // Unit conversion helpers
  const isImperial = roomConfig.unitSystem === 'imperial';
  const m2ft = 3.28084;
  const toDisplayUnit = (m: number) => (isImperial ? `${(m * m2ft).toFixed(1)} ft` : `${m.toFixed(2)} m`);

  // Helper to generate a full grid (used by presets and custom builder)
  const generateGrid = (
    numBaysX: number,
    numBaysY: number,
    spanX: number,
    spanY: number,
    cProfile: 'square-concrete' | 'rect-concrete' | 'steel-h' | 'round-concrete',
    colH: number,
    bProfile: 'concrete' | 'steel' | 'timber',
    beamElev: number,
    withBeams: boolean,
    adaptRoom: boolean,
    gridTitle: string
  ) => {
    // Grid total dimensions
    const totalW = numBaysX * spanX;
    const totalL = numBaysY * spanY;

    // Grid lines: X-lines = A, B, C...; Y-lines = 1, 2, 3...
    const numLinesX = numBaysX + 1;
    const numLinesY = numBaysY + 1;

    // Center the grid around origin (0, 0)
    const startX = -totalW / 2;
    const startZ = -totalL / 2;

    // Determine modelType and dimensions for column
    let colModelType = 'structural-column-square';
    let colW = 0.45;
    let colD = 0.45;
    let colPrice = 750;
    let colColor = '#94a3b8';

    if (cProfile === 'rect-concrete') {
      colModelType = 'structural-column-650x900';
      colW = 0.65;
      colD = 0.90;
      colPrice = 980;
    } else if (cProfile === 'steel-h') {
      colModelType = 'structural-column-steel';
      colW = 0.35;
      colD = 0.35;
      colPrice = 920;
      colColor = '#334155';
    } else if (cProfile === 'round-concrete') {
      colModelType = 'architectural-pillar';
      colW = 0.45;
      colD = 0.45;
      colPrice = 800;
    }

    // Determine beam modelType and dimensions
    let beamModelType = 'structural-beam-concrete';
    let beamW = 0.30;
    let beamD = 0.60;
    let beamPrice = 650;
    let beamColor = '#94a3b8';

    if (bProfile === 'steel') {
      beamModelType = 'structural-beam-steel';
      beamW = 0.25;
      beamD = 0.45;
      beamPrice = 850;
      beamColor = '#334155';
    } else if (bProfile === 'timber') {
      beamModelType = 'architectural-ceiling-beam';
      beamW = 0.24;
      beamD = 0.30;
      beamPrice = 520;
      beamColor = '#453224';
    }

    // 1. Generate columns systematically labeled C1, C2, C3...
    const newColumns: PlacedFurnitureItem[] = [];
    const colGridMap: { [key: string]: PlacedFurnitureItem } = {}; // key: "xIdx-yIdx"

    let colCounter = 1;
    for (let iy = 0; iy < numLinesY; iy++) {
      const zPos = +(startZ + iy * spanY).toFixed(3);
      const yLabel = (iy + 1).toString();

      for (let ix = 0; ix < numLinesX; ix++) {
        const xPos = +(startX + ix * spanX).toFixed(3);
        const xLabel = String.fromCharCode(65 + ix); // 'A', 'B', 'C'...
        const gridCoord = `${xLabel}-${yLabel}`;
        const colId = `C${colCounter}`;

        const colItem: PlacedFurnitureItem = {
          id: `col-${Date.now()}-${colCounter}`,
          modelType: colModelType,
          name: `${colId}: Column (${gridCoord})`,
          category: 'architectural',
          position: [xPos, 0, zPos],
          rotationY: 0,
          dimensions: {
            width: colW,
            depth: colD,
            height: colH,
          },
          color: colColor,
          price: colPrice,
          customData: {
            architecturalType: 'column',
            structuralId: colId,
            gridCoordinate: gridCoord,
            columnStyle: colModelType,
          },
        };

        newColumns.push(colItem);
        colGridMap[`${ix}-${iy}`] = colItem;
        colCounter++;
      }
    }

    // 2. Generate connecting beams systematically labeled B1, B2, B3...
    const newBeams: PlacedFurnitureItem[] = [];
    let beamCounter = 1;

    if (withBeams) {
      // Longitudinal beams along X (connecting col(ix, iy) to col(ix+1, iy))
      for (let iy = 0; iy < numLinesY; iy++) {
        for (let ix = 0; ix < numLinesX - 1; ix++) {
          const colA = colGridMap[`${ix}-${iy}`];
          const colB = colGridMap[`${ix + 1}-${iy}`];
          if (!colA || !colB) continue;

          const beamId = `B${beamCounter}`;
          const xMid = +((colA.position[0] + colB.position[0]) / 2).toFixed(3);
          const zMid = +((colA.position[2] + colB.position[2]) / 2).toFixed(3);
          const dx = colB.position[0] - colA.position[0];
          const dz = colB.position[2] - colA.position[2];
          const len = +Math.sqrt(dx * dx + dz * dz).toFixed(3);
          const rotDeg = 0; // Along X axis

          const beamItem: PlacedFurnitureItem = {
            id: `beam-${Date.now()}-${beamCounter}`,
            modelType: beamModelType,
            name: `${beamId}: Beam (${colA.customData?.structuralId}➜${colB.customData?.structuralId})`,
            category: 'architectural',
            position: [xMid, beamElev, zMid],
            rotationY: rotDeg,
            dimensions: {
              width: len,
              depth: beamW,
              height: beamD,
            },
            color: beamColor,
            price: beamPrice,
            customData: {
              architecturalType: 'beam',
              structuralId: beamId,
              connectedColumns: [
                colA.customData?.structuralId || `C${ix + 1}`,
                colB.customData?.structuralId || `C${ix + 2}`,
              ],
              beamProfile: bProfile,
            },
          };

          newBeams.push(beamItem);
          beamCounter++;
        }
      }

      // Transverse beams along Y (connecting col(ix, iy) to col(ix, iy+1))
      for (let ix = 0; ix < numLinesX; ix++) {
        for (let iy = 0; iy < numLinesY - 1; iy++) {
          const colA = colGridMap[`${ix}-${iy}`];
          const colB = colGridMap[`${ix}-${iy + 1}`];
          if (!colA || !colB) continue;

          const beamId = `B${beamCounter}`;
          const xMid = +((colA.position[0] + colB.position[0]) / 2).toFixed(3);
          const zMid = +((colA.position[2] + colB.position[2]) / 2).toFixed(3);
          const dx = colB.position[0] - colA.position[0];
          const dz = colB.position[2] - colA.position[2];
          const len = +Math.sqrt(dx * dx + dz * dz).toFixed(3);
          const rotDeg = 90; // Along Z axis

          const beamItem: PlacedFurnitureItem = {
            id: `beam-${Date.now()}-${beamCounter}`,
            modelType: beamModelType,
            name: `${beamId}: Beam (${colA.customData?.structuralId}➜${colB.customData?.structuralId})`,
            category: 'architectural',
            position: [xMid, beamElev, zMid],
            rotationY: rotDeg,
            dimensions: {
              width: len,
              depth: beamW,
              height: beamD,
            },
            color: beamColor,
            price: beamPrice,
            customData: {
              architecturalType: 'beam',
              structuralId: beamId,
              connectedColumns: [
                colA.customData?.structuralId || '',
                colB.customData?.structuralId || '',
              ],
              beamProfile: bProfile,
            },
          };

          newBeams.push(beamItem);
          beamCounter++;
        }
      }
    }

    // Keep existing non-structural furniture
    const nonStructural = items.filter(
      (it) =>
        !(
          it.category === 'architectural' &&
          (it.customData?.architecturalType === 'column' ||
            it.customData?.architecturalType === 'beam' ||
            it.modelType.startsWith('structural-column-') ||
            it.modelType.startsWith('structural-beam'))
        )
    );

    const updatedItems = [...nonStructural, ...newColumns, ...newBeams];
    onUpdateItems(updatedItems);

    // Update room config with structural grid parameters
    const gridConfig: StructuralGridConfig = {
      enabled: true,
      gridName: gridTitle,
      gridType: 'office',
      baysX: numBaysX,
      baysY: numBaysY,
      spacingX: spanX,
      spacingY: spanY,
      columnHeight: colH,
      columnProfile: cProfile,
      columnWidth: colW,
      columnDepth: colD,
      beamProfile: bProfile,
      beamWidth: beamW,
      beamDepth: beamD,
      beamElevation: beamElev,
      includeBeams: withBeams,
      showGridBubbles: true,
      showGridLines: true,
      showLabels: true,
    };

    let nextRoomConfig = {
      ...roomConfig,
      structuralGrid: gridConfig,
    };

    if (adaptRoom) {
      nextRoomConfig = {
        ...nextRoomConfig,
        width: Math.max(totalW + 1.2, totalW),
        length: Math.max(totalL + 1.2, totalL),
        height: Math.max(colH, roomConfig.height),
      };
    }

    onUpdateConfig(nextRoomConfig);
    showToast(
      `Created ${gridTitle}: ${newColumns.length} Columns (C1–C${newColumns.length}) & ${newBeams.length} Beams (B1–B${newBeams.length})`
    );
  };

  // Renumber all existing columns sequentially as C1, C2, C3...
  const handleRenumberColumns = () => {
    if (structuralColumns.length === 0) {
      showToast('No columns found to renumber');
      return;
    }

    // Sort by Z (row), then by X (column)
    const sorted = [...structuralColumns].sort((a, b) => {
      const dz = a.position[2] - b.position[2];
      if (Math.abs(dz) > 0.4) return dz;
      return a.position[0] - b.position[0];
    });

    const idMap: { [oldId: string]: string } = {};
    const updatedColumns = sorted.map((col, idx) => {
      const newTag = `C${idx + 1}`;
      idMap[col.id] = newTag;
      return {
        ...col,
        name: `${newTag}: Column (${col.customData?.gridCoordinate || `Col ${idx + 1}`})`,
        customData: {
          ...col.customData,
          architecturalType: 'column' as const,
          structuralId: newTag,
        },
      };
    });

    // Replace in items
    const nonCols = items.filter((it) => !structuralColumns.some((c) => c.id === it.id));
    onUpdateItems([...nonCols, ...updatedColumns]);
    showToast(`Renumbered ${updatedColumns.length} columns cleanly as C1 to C${updatedColumns.length}`);
  };

  // Renumber all existing beams sequentially as B1, B2, B3...
  const handleRenumberBeams = () => {
    if (structuralBeams.length === 0) {
      showToast('No beams found to renumber');
      return;
    }

    // Sort by Elevation, then Z, then X
    const sorted = [...structuralBeams].sort((a, b) => {
      const dy = a.position[1] - b.position[1];
      if (Math.abs(dy) > 0.3) return dy;
      const dz = a.position[2] - b.position[2];
      if (Math.abs(dz) > 0.4) return dz;
      return a.position[0] - b.position[0];
    });

    const updatedBeams = sorted.map((beam, idx) => {
      const newTag = `B${idx + 1}`;
      const conn = beam.customData?.connectedColumns?.join('➜') || 'Framing';
      return {
        ...beam,
        name: `${newTag}: Beam (${conn})`,
        customData: {
          ...beam.customData,
          architecturalType: 'beam' as const,
          structuralId: newTag,
        },
      };
    });

    const nonBeams = items.filter((it) => !structuralBeams.some((b) => b.id === it.id));
    onUpdateItems([...nonBeams, ...updatedBeams]);
    showToast(`Renumbered ${updatedBeams.length} beams cleanly as B1 to B${updatedBeams.length}`);
  };

  // Connect a single beam between two picked columns
  const handleConnectBeamBetween = () => {
    if (!connectColA || !connectColB) {
      showToast('Please select both starting and ending columns');
      return;
    }
    if (connectColA === connectColB) {
      showToast('Starting and ending columns must be different');
      return;
    }

    const colA = items.find((it) => it.id === connectColA);
    const colB = items.find((it) => it.id === connectColB);
    if (!colA || !colB) return;

    const beamId = `B${structuralBeams.length + 1}`;
    const xMid = +((colA.position[0] + colB.position[0]) / 2).toFixed(3);
    const zMid = +((colA.position[2] + colB.position[2]) / 2).toFixed(3);
    const dx = colB.position[0] - colA.position[0];
    const dz = colB.position[2] - colA.position[2];
    const len = +Math.sqrt(dx * dx + dz * dz).toFixed(3);

    // Calculate rotation angle in degrees
    const angleRad = Math.atan2(-dz, dx);
    const rotDeg = Math.round((angleRad * 180) / Math.PI);

    const tagA = colA.customData?.structuralId || colA.name.split(':')[0] || 'C?';
    const tagB = colB.customData?.structuralId || colB.name.split(':')[0] || 'C?';

    const newBeam: PlacedFurnitureItem = {
      id: `beam-${Date.now()}`,
      modelType: 'structural-beam-concrete',
      name: `${beamId}: Beam (${tagA}➜${tagB})`,
      category: 'architectural',
      position: [xMid, beamElevation, zMid],
      rotationY: rotDeg,
      dimensions: {
        width: len,
        depth: 0.30,
        height: 0.60,
      },
      color: '#94a3b8',
      price: 650,
      customData: {
        architecturalType: 'beam',
        structuralId: beamId,
        connectedColumns: [tagA, tagB],
        beamProfile: 'concrete',
      },
    };

    onUpdateItems([...items, newBeam]);
    showToast(`Connected ${beamId} between ${tagA} and ${tagB} (Span ${toDisplayUnit(len)})`);
  };

  // Delete all columns
  const handleClearAllColumns = () => {
    const remaining = items.filter((it) => !structuralColumns.some((c) => c.id === it.id));
    onUpdateItems(remaining);
    showToast('All structural columns removed');
  };

  // Delete all beams
  const handleClearAllBeams = () => {
    const remaining = items.filter((it) => !structuralBeams.some((b) => b.id === it.id));
    onUpdateItems(remaining);
    showToast('All structural beams removed');
  };

  // Delete single item
  const handleDeleteItem = (id: string, name: string) => {
    onUpdateItems(items.filter((it) => it.id !== id));
    showToast(`Removed ${name}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Office Structural Grid & Framing Editor
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                  AutoCAD / BIM
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Easy grid generator & editor with sequential columns (C1, C2...) and beams (B1, B2...)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-slate-800 bg-slate-900/50">
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'presets'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>⚡ Fast Office Presets</span>
          </button>

          <button
            onClick={() => setActiveTab('custom-grid')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'custom-grid'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>📐 Custom Grid Maker</span>
          </button>

          <button
            onClick={() => setActiveTab('columns-list')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'columns-list'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>🏛️ Columns Schedule ({structuralColumns.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('beams-list')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'beams-list'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>🏗️ Beams Schedule ({structuralBeams.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: FAST OFFICE PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Ready-to-Use Office Structural Grids
                  </h3>
                  <p className="text-xs text-slate-400">
                    Click any preset to immediately generate structural bays with columns (C1, C2...) and beams (B1, B2...)
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
                  <span>Current: {structuralColumns.length} Cols</span>
                  <span>•</span>
                  <span>{structuralBeams.length} Beams</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Preset 1: Standard Corporate Office */}
                <div className="p-4 bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/70 rounded-2xl transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                          3×3
                        </span>
                        <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                          Standard Corporate Office Grid
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                        18m × 18m
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">
                      Standard 6.0m (20ft) column bays. Generates 16 columns (C1 to C16) and 24 primary framing beams (B1 to B24).
                    </p>
                    <div className="flex flex-wrap gap-2 text-[11px] font-mono mb-4 text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700">Columns: C1 – C16</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700">Beams: B1 – B24</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700">Span: 6.0m (19.7ft)</span>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      generateGrid(
                        3,
                        3,
                        6.0,
                        6.0,
                        'square-concrete',
                        3.5,
                        'concrete',
                        3.5,
                        true,
                        true,
                        'Corporate Office Grid'
                      )
                    }
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Apply Corporate Office Grid (C1..C16 & B1..B24)</span>
                  </button>
                </div>

                {/* Preset 2: Open Plan Tech Office */}
                <div className="p-4 bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/70 rounded-2xl transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                          4×3
                        </span>
                        <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                          Open-Plan Tech Hub & Co-working
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                        28m × 19.5m
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">
                      Wide 7.0m × 6.5m bays for open collaborative desk pods. Generates 20 columns (C1 to C20) and 31 structural beams.
                    </p>
                    <div className="flex flex-wrap gap-2 text-[11px] font-mono mb-4 text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700">Columns: C1 – C20</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700">Beams: B1 – B31</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700">Steel H-Columns</span>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      generateGrid(
                        4,
                        3,
                        7.0,
                        6.5,
                        'steel-h',
                        3.8,
                        'steel',
                        3.8,
                        true,
                        true,
                        'Open Plan Tech Grid'
                      )
                    }
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Apply Open-Plan Tech Grid (C1..C20 & B1..B31)</span>
                  </button>
                </div>

                {/* Preset 3: Executive Suites & Conference */}
                <div className="p-4 bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/70 rounded-2xl transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                          3×2
                        </span>
                        <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                          Executive Suites & Boardrooms
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                        18m × 10m
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">
                      Compact rectangular 3×2 bay layout for private executive offices and central meeting rooms. 12 columns & 17 beams.
                    </p>
                    <div className="flex flex-wrap gap-2 text-[11px] font-mono mb-4 text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700">Columns: C1 – C12</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700">Beams: B1 – B17</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700">Span: 6.0m × 5.0m</span>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      generateGrid(
                        3,
                        2,
                        6.0,
                        5.0,
                        'square-concrete',
                        3.2,
                        'concrete',
                        3.2,
                        true,
                        true,
                        'Executive Suite Grid'
                      )
                    }
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Apply Executive Suite Grid (C1..C12 & B1..B17)</span>
                  </button>
                </div>

                {/* Preset 4: Boutique Creative Studio */}
                <div className="p-4 bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/70 rounded-2xl transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                          2×2
                        </span>
                        <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                          Boutique Creative Office Studio
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                        10m × 10m
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">
                      Intimate 2×2 bay grid with exposed architectural timber ceiling beams. Generates 9 columns (C1 to C9) and 12 beams.
                    </p>
                    <div className="flex flex-wrap gap-2 text-[11px] font-mono mb-4 text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700">Columns: C1 – C9</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700">Beams: B1 – B12</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700">Timber Glulam Beams</span>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      generateGrid(
                        2,
                        2,
                        5.0,
                        5.0,
                        'round-concrete',
                        3.2,
                        'timber',
                        3.2,
                        true,
                        true,
                        'Creative Studio Grid'
                      )
                    }
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Apply Creative Studio Grid (C1..C9 & B1..B12)</span>
                  </button>
                </div>

                {/* Preset 5: Clear-Span Grand Hall (Center Columns Removed, 450x900 Beams @ 5761mm) */}
                <div className="p-4 bg-gradient-to-br from-emerald-950/40 via-slate-800/60 to-slate-900/80 hover:bg-slate-800/80 border border-emerald-500/40 rounded-2xl transition-all flex flex-col justify-between group md:col-span-2">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
                          CLEAR
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                            Clear-Span Grand Hall (Zero Center Columns)
                          </h4>
                          <span className="text-[10px] text-emerald-400/90 font-medium">
                            Beams rest on Outer Columns • 450×900mm @ 5761mm Level
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        100% Open Center
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mb-3">
                      All columns removed from the hall center. Heavy 450mm width × 900mm height clear-span transfer beams rest directly on the outer columns at 5761mm from ground level.
                    </p>
                    <div className="flex flex-wrap gap-2 text-[11px] font-mono mb-4 text-slate-200">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-emerald-600/40 text-emerald-300">
                        Center Columns: 0 (Removed)
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-emerald-600/40 text-emerald-300">
                        Beam Size: 450mm W × 900mm H
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-amber-500/40 text-amber-300">
                        Elevation: 5761mm (5.761m)
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-blue-500/40 text-blue-300">
                        Outer Columns: 12 (650×900mm)
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const updatedMCfg = {
                        ...(roomConfig.masjidConfig || {
                          isMasjid: true,
                          qiblaWallFeet: 40.9,
                          leftWallFeet: 73.5,
                          rightWallFeet: 69.1,
                          backWallFeet: 63.2,
                          mehrabWidthFeet: 18.0,
                          mehrabDepthFeet: 7.0,
                          mehrabHeightFeet: 9.0,
                          showSaffLines: true,
                          saffSpacingMeters: 1.2,
                          saffColor: '#d4af37',
                          estimatedCapacity: 340,
                          showTieBeams: true,
                          showColumns: true,
                          showStructuralGrid: true,
                          mainColumnWidthMm: 650,
                          mainColumnDepthMm: 900,
                          tieBeamHeightFt: 13,
                          tieBeamWidthMm: 150,
                          tieBeamHeightMm: 450,
                          extensionFeet: 8.0,
                          extensionColumnCount: 2,
                          extensionColumnWidthMm: 150,
                          extensionColumnDepthMm: 200,
                        }),
                        removeCenterColumns: true,
                        mainColumnCount: 12,
                        mainBeamElevationMm: 5761,
                        mainBeamWidthMm: 450,
                        mainBeamDepthMm: 900,
                        mainBeamHeightFt: 18.9,
                        showMainBeams: true,
                      };
                      // Clean any center pillars from items
                      const cleanItems = items.filter((it) => it.modelType !== 'masjid-pillar');
                      onUpdateItems(cleanItems);
                      onUpdateConfig({
                        ...roomConfig,
                        wallHeightMeters: 5.761,
                        masjidConfig: updatedMCfg,
                      });
                      showToast('Applied Clear-Span Hall: Center columns removed. Beams 450×900mm resting on outer columns at 5761mm.');
                      onClose();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Apply Clear-Span Hall (Center Columns Removed • 450×900mm Beams @ 5761mm)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM GRID MAKER */}
          {activeTab === 'custom-grid' && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-2xl">
                <h3 className="text-sm font-semibold text-white mb-1">
                  Custom Structural Grid Dimensions
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Specify number of bays and span spacing. Columns will be systematically labeled C1..Cn and Beams B1..Bn.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Bays in X (Lines A, B...)</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={baysX}
                      onChange={(e) => setBaysX(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">{baysX + 1} Grid Lines</span>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Bays in Y (Lines 1, 2...)</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={baysY}
                      onChange={(e) => setBaysY(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">{baysY + 1} Grid Lines</span>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Bay Span X ({isImperial ? 'ft' : 'm'})</label>
                    <input
                      type="number"
                      step={0.5}
                      min={3}
                      max={20}
                      value={isImperial ? +(spacingX * m2ft).toFixed(1) : spacingX}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 6.0;
                        setSpacingX(isImperial ? +(val / m2ft).toFixed(2) : val);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Total: {toDisplayUnit(baysX * spacingX)}</span>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Bay Span Y ({isImperial ? 'ft' : 'm'})</label>
                    <input
                      type="number"
                      step={0.5}
                      min={3}
                      max={20}
                      value={isImperial ? +(spacingY * m2ft).toFixed(1) : spacingY}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 6.0;
                        setSpacingY(isImperial ? +(val / m2ft).toFixed(2) : val);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Total: {toDisplayUnit(baysY * spacingY)}</span>
                  </div>
                </div>
              </div>

              {/* Profiles & Members */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Column Profile */}
                <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-2xl space-y-3">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <Columns className="w-4 h-4 text-blue-400" />
                    <span>Column Profile (C1, C2...)</span>
                  </h4>
                  <div>
                    <label className="text-slate-400 block mb-1">Column Geometry & Section</label>
                    <select
                      value={columnProfile}
                      onChange={(e) => setColumnProfile(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="square-concrete">Square Concrete (450 × 450 mm)</option>
                      <option value="rect-concrete">Heavy Concrete (650 × 900 mm)</option>
                      <option value="steel-h">Wide-Flange Steel H-Column (350 × 350 mm)</option>
                      <option value="round-concrete">Round Architectural Pillar (Ø450 mm)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Column Clear Height</label>
                    <input
                      type="number"
                      step={0.2}
                      min={2.4}
                      max={12.0}
                      value={isImperial ? +(columnHeight * m2ft).toFixed(1) : columnHeight}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 3.5;
                        setColumnHeight(isImperial ? +(val / m2ft).toFixed(2) : val);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>

                {/* Beam Profile */}
                <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-2xl space-y-3">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Beam Profile (B1, B2...)</span>
                  </h4>
                  <div>
                    <label className="text-slate-400 block mb-1">Beam Section & Material</label>
                    <select
                      value={beamProfile}
                      onChange={(e) => setBeamProfile(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="concrete">Reinforced Concrete Beam (300 × 600 mm)</option>
                      <option value="steel">AISC Wide-Flange Steel I-Beam (250 × 450 mm)</option>
                      <option value="timber">Exposed Timber Glulam Beam (240 × 300 mm)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Beam Elevation (Above Floor)</label>
                    <input
                      type="number"
                      step={0.2}
                      min={2.4}
                      max={12.0}
                      value={isImperial ? +(beamElevation * m2ft).toFixed(1) : beamElevation}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 3.5;
                        setBeamElevation(isImperial ? +(val / m2ft).toFixed(2) : val);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-4 p-4 bg-slate-800/30 border border-slate-700/50 rounded-2xl text-xs">
                <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeBeams}
                    onChange={(e) => setIncludeBeams(e.target.checked)}
                    className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-900 w-4 h-4"
                  />
                  <span>Auto-connect columns with beams (B1, B2...)</span>
                </label>

                <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resizeRoomWalls}
                    onChange={(e) => setResizeRoomWalls(e.target.checked)}
                    className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-900 w-4 h-4"
                  />
                  <span>Auto-resize room perimeter walls to enclose grid</span>
                </label>
              </div>

              {/* Summary & Apply Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-blue-950/40 border border-blue-800/50 rounded-2xl">
                <div className="text-xs text-slate-300">
                  <span className="font-bold text-white block text-sm">
                    Total: {(baysX + 1) * (baysY + 1)} Columns (C1–C{(baysX + 1) * (baysY + 1)})
                  </span>
                  <span>
                    Footprint: {toDisplayUnit(baysX * spacingX)} × {toDisplayUnit(baysY * spacingY)}
                    {includeBeams ? ` • ${baysX * (baysY + 1) + baysY * (baysX + 1)} Beams (B1..Bn)` : ''}
                  </span>
                </div>
                <button
                  onClick={() =>
                    generateGrid(
                      baysX,
                      baysY,
                      spacingX,
                      spacingY,
                      columnProfile,
                      columnHeight,
                      beamProfile,
                      beamElevation,
                      includeBeams,
                      resizeRoomWalls,
                      'Custom Office Grid'
                    )
                  }
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>Generate Custom Grid & Framing</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: COLUMNS SCHEDULE & EASY EDITING */}
          {activeTab === 'columns-list' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Live Columns Schedule ({structuralColumns.length} Total)
                  </h3>
                  <p className="text-xs text-slate-400">
                    All structural columns with designated C1, C2, C3... badges. Edit names, profiles, or resequence.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRenumberColumns}
                    className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Automatically renumber all columns sequentially as C1, C2, C3..."
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Renumber as C1, C2...</span>
                  </button>

                  <button
                    onClick={handleClearAllColumns}
                    className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Delete all columns"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                </div>
              </div>

              {structuralColumns.length === 0 ? (
                <div className="p-8 text-center bg-slate-800/30 border border-slate-800 rounded-2xl">
                  <Columns className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">No Structural Columns in Project</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Use the Fast Office Presets or Custom Grid Maker to automatically generate columns.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl bg-slate-800/30 overflow-hidden max-h-[420px] overflow-y-auto">
                  {structuralColumns.map((col, idx) => {
                    const tag = col.customData?.structuralId || `C${idx + 1}`;
                    const coord = col.customData?.gridCoordinate || 'Grid Point';

                    return (
                      <div
                        key={col.id}
                        className="flex items-center justify-between p-3 hover:bg-slate-800/60 transition-colors text-xs"
                      >
                        <div className="flex items-center gap-3">
                          {/* Column Badge C1, C2... */}
                          <div className="px-2.5 py-1 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-300 font-mono font-bold text-xs flex items-center gap-1 shadow-sm">
                            <Columns className="w-3 h-3 text-blue-400" />
                            <span>{tag}</span>
                          </div>

                          <div>
                            <span className="font-semibold text-white block">{col.name}</span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                              <span>Grid: {coord}</span>
                              <span>•</span>
                              <span>
                                X: {col.position[0].toFixed(2)}m, Z: {col.position[2].toFixed(2)}m
                              </span>
                              <span>•</span>
                              <span>
                                {col.dimensions.width.toFixed(2)} × {col.dimensions.depth.toFixed(2)}m
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (onSelectItemId) onSelectItemId(col.id);
                              onClose();
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Focus column in 3D scene"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(col.id, tag)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors"
                            title="Delete column"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BEAMS SCHEDULE & EASY EDITING */}
          {activeTab === 'beams-list' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Live Beams Schedule ({structuralBeams.length} Total)
                  </h3>
                  <p className="text-xs text-slate-400">
                    All framing beams with designated B1, B2, B3... badges connecting column bays.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRenumberBeams}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Automatically renumber all beams sequentially as B1, B2, B3..."
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Renumber as B1, B2...</span>
                  </button>

                  <button
                    onClick={handleClearAllBeams}
                    className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Delete all beams"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                </div>
              </div>

              {/* Manual Beam Connector Tool */}
              <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-2xl">
                <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-blue-400" />
                  <span>Connect Beam Between Columns</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">From Column</label>
                    <select
                      value={connectColA}
                      onChange={(e) => setConnectColA(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                    >
                      <option value="">Select Start Column...</option>
                      {structuralColumns.map((col, idx) => {
                        const tag = col.customData?.structuralId || `C${idx + 1}`;
                        return (
                          <option key={col.id} value={col.id}>
                            {tag} ({col.name})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">To Column</label>
                    <select
                      value={connectColB}
                      onChange={(e) => setConnectColB(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                    >
                      <option value="">Select End Column...</option>
                      {structuralColumns.map((col, idx) => {
                        const tag = col.customData?.structuralId || `C${idx + 1}`;
                        return (
                          <option key={col.id} value={col.id}>
                            {tag} ({col.name})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={handleConnectBeamBetween}
                      className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/20"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Beam (B{structuralBeams.length + 1})</span>
                    </button>
                  </div>
                </div>
              </div>

              {structuralBeams.length === 0 ? (
                <div className="p-8 text-center bg-slate-800/30 border border-slate-800 rounded-2xl">
                  <Layers className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">No Structural Beams in Project</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Generate an office grid or pick two columns above to connect with a beam.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl bg-slate-800/30 overflow-hidden max-h-[380px] overflow-y-auto">
                  {structuralBeams.map((beam, idx) => {
                    const tag = beam.customData?.structuralId || `B${idx + 1}`;
                    const conn = beam.customData?.connectedColumns?.join(' ➜ ') || 'Framing Span';
                    const spanLen = beam.dimensions.width;

                    return (
                      <div
                        key={beam.id}
                        className="flex items-center justify-between p-3 hover:bg-slate-800/60 transition-colors text-xs"
                      >
                        <div className="flex items-center gap-3">
                          {/* Beam Badge B1, B2... */}
                          <div className="px-2.5 py-1 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs flex items-center gap-1 shadow-sm">
                            <Layers className="w-3 h-3 text-emerald-400" />
                            <span>{tag}</span>
                          </div>

                          <div>
                            <span className="font-semibold text-white block">{beam.name}</span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                              <span>Span: {conn}</span>
                              <span>•</span>
                              <span>Length: {toDisplayUnit(spanLen)}</span>
                              <span>•</span>
                              <span>Elev: {toDisplayUnit(beam.position[1])}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (onSelectItemId) onSelectItemId(beam.id);
                              onClose();
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Focus beam in 3D scene"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(beam.id, tag)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors"
                            title="Delete beam"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 text-xs">
          <div className="flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span>Columns: C1..C{structuralColumns.length}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Beams: B1..B{structuralBeams.length}</span>
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
