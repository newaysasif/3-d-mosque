import React from 'react';
import {
  AIStyle,
  PlacedFurnitureItem,
  RoomConfig,
  SpatialAuditReport,
} from '../types';
import {
  STYLE_PRESETS,
  applyStyleHarmonizer,
  auditSpatialDesign,
} from '../engine/aiStylist';
import {
  Sparkles,
  X,
  Check,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  TrendingUp,
  Palette,
} from 'lucide-react';

interface AIStylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomConfig: RoomConfig;
  items: PlacedFurnitureItem[];
  onApplyPreset: (
    newConfig: RoomConfig,
    newItems: PlacedFurnitureItem[],
    recommendedLighting: 'daylight' | 'golden-hour' | 'evening'
  ) => void;
}

export const AIStylistModal: React.FC<AIStylistModalProps> = ({
  isOpen,
  onClose,
  roomConfig,
  items,
  onApplyPreset,
}) => {
  if (!isOpen) return null;

  const auditReport: SpatialAuditReport = auditSpatialDesign(roomConfig, items);

  const handleSelectStyle = (styleKey: AIStyle) => {
    const result = applyStyleHarmonizer(styleKey, roomConfig, items);
    onApplyPreset(result.newRoomConfig, result.newItems, result.recommendedLighting);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        id="ai-stylist-modal"
        className="w-full max-w-3xl bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">AI Interior Stylist & Harmonizer</h2>
              <p className="text-xs text-slate-400">
                1-click aesthetic harmonization and intelligent spatial clearance audit
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Spatial Audit Dashboard */}
          <div className="p-4 bg-slate-800/60 border border-slate-700/70 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  Spatial Clearance & Circulation Audit
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  Circulation Rating:{' '}
                  <span
                    className={`font-semibold ${
                      auditReport.circulationRating === 'Optimal'
                        ? 'text-emerald-400'
                        : auditReport.circulationRating === 'Acceptable'
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  >
                    {auditReport.circulationRating}
                  </span>
                </span>
                <span className="text-sm font-bold font-mono text-purple-400 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30">
                  {auditReport.score}/100
                </span>
              </div>
            </div>

            {/* Score Progress Bar */}
            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                style={{ width: `${auditReport.score}%` }}
              />
            </div>

            {/* Warnings or Recommendations List */}
            <div className="space-y-2 pt-1 text-xs">
              {auditReport.clearanceWarnings.length > 0 ? (
                auditReport.clearanceWarnings.map((warn, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-300 flex items-start gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                    <span>{warn}</span>
                  </div>
                ))
              ) : (
                <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>All furniture clearances, walkways, and wall boundaries pass standard architectural ergonomics!</span>
                </div>
              )}

              {/* Lighting and Spatial Advice */}
              {auditReport.lightingTips.map((tip, i) => (
                <div
                  key={`light-${i}`}
                  className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 flex items-start gap-2"
                >
                  <Lightbulb className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  <span>{tip}</span>
                </div>
              ))}

              {auditReport.recommendations.map((rec, i) => (
                <div
                  key={`rec-${i}`}
                  className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 flex items-start gap-2"
                >
                  <TrendingUp className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 1-Click Aesthetic Harmonizers */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-400" /> 1-Click Aesthetic Harmonizers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {(Object.keys(STYLE_PRESETS) as AIStyle[]).map((key) => {
                const preset = STYLE_PRESETS[key];
                return (
                  <div
                    key={key}
                    className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/70 hover:border-purple-500/60 rounded-xl transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="text-sm font-semibold text-white">{preset.name}</h4>
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {preset.recommendedLighting}
                        </span>
                      </div>
                      <p className="text-xs text-purple-300 font-medium mb-1.5 leading-snug">
                        {preset.tagline}
                      </p>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                        {preset.description}
                      </p>

                      {/* Color Palette Chips */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[11px] text-slate-400">Palette:</span>
                        <span
                          className="w-5 h-5 rounded-full border border-slate-600 inline-block shadow-sm"
                          style={{ backgroundColor: preset.palette.primaryUpholstery }}
                          title="Primary Upholstery"
                        />
                        <span
                          className="w-5 h-5 rounded-full border border-slate-600 inline-block shadow-sm"
                          style={{ backgroundColor: preset.palette.woodCasegoods }}
                          title="Timber / Casegoods"
                        />
                        <span
                          className="w-5 h-5 rounded-full border border-slate-600 inline-block shadow-sm"
                          style={{ backgroundColor: preset.palette.leatherOrSecondary }}
                          title="Leather / Accent"
                        />
                        <span
                          className="w-5 h-5 rounded-full border border-slate-600 inline-block shadow-sm"
                          style={{ backgroundColor: preset.accentWallColor }}
                          title="Accent Wall"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectStyle(key)}
                      className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs rounded-lg shadow-md hover:shadow-purple-500/25 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Apply {preset.name}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-800/80 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
