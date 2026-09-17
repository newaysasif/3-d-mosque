import React, { useState, useRef } from 'react';
import { SavedProject, RoomConfig, PlacedFurnitureItem, LightingEnv } from '../types';
import {
  FolderOpen,
  Plus,
  Copy,
  Trash2,
  Download,
  Upload,
  Check,
  X,
  Calendar,
  Layers,
  Sparkles,
  Pencil,
  Search,
  Maximize2,
} from 'lucide-react';
import {
  createNewProject,
  duplicateProject,
  exportProjectAsJSON,
} from '../engine/projectStorage';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProjectId: string;
  projects: SavedProject[];
  onSelectProject: (project: SavedProject) => void;
  onCreateProject: (newProject: SavedProject) => void;
  onUpdateProjectsList: (updatedList: SavedProject[]) => void;
  currentRoomConfig: RoomConfig;
  currentItems: PlacedFurnitureItem[];
  currentLightingEnv: LightingEnv;
  onSaveCurrentProject: () => void;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  activeProjectId,
  projects,
  onSelectProject,
  onCreateProject,
  onUpdateProjectsList,
  currentRoomConfig,
  currentItems,
  currentLightingEnv,
  onSaveCurrentProject,
}) => {
  const [activeTab, setActiveTab] = useState<'open' | 'new' | 'saveAs'>('open');
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // New Project Form State
  const [newName, setNewName] = useState('');
  const [newPreset, setNewPreset] = useState<'empty' | 'nordic' | 'loft' | 'bedroom'>('empty');
  const [newWidth, setNewWidth] = useState(6.5);
  const [newLength, setNewLength] = useState(5.5);
  const [newHeight, setNewHeight] = useState(2.8);

  // Save As State
  const [saveAsName, setSaveAsName] = useState('');

  const importFileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Filter projects by query
  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleStartRename = (project: SavedProject, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(project.id);
    setRenameValue(project.name);
  };

  const handleConfirmRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!renameValue.trim()) return;
    const updated = projects.map((p) =>
      p.id === id ? { ...p, name: renameValue.trim(), updatedAt: new Date().toISOString() } : p
    );
    onUpdateProjectsList(updated);
    setRenamingId(null);
  };

  const handleDuplicate = (project: SavedProject, e: React.MouseEvent) => {
    e.stopPropagation();
    const cloned = duplicateProject(project);
    const updated = [cloned, ...projects];
    onUpdateProjectsList(updated);
  };

  const handleDelete = (project: SavedProject, e: React.MouseEvent) => {
    e.stopPropagation();
    if (projects.length <= 1) {
      alert('You must keep at least one project in your studio workspace.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete project "${project.name}"?`)) {
      const remaining = projects.filter((p) => p.id !== project.id);
      onUpdateProjectsList(remaining);
      if (project.id === activeProjectId) {
        onSelectProject(remaining[0]);
      }
    }
  };

  const handleExportJSON = (project: SavedProject, e: React.MouseEvent) => {
    e.stopPropagation();
    exportProjectAsJSON(project);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCurrentProject(); // Ensure active project changes are preserved
    const created = createNewProject(newName || 'My Interior Project', newPreset, {
      width: newWidth,
      length: newLength,
      height: newHeight,
    });
    onCreateProject(created);
    onClose();
  };

  const handleSaveAsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveAsName.trim()) return;
    const now = new Date().toISOString();
    const newProject: SavedProject = {
      id: `project-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: saveAsName.trim(),
      createdAt: now,
      updatedAt: now,
      roomConfig: currentRoomConfig,
      items: currentItems.map((it) => ({
        ...it,
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      })),
      lightingEnv: currentLightingEnv,
    };
    onCreateProject(newProject);
    onClose();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content);
          if (parsed.roomConfig && Array.isArray(parsed.items)) {
            const imported: SavedProject = {
              id: parsed.id || `project-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              name: parsed.name || file.name.replace(/\.json$/i, ''),
              description: parsed.description || 'Imported project file',
              createdAt: parsed.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              roomConfig: parsed.roomConfig,
              items: parsed.items,
              lightingEnv: parsed.lightingEnv || 'daylight',
              thumbnail: parsed.thumbnail,
            };
            const updated = [imported, ...projects.filter((p) => p.id !== imported.id)];
            onUpdateProjectsList(updated);
            onSelectProject(imported);
            onClose();
          } else {
            alert('The selected file does not appear to be a valid interior design project.');
          }
        } catch (err) {
          alert('Failed to read project JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white">
                Project Manager
              </h2>
              <p className="text-xs text-slate-400">
                Manage, open, switch, and save multiple interior design projects
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveTab('open')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'open'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Open Projects ({projects.length})
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                activeTab === 'new'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              New Project
            </button>
            <button
              onClick={() => {
                setActiveTab('saveAs');
                const active = projects.find((p) => p.id === activeProjectId);
                setSaveAsName(active ? `${active.name} - Version 2` : 'New Project Version');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'saveAs'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Save As Copy
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab 1: Open Projects List */}
        {activeTab === 'open' && (
          <div className="flex-1 overflow-hidden flex flex-col p-5">
            {/* Search & Actions Bar */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search saved projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => importFileRef.current?.click()}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700/90 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Import project from .json file"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  Import JSON
                </button>
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />

                <button
                  onClick={() => setActiveTab('new')}
                  className="py-2 px-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create New
                </button>
              </div>
            </div>

            {/* Projects Grid */}
            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredProjects.map((proj) => {
                const isActive = proj.id === activeProjectId;
                const isRenaming = renamingId === proj.id;
                const dateStr = new Date(proj.updatedAt || proj.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={proj.id}
                    onClick={() => {
                      if (!isRenaming) {
                        onSelectProject(proj);
                        onClose();
                      }
                    }}
                    className={`group relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isActive
                        ? 'bg-blue-950/30 border-blue-500/50 shadow-md shadow-blue-500/10'
                        : 'bg-slate-800/40 hover:bg-slate-800/80 border-slate-700/60 hover:border-slate-600'
                    }`}
                  >
                    {/* Top Row: Title & Active Badge */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        {isRenaming ? (
                          <div
                            className="flex items-center gap-1.5 w-full"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              className="px-2 py-1 bg-slate-950 border border-blue-500 rounded text-xs text-white flex-1 focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={(e) => handleConfirmRename(proj.id, e)}
                              className="p-1 bg-blue-600 text-white rounded hover:bg-blue-500"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRenamingId(null);
                              }}
                              className="p-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                              {proj.name}
                            </h3>
                            <button
                              onClick={(e) => handleStartRename(proj, e)}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-200 transition-opacity p-0.5"
                              title="Rename project"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 font-medium text-[10px] shrink-0">
                            Active
                          </span>
                        )}
                      </div>

                      {proj.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                          {proj.description}
                        </p>
                      )}
                    </div>

                    {/* Metadata & Actions */}
                    <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-mono text-slate-300">
                          <Maximize2 className="w-3 h-3 text-slate-500" />
                          {proj.roomConfig?.width || 6}m × {proj.roomConfig?.length || 5}m
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Layers className="w-3 h-3 text-slate-500" />
                          {proj.items?.length || 0} items
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Calendar className="w-3 h-3" />
                          {dateStr}
                        </span>
                      </div>

                      {/* Action Icon Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleDuplicate(proj, e)}
                          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                          title="Duplicate project"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleExportJSON(proj, e)}
                          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                          title="Download project .json"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(proj, e)}
                          disabled={projects.length <= 1}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Delete project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: New Project Creator */}
        {activeTab === 'new' && (
          <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Project Name
              </label>
              <input
                type="text"
                placeholder="e.g., Waterfront Penthouse, Master Bedroom Suite"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Starting Preset */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Starting Setup Preset
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    id: 'empty',
                    label: 'Clean Canvas',
                    desc: 'Empty architectural floor ready for custom drawing',
                    icon: Layers,
                  },
                  {
                    id: 'nordic',
                    label: 'Nordic Living',
                    desc: 'Scandinavian bouclé seating & natural oak',
                    icon: Sparkles,
                  },
                  {
                    id: 'loft',
                    label: 'Industrial Loft',
                    desc: 'Open-concept loft with black steel & brick',
                    icon: Maximize2,
                  },
                  {
                    id: 'bedroom',
                    label: 'Master Bedroom',
                    desc: 'Japandi platform bed with ambient nightstands',
                    icon: FolderOpen,
                  },
                ].map((pre) => {
                  const Icon = pre.icon;
                  const isSelected = newPreset === pre.id;
                  return (
                    <button
                      key={pre.id}
                      type="button"
                      onClick={() => setNewPreset(pre.id as any)}
                      className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/10'
                          : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                      </div>
                      <div>
                        <div className="text-xs font-semibold">{pre.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{pre.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Room Dimensions */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Room Dimensions (Meters)
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-xs text-slate-400 mb-1 block">Width: {newWidth}m</span>
                  <input
                    type="range"
                    min="3.0"
                    max="15.0"
                    step="0.5"
                    value={newWidth}
                    onChange={(e) => setNewWidth(parseFloat(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>
                <div>
                  <span className="text-xs text-slate-400 mb-1 block">Length: {newLength}m</span>
                  <input
                    type="range"
                    min="3.0"
                    max="15.0"
                    step="0.5"
                    value={newLength}
                    onChange={(e) => setNewLength(parseFloat(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>
                <div>
                  <span className="text-xs text-slate-400 mb-1 block">Ceiling Height: {newHeight}m</span>
                  <input
                    type="range"
                    min="2.2"
                    max="5.0"
                    step="0.1"
                    value={newHeight}
                    onChange={(e) => setNewHeight(parseFloat(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60 text-xs text-slate-400">
              Note: Your active project changes will be saved to your project library before opening the new project.
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('open')}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create & Open Project
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Save As Copy */}
        {activeTab === 'saveAs' && (
          <form onSubmit={handleSaveAsSubmit} className="flex-1 p-6 flex flex-col gap-6">
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">
                Save Project As New Copy
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Save your current design layout, room architecture, and finishes under a new project name so you can explore alternative layout versions.
              </p>

              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                New Project Name
              </label>
              <input
                type="text"
                value={saveAsName}
                onChange={(e) => setSaveAsName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-auto">
              <button
                type="button"
                onClick={() => setActiveTab('open')}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                Save New Version
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
