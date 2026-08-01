import React, { useState, useRef } from 'react';
import { 
  Layers, 
  Plus, 
  AlertTriangle, 
  Barcode, 
  Printer, 
  ArrowRightLeft, 
  CheckCircle2, 
  Search, 
  Filter, 
  Tag, 
  Building, 
  FileText,
  Sparkles,
  MapPin,
  X,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Upload,
  Save
} from 'lucide-react';
import { 
  MasterProduct, 
  ProductVariant, 
  ClothingSize, 
  StoreLocation, 
  StockTransfer, 
  ReorderPO,
  ProductCategory
} from '../types';
import { formatCurrency } from '../utils/format';

interface InventoryMatrixManagerProps {
  products: MasterProduct[];
  stores: StoreLocation[];
  activeStoreId: string;
  transfers: StockTransfer[];
  purchaseOrders: ReorderPO[];
  onAddMasterProduct: (product: MasterProduct) => void;
  onUpdateMasterProduct: (product: MasterProduct) => void;
  onDeleteMasterProduct: (productId: string) => void;
  onUpdateVariantStock: (variantId: string, storeId: string, newStock: number) => void;
  onCreateStockTransfer: (transfer: StockTransfer) => void;
  onCreatePurchaseOrder: (po: ReorderPO) => void;
}

export const InventoryMatrixManager: React.FC<InventoryMatrixManagerProps> = ({
  products,
  stores,
  activeStoreId,
  transfers,
  purchaseOrders,
  onAddMasterProduct,
  onUpdateMasterProduct,
  onDeleteMasterProduct,
  onUpdateVariantStock,
  onCreateStockTransfer,
  onCreatePurchaseOrder,
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'lowstock' | 'transfers' | 'add_style'>('matrix');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>(activeStoreId);

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState<MasterProduct | null>(null);

  // Garment Tag Print Preview state
  const [printableTagVariant, setPrintableTagVariant] = useState<{
    product: MasterProduct;
    variant: ProductVariant;
  } | null>(null);

  // Transfer stock modal state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [transferFromStore, setTransferFromStore] = useState<string>('store-3'); // Warehouse
  const [transferToStore, setTransferToStore] = useState<string>('store-1'); // Flagship
  const [transferQty, setTransferQty] = useState<number>(5);
  const [transferVariantId, setTransferVariantId] = useState<string>('');

  // Add Style / Product Form State
  const [newTitle, setNewTitle] = useState('');
  const [newStyleNum, setNewStyleNum] = useState('');
  const [newCategory, setNewCategory] = useState<ProductCategory | string>('Jackets & Outerwear');
  const [customCategory, setCustomCategory] = useState('');
  const [newBasePrice, setNewBasePrice] = useState<number>(3500);
  const [newCostPrice, setNewCostPrice] = useState<number>(1800);
  const [newFabric, setNewFabric] = useState('100% Kenyan Cotton / Kitenge Blend');
  const [newDescription, setNewDescription] = useState('');
  const [newImage, setNewImage] = useState(
    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80'
  );
  const [selectedColorsText, setSelectedColorsText] = useState('');
  const [sizesText, setSizesText] = useState('S, M, L, XL');
  // Per-size quantity map (key: size or "color-size", value: quantity)
  const [sizeQuantitiesMap, setSizeQuantitiesMap] = useState<Record<string, number>>({});

  // Per-size color and quantity customizer state
  // key: size (e.g. "S", "M", "40", "41") -> { color: string, colorHex: string, quantity: number }
  const [perSizeColorMap, setPerSizeColorMap] = useState<Record<string, { color: string; colorHex: string; quantity: number }>>({});

  const handlePerSizeColorChange = (size: string, field: 'color' | 'colorHex' | 'quantity', value: any) => {
    setPerSizeColorMap((prev) => {
      const current = prev[size] || { color: '', colorHex: '#1B263B', quantity: 1 };
      return {
        ...prev,
        [size]: {
          ...current,
          [field]: field === 'quantity' ? Math.max(0, Number(value)) : value,
        },
      };
    });
  };
  // Modal to Add Custom Size/Variant to an existing product
  const [addVariantToProduct, setAddVariantToProduct] = useState<MasterProduct | null>(null);
  const [newVarColor, setNewVarColor] = useState('Black');
  const [newVarSize, setNewVarSize] = useState('M');
  const [newVarStock, setNewVarStock] = useState<number>(10);

  // Helper to parse sizes list
  const parsedSizesList = sizesText
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Helper to update quantity for a specific size or color-size
  const handleSizeQuantityChange = (key: string, qty: number) => {
    setSizeQuantitiesMap((prev) => ({
      ...prev,
      [key]: Math.max(0, qty),
    }));
  };

  // Image Upload File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Handle Image File Upload (Convert to Base64)
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditMode = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (isEditMode && editingProduct) {
          setEditingProduct({ ...editingProduct, image: base64String });
        } else {
          setNewImage(base64String);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Calculate low stock items across selected store
  const lowStockList: { product: MasterProduct; variant: ProductVariant; currentStock: number }[] = [];
  products.forEach((p) => {
    p.variants.forEach((v) => {
      const current = v.stockByStore[selectedStoreFilter] || 0;
      if (current <= v.reorderLevel) {
        lowStockList.push({ product: p, variant: v, currentStock: current });
      }
    });
  });

  // Handle create new master style with automated matrix generator
  const handleCreateStyle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const styleNum = newStyleNum.trim() || `STY-${Math.floor(1000 + Math.random() * 9000)}`;
    const categoryToSave = (newCategory === 'Custom' ? customCategory : newCategory) as ProductCategory;
    const globalColors = selectedColorsText.split(',').map((c) => c.trim()).filter(Boolean);
    const sizes = parsedSizesList.length > 0 ? parsedSizesList : ['M'];

    const generatedVariants: ProductVariant[] = [];

    // Helper to construct exact store stock distribution
    const buildStockObj = (targetQty: number) => {
      const stockObj: Record<string, number> = {};
      stores.forEach((st) => {
        if (selectedStoreFilter === 'all' || selectedStoreFilter === st.id) {
          stockObj[st.id] = targetQty;
        } else {
          stockObj[st.id] = 0;
        }
      });
      return stockObj;
    };

    sizes.forEach((sz, sIdx) => {
      const customForSize = perSizeColorMap[sz];
      const customColorName = customForSize?.color?.trim();
      const customColorHex = customForSize?.colorHex || '#1B263B';
      const qty = customForSize?.quantity ?? (sizeQuantitiesMap[sz] ?? 1);

      let sizeColorsList: { name: string; hex: string }[] = [];

      if (globalColors.length > 0) {
        sizeColorsList = globalColors.map((cName, cIdx) => ({
          name: cName,
          hex: cIdx === 0 ? customColorHex : (cIdx === 1 ? '#EAE3D2' : cIdx === 2 ? '#7B3F00' : '#C05C46'),
        }));
        if (customColorName && !sizeColorsList.some((c) => c.name.toLowerCase() === customColorName.toLowerCase())) {
          sizeColorsList.unshift({ name: customColorName, hex: customColorHex });
        }
      } else if (customColorName) {
        const splitColors = customColorName.split(',').map((c) => c.trim()).filter(Boolean);
        if (splitColors.length > 0) {
          sizeColorsList = splitColors.map((cName) => ({
            name: cName,
            hex: customColorHex,
          }));
        } else {
          sizeColorsList = [{ name: customColorName, hex: customColorHex }];
        }
      } else {
        sizeColorsList = [{ name: 'Standard', hex: customColorHex }];
      }

      sizeColorsList.forEach((col, cIdx) => {
        const cleanColTag = col.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() || 'STD';
        const sku = `${styleNum.replace('STY-', '')}-${cleanColTag}-${sz}`;
        const barcode = `${889100000 + Math.floor(1000 + Math.random() * 8999)}`;

        generatedVariants.push({
          id: `v-${Date.now()}-${sIdx}-${cIdx}`,
          sku,
          barcode,
          color: col.name,
          colorHex: col.hex,
          size: sz,
          reorderLevel: 4,
          stockByStore: buildStockObj(qty),
        });
      });
    });

    const newMaster: MasterProduct = {
      id: `prod-${Date.now()}`,
      styleNumber: styleNum,
      title: newTitle,
      category: categoryToSave || 'Jackets & Outerwear',
      description: newDescription || `Premium ${newTitle} crafted with ${newFabric}.`,
      basePrice: Number(newBasePrice),
      costPrice: Number(newCostPrice),
      image: newImage,
      fabricContent: newFabric,
      careInstructions: 'Machine wash cold or wipe with soft brush.',
      variants: generatedVariants,
      tags: ['New Garment', categoryToSave],
      createdAt: new Date().toISOString().split('T')[0],
    };

    onAddMasterProduct(newMaster);
    setActiveTab('matrix');
    setNewTitle('');
    setNewStyleNum('');
    setNewDescription('');
    setSelectedColorsText('');
    setPerSizeColorMap({});
  };

  // Add a single new variant to existing product
  const handleAddNewVariantToProduct = () => {
    if (!addVariantToProduct || !newVarSize.trim()) return;

    const sku = `${addVariantToProduct.styleNumber.replace('STY-', '')}-${newVarColor.substring(0, 3).toUpperCase()}-${newVarSize.trim()}`;
    const barcode = `${889100000 + Math.floor(1000 + Math.random() * 8999)}`;

    const newVar: ProductVariant = {
      id: `v-${Date.now()}`,
      sku,
      barcode,
      color: newVarColor.trim() || 'Standard',
      colorHex: '#1B263B',
      size: newVarSize.trim(),
      reorderLevel: 4,
      stockByStore: {
        'store-1': newVarStock,
        'store-2': Math.floor(newVarStock * 0.5),
        'store-3': newVarStock * 2,
      },
    };

    const updatedProduct = {
      ...addVariantToProduct,
      variants: [...addVariantToProduct.variants, newVar],
    };

    onUpdateMasterProduct(updatedProduct);
    setAddVariantToProduct(null);
  };

  // Save changes to edited product
  const handleSaveProductEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    onUpdateMasterProduct(editingProduct);
    setEditingProduct(null);
  };

  // Generate Automated Purchase Order for suppliers
  const handleGeneratePO = () => {
    if (lowStockList.length === 0) return;

    const poItems = lowStockList.map((ls) => ({
      productId: ls.product.id,
      variantId: ls.variant.id,
      productTitle: ls.product.title,
      color: ls.variant.color,
      size: ls.variant.size,
      suggestedQuantity: 20,
      estimatedCost: ls.product.costPrice * 20,
    }));

    const totalEst = poItems.reduce((acc, it) => acc + it.estimatedCost, 0);

    const newPO: ReorderPO = {
      id: `po-${Date.now()}`,
      poNumber: `PO-2026-${Math.floor(100 + Math.random() * 900)}`,
      supplierName: 'Eldoret & Nairobi Garment Mills Ltd',
      dateCreated: new Date().toISOString().split('T')[0],
      targetStoreId: selectedStoreFilter,
      items: poItems,
      status: 'submitted',
      totalEstimatedCost: totalEst,
    };

    onCreatePurchaseOrder(newPO);
    alert(`Purchase Order ${newPO.poNumber} generated! Estimated Cost: ${formatCurrency(totalEst)}`);
  };

  // Create Stock Transfer
  const handleInitiateTransfer = () => {
    if (!transferVariantId) return;

    const foundItem = products.flatMap((p) => p.variants.map((v) => ({ product: p, variant: v }))).find((item) => item.variant.id === transferVariantId);

    if (!foundItem) return;

    const newTransfer: StockTransfer = {
      id: `tr-${Date.now()}`,
      transferNumber: `TRF-2026-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
      fromStoreId: transferFromStore,
      toStoreId: transferToStore,
      status: 'completed',
      initiatedBy: 'Boutique Manager',
      notes: `Transferring ${transferQty} units of ${foundItem.product.title} (${foundItem.variant.color} - Sz ${foundItem.variant.size})`,
      items: [
        {
          productId: foundItem.product.id,
          variantId: foundItem.variant.id,
          productTitle: foundItem.product.title,
          styleNumber: foundItem.product.styleNumber,
          color: foundItem.variant.color,
          size: foundItem.variant.size,
          quantity: transferQty,
        },
      ],
    };

    onCreateStockTransfer(newTransfer);

    // Update stock counts
    const currentFrom = foundItem.variant.stockByStore[transferFromStore] || 0;
    const currentTo = foundItem.variant.stockByStore[transferToStore] || 0;

    onUpdateVariantStock(foundItem.variant.id, transferFromStore, Math.max(0, currentFrom - transferQty));
    onUpdateVariantStock(foundItem.variant.id, transferToStore, currentTo + transferQty);

    setIsTransferModalOpen(false);
  };

  const categoriesList: (ProductCategory | string)[] = [
    'Jackets & Outerwear',
    'Tops & Shirts',
    'Dresses & Skirts',
    'Pants & Denim',
    'Knitwear & Sweaters',
    'Footwear & Shoes',
    'Accessories & Bags',
    'African Print & Kitenge',
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Navigation Sub-Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800 gap-4">
        
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Product & Variant Catalog</span>
          </button>

          <button
            onClick={() => setActiveTab('lowstock')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'lowstock'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-950" />
            <span>Low-Stock Alerts ({lowStockList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('transfers')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'transfers'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Stock Transfers ({transfers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('add_style')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'add_style'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add New Clothing Product</span>
          </button>
        </div>

        {/* Store Location Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Viewing Stock For:</span>
          <select
            value={selectedStoreFilter}
            onChange={(e) => setSelectedStoreFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl px-3 py-1.5 outline-none focus:border-amber-500 cursor-pointer"
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* TAB 1: Variant Matrix & Stock Manager */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          
          {/* Filter Bar & Quick Add */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search style #, title, or SKU..."
                className="w-full bg-slate-950 text-slate-100 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-800 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('add_style')}
                className="flex-1 sm:flex-initial bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>

              <button
                onClick={() => setIsTransferModalOpen(true)}
                className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                <span>Transfer Stock</span>
              </button>
            </div>
          </div>

          {/* Master Styles Matrix List */}
          <div className="space-y-6">
            {products
              .filter((p) => {
                const q = searchQuery.toLowerCase();
                return (
                  p.title.toLowerCase().includes(q) ||
                  p.styleNumber.toLowerCase().includes(q) ||
                  p.variants.some((v) => v.sku.toLowerCase().includes(q))
                );
              })
              .map((product) => (
                <div
                  key={product.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl"
                >
                  {/* Master Product Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-16 h-16 object-cover rounded-xl bg-slate-950 border border-slate-800"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400 text-xs bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {product.styleNumber}
                          </span>
                          <span className="text-xs text-slate-400 font-semibold uppercase">
                            {product.category}
                          </span>
                        </div>
                        <h3 className="font-bold text-base text-slate-100 mt-0.5">{product.title}</h3>
                        <p className="text-xs text-slate-400">{product.fabricContent}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right font-mono">
                        <span className="text-slate-500 block text-[10px]">RETAIL PRICE</span>
                        <strong className="text-amber-400 font-bold text-sm">
                          {formatCurrency(product.basePrice)}
                        </strong>
                      </div>

                      <div className="text-right font-mono hidden md:block">
                        <span className="text-slate-500 block text-[10px]">COST PRICE</span>
                        <strong className="text-slate-300 font-bold text-sm">
                          {formatCurrency(product.costPrice)}
                        </strong>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setAddVariantToProduct(product);
                            setNewVarColor(product.variants[0]?.color || 'Black');
                            setNewVarSize('M');
                            setNewVarStock(10);
                          }}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 font-semibold text-xs rounded-xl border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                          title="Add New Custom Size Variant to Product"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Size</span>
                        </button>

                        <button
                          onClick={() => setEditingProduct(product)}
                          className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                          title="Edit Product Details & Picture"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${product.title}"?`)) {
                              onDeleteMasterProduct(product.id);
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Variants Grid Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-sans">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                          <th className="py-2 px-3">Color Swatch</th>
                          <th className="py-2 px-3">Size</th>
                          <th className="py-2 px-3">SKU</th>
                          <th className="py-2 px-3">Barcode Tag</th>
                          <th className="py-2 px-3 text-center">In Store ({stores.find((s) => s.id === selectedStoreFilter)?.code})</th>
                          <th className="py-2 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {product.variants.map((variant) => {
                          const stock = variant.stockByStore[selectedStoreFilter] || 0;
                          return (
                            <tr key={variant.id} className="hover:bg-slate-950/50 transition-colors">
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-slate-700 shadow-inner"
                                    style={{ backgroundColor: variant.colorHex }}
                                  />
                                  <span className="font-medium text-slate-200">{variant.color}</span>
                                </div>
                              </td>

                              <td className="py-2.5 px-3">
                                <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                  {variant.size}
                                </span>
                              </td>

                              <td className="py-2.5 px-3 font-mono text-slate-300">{variant.sku}</td>

                              <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                                {variant.barcode}
                              </td>

                              <td className="py-2.5 px-3 text-center">
                                <div className="inline-flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                                  <button
                                    onClick={() =>
                                      onUpdateVariantStock(
                                        variant.id,
                                        selectedStoreFilter,
                                        Math.max(0, stock - 1)
                                      )
                                    }
                                    className="text-slate-400 hover:text-slate-100 font-mono px-1 font-bold cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span
                                    className={`font-mono font-bold w-8 text-center ${
                                      stock <= variant.reorderLevel
                                        ? 'text-rose-400'
                                        : 'text-emerald-400'
                                    }`}
                                  >
                                    {stock}
                                  </span>
                                  <button
                                    onClick={() =>
                                      onUpdateVariantStock(
                                        variant.id,
                                        selectedStoreFilter,
                                        stock + 1
                                      )
                                    }
                                    className="text-slate-400 hover:text-slate-100 font-mono px-1 font-bold cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>

                              <td className="py-2.5 px-3 text-right">
                                <button
                                  onClick={() => setPrintableTagVariant({ product, variant })}
                                  className="text-xs text-amber-400 hover:underline flex items-center gap-1 ml-auto font-semibold cursor-pointer"
                                >
                                  <Barcode className="w-3.5 h-3.5" />
                                  <span>Print Tag</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                </div>
              ))}
          </div>

        </div>
      )}

      {/* TAB 2: Low-Stock Alerts & Auto-Reorder PO Generator */}
      {activeTab === 'lowstock' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-lg text-slate-100">Low-Stock Automated Alerts</h3>
              </div>
              <p className="text-xs text-slate-400">
                Items falling below safety threshold level ({lowStockList.length} variants need reordering)
              </p>
            </div>

            <button
              onClick={handleGeneratePO}
              disabled={lowStockList.length === 0}
              className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                lowStockList.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Generate Supplier Purchase Order PO</span>
            </button>
          </div>

          <div className="space-y-3">
            {lowStockList.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                <p className="text-sm font-bold text-slate-300">All Stock Levels Healthy!</p>
                <p className="text-xs text-slate-500">No items are currently below safety reorder threshold.</p>
              </div>
            ) : (
              lowStockList.map(({ product, variant, currentStock }, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-12 h-12 object-cover rounded-lg bg-slate-900 border border-slate-800"
                    />
                    <div>
                      <div className="font-bold text-slate-100">{product.title}</div>
                      <div className="text-slate-400 text-[11px]">
                        Color: {variant.color} • Size:{' '}
                        <strong className="text-amber-400 font-mono">{variant.size}</strong> • SKU:{' '}
                        <span className="font-mono">{variant.sku}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block uppercase">Stock Status</span>
                    <span className="font-mono font-extrabold text-rose-400 text-sm">
                      {currentStock} remaining (Min: {variant.reorderLevel})
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Stock Transfers Log */}
      {activeTab === 'transfers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-lg text-slate-100">Multi-Store Stock Transfers</h3>
              <p className="text-xs text-slate-400">Track inter-store garment movements</p>
            </div>

            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Transfer</span>
            </button>
          </div>

          <div className="space-y-3">
            {transfers.map((tr) => (
              <div key={tr.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="font-mono font-bold text-amber-400">{tr.transferNumber}</span>
                  <span className="text-slate-400 font-mono">{tr.date}</span>
                </div>

                <div className="flex justify-between text-slate-300">
                  <span>From: <strong>{stores.find((s) => s.id === tr.fromStoreId)?.name}</strong></span>
                  <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                  <span>To: <strong>{stores.find((s) => s.id === tr.toStoreId)?.name}</strong></span>
                </div>

                <div className="text-slate-400 text-[11px] italic">"{tr.notes}"</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Create Master Style Form */}
      {activeTab === 'add_style' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl mx-auto shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-bold text-lg text-slate-100">Add New Apparel Product & Matrix</h3>
            <p className="text-xs text-slate-400">
              Set product title, category, colors, price, and picture (URL or image upload)
            </p>
          </div>

          <form onSubmit={handleCreateStyle} className="space-y-4 text-xs">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Product Name / Title:</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Traditional Kitenge Printed Shirt"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Style Code / SKU Prefix:</label>
                <input
                  type="text"
                  value={newStyleNum}
                  onChange={(e) => setNewStyleNum(e.target.value)}
                  placeholder="e.g. STY-SHT-88"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Category:</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none cursor-pointer"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Custom">+ Custom Category</option>
                </select>

                {newCategory === 'Custom' && (
                  <input
                    type="text"
                    required
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter category name"
                    className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 outline-none focus:border-amber-500"
                  />
                )}
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Retail Price (KSh):</label>
                <input
                  type="number"
                  required
                  value={newBasePrice}
                  onChange={(e) => setNewBasePrice(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-amber-400 font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Cost Price (KSh):</label>
                <input
                  type="number"
                  value={newCostPrice}
                  onChange={(e) => setNewCostPrice(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-300 font-mono outline-none"
                />
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <label className="text-slate-300 font-semibold flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>Product Picture / Photo:</span>
              </label>

              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <img
                  src={newImage}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded-xl border border-slate-700 bg-slate-900 shrink-0"
                />

                <div className="space-y-2 flex-1 w-full">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>Upload Photo</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileUpload(e, false)}
                      className="hidden"
                    />
                  </div>

                  <input
                    type="text"
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    placeholder="Or enter image URL (https://...)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-300 font-mono outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>



            {/* CUSTOM SIZES INPUT & QUICK PRESETS */}
            <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center">
                <label className="text-slate-200 font-bold flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-amber-400" />
                  <span>Sizes (Comma Separated Custom Input):</span>
                </label>
                <span className="text-[11px] text-amber-400 font-mono">
                  {parsedSizesList.length} Size(s) Defined
                </span>
              </div>

              <input
                type="text"
                value={sizesText}
                onChange={(e) => setSizesText(e.target.value)}
                placeholder="e.g. XS, S, M, L, XL, XXL or 28, 30, 32, 34"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-mono font-bold outline-none focus:border-amber-500"
              />

              {/* Quick Size Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Presets:</span>
                <button
                  type="button"
                  onClick={() => setSizesText('S, M, L, XL')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  Apparel (S - XL)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSizesText('39, 40, 41, 42, 43, 44, 45');
                    setNewCategory('Footwear & Shoes');
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] px-2.5 py-1 rounded-lg border border-blue-400/50 shadow-sm transition-colors cursor-pointer font-bold"
                >
                  👟 Shoes / EU (39-45)
                </button>
                <button
                  type="button"
                  onClick={() => setSizesText('28, 30, 32, 34, 36, 38')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  Pants/Waist (28 - 38)
                </button>
                <button
                  type="button"
                  onClick={() => setSizesText('38, 40, 42, 44, 46')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  Suits/Chests (38 - 46)
                </button>
                <button
                  type="button"
                  onClick={() => setSizesText('Free Size')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  One Size / Free Size
                </button>
              </div>
            </div>

            {/* PER-SIZE COLOUR & QUANTITY KEYING GRID */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <div>
                  <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Fill Colour & Quantity for Each Size Directly:</span>
                  </h4>
                  <p className="text-[10px] text-slate-400">Specify unique color name, swatch & initial stock per size</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {parsedSizesList.map((sz) => {
                  const custom = perSizeColorMap[sz] || { color: '', colorHex: '#1B263B', quantity: 1 };
                  return (
                    <div key={sz} className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-amber-400 text-xs">
                          Size {sz}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] text-slate-400">Swatch:</label>
                          <input
                            type="color"
                            value={custom.colorHex}
                            onChange={(e) => handlePerSizeColorChange(sz, 'colorHex', e.target.value)}
                            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                            title="Choose Color Swatch"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Colour Name:</label>
                          <input
                            type="text"
                            value={custom.color}
                            onChange={(e) => handlePerSizeColorChange(sz, 'color', e.target.value)}
                            placeholder="e.g. Cognac, Navy, Cream"
                            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs p-1.5 rounded outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Initial Stock:</label>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handlePerSizeColorChange(sz, 'quantity', custom.quantity - 1)}
                              className="w-6 h-6 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold text-xs flex items-center justify-center cursor-pointer shrink-0"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={custom.quantity}
                              onChange={(e) => handlePerSizeColorChange(sz, 'quantity', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 text-center text-emerald-400 font-mono font-bold text-xs py-1 rounded outline-none focus:border-amber-500"
                            />
                            <button
                              type="button"
                              onClick={() => handlePerSizeColorChange(sz, 'quantity', custom.quantity + 1)}
                              className="w-6 h-6 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold text-xs flex items-center justify-center cursor-pointer shrink-0"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Fabric / Material Description:</label>
              <input
                type="text"
                value={newFabric}
                onChange={(e) => setNewFabric(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Save Garment Product to Inventory
            </button>

          </form>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 text-slate-100 space-y-4 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <span>Edit Product: {editingProduct.title}</span>
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-100 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Product Title:</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.title}
                    onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Style Code #:</label>
                  <input
                    type="text"
                    value={editingProduct.styleNumber}
                    onChange={(e) => setEditingProduct({ ...editingProduct, styleNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Category:</label>
                  <input
                    type="text"
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as ProductCategory })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Price (KSh):</label>
                  <input
                    type="number"
                    value={editingProduct.basePrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, basePrice: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-amber-400 font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Cost (KSh):</label>
                  <input
                    type="number"
                    value={editingProduct.costPrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, costPrice: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-300 font-mono outline-none"
                  />
                </div>
              </div>

              {/* Photo Upload in Edit */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>Update Picture:</span>
                </label>

                <div className="flex gap-3 items-center">
                  <img
                    src={editingProduct.image}
                    alt="Current"
                    className="w-16 h-16 object-cover rounded-xl border border-slate-800 bg-slate-900 shrink-0"
                  />

                  <div className="space-y-1.5 flex-1">
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>Upload New Image File</span>
                    </button>
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileUpload(e, true)}
                      className="hidden"
                    />

                    <input
                      type="text"
                      value={editingProduct.image}
                      onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                      placeholder="Image URL"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-300 font-mono outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Manage Color & Size Variants */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5 text-xs">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <span>Variants & Color/Size Mapping ({editingProduct.variants.length}):</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const newV: ProductVariant = {
                        id: `v-${Date.now()}`,
                        sku: `${editingProduct.styleNumber}-VAR-${editingProduct.variants.length + 1}`,
                        barcode: `${889100000 + Math.floor(1000 + Math.random() * 8999)}`,
                        color: 'Navy Blue',
                        colorHex: '#1B263B',
                        size: 'M',
                        reorderLevel: 4,
                        stockByStore: { 'store-1': 10, 'store-2': 5, 'store-3': 15 },
                      };
                      setEditingProduct({
                        ...editingProduct,
                        variants: [...editingProduct.variants, newV],
                      });
                    }}
                    className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold px-2 py-1 rounded-lg border border-amber-500/40 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Variant</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {editingProduct.variants.map((v, vIdx) => (
                    <div key={v.id || vIdx} className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex items-center gap-2 text-[11px]">
                      <input
                        type="color"
                        value={v.colorHex || '#1B263B'}
                        onChange={(e) => {
                          const updated = [...editingProduct.variants];
                          updated[vIdx] = { ...v, colorHex: e.target.value };
                          setEditingProduct({ ...editingProduct, variants: updated });
                        }}
                        className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent shrink-0"
                        title="Color Swatch"
                      />
                      <input
                        type="text"
                        value={v.color}
                        onChange={(e) => {
                          const updated = [...editingProduct.variants];
                          updated[vIdx] = { ...v, color: e.target.value };
                          setEditingProduct({ ...editingProduct, variants: updated });
                        }}
                        placeholder="Color"
                        className="w-24 bg-slate-950 border border-slate-800 rounded p-1 text-slate-100 text-xs outline-none"
                      />
                      <input
                        type="text"
                        value={v.size}
                        onChange={(e) => {
                          const updated = [...editingProduct.variants];
                          updated[vIdx] = { ...v, size: e.target.value };
                          setEditingProduct({ ...editingProduct, variants: updated });
                        }}
                        placeholder="Size"
                        className="w-16 bg-slate-950 border border-slate-800 rounded p-1 text-amber-400 font-mono font-bold text-xs outline-none text-center"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400">Stock:</span>
                        <input
                          type="number"
                          value={v.stockByStore[selectedStoreFilter] ?? 10}
                          onChange={(e) => {
                            const updated = [...editingProduct.variants];
                            updated[vIdx] = {
                              ...v,
                              stockByStore: {
                                ...v.stockByStore,
                                [selectedStoreFilter]: Math.max(0, Number(e.target.value)),
                              },
                            };
                            setEditingProduct({ ...editingProduct, variants: updated });
                          }}
                          className="w-14 bg-slate-950 border border-slate-800 rounded p-1 text-emerald-400 font-mono font-bold text-xs outline-none text-center"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editingProduct.variants.filter((_, idx) => idx !== vIdx);
                          setEditingProduct({ ...editingProduct, variants: updated });
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer ml-auto"
                        title="Remove Variant"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SIZE / VARIANT MODAL */}
      {addVariantToProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-100 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Add Size / Variant: {addVariantToProduct.title}</span>
              </h3>
              <button
                onClick={() => setAddVariantToProduct(null)}
                className="text-slate-400 hover:text-slate-100 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Color Name:</label>
                <input
                  type="text"
                  value={newVarColor}
                  onChange={(e) => setNewVarColor(e.target.value)}
                  placeholder="e.g. Olive, Navy, Cream"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Custom Size (e.g., S, M, L, XL, XXL, 32, 34):</label>
                <input
                  type="text"
                  value={newVarSize}
                  onChange={(e) => setNewVarSize(e.target.value)}
                  placeholder="e.g. XXL or 36"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono font-bold outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Initial Stock Quantity:</label>
                <input
                  type="number"
                  value={newVarStock}
                  onChange={(e) => setNewVarStock(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-emerald-400 font-mono font-bold outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setAddVariantToProduct(null)}
                className="flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-xl font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNewVariantToProduct}
                className="flex-1 bg-amber-500 text-slate-950 py-2.5 rounded-xl font-bold text-xs cursor-pointer"
              >
                Add Size Variant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Garment Tag Printable Modal */}
      {printableTagVariant && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-slate-100 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-slate-100">Garment Tag Print Preview</h3>
              <button
                onClick={() => setPrintableTagVariant(null)}
                className="text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual Tag */}
            <div className="bg-white text-slate-950 font-mono text-center p-6 rounded-xl border border-slate-300 shadow-inner space-y-2">
              <h4 className="font-extrabold text-sm uppercase tracking-widest text-slate-900">
                Threads & Style
              </h4>
              <p className="text-xs font-bold font-sans text-slate-800">
                {printableTagVariant.product.title}
              </p>
              <div className="text-[11px] text-slate-600 font-semibold">
                COLOR: {printableTagVariant.variant.color} • SIZE:{' '}
                <strong className="text-slate-950 font-bold">{printableTagVariant.variant.size}</strong>
              </div>

              {/* Barcode graphic */}
              <div className="py-2 flex justify-center">
                <div className="h-10 w-48 bg-slate-900 flex items-center justify-center rounded">
                  <span className="font-mono text-white tracking-[0.25em] text-[10px] font-bold">
                    ||| |||| || ||||| |||
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 font-mono">
                BARCODE: {printableTagVariant.variant.barcode}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                SKU: {printableTagVariant.variant.sku}
              </div>
              <div className="text-base font-extrabold text-slate-950 pt-1 border-t border-slate-300">
                {formatCurrency(printableTagVariant.product.basePrice)}
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Garment Tag</span>
            </button>
          </div>
        </div>
      )}

      {/* Stock Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-100 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-base text-slate-100">Inter-Store Stock Transfer</h3>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Select Garment Variant:</label>
                <select
                  value={transferVariantId}
                  onChange={(e) => setTransferVariantId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none cursor-pointer"
                >
                  <option value="">Select Variant...</option>
                  {products.flatMap((p) =>
                    p.variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {p.title} - {v.color} (Sz {v.size})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">From Store:</label>
                  <select
                    value={transferFromStore}
                    onChange={(e) => setTransferFromStore(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 outline-none cursor-pointer"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">To Store:</label>
                  <select
                    value={transferToStore}
                    onChange={(e) => setTransferToStore(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 outline-none cursor-pointer"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Quantity to Move:</label>
                <input
                  type="number"
                  value={transferQty}
                  onChange={(e) => setTransferQty(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-amber-400 font-mono font-bold outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-xl font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleInitiateTransfer}
                className="flex-1 bg-amber-500 text-slate-950 py-2.5 rounded-xl font-bold text-xs cursor-pointer"
              >
                Transfer Units
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
