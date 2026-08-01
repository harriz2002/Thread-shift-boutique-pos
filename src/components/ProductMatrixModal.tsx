import React, { useState } from 'react';
import { X, Check, AlertCircle, Barcode, MapPin, Tag, Plus, Minus, ShoppingBag } from 'lucide-react';
import { MasterProduct, ProductVariant, ClothingSize, StoreLocation } from '../types';
import { formatCurrency } from '../utils/format';

interface ProductMatrixModalProps {
  product: MasterProduct;
  stores: StoreLocation[];
  activeStoreId: string;
  onClose: () => void;
  onAddToCart: (product: MasterProduct, variant: ProductVariant, quantity: number) => void;
}

export const ProductMatrixModal: React.FC<ProductMatrixModalProps> = ({
  product,
  stores,
  activeStoreId,
  onClose,
  onAddToCart,
}) => {
  // Extract unique colors and sizes available across variants
  const colorsMap = new Map<string, { color: string; hex: string }>();
  const sizesSet = new Set<ClothingSize>();

  product.variants.forEach((v) => {
    if (!colorsMap.has(v.color)) {
      colorsMap.set(v.color, { color: v.color, hex: v.colorHex });
    }
    sizesSet.add(v.size);
  });

  const colors = Array.from(colorsMap.values());
  
  // Standard clothing size order ranking
  const standardSizeOrder: Record<string, number> = {
    'XXS': 0, 'XS': 1, 'S': 2, 'M': 3, 'L': 4, 'XL': 5, 'XXL': 6, '3XL': 7, '4XL': 8, 'ONE SIZE': 9
  };

  const allProductSizes = Array.from(sizesSet).sort((a, b) => {
    const rankA = standardSizeOrder[String(a).toUpperCase()];
    const rankB = standardSizeOrder[String(b).toUpperCase()];
    if (rankA !== undefined && rankB !== undefined) return rankA - rankB;
    if (rankA !== undefined) return -1;
    if (rankB !== undefined) return 1;
    const numA = Number(a);
    const numB = Number(b);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return String(a).localeCompare(String(b));
  });

  const standardApparelSizes: ClothingSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const isStandardApparelOnly = Array.from(sizesSet).every((sz) =>
    standardApparelSizes.includes(String(sz).toUpperCase())
  );

  const displaySizes: ClothingSize[] = isStandardApparelOnly && sizesSet.size > 0
    ? standardApparelSizes
    : allProductSizes;

  // Active selections - prefer a variant that is currently in stock at activeStoreId
  const [selectedColor, setSelectedColor] = useState<string>(() => {
    const inStockVariant = product.variants.find(
      (v) => (v.stockByStore[activeStoreId] || 0) > 0
    );
    if (inStockVariant) return inStockVariant.color;
    return colors[0]?.color || '';
  });

  const [selectedSize, setSelectedSize] = useState<ClothingSize>(() => {
    const inStockVariant = product.variants.find(
      (v) => (v.stockByStore[activeStoreId] || 0) > 0
    );
    if (inStockVariant) return inStockVariant.size;
    return allProductSizes[0] || 'M';
  });
  const [quantity, setQuantity] = useState<number>(1);
  const [viewCrossStore, setViewCrossStore] = useState<boolean>(false);

  const handleSelectColor = (newColor: string) => {
    setSelectedColor(newColor);
    // If the currently selected size does not exist for the new color, switch to one that does
    const variantExists = product.variants.find(
      (v) => v.color === newColor && v.size === selectedSize
    );
    if (!variantExists) {
      const firstAvailableForColor = product.variants.find(
        (v) => v.color === newColor && (v.stockByStore[activeStoreId] || 0) > 0
      ) || product.variants.find((v) => v.color === newColor);
      if (firstAvailableForColor) {
        setSelectedSize(firstAvailableForColor.size);
      }
    }
  };

  // Find matching variant
  const selectedVariant = product.variants.find(
    (v) => v.color === selectedColor && v.size === selectedSize
  );

  const currentStoreStock = selectedVariant
    ? selectedVariant.stockByStore[activeStoreId] || 0
    : 0;

  const currentStore = stores.find((s) => s.id === activeStoreId);

  const handleAdd = () => {
    if (!selectedVariant) return;
    onAddToCart(product, selectedVariant, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden text-slate-100 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <span className="bg-amber-500/20 text-amber-400 text-xs font-mono font-bold px-2.5 py-1 rounded-md border border-amber-500/30">
              {product.styleNumber}
            </span>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              {product.category}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Product Image & Spec */}
          <div className="md:col-span-5 space-y-4">
            <div className="aspect-3/4 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative group">
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-md text-amber-400 font-bold px-3 py-1 rounded-full text-sm border border-amber-500/30">
                {formatCurrency(product.basePrice)}
              </div>
            </div>

            <div className="text-xs text-slate-400 space-y-1.5 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>Fabric: {product.fabricContent}</span>
              </div>
              <p className="text-slate-400 leading-relaxed">{product.description}</p>
            </div>
          </div>

          {/* Matrix Picker */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-100 mb-1">{product.title}</h2>
              <p className="text-xs text-slate-400 mb-4">Select size and color variant from matrix</p>

              {/* Color Swatch Picker */}
              <div className="mb-5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 block">
                  Select Garment Color: <span className="text-amber-400 font-bold">{selectedColor}</span>
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {colors.map((c) => {
                    const isSelected = selectedColor === c.color;
                    return (
                      <button
                        key={c.color}
                        onClick={() => handleSelectColor(c.color)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/10 text-slate-100 ring-2 ring-amber-500/30'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-slate-700 shadow-inner"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span>{c.color}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size Pill Picker */}
              <div className="mb-5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 block">
                  Select Size Variant: <span className="text-amber-400 font-bold">{selectedSize}</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {displaySizes.map((sz) => {
                    // Check if this size exists for the chosen color
                    const variantForSize = product.variants.find(
                      (v) => v.color === selectedColor && v.size === sz
                    );
                    const exists = Boolean(variantForSize);
                    const stock = variantForSize
                      ? variantForSize.stockByStore[activeStoreId] || 0
                      : 0;
                    const isSelected = selectedSize === sz;

                    return (
                      <button
                        key={sz}
                        disabled={!exists}
                        onClick={() => setSelectedSize(sz)}
                        className={`py-2 px-2 rounded-xl border text-center transition-all relative ${
                          !exists
                            ? 'border-slate-800/50 bg-slate-950/40 text-slate-600 opacity-40 cursor-not-allowed'
                            : isSelected
                            ? 'border-amber-500 bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                            : stock > 0
                            ? 'border-slate-800 bg-slate-950 text-slate-200 hover:border-slate-700'
                            : 'border-rose-900/40 bg-rose-950/20 text-rose-300 hover:border-rose-800/60'
                        }`}
                      >
                        <div className="text-sm font-extrabold">{sz}</div>
                        <div className="text-[10px] font-medium opacity-80 mt-0.5">
                          {!exists ? 'N/A' : stock > 0 ? `${stock} in stock` : 'Out of stock'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Variant Specs & Barcode */}
              {selectedVariant && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-mono text-slate-300">
                      <Barcode className="w-4 h-4 text-emerald-400" />
                      SKU: <strong className="text-slate-100">{selectedVariant.sku}</strong>
                    </span>
                    <span className="font-mono text-slate-400">
                      Barcode: {selectedVariant.barcode}
                    </span>
                  </div>

                  {/* Stock Status Banner */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/50">
                    <div className="flex items-center gap-1.5 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-slate-300 font-medium">
                        {currentStore?.name}:
                      </span>
                      {currentStoreStock > 0 ? (
                        <span className="text-emerald-400 font-bold">{currentStoreStock} units available</span>
                      ) : (
                        <span className="text-rose-400 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Out of stock here
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setViewCrossStore(!viewCrossStore)}
                      className="text-[11px] text-amber-400 hover:underline font-semibold"
                    >
                      {viewCrossStore ? 'Hide Stores' : 'Check Other Stores'}
                    </button>
                  </div>

                  {/* Cross-Store Inventory Table */}
                  {viewCrossStore && (
                    <div className="mt-2 pt-2 border-t border-slate-800 text-xs space-y-1.5">
                      <p className="text-[11px] text-slate-400 font-semibold uppercase">Real-Time Multi-Store Inventory:</p>
                      <div className="grid grid-cols-1 gap-1">
                        {stores.map((s) => {
                          const st = selectedVariant.stockByStore[s.id] || 0;
                          return (
                            <div
                              key={s.id}
                              className={`flex items-center justify-between px-2.5 py-1 rounded ${
                                s.id === activeStoreId ? 'bg-amber-500/10 text-amber-300' : 'bg-slate-900 text-slate-300'
                              }`}
                            >
                              <span>{s.name}</span>
                              <span className="font-mono font-bold">
                                {st > 0 ? `${st} in stock` : '0 (Out)'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions: Quantity & Add Button */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase">Quantity:</span>
                <div className="flex items-center gap-3 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-bold text-sm text-amber-400 font-mono">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                disabled={!selectedVariant || currentStoreStock === 0}
                onClick={handleAdd}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                  !selectedVariant || currentStoreStock === 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25 active:scale-98'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {currentStoreStock === 0
                    ? 'Out of Stock in This Store'
                    : `Add to Register Cart — ${formatCurrency((selectedVariant?.priceOverride || product.basePrice) * quantity)}`}
                </span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
