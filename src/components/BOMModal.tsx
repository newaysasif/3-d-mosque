import React from 'react';
import { PlacedFurnitureItem, RoomConfig } from '../types';
import {
  X,
  FileSpreadsheet,
  Download,
  Printer,
  DollarSign,
  Package,
} from 'lucide-react';

interface BOMModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: PlacedFurnitureItem[];
  roomConfig: RoomConfig;
}

export const BOMModal: React.FC<BOMModalProps> = ({
  isOpen,
  onClose,
  items,
  roomConfig,
}) => {
  if (!isOpen) return null;

  const totalBudget = items.reduce((sum, item) => sum + item.price, 0);

  // Group items by category
  const categoryCounts = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleExportCSV = () => {
    const headers = ['Item Name', 'Category', 'Dimensions (WxDxH m)', 'Position (X, Z m)', 'Finish Hex', 'Unit Price (USD)'];
    const rows = items.map((item) => [
      `"${item.name}"`,
      item.category,
      `"${item.dimensions.width} x ${item.dimensions.depth} x ${item.dimensions.height}"`,
      `"${item.position[0].toFixed(2)}, ${item.position[2].toFixed(2)}"`,
      item.color,
      item.price,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `interior_design_BOM_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        id="bom-modal"
        className="w-full max-w-4xl bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Specifications & Bill of Materials (BOM)
              </h2>
              <p className="text-xs text-slate-400">
                Itemized specification schedule, metric dimensions, finishes, and budget breakdown
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

        {/* Summary Metric Cards */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/40 grid grid-cols-3 gap-4">
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 block mb-1 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-blue-400" /> Total Items Placed
            </span>
            <span className="text-xl font-bold font-mono text-white">{items.length} units</span>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 block mb-1 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Estimated Furniture Budget
            </span>
            <span className="text-xl font-bold font-mono text-emerald-400">
              ${totalBudget.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 block mb-1">Room Footprint</span>
            <span className="text-xl font-bold font-mono text-slate-200">
              {(roomConfig.width * roomConfig.length).toFixed(1)} m²
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              ({roomConfig.width}m × {roomConfig.length}m × {roomConfig.height}m)
            </span>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="pb-3 pl-2">Item</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Dimensions (W×D×H)</th>
                <th className="pb-3">Finish</th>
                <th className="pb-3">Position</th>
                <th className="pb-3 pr-2 text-right">Est. Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {items.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 pl-2 font-medium">
                    <span className="text-slate-400 font-mono mr-2">{index + 1}.</span>
                    {item.name}
                  </td>
                  <td className="py-3">
                    <span className="uppercase text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-slate-400">
                    {item.dimensions.width} × {item.dimensions.depth} × {item.dimensions.height}m
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full border border-slate-600 inline-block shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-mono text-[11px] text-slate-400">{item.color}</span>
                    </div>
                  </td>
                  <td className="py-3 font-mono text-slate-400">
                    [{item.position[0].toFixed(2)}, {item.position[2].toFixed(2)}]
                  </td>
                  <td className="py-3 pr-2 text-right font-mono font-semibold text-emerald-400">
                    ${item.price.toLocaleString()}
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No furniture items placed in the room yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with CSV Export & Print */}
        <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Prices are estimates based on standard trade catalog specs.
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="py-2 px-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" /> Print Spec Sheet
            </button>
            <button
              onClick={handleExportCSV}
              className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-lg hover:shadow-emerald-500/25 flex items-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
