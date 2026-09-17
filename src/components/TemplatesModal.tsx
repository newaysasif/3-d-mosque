import React from 'react';
import { DesignTemplate, PlacedFurnitureItem, RoomConfig } from '../types';
import { DESIGNER_TEMPLATES } from '../engine/designerTemplates';
import { LayoutTemplate, X, ArrowRight, DollarSign, Package } from 'lucide-react';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTemplate: (template: DesignTemplate) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onLoadTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        id="templates-modal"
        className="w-full max-w-3xl bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Designer Templates</h2>
              <p className="text-xs text-slate-400">
                Instantly load pre-configured curated layouts with matching finishes and furnishings
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DESIGNER_TEMPLATES.map((tmpl) => {
            const budget = tmpl.items.reduce((sum, it) => sum + it.price, 0);

            return (
              <div
                key={tmpl.id}
                className="p-5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/70 hover:border-blue-500/60 rounded-2xl transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {tmpl.category}
                    </span>
                    <span className="text-xs text-emerald-400 font-mono font-semibold">
                      ${budget.toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors mb-1.5">
                    {tmpl.name}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {tmpl.description}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-400 pb-3 border-b border-slate-700/60 mb-4">
                    <span className="flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-blue-400" /> {tmpl.items.length} pieces
                    </span>
                    <span>•</span>
                    <span className="font-mono">
                      {tmpl.roomConfig.width}m × {tmpl.roomConfig.length}m
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onLoadTemplate(tmpl);
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow-md hover:shadow-blue-500/25 flex items-center justify-center gap-1.5 transition-all"
                >
                  Load Layout <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
