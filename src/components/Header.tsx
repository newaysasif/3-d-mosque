import React, { useRef } from 'react';
import { CameraMode, LightingEnv } from '../types';
import {
  Box,
  Square,
  Footprints,
  Sun,
  Sunset,
  Moon,
  SlidersHorizontal,
  LayoutTemplate,
  Sparkles,
  FileSpreadsheet,
  Camera,
  Undo2,
  Redo2,
  Save,
  Upload,
  Layers,
  DoorClosed,
  FolderOpen,
  PenTool,
  Grid,
  Image as ImageIcon,
} from 'lucide-react';

interface HeaderProps {
  cameraMode: CameraMode;
  onSelectCameraMode: (mode: CameraMode) => void;
  lightingEnv: LightingEnv;
  onSelectLightingEnv: (env: LightingEnv) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenRoomSettings: () => void;
  onOpenWallManager?: () => void;
  onOpenOfficeGrid?: () => void;
  onOpenImagePaster?: () => void;
  onOpenDrawWall?: () => void;
  onOpenTemplates: () => void;
  onOpenAIStylist: () => void;
  onOpenBOM: () => void;
  onOpenArchitecturalTools: () => void;
  onOpenFolderPicker: () => void;
  onCapturePhotoRender: () => void;
  // Project Management props
  activeProjectName: string;
  onOpenProjectManager: (tab?: 'open' | 'new' | 'saveAs') => void;
  onSaveProject: () => void;
  isProjectSaved?: boolean;
  onLoadProject: (file: File) => void;
  // CAD Drawing Tools props
  isCADDrawingActive: boolean;
  onToggleCADDrawing: () => void;
  onGenerate3D?: () => void;
  onSwitchTo2DSketch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cameraMode,
  onSelectCameraMode,
  lightingEnv,
  onSelectLightingEnv,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenRoomSettings,
  onOpenWallManager,
  onOpenOfficeGrid,
  onOpenImagePaster,
  onOpenDrawWall,
  onOpenTemplates,
  onOpenAIStylist,
  onOpenBOM,
  onOpenArchitecturalTools,
  onOpenFolderPicker,
  onCapturePhotoRender,
  activeProjectName,
  onOpenProjectManager,
  onSaveProject,
  isProjectSaved,
  onLoadProject,
  isCADDrawingActive,
  onToggleCADDrawing,
  onGenerate3D,
  onSwitchTo2DSketch,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onLoadProject(e.target.files[0]);
    }
  };

  return (
    <header
      id="studio-header"
      className="h-14 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between text-slate-100 z-40 relative gap-2"
    >
      {/* Left: Brand + Project Controls (New, Open, Save) */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shrink-0">
          <Layers className="w-4 h-4 text-white" />
        </div>

        {/* Active Project Title Pill */}
        <div
          onClick={() => onOpenProjectManager('open')}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 hover:border-slate-600 rounded-xl cursor-pointer transition-all max-w-[200px]"
          title="Click to manage projects"
        >
          <FolderOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="text-xs font-medium text-slate-200 truncate">
            {activeProjectName}
          </span>
        </div>

        {/* Project New / Open / Save Actions */}
        <div className="flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/70">
          <button
            onClick={() => onOpenProjectManager('new')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors"
            title="Create a new interior design project"
          >
            <span className="text-blue-400 font-bold">+</span>
            <span>New</span>
          </button>

          <button
            onClick={() => onOpenProjectManager('open')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors"
            title="Open an existing project from workspace"
          >
            <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Open</span>
          </button>

          <button
            onClick={onSaveProject}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              isProjectSaved
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/80'
            }`}
            title="Save project changes (Ctrl+S)"
          >
            <Save className={`w-3.5 h-3.5 ${isProjectSaved ? 'text-emerald-400' : 'text-blue-400'}`} />
            <span>{isProjectSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Center Controls: Two Core Functions (1: 2D Sketch/Draw like Coohom, 2: 3D View/Walkthrough) */}
      <div className="flex items-center gap-2">
        {/* Function Switcher Container */}
        <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 shadow-inner">
          {/* Function 1: 2D Sketch & Draw */}
          <button
            onClick={() => {
              if (onSwitchTo2DSketch) {
                onSwitchTo2DSketch();
              } else {
                onSelectCameraMode('2d-plan');
                if (!isCADDrawingActive) onToggleCADDrawing();
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              cameraMode === '2d-plan'
                ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
            title="Function 1: 2D Architectural Sketching (Draw Walls, Columns & Rooms like Coohom)"
          >
            <PenTool className="w-3.5 h-3.5 text-blue-300" />
            <span>2D Sketch & Draw</span>
          </button>

          {/* Function 2: 3D View & Walkthrough */}
          <button
            onClick={() => {
              if (cameraMode === '2d-plan') {
                if (onGenerate3D) onGenerate3D();
                else onSelectCameraMode('3d-orbit');
              } else {
                onSelectCameraMode('3d-orbit');
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              cameraMode !== '2d-plan'
                ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
            title="Function 2: 3D Model & Walkthrough"
          >
            <Box className="w-3.5 h-3.5 text-cyan-300" />
            <span>3D View</span>
          </button>
        </div>

        {/* Dynamic Action Button depending on Mode */}
        {cameraMode === '2d-plan' ? (
          <button
            onClick={onGenerate3D}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-md shadow-emerald-500/25 transition-all"
            title="Make 3D Model from your 2D sketch!"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Generate 3D</span>
          </button>
        ) : (
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/70 shadow-inner">
            <button
              onClick={() => onSelectCameraMode('3d-orbit')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                cameraMode === '3d-orbit'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="3D Orbit Perspective"
            >
              Orbit
            </button>
            <button
              onClick={() => onSelectCameraMode('walkthrough')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                cameraMode === 'walkthrough'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="First-Person Walkthrough"
            >
              <Footprints className="w-3 h-3" />
              <span>Walk</span>
            </button>
          </div>
        )}

        {/* Dynamic Lighting Environments */}
        <div className="hidden xl:flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/70 shadow-inner">
          <button
            onClick={() => onSelectLightingEnv('daylight')}
            className={`p-1.5 rounded-lg transition-all ${
              lightingEnv === 'daylight'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Natural Daylight"
          >
            <Sun className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSelectLightingEnv('golden-hour')}
            className={`p-1.5 rounded-lg transition-all ${
              lightingEnv === 'golden-hour'
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Golden Hour Sunset"
          >
            <Sunset className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSelectLightingEnv('evening')}
            className={`p-1.5 rounded-lg transition-all ${
              lightingEnv === 'evening'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Cozy Evening (Warm Indoor Spotlights & Lamp Glow)"
          >
            <Moon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right Toolbar Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/70">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Room & Finishes Customizer */}
        <button
          onClick={onOpenRoomSettings}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/70 text-slate-200 hover:text-white transition-colors"
          title="Room Architecture & Finishes"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        {/* Draw & Build Walls */}
        <button
          onClick={onOpenDrawWall || onOpenWallManager}
          className="px-2.5 py-1.5 rounded-xl bg-amber-600/25 hover:bg-amber-600/40 border border-amber-500/50 text-amber-200 flex items-center gap-1.5 text-xs font-semibold shadow-sm transition-all"
          title="Draw & Build Walls: Parametric builder, interactive 2D sketch, custom thickness, height, and luxury travertine/walnut materials"
        >
          <PenTool className="w-3.5 h-3.5 text-amber-300" />
          <span className="hidden sm:inline">Draw/Build Walls</span>
        </button>

        {/* Interior Image & Artwork Decal Paster */}
        {onOpenImagePaster && (
          <button
            onClick={onOpenImagePaster}
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600/30 to-yellow-600/25 hover:from-amber-600/45 hover:to-yellow-600/40 border border-amber-400/50 text-amber-200 flex items-center gap-1.5 text-xs font-semibold shadow-sm transition-all"
            title="Paste Images, Artwork, and Calligraphy onto Interior Walls (Supports Ctrl+V from clipboard!)"
          >
            <ImageIcon className="w-3.5 h-3.5 text-yellow-300" />
            <span className="hidden md:inline">Paste Image</span>
            <span className="hidden lg:inline text-[10px] px-1 py-0.2 rounded bg-amber-500/30 text-amber-200 font-mono font-bold">
              Ctrl+V
            </span>
          </button>
        )}

        {/* Walls & Columns Manager */}
        {onOpenWallManager && (
          <button
            onClick={onOpenWallManager}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 flex items-center gap-1.5 text-xs font-semibold shadow-sm transition-all"
            title="Wall Sizes, Visibility & 26-Column Structural Grid"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Wall Settings</span>
          </button>
        )}

        {/* Office Structural Grid & Framing (C1, C2... & B1, B2...) */}
        {onOpenOfficeGrid && (
          <button
            id="header-btn-columns-beams"
            onClick={onOpenOfficeGrid}
            className="px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/60 text-blue-200 flex items-center gap-1.5 text-xs font-semibold shadow-md ring-1 ring-blue-500/20 transition-all active:scale-95"
            title="Columns & Beams Manager: Edit, Add, Resize, or Renumber C1, C2... Columns and B1, B2... Beams"
          >
            <Grid className="w-3.5 h-3.5 text-blue-300 animate-pulse" />
            <span>Columns & Beams</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/40 text-blue-100 font-mono font-bold border border-blue-400/30">
              C1/B1
            </span>
          </button>
        )}

        {/* Templates */}
        <button
          onClick={onOpenTemplates}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/70 text-slate-200 hover:text-white transition-colors"
          title="Designer Layout Templates"
        >
          <LayoutTemplate className="w-4 h-4" />
        </button>

        {/* Folder Product Picker */}
        <button
          onClick={onOpenFolderPicker}
          className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 flex items-center gap-1.5 text-xs font-medium transition-colors"
          title="Pick Products from Folder & Place in 3D Scene"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Folder Picker</span>
        </button>

        {/* AI Stylist */}
        <button
          onClick={onOpenAIStylist}
          className="px-2.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 flex items-center gap-1.5 text-xs font-medium transition-colors"
          title="AI Stylist & Spatial Design Advisor"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden md:inline">AI Stylist</span>
        </button>

        {/* Bill of Materials (BOM) */}
        <button
          onClick={onOpenBOM}
          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/70 text-slate-200 flex items-center gap-1.5 text-xs font-medium transition-colors"
          title="Bill of Materials & Furniture Budget"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden lg:inline">BOM</span>
        </button>

        {/* High-Res Photo Render */}
        <button
          onClick={onCapturePhotoRender}
          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md hover:shadow-blue-500/25 flex items-center gap-1.5 transition-all"
          title="Export High-Resolution Photo Render"
        >
          <Camera className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Render</span>
        </button>

        {/* Import JSON File Input (Hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </header>
  );
};
