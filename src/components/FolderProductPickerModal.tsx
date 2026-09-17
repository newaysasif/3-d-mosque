import React, { useState, useRef } from 'react';
import {
  X,
  FolderOpen,
  Upload,
  Plus,
  Trash2,
  Check,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  HelpCircle,
  FileImage,
  Sliders,
} from 'lucide-react';
import {
  ImportedProduct,
  PlacedFurnitureItem,
  FurnitureCategory,
  RoomConfig,
} from '../types';

interface FolderProductPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomConfig: RoomConfig;
  onPlaceProduct: (item: PlacedFurnitureItem) => void;
  onSaveToCatalog?: (product: ImportedProduct) => void;
}

// Curated sample products representing an imported designer furniture folder
const SAMPLE_FOLDER_PRODUCTS: Omit<ImportedProduct, 'id'>[] = [
  {
    name: 'Nordic Bouclé Curved Armchair',
    category: 'living',
    sourceFileName: 'Nordic_Boucle_Armchair.webp',
    imageUrl:
      'https://images.unsplash.com/photo-1580481077195-c9a7566164d9?auto=format&fit=crop&w=600&q=80',
    dimensions: { width: 0.88, depth: 0.85, height: 0.82 },
    defaultColor: '#eae5dc',
    price: 890,
  },
  {
    name: 'Italian Travertine Plinth Coffee Table',
    category: 'living',
    sourceFileName: 'Travertine_Plinth_Table.webp',
    imageUrl:
      'https://images.unsplash.com/photo-1533779283484-84e1b8b80419?auto=format&fit=crop&w=600&q=80',
    dimensions: { width: 1.2, depth: 0.75, height: 0.38 },
    defaultColor: '#ded6c7',
    price: 1250,
  },
  {
    name: 'Fluted White Oak Credenza Console',
    category: 'living',
    sourceFileName: 'Fluted_Oak_Credenza.webp',
    imageUrl:
      'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80',
    dimensions: { width: 1.8, depth: 0.45, height: 0.75 },
    defaultColor: '#c5a57d',
    price: 1420,
  },
  {
    name: 'Sculptural Cast Ceramic Floor Lamp',
    category: 'decor',
    sourceFileName: 'Ceramic_Sculptural_Lamp.webp',
    imageUrl:
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80',
    dimensions: { width: 0.45, depth: 0.45, height: 1.6 },
    defaultColor: '#f3ece2',
    price: 460,
  },
  {
    name: 'Japanese Olive Tree in Terracotta Urn',
    category: 'decor',
    sourceFileName: 'Olive_Tree_Terracotta_Urn.webp',
    imageUrl:
      'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=600&q=80',
    dimensions: { width: 0.7, depth: 0.7, height: 1.85 },
    defaultColor: '#9b5d43',
    price: 320,
  },
  {
    name: 'Solid Walnut Executive Ergonomic Desk',
    category: 'office',
    sourceFileName: 'Solid_Walnut_Desk.webp',
    imageUrl:
      'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=80',
    dimensions: { width: 1.6, depth: 0.8, height: 0.76 },
    defaultColor: '#3d2817',
    price: 1680,
  },
];

export const FolderProductPickerModal: React.FC<FolderProductPickerModalProps> = ({
  isOpen,
  onClose,
  roomConfig,
  onPlaceProduct,
  onSaveToCatalog,
}) => {
  const [importedProducts, setImportedProducts] = useState<ImportedProduct[]>(() => {
    // Initial load from sample folder or empty
    return SAMPLE_FOLDER_PRODUCTS.map((p, index) => ({
      ...p,
      id: `imported-${index + 1}`,
    }));
  });

  const [currentFolderName, setCurrentFolderName] = useState<string>('Designer_Collection_Folder');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    importedProducts[0]?.id || null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [filterCategory, setFilterCategory] = useState<FurnitureCategory | 'all'>('all');

  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Helper to infer product category & dimension heuristics from filename
  const detectProductMetadata = (fileName: string): {
    cleanName: string;
    category: FurnitureCategory;
    dimensions: { width: number; depth: number; height: number };
  } => {
    const base = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    const cleanName = base.charAt(0).toUpperCase() + base.slice(1);
    const lower = base.toLowerCase();

    let category: FurnitureCategory = 'custom';
    let dimensions = { width: 1.0, depth: 0.8, height: 0.85 };

    if (lower.includes('chair') || lower.includes('armchair') || lower.includes('stool')) {
      category = 'living';
      dimensions = { width: 0.8, depth: 0.8, height: 0.85 };
    } else if (lower.includes('sofa') || lower.includes('couch') || lower.includes('sectional')) {
      category = 'living';
      dimensions = { width: 2.2, depth: 0.95, height: 0.82 };
    } else if (lower.includes('table') || lower.includes('coffee') || lower.includes('plinth')) {
      category = 'living';
      dimensions = { width: 1.2, depth: 0.7, height: 0.42 };
    } else if (lower.includes('desk') || lower.includes('office') || lower.includes('workspace')) {
      category = 'office';
      dimensions = { width: 1.5, depth: 0.75, height: 0.76 };
    } else if (lower.includes('bed') || lower.includes('mattress') || lower.includes('headboard')) {
      category = 'bedroom';
      dimensions = { width: 1.9, depth: 2.1, height: 1.1 };
    } else if (lower.includes('lamp') || lower.includes('light') || lower.includes('chandelier')) {
      category = 'decor';
      dimensions = { width: 0.4, depth: 0.4, height: 1.5 };
    } else if (lower.includes('plant') || lower.includes('tree') || lower.includes('vase') || lower.includes('art')) {
      category = 'decor';
      dimensions = { width: 0.5, depth: 0.5, height: 1.4 };
    } else if (lower.includes('door') || lower.includes('window') || lower.includes('divider')) {
      category = 'architectural';
      dimensions = { width: 1.0, depth: 0.15, height: 2.15 };
    }

    return { cleanName, category, dimensions };
  };

  // Process selected files from a folder or file picker
  const processFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    // Detect folder name if available via webkitRelativePath
    const firstRel = (fileArray[0] as any).webkitRelativePath;
    if (firstRel) {
      const folder = firstRel.split('/')[0];
      if (folder) setCurrentFolderName(folder);
    }

    const newItems: ImportedProduct[] = [];

    fileArray.forEach((file) => {
      // Check if it's an image or 3D OBJ file
      const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|svg|gif)$/i.test(file.name);
      const isObj = /\.obj$/i.test(file.name);

      if (!isImage && !isObj) return;

      const { cleanName, category, dimensions } = detectProductMetadata(file.name);

      const reader = new FileReader();
      if (isImage) {
        reader.onload = (e) => {
          const result = e.target?.result as string;
          const product: ImportedProduct = {
            id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: cleanName,
            category,
            sourceFileName: file.name,
            imageUrl: result,
            dimensions,
            defaultColor: '#d4af37',
            price: 450,
          };
          setImportedProducts((prev) => [product, ...prev]);
          setSelectedProductId(product.id);
        };
        reader.readAsDataURL(file);
      } else if (isObj) {
        reader.onload = (e) => {
          const result = e.target?.result as string;
          const product: ImportedProduct = {
            id: `imported-obj-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: cleanName + ' (3D OBJ)',
            category,
            sourceFileName: file.name,
            objData: result,
            dimensions,
            defaultColor: '#78716c',
            price: 650,
          };
          setImportedProducts((prev) => [product, ...prev]);
          setSelectedProductId(product.id);
        };
        reader.readAsText(file);
      }
    });
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Place selected product into 3D interior studio room
  const handlePlaceProductInRoom = (product: ImportedProduct) => {
    // Generate slight offset near room center
    const offsetX = (Math.random() - 0.5) * 1.5;
    const offsetZ = (Math.random() - 0.5) * 1.5;

    const newItem: PlacedFurnitureItem = {
      id: `placed-${product.id}-${Date.now()}`,
      modelType: 'custom-imported-product',
      name: product.name,
      category: product.category,
      position: [offsetX, 0, offsetZ],
      rotationY: 0,
      dimensions: {
        width: product.dimensions.width,
        depth: product.dimensions.depth,
        height: product.dimensions.height,
      },
      color: product.defaultColor || '#e2e8f0',
      secondaryColor: '#1e293b',
      price: product.price || 500,
      customData: {
        isImportedProduct: true,
        imageUrl: product.imageUrl,
        sourceFileName: product.sourceFileName,
        objData: product.objData,
      },
    };

    onPlaceProduct(newItem);
    onClose();
  };

  // Update dimension or category of a product
  const updateProduct = (id: string, updates: Partial<ImportedProduct>) => {
    setImportedProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  // Remove a product from list
  const removeProduct = (id: string) => {
    setImportedProducts((prev) => prev.filter((p) => p.id !== id));
    if (selectedProductId === id) {
      setSelectedProductId(null);
    }
  };

  const selectedProduct = importedProducts.find((p) => p.id === selectedProductId);

  const filteredProducts = importedProducts.filter(
    (p) => filterCategory === 'all' || p.category === filterCategory
  );

  return (
    <div
      id="folder-product-picker-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
                Pick Products from Folder & Place in 3D Scene
              </h2>
              <p className="text-xs text-slate-400">
                Select an entire local folder or drop product photos to instantly convert them into 3D interior assets.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Control Bar: Pick Folder / Add Files / Sample Folder */}
        <div className="px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/40">
          <div className="flex items-center gap-2">
            {/* Hidden native input for directory picking */}
            <input
              type="file"
              ref={folderInputRef}
              onChange={handleFolderChange}
              {...({ webkitdirectory: '', directory: '' } as Record<string, unknown>)}
              multiple
              className="hidden"
            />
            {/* Hidden native input for individual files */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/*,.obj"
              className="hidden"
            />

            <button
              onClick={() => folderInputRef.current?.click()}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <FolderOpen className="w-4 h-4" />
              Pick Folder from Computer
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-xs flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              Add Image Files
            </button>

            <button
              onClick={() => {
                setImportedProducts(
                  SAMPLE_FOLDER_PRODUCTS.map((p, index) => ({
                    ...p,
                    id: `sample-${Date.now()}-${index}`,
                  }))
                );
                setCurrentFolderName('Designer_Collection_Folder');
              }}
              className="px-3 py-2 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Reset to Designer Sample Folder
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-mono bg-slate-800 px-2 py-1 rounded text-slate-300">
              📁 {currentFolderName} ({importedProducts.length} items)
            </span>
          </div>
        </div>

        {/* Drag & Drop Zone + Filter Tabs */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`px-6 py-2 border-b border-slate-800/80 transition-colors flex items-center justify-between text-xs ${
            isDragging
              ? 'bg-amber-500/15 border-amber-500 text-amber-300'
              : 'bg-slate-900/60 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileImage className="w-4 h-4 text-amber-400" />
            <span>
              {isDragging
                ? 'Drop folder or product photos here now!'
                : 'Tip: You can also drag & drop entire folders or multiple PNG/JPG photos here.'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {(['all', 'living', 'bedroom', 'office', 'decor', 'architectural'] as const).map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-colors ${
                    filterCategory === cat
                      ? 'bg-slate-700 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>
        </div>

        {/* Body: Product Cards Grid (Left) + Detail & Dimension Inspector (Right) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800">
          {/* Products Grid (2 columns on medium screens) */}
          <div className="md:col-span-2 overflow-y-auto p-5">
            {filteredProducts.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 p-8">
                <FolderOpen className="w-12 h-12 mb-3 text-slate-600" />
                <p className="text-sm font-medium text-slate-400">No products found in folder</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Click "Pick Folder from Computer" above or drag and drop your product images here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {filteredProducts.map((product) => {
                  const isSelected = product.id === selectedProductId;
                  return (
                    <div
                      key={product.id}
                      onClick={() => setSelectedProductId(product.id)}
                      className={`group relative rounded-xl border p-3 flex flex-col justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/80 ring-1 ring-amber-500'
                          : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/70'
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="relative aspect-square w-full rounded-lg bg-slate-950/60 overflow-hidden mb-2.5 flex items-center justify-center">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Package className="w-10 h-10 text-slate-600" />
                        )}

                        <span className="absolute bottom-1.5 left-1.5 bg-slate-950/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-300 uppercase">
                          {product.category}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeProduct(product.id);
                          }}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-slate-900/80 text-slate-400 hover:text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove from folder list"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Product Name & Dimensions */}
                      <div>
                        <h4 className="font-semibold text-xs text-white line-clamp-1 group-hover:text-amber-300 transition-colors">
                          {product.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          {product.dimensions.width}m × {product.dimensions.depth}m × {product.dimensions.height}m
                        </p>
                      </div>

                      {/* Quick "Place in Room" button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlaceProductInRoom(product);
                        }}
                        className="mt-3 w-full py-1.5 px-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Place in Room
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Inspector & Dimension Tweaker */}
          <div className="overflow-y-auto p-5 bg-slate-950/30 flex flex-col justify-between">
            {selectedProduct ? (
              <div className="space-y-5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                    Selected Product Configuration
                  </span>
                  <input
                    type="text"
                    value={selectedProduct.name}
                    onChange={(e) => updateProduct(selectedProduct.id, { name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-semibold text-white focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[11px] text-slate-400 font-mono mt-1">
                    Source: {selectedProduct.sourceFileName}
                  </p>
                </div>

                {/* Big Preview */}
                <div className="aspect-video w-full rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center relative">
                  {selectedProduct.imageUrl ? (
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Package className="w-12 h-12 text-slate-600" />
                  )}
                </div>

                {/* Category Dropdown */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
                    Product Category
                  </label>
                  <select
                    value={selectedProduct.category}
                    onChange={(e) =>
                      updateProduct(selectedProduct.id, {
                        category: e.target.value as FurnitureCategory,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="living">Living Room</option>
                    <option value="bedroom">Bedroom</option>
                    <option value="dining">Dining Room</option>
                    <option value="office">Office & Workspace</option>
                    <option value="decor">Decor & Lighting</option>
                    <option value="architectural">Architectural Feature</option>
                    <option value="custom">Custom Import</option>
                  </select>
                </div>

                {/* 3D Real-World Dimensions Sliders */}
                <div className="space-y-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span>Real-World 3D Dimensions (Meters)</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Width (X)</span>
                      <span className="text-amber-400 font-mono">
                        {selectedProduct.dimensions.width.toFixed(2)} m
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.2}
                      max={4.0}
                      step={0.05}
                      value={selectedProduct.dimensions.width}
                      onChange={(e) =>
                        updateProduct(selectedProduct.id, {
                          dimensions: {
                            ...selectedProduct.dimensions,
                            width: parseFloat(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-amber-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Depth (Z)</span>
                      <span className="text-amber-400 font-mono">
                        {selectedProduct.dimensions.depth.toFixed(2)} m
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={3.0}
                      step={0.05}
                      value={selectedProduct.dimensions.depth}
                      onChange={(e) =>
                        updateProduct(selectedProduct.id, {
                          dimensions: {
                            ...selectedProduct.dimensions,
                            depth: parseFloat(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-amber-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Height (Y)</span>
                      <span className="text-amber-400 font-mono">
                        {selectedProduct.dimensions.height.toFixed(2)} m
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={3.0}
                      step={0.05}
                      value={selectedProduct.dimensions.height}
                      onChange={(e) =>
                        updateProduct(selectedProduct.id, {
                          dimensions: {
                            ...selectedProduct.dimensions,
                            height: parseFloat(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-amber-500"
                    />
                  </div>
                </div>

                {/* Finish / Accent Color */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
                    Accent / Frame Tint
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedProduct.defaultColor || '#e2e8f0'}
                      onChange={(e) =>
                        updateProduct(selectedProduct.id, { defaultColor: e.target.value })
                      }
                      className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs text-slate-400 font-mono">
                      {selectedProduct.defaultColor || '#e2e8f0'}
                    </span>
                  </div>
                </div>

                {/* Primary Action: Place into Room */}
                <div className="pt-2">
                  <button
                    onClick={() => handlePlaceProductInRoom(selectedProduct)}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Place "{selectedProduct.name}" in Room
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-6">
                <Sliders className="w-10 h-10 text-slate-700 mb-2" />
                <p className="text-xs text-slate-400">Select any product on the left to configure dimensions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
