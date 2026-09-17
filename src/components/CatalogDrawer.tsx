import React, { useState, useMemo } from 'react';
import { FurnitureCategory, FurnitureCatalogItem } from '../types';
import { FURNITURE_CATALOG } from '../engine/catalogData';
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sofa,
  Bed,
  Utensils,
  Briefcase,
  Sparkles,
  LayoutGrid,
  DoorClosed,
  FolderOpen,
  Compass,
  Move,
  Sliders,
  Layers,
} from 'lucide-react';

interface CatalogDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  onAddItem: (catalogItem: FurnitureCatalogItem) => void;
  onOpenPlacementOptions?: (item: FurnitureCatalogItem) => void;
  onStartMoveWithCursor?: (item: FurnitureCatalogItem) => void;
  onOpenFolderPicker?: () => void;
  onOpenArchitecturalTools?: () => void;
  onOpenWallManager?: () => void;
}

export const CatalogDrawer: React.FC<CatalogDrawerProps> = ({
  isOpen,
  onToggle,
  onAddItem,
  onOpenPlacementOptions,
  onStartMoveWithCursor,
  onOpenFolderPicker,
  onOpenArchitecturalTools,
  onOpenWallManager,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FurnitureCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories: { id: FurnitureCategory | 'all'; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'all', label: 'All', icon: LayoutGrid },
    { id: 'masjid', label: 'Masjid & Mehrab', icon: Compass },
    { id: 'architectural', label: 'Doors & Windows', icon: DoorClosed },
    { id: 'living', label: 'Living', icon: Sofa },
    { id: 'bedroom', label: 'Bedroom', icon: Bed },
    { id: 'dining', label: 'Dining', icon: Utensils },
    { id: 'office', label: 'Office', icon: Briefcase },
    { id: 'decor', label: 'Decor', icon: Sparkles },
    { id: 'custom', label: 'Custom', icon: FolderOpen },
  ];

  const filteredItems = useMemo(() => {
    return FURNITURE_CATALOG.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div
      id="catalog-drawer"
      className={`fixed top-14 bottom-0 left-0 z-30 transition-all duration-300 ease-in-out flex ${
        isOpen ? 'w-84 sm:w-96' : 'w-0'
      }`}
    >
      {/* Main Drawer Container */}
      <div
        className={`w-full h-full bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 flex flex-col overflow-hidden shadow-2xl transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Top Header & Search */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-slate-100 flex items-center gap-2">
              <Sofa className="w-4 h-4 text-blue-400" /> Furniture & Decor
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              {filteredItems.length} items
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search couches, beds, lamps, decor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Walls & Structural Shortcut */}
          {onOpenWallManager && (
            <button
              onClick={onOpenWallManager}
              className="w-full mt-2 py-2 px-3 rounded-xl bg-amber-600/15 hover:bg-amber-600/25 border border-amber-500/35 text-amber-300 flex items-center justify-between text-xs font-semibold transition-all shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Make, Remove & Resize Walls / Columns</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200">
                CAD
              </span>
            </button>
          )}
        </div>

        {/* Scrollable Item Grid */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group p-3 bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/60 hover:border-blue-500/50 rounded-xl transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                      {item.category}
                    </span>
                    <span className="text-xs font-semibold text-emerald-400">
                      ${item.price.toLocaleString()}
                    </span>
                  </div>
                  <h4 className="text-xs font-medium text-slate-100 group-hover:text-blue-300 transition-colors truncate">
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Quick Add Button */}
                <button
                  onClick={() => onAddItem(item)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg shadow transition-all flex items-center justify-center shrink-0"
                  title="Quick add at center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Dimensions & Color swatches preview */}
              <div className="mt-2 pt-2 border-t border-slate-700/40 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono text-slate-300">
                  {item.dimensions.width} × {item.dimensions.depth} × {item.dimensions.height}m
                </span>
                <div className="flex items-center gap-1">
                  {item.colorOptions.slice(0, 4).map((c) => (
                    <span
                      key={c}
                      className="w-2.5 h-2.5 rounded-full border border-slate-600 inline-block"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  {item.colorOptions.length > 4 && (
                    <span className="text-[9px] text-slate-500">+{item.colorOptions.length - 4}</span>
                  )}
                </div>
              </div>

              {/* Both Placement & Size Options Buttons */}
              <div className="mt-2.5 grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-800/80">
                <button
                  onClick={() => {
                    if (onStartMoveWithCursor) {
                      onStartMoveWithCursor(item);
                    } else if (onOpenPlacementOptions) {
                      onOpenPlacementOptions(item);
                    } else {
                      onAddItem(item);
                    }
                  }}
                  className="py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/20 transition-all"
                  title="Move with cursor and click anywhere on the floor to place"
                >
                  <Move className="w-3 h-3" />
                  Move Cursor
                </button>

                <button
                  onClick={() => {
                    if (onOpenPlacementOptions) {
                      onOpenPlacementOptions(item);
                    } else {
                      onAddItem(item);
                    }
                  }}
                  className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all"
                  title="Choose custom size, presets, and coordinates"
                >
                  <Sliders className="w-3 h-3 text-emerald-400" />
                  Sizes & Mode
                </button>
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              No matching furniture found. Try searching for something else.
            </div>
          )}
        </div>

        {/* Quick Architectural & Import Shortcuts */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex flex-col gap-2">
          {onOpenArchitecturalTools && (
            <button
              onClick={onOpenArchitecturalTools}
              className="w-full py-2 px-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <DoorClosed className="w-3.5 h-3.5" />
              Open Doors & Windows Builder
            </button>
          )}
          {onOpenFolderPicker && (
            <button
              onClick={onOpenFolderPicker}
              className="w-full py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Pick Products from Local Folder
            </button>
          )}
        </div>
      </div>

      {/* Toggle Tab Attached to Edge */}
      <button
        id="catalog-toggle-btn"
        onClick={onToggle}
        className="self-center -ml-px py-3 px-1 bg-slate-900 border border-l-0 border-slate-700 text-slate-300 hover:text-white rounded-r-lg shadow-lg hover:bg-slate-800 transition-colors"
        title={isOpen ? 'Collapse library' : 'Open furniture library'}
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
    </div>
  );
};
