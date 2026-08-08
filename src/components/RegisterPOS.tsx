import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ShoppingBag, 
  Trash2, 
  Tag, 
  Barcode, 
  QrCode, 
  Clock, 
  CreditCard, 
  Plus, 
  Minus, 
  Percent, 
  MapPin, 
  Sparkles,
  Layers,
  TrendingUp,
  Receipt,
  Banknote,
  Zap,
  ChevronDown,
  ChevronUp,
  Printer,
  Smartphone,
  PieChart,
  HelpCircle,
  Download
} from 'lucide-react';
import { MasterProduct, ProductVariant, CartItem, ProductCategory, StoreLocation, SaleTransaction, UserAccount, SystemSettings } from '../types';
import { formatCurrency } from '../utils/format';
import { ShiftBreakdownModal } from './ShiftBreakdownModal';

interface RegisterPOSProps {
  products: MasterProduct[];
  cart: CartItem[];
  stores: StoreLocation[];
  activeStoreId: string;
  transactions?: SaleTransaction[];
  currentUser?: UserAccount | null;
  systemSettings?: SystemSettings;
  onViewReceipt?: (transaction: SaleTransaction) => void;
  onAddToCart: (product: MasterProduct, variant: ProductVariant, quantity: number) => void;
  onUpdateCartItemQty: (cartItemId: string, quantity: number) => void;
  onUpdateCartItemPrice?: (cartItemId: string, newUnitPrice: number) => void;
  onRemoveCartItem: (cartItemId: string) => void;
  onClearCart: () => void;
  onOpenMatrixModal: (product: MasterProduct) => void;
  onOpenBarcodeModal: () => void;
  onOpenHoldModal: () => void;
  onOpenCheckoutModal: () => void;
  onSaveHoldCart: () => void;
  onOpenLayawayModal: () => void;
}

export const RegisterPOS: React.FC<RegisterPOSProps> = ({
  products,
  cart,
  stores,
  activeStoreId,
  transactions,
  currentUser,
  systemSettings,
  onViewReceipt,
  onAddToCart,
  onUpdateCartItemQty,
  onUpdateCartItemPrice,
  onRemoveCartItem,
  onClearCart,
  onOpenMatrixModal,
  onOpenBarcodeModal,
  onOpenCheckoutModal,
  onSaveHoldCart,
  onOpenLayawayModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isStatsExpanded, setIsStatsExpanded] = useState(true);
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const categories: (ProductCategory | 'All')[] = [
    'All',
    'Jackets & Outerwear',
    'Tops & Shirts',
    'Dresses & Skirts',
    'Pants & Denim',
    'Knitwear & Sweaters',
    'Accessories & Bags',
  ];

  const activeStore = stores.find((s) => s.id === activeStoreId);

  // Calculate today's shift metrics for active store
  const todayDateStr = new Date().toISOString().split('T')[0];

  const storeTodayTransactions = (transactions || []).filter((tx) => {
    if (tx.storeId && tx.storeId !== activeStoreId) return false;
    if (!tx.date) return false;
    try {
      const txDateStr = new Date(tx.date).toISOString().split('T')[0];
      return txDateStr === todayDateStr || tx.date.startsWith(todayDateStr);
    } catch {
      return false;
    }
  });

  const completedTodayTx = storeTodayTransactions.filter((tx) => tx.status !== 'returned');
  const todaySalesCount = completedTodayTx.length;
  const shiftTotal = completedTodayTx.reduce((sum, tx) => sum + (tx.total || 0), 0);
  const avgBasketValue = todaySalesCount > 0 ? shiftTotal / todaySalesCount : 0;
  const todayReturnsCount = storeTodayTransactions.filter((tx) => tx.status === 'returned').length;

  // Identify most recent transaction for quick receipt reprint
  const lastTransaction = (transactions || []).find((tx) => !tx.storeId || tx.storeId === activeStoreId) || (transactions || [])[0];

  // Calculate shift payment breakdown for tooltip & modal
  let shiftCashTotal = 0, shiftCashCount = 0;
  let shiftMpesaTotal = 0, shiftMpesaCount = 0;
  let shiftCardTotal = 0, shiftCardCount = 0;
  let shiftOtherTotal = 0, shiftOtherCount = 0;

  completedTodayTx.forEach((tx) => {
    if (tx.payments && tx.payments.length > 0) {
      tx.payments.forEach((p) => {
        const amt = p.amount || 0;
        if (p.method === 'cash') {
          shiftCashTotal += amt;
          shiftCashCount += 1;
        } else if (p.method === 'mpesa') {
          shiftMpesaTotal += amt;
          shiftMpesaCount += 1;
        } else if (p.method === 'card') {
          shiftCardTotal += amt;
          shiftCardCount += 1;
        } else {
          shiftOtherTotal += amt;
          shiftOtherCount += 1;
        }
      });
    } else {
      shiftCashTotal += (tx.total || 0);
      shiftCashCount += 1;
    }
  });

  // Filter products by category & search query (title, styleNumber, tags, variant SKUs)
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const q = searchTerm.toLowerCase().trim();

    if (!q) return matchesCategory;

    const matchesTitle = p.title.toLowerCase().includes(q);
    const matchesStyle = p.styleNumber.toLowerCase().includes(q);
    const matchesTag = p.tags.some((t) => t.toLowerCase().includes(q));
    const matchesVariant = p.variants.some(
      (v) => v.sku.toLowerCase().includes(q) || v.barcode.includes(q)
    );

    return matchesCategory && (matchesTitle || matchesStyle || matchesTag || matchesVariant);
  });

  // Calculate cart subtotal
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const grandTotal = subtotal;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 max-w-7xl mx-auto">
      
      {/* Left Area: Product Search & Apparel Matrix Catalog (8 Cols) */}
      <div className="lg:col-span-7 space-y-4">

        {/* Quick Stats Summary Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-extrabold text-slate-100 uppercase tracking-wider">
                    Quick Shift Stats
                  </h3>
                  <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    ACTIVE SHIFT
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {activeStore?.name || 'Current Terminal'} {currentUser ? `• Cashier: ${currentUser.name}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 relative">
              {/* Payment Breakdown Button & Tooltip Trigger */}
              <div className="relative">
                <button
                  onClick={() => setIsBreakdownModalOpen(true)}
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] px-2.5 py-1.5 rounded-xl border border-slate-700 transition-colors shadow-sm"
                  title="Hover or click for active shift payment breakdown"
                >
                  <PieChart className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="hidden sm:inline">Shift Breakdown</span>
                </button>

                {/* Floating Hover Tooltip Popover */}
                {showTooltip && (
                  <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-slate-950 border border-slate-800 rounded-2xl p-3.5 shadow-2xl text-slate-100 space-y-2.5 animate-in fade-in duration-200 pointer-events-none">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                        <PieChart className="w-3 h-3" /> Shift Payment Breakdown
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">
                        {todaySalesCount} txns
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs font-mono">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="flex items-center gap-1 text-[11px] font-sans font-medium text-emerald-400">
                          <Banknote className="w-3.5 h-3.5" /> Cash
                        </span>
                        <span className="font-extrabold text-slate-100">
                          {formatCurrency(shiftCashTotal)} ({shiftCashCount})
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-300">
                        <span className="flex items-center gap-1 text-[11px] font-sans font-medium text-emerald-300">
                          <Smartphone className="w-3.5 h-3.5" /> M-Pesa
                        </span>
                        <span className="font-extrabold text-slate-100">
                          {formatCurrency(shiftMpesaTotal)} ({shiftMpesaCount})
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-300">
                        <span className="flex items-center gap-1 text-[11px] font-sans font-medium text-blue-400">
                          <CreditCard className="w-3.5 h-3.5" /> Card
                        </span>
                        <span className="font-extrabold text-slate-100">
                          {formatCurrency(shiftCardTotal)} ({shiftCardCount})
                        </span>
                      </div>

                      {shiftOtherTotal > 0 && (
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="flex items-center gap-1 text-[11px] font-sans font-medium text-amber-400">
                            <Zap className="w-3.5 h-3.5" /> Other
                          </span>
                          <span className="font-extrabold text-slate-100">
                            {formatCurrency(shiftOtherTotal)} ({shiftOtherCount})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-sans text-slate-400">
                      <span>Full Report, CSV & Print</span>
                      <span className="text-amber-400 font-bold">Click to Open →</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  if (lastTransaction) {
                    onViewReceipt?.(lastTransaction);
                  }
                }}
                disabled={!lastTransaction}
                className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800/80 disabled:text-slate-500 disabled:border-slate-800 text-slate-950 font-extrabold text-[11px] px-3 py-1.5 rounded-xl border border-amber-400/30 shadow-sm transition-all active:scale-95 disabled:active:scale-100"
                title={
                  lastTransaction 
                    ? `Reprint Receipt #${lastTransaction.receiptNumber || lastTransaction.id}` 
                    : "No recent transaction available"
                }
              >
                <Printer className="w-3.5 h-3.5 shrink-0 text-slate-950 group-disabled:text-slate-500" />
                <span className="hidden sm:inline">Print Last Receipt</span>
                <span className="sm:hidden">Reprint</span>
              </button>

              <button
                onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                className="text-slate-400 hover:text-slate-200 text-[11px] font-medium flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 transition-colors"
                title={isStatsExpanded ? "Minimize stats view" : "Expand stats view"}
              >
                <span>{isStatsExpanded ? 'Minimize' : 'Expand'}</span>
                {isStatsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {isStatsExpanded && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              {/* Today's Total Sales Count */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                  Today's Sales Count
                  <Receipt className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                </span>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-lg font-mono font-extrabold text-slate-100">
                    {todaySalesCount}
                  </p>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {todaySalesCount === 1 ? 'order' : 'orders'}
                  </span>
                </div>
                {todayReturnsCount > 0 ? (
                  <span className="text-[9px] text-rose-400/80 font-mono block">
                    ({todayReturnsCount} return{todayReturnsCount > 1 ? 's' : ''})
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-500 font-mono block">
                    Completed today
                  </span>
                )}
              </div>

              {/* Current Shift Total */}
              <div 
                onClick={() => setIsBreakdownModalOpen(true)}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="bg-slate-950 p-3 rounded-xl border border-amber-500/30 hover:border-amber-500/60 bg-gradient-to-br from-amber-500/10 via-slate-950 to-transparent space-y-1 cursor-pointer transition-all group"
                title="Click to open payment breakdown, export CSV or print shift report"
              >
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center justify-between">
                  Current Shift Total
                  <Banknote className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                </span>
                <p className="text-lg font-mono font-extrabold text-amber-300">
                  {formatCurrency(shiftTotal)}
                </p>
                <span className="text-[9px] text-slate-400 font-mono block truncate flex items-center justify-between">
                  <span>Total revenue earned</span>
                  <span className="text-amber-400 font-sans font-bold text-[8px] uppercase">View Breakdown →</span>
                </span>
              </div>

              {/* Avg Sale Value */}
              <div className="col-span-2 sm:col-span-1 bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                  Avg. Order Value
                  <Zap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                </span>
                <p className="text-lg font-mono font-extrabold text-indigo-300">
                  {formatCurrency(avgBasketValue)}
                </p>
                <span className="text-[9px] text-slate-500 font-mono block">
                  Average per sale
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Search & Barcode Quick Action */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Title, Style #, SKU, or Barcode..."
              className="w-full bg-slate-900 text-slate-100 text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:border-amber-500 outline-none shadow-inner"
            />
          </div>

          <button
            onClick={onOpenBarcodeModal}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-700 transition-colors shrink-0"
            title="Scan Garment Tag"
          >
            <Barcode className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Scan Tag</span>
          </button>
        </div>

        {/* Category Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredProducts.map((prod) => {
            // Calculate total stock across variants for current store
            const totalStoreStock = prod.variants.reduce(
              (sum, v) => sum + (v.stockByStore[activeStoreId] || 0),
              0
            );

            // Extract unique colors and sizes
            const availableSizes = Array.from(new Set(prod.variants.map((v) => v.size)));

            return (
              <div
                key={prod.id}
                onClick={() => onOpenMatrixModal(prod)}
                className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-all hover:shadow-lg group relative overflow-hidden"
              >
                {/* Image & Price */}
                <div>
                  <div className="aspect-4/3 rounded-lg overflow-hidden bg-slate-950 mb-2 relative">
                    <img
                      src={prod.image}
                      alt={prod.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-1.5 right-1.5 bg-slate-950/80 backdrop-blur-sm text-amber-400 text-xs font-extrabold px-2 py-0.5 rounded-full border border-amber-500/20">
                      {formatCurrency(prod.basePrice)}
                    </div>
                  </div>

                  <span className="text-[10px] text-amber-400 font-mono font-bold block">
                    {prod.styleNumber}
                  </span>
                  <h3 className="text-xs font-bold text-slate-100 line-clamp-1 group-hover:text-amber-300 transition-colors">
                    {prod.title}
                  </h3>

                  {/* Size Matrix Badge Preview */}
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    {availableSizes.slice(0, 4).map((sz) => (
                      <span
                        key={sz}
                        className="bg-slate-950 border border-slate-800 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded text-slate-300"
                      >
                        {sz}
                      </span>
                    ))}
                    {availableSizes.length > 4 && (
                      <span className="text-[9px] text-slate-500 font-mono">
                        +{availableSizes.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stock Footer */}
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-slate-500" />
                    Matrix
                  </span>

                  <span
                    className={`font-mono font-bold ${
                      totalStoreStock > 5
                        ? 'text-emerald-400'
                        : totalStoreStock > 0
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {totalStoreStock > 0 ? `${totalStoreStock} in store` : 'Out of Stock'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Right Area: Active Cart Drawer (5 Cols) */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xl space-y-4">
        
        {/* Cart Header */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h2 className="font-bold text-base text-slate-100">Register Cart</h2>
              <span className="bg-amber-500/20 text-amber-300 font-bold text-xs px-2 py-0.5 rounded-full border border-amber-500/30">
                {cart.reduce((a, b) => a + b.quantity, 0)} Items
              </span>
            </div>

            {cart.length > 0 && (
              <button
                onClick={onClearCart}
                className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-xs flex items-center gap-1"
                title="Clear entire cart"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>

          {/* Location Indicator */}
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-2 bg-slate-950 p-2 rounded-lg border border-slate-800/80">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Fulfilling from: <strong className="text-slate-200">{activeStore?.name}</strong></span>
          </div>
        </div>

        {/* Cart Itemized List */}
        <div className="flex-1 overflow-y-auto max-h-[380px] space-y-2.5 pr-1 no-scrollbar">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <ShoppingBag className="w-10 h-10 mx-auto text-slate-700 stroke-1" />
              <p className="text-xs font-semibold">No apparel items in cart yet</p>
              <p className="text-[11px] text-slate-600">
                Click a clothing card or scan a barcode tag to select size/color.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.cartItemId}
                className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex flex-col space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Thumbnail */}
                  <img
                    src={item.product.image}
                    alt={item.product.title}
                    className="w-12 h-12 object-cover rounded-lg bg-slate-900 border border-slate-800 shrink-0"
                  />

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-100 truncate">{item.product.title}</h4>
                    
                    {/* Variant Badge */}
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                      <span className="bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-500/30">
                        Size {item.variant.size}
                      </span>
                      <span className="text-slate-400 font-medium truncate">{item.variant.color}</span>
                      <span className="text-slate-600 font-mono">({item.variant.sku})</span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-300 mt-1">
                      {formatCurrency(item.unitPrice)} x {item.quantity} ={' '}
                      <strong className="text-amber-400">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </strong>
                    </div>
                  </div>

                  {/* Quantity Actions & Delete */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 p-1">
                      <button
                        onClick={() => onUpdateCartItemQty(item.cartItemId, item.quantity - 1)}
                        className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold font-mono text-xs text-amber-400">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateCartItemQty(item.cartItemId, item.quantity + 1)}
                        className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveCartItem(item.cartItemId)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Bargained Unit Price Input Bar & Live Profit Calculation */}
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5 bg-slate-900/60 p-2 rounded-lg">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-slate-400 font-semibold">Bargained Unit Price:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex items-center">
                        <span className="text-slate-500 text-[10px] absolute left-2 font-mono font-bold">KSh</span>
                        <input
                          type="number"
                          min={0}
                          value={item.unitPrice}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (onUpdateCartItemPrice) {
                              onUpdateCartItemPrice(item.cartItemId, isNaN(val) ? 0 : val);
                            }
                          }}
                          placeholder="0"
                          className="w-24 bg-slate-950 text-amber-400 font-mono font-extrabold text-xs pl-9 pr-2 py-1 rounded-lg border border-slate-800 focus:border-amber-500 outline-none"
                        />
                      </div>
                      {item.unitPrice !== item.product.basePrice && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                          Overridden
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Profit & Margin Display for Bargained Price */}
                  {(() => {
                    const itemCost = item.product?.costPrice || 0;
                    const unitProfit = item.unitPrice - itemCost;
                    const totalItemProfit = unitProfit * item.quantity;
                    const marginPct = item.unitPrice > 0 ? (unitProfit / item.unitPrice) * 100 : 0;

                    return (
                      <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-800/60">
                        <span className="text-slate-400">
                          Unit Cost: <strong className="font-mono text-slate-300">{formatCurrency(itemCost)}</strong>
                        </span>
                        <span
                          className={`font-mono font-extrabold px-2 py-0.5 rounded border text-[10px] ${
                            unitProfit > 0
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : unitProfit === 0
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          Profit: {unitProfit >= 0 ? '+' : ''}{formatCurrency(totalItemProfit)} ({marginPct.toFixed(1)}% margin)
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Totals & Actions */}
        <div className="border-t border-slate-800 pt-3 space-y-3">
          
          {/* Subtotal, Cost & Expected Profit */}
          {(() => {
            const totalCartCost = cart.reduce((sum, item) => sum + ((item.product?.costPrice || 0) * item.quantity), 0);
            const estimatedCartProfit = grandTotal - totalCartCost;
            const overallMarginPct = grandTotal > 0 ? (estimatedCartProfit / grandTotal) * 100 : 0;

            return (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Cost of Goods:</span>
                  <span className="font-mono">{formatCurrency(totalCartCost)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-800/80">
                  <span className="text-slate-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Estimated Profit:
                  </span>
                  <span
                    className={`font-mono font-extrabold ${
                      estimatedCartProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {estimatedCartProfit >= 0 ? '+' : ''}{formatCurrency(estimatedCartProfit)} ({overallMarginPct.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-100 pt-1.5 border-t border-slate-800">
                  <span>Total Payable:</span>
                  <span className="text-amber-400 font-mono">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            );
          })()}

          {/* Action Row: Hold, Layaway, Checkout */}
          <div className="grid grid-cols-2 gap-2">
            <button
              disabled={cart.length === 0}
              onClick={onSaveHoldCart}
              className={`py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all border ${
                cart.length === 0
                  ? 'border-slate-800 text-slate-600 cursor-not-allowed'
                  : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Hold Cart</span>
            </button>

            <button
              disabled={cart.length === 0}
              onClick={onOpenLayawayModal}
              className={`py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all border ${
                cart.length === 0
                  ? 'border-slate-800 text-slate-600 cursor-not-allowed'
                  : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer'
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-purple-400" />
              <span>Layaway Plan</span>
            </button>
          </div>

          {/* Pay Now Button */}
          <button
            disabled={cart.length === 0}
            onClick={onOpenCheckoutModal}
            className={`w-full py-3.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
              cart.length === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25 active:scale-98 cursor-pointer'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Process Payment ({formatCurrency(grandTotal)})</span>
          </button>

        </div>

      </div>

      {/* Shift Payment Breakdown & Export Modal */}
      <ShiftBreakdownModal
        isOpen={isBreakdownModalOpen}
        onClose={() => setIsBreakdownModalOpen(false)}
        transactions={transactions || []}
        activeStore={activeStore}
        currentUser={currentUser}
        systemSettings={systemSettings}
      />

    </div>
  );
};
