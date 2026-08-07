import React, { useState } from 'react';
import { 
  RotateCcw, 
  Search, 
  CheckCircle2, 
  ArrowRightLeft, 
  AlertCircle, 
  Barcode, 
  Layers, 
  DollarSign, 
  Smartphone, 
  CreditCard,
  RefreshCw,
  PackageCheck,
  PackageX,
  Calendar,
  User,
  Store,
  Filter,
  ArrowDownLeft,
  FileText,
  Boxes
} from 'lucide-react';
import { SaleTransaction, MasterProduct, ProductVariant, PaymentMethod, StoreLocation } from '../types';

interface ReturnsAndExchangesModalProps {
  transactions: SaleTransaction[];
  products: MasterProduct[];
  stores: StoreLocation[];
  activeStoreId: string;
  onProcessReturn: (
    transactionId: string,
    returnedVariantIds: string[],
    refundAmount: number,
    restock: boolean,
    refundMethod: PaymentMethod,
    returnReason?: string
  ) => void;
}

export const ReturnsAndExchangesModal: React.FC<ReturnsAndExchangesModalProps> = ({
  transactions,
  products,
  stores,
  activeStoreId,
  onProcessReturn,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'processor' | 'returned_goods'>('processor');
  const [searchQuery, setSearchQuery] = useState('');
  const [returnedSearchQuery, setReturnedSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<SaleTransaction | null>(null);
  
  // Return items selection
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(new Set());
  const [returnReason, setReturnReason] = useState<string>('Size Swap (Medium to Large)');
  const [restockInventory, setRestockInventory] = useState<boolean>(true);
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>('mpesa');
  const [processedSuccess, setProcessedSuccess] = useState<boolean>(false);

  // Filtered transactions for the return processor
  const filteredTransactions = transactions.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      t.receiptNumber.toLowerCase().includes(q) ||
      (t.customerName && t.customerName.toLowerCase().includes(q))
    );
  });

  // Returned transactions list
  const returnedTransactions = transactions.filter((t) => t.status === 'returned');

  // Filtered returned transactions for the Returned Goods tab
  const filteredReturnedTransactions = returnedTransactions.filter((t) => {
    const q = returnedSearchQuery.toLowerCase().trim();
    if (!q) return true;
    const itemsMatch = t.items.some(
      (i) =>
        i.product.title.toLowerCase().includes(q) ||
        i.variant.sku.toLowerCase().includes(q) ||
        i.variant.color.toLowerCase().includes(q)
    );
    return (
      t.receiptNumber.toLowerCase().includes(q) ||
      (t.customerName && t.customerName.toLowerCase().includes(q)) ||
      (t.returnReason && t.returnReason.toLowerCase().includes(q)) ||
      itemsMatch
    );
  });

  // Calculate Returned Goods metrics
  const totalReturnedValue = returnedTransactions.reduce(
    (sum, t) => sum + (t.refundAmount || t.total),
    0
  );

  const totalReturnedItemsCount = returnedTransactions.reduce((sum, t) => {
    if (t.returnedVariantIds && t.returnedVariantIds.length > 0) {
      return sum + t.returnedVariantIds.length;
    }
    return sum + t.items.length;
  }, 0);

  const restockedItemsCount = returnedTransactions.filter((t) => t.restocked !== false).length;

  const toggleSelectVariant = (variantId: string) => {
    const next = new Set(selectedVariantIds);
    if (next.has(variantId)) {
      next.delete(variantId);
    } else {
      next.add(variantId);
    }
    setSelectedVariantIds(next);
  };

  // Calculate total refund
  const refundAmount = selectedTx
    ? selectedTx.items
        .filter((item) => selectedVariantIds.has(item.variant.id))
        .reduce((sum, item) => sum + item.unitPrice * item.quantity - item.discountAmount, 0)
    : 0;

  const handleConfirmReturn = () => {
    if (!selectedTx || selectedVariantIds.size === 0) return;

    onProcessReturn(
      selectedTx.id,
      Array.from(selectedVariantIds),
      refundAmount,
      restockInventory,
      refundMethod,
      returnReason
    );

    setProcessedSuccess(true);
    setTimeout(() => {
      setProcessedSuccess(false);
      setSelectedTx(null);
      setSelectedVariantIds(new Set());
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Header & Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 shrink-0">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Returns & Garment Swaps</h2>
            <p className="text-xs text-slate-400">
              Process garment returns, inspect past returned goods, and auto-restock inventory
            </p>
          </div>
        </div>

        {/* View Mode Toggle Switcher */}
        <div className="flex items-center bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('processor')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'processor'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Process Return / Swap</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('returned_goods')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all relative ${
              activeSubTab === 'returned_goods'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>Returned Goods Log</span>
            {returnedTransactions.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold ${
                activeSubTab === 'returned_goods' ? 'bg-slate-950 text-amber-400' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {returnedTransactions.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: RETURN PROCESSOR */}
      {activeSubTab === 'processor' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Transaction Search List (5 Cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Past Sales Receipts ({filteredTransactions.length}):
                </h3>

                {/* Quick Search */}
                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search receipt #..."
                    className="w-full bg-slate-950 text-slate-100 text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1 no-scrollbar">
                {filteredTransactions.map((tx) => {
                  const isSelected = selectedTx?.id === tx.id;
                  const isReturned = tx.status === 'returned';
                  return (
                    <div
                      key={tx.id}
                      onClick={() => {
                        setSelectedTx(tx);
                        setSelectedVariantIds(new Set());
                      }}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 text-slate-100 shadow-md ring-1 ring-amber-500/30'
                          : isReturned
                          ? 'border-rose-500/30 bg-rose-500/5 text-slate-300 hover:border-rose-500/50'
                          : 'border-slate-800 bg-slate-900 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800/80 text-xs">
                        <strong className="font-mono text-amber-400 flex items-center gap-1.5">
                          {tx.receiptNumber}
                          {isReturned && (
                            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-sans px-1.5 py-0.2 rounded font-bold">
                              RETURNED
                            </span>
                          )}
                        </strong>
                        <span className="text-[10px] text-slate-400">
                          {new Date(tx.date).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="mt-2 text-xs flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-slate-100">{tx.customerName || 'Walk-In Customer'}</div>
                          <div className="text-[10px] text-slate-400">{tx.items.length} garment lines</div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono font-bold text-amber-400 text-sm">KSh {tx.total.toFixed(2)}</div>
                          <span className={`text-[10px] font-semibold uppercase ${
                            isReturned ? 'text-rose-400' : 'text-emerald-400'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Selected Receipt Inspection & Return Processor (7 Cols) */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              {!selectedTx ? (
                <div className="text-center py-20 text-slate-500 space-y-2">
                  <RotateCcw className="w-12 h-12 mx-auto text-slate-700 stroke-1" />
                  <h3 className="font-bold text-slate-400 text-sm">Select a Sales Receipt</h3>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    Choose a receipt from the left list to initiate item returns or garment size exchanges.
                  </p>
                </div>
              ) : (
                <>
                  {/* Receipt Info */}
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-slate-100">{selectedTx.receiptNumber}</h3>
                        <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded">
                          {selectedTx.cashierName}
                        </span>
                        {selectedTx.status === 'returned' && (
                          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] px-2 py-0.5 rounded font-bold">
                            Returned Item
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        Customer: {selectedTx.customerName || 'Walk-In'} • Date:{' '}
                        {new Date(selectedTx.date).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Original Total:</span>
                      <span className="font-mono font-extrabold text-amber-400 text-base">
                        KSh {selectedTx.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Items Picker */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                      Select Items To Return / Exchange:
                    </label>

                    <div className="space-y-2">
                      {selectedTx.items.map((item) => {
                        const isChecked = selectedVariantIds.has(item.variant.id);
                        return (
                          <div
                            key={item.cartItemId}
                            onClick={() => toggleSelectVariant(item.variant.id)}
                            className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                              isChecked
                                ? 'border-amber-500 bg-amber-500/10 text-slate-100'
                                : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelectVariant(item.variant.id)}
                                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                              />
                              <img
                                src={item.product.image}
                                alt={item.product.title}
                                className="w-10 h-10 object-cover rounded-lg bg-slate-900 border border-slate-800"
                              />
                              <div>
                                <div className="font-bold text-xs text-slate-100">{item.product.title}</div>
                                <div className="text-[10px] text-slate-400">
                                  {item.variant.color} • Size <strong className="text-amber-400">{item.variant.size}</strong> • SKU {item.variant.sku}
                                </div>
                              </div>
                            </div>

                            <div className="text-right font-mono font-bold text-xs text-slate-200">
                              KSh {(item.unitPrice * item.quantity - item.discountAmount).toFixed(2)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Return Options Form */}
                  {selectedVariantIds.size > 0 && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4 text-xs">
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-300 font-semibold block mb-1">Return / Swap Reason:</label>
                          <select
                            value={returnReason}
                            onChange={(e) => setReturnReason(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 outline-none"
                          >
                            <option value="Size Swap (Medium to Large)">Size Swap (Medium to Large)</option>
                            <option value="Size Swap (Small to Medium)">Size Swap (Small to Medium)</option>
                            <option value="Color Swap">Color Swap</option>
                            <option value="Changed Mind">Changed Mind</option>
                            <option value="Minor Garment Defect">Minor Garment Defect</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-slate-300 font-semibold block mb-1">Refund Channel:</label>
                          <select
                            value={refundMethod}
                            onChange={(e) => setRefundMethod(e.target.value as PaymentMethod)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 outline-none"
                          >
                            <option value="mpesa">📱 M-Pesa Mobile Refund</option>
                            <option value="store_credit">🎁 Issue Store Credit / Gift Voucher</option>
                            <option value="cash">💵 Cash Refund</option>
                          </select>
                        </div>
                      </div>

                      {/* Restock Toggle */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        <div>
                          <span className="font-bold text-slate-200 block">Automatic Real-Time Restock:</span>
                          <span className="text-[10px] text-slate-400">
                            Places returned garment straight back into store inventory.
                          </span>
                        </div>

                        <input
                          type="checkbox"
                          checked={restockInventory}
                          onChange={(e) => setRestockInventory(e.target.checked)}
                          className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                        />
                      </div>

                      {/* Calculated Refund */}
                      <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-extrabold">
                        <span className="text-slate-200">Total Refund Due:</span>
                        <span className="text-emerald-400 font-mono text-base">KSh {refundAmount.toFixed(2)}</span>
                      </div>

                    </div>
                  )}

                  {/* Confirm Return Button */}
                  {processedSuccess ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl text-center text-emerald-300 font-bold text-xs flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Return Processed & Inventory Updated Successfully!</span>
                    </div>
                  ) : (
                    <button
                      disabled={selectedVariantIds.size === 0}
                      onClick={handleConfirmReturn}
                      className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                        selectedVariantIds.size === 0
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20'
                      }`}
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Process Garment Return (KSh {refundAmount.toFixed(2)})</span>
                    </button>
                  )}

                </>
              )}
            </div>

          </div>

          {/* Quick Returned Goods Banner at Bottom of Processor */}
          {returnedTransactions.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-200">
                    {returnedTransactions.length} Returned Receipt(s) Logged
                  </h4>
                  <p className="text-xs text-slate-400">
                    Total returned goods value: <strong className="text-rose-400 font-mono">KSh {totalReturnedValue.toLocaleString()}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveSubTab('returned_goods')}
                className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition-all"
              >
                View Full Returned Goods Log →
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: RETURNED GOODS LOG & INVENTORY RESTOCKS */}
      {activeSubTab === 'returned_goods' && (
        <div className="space-y-6">
          
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Refund Value</span>
                <span className="font-mono font-extrabold text-lg text-rose-400">KSh {totalReturnedValue.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Returned Receipts</span>
                <span className="font-mono font-extrabold text-lg text-amber-300">{returnedTransactions.length}</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <PackageCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Returned Garments</span>
                <span className="font-mono font-extrabold text-lg text-emerald-300">{totalReturnedItemsCount} items</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Restocked to Stock</span>
                <span className="font-mono font-extrabold text-lg text-blue-300">{restockedItemsCount} transactions</span>
              </div>
            </div>
          </div>

          {/* Search Bar for Returned Goods */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2 shrink-0">
              <PackageCheck className="w-4 h-4 text-emerald-400" />
              Returned Goods & Restock Logs
            </h3>

            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={returnedSearchQuery}
                onChange={(e) => setReturnedSearchQuery(e.target.value)}
                placeholder="Search returned product, receipt, reason..."
                className="w-full bg-slate-950 text-slate-100 text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-800 focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Returned Goods List */}
          {filteredReturnedTransactions.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-3">
              <PackageX className="w-12 h-12 mx-auto text-slate-700 stroke-1" />
              <h3 className="font-bold text-slate-400 text-sm">No Returned Goods Found</h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                No items match your query. Processed returns will appear here with full inventory restock details.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReturnedTransactions.map((tx) => {
                const isRestocked = tx.restocked !== false;
                const refundMethodLabel =
                  tx.refundMethod === 'mpesa'
                    ? '📱 M-Pesa'
                    : tx.refundMethod === 'store_credit'
                    ? '🎁 Store Credit'
                    : '💵 Cash';

                return (
                  <div
                    key={tx.id}
                    className="bg-slate-900 border border-slate-800/90 rounded-2xl p-5 shadow-lg space-y-4 hover:border-slate-700/80 transition-all"
                  >
                    {/* Top Row: Receipt Info & Reason */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-amber-400 text-sm bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                          {tx.receiptNumber}
                        </span>
                        <span className="text-slate-400 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          {tx.customerName || 'Walk-In Customer'}
                        </span>
                        <span className="text-slate-500 text-[11px] hidden md:inline">
                          • Cashier: {tx.cashierName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Reason Badge */}
                        <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                          Reason: {tx.returnReason || 'Size Swap / Return'}
                        </span>

                        {/* Date */}
                        <span className="text-slate-400 text-xs flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {new Date(tx.returnedAt || tx.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Returned Garment Items */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Returned Items ({tx.items.length}):
                      </span>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {tx.items.map((item) => (
                          <div
                            key={item.cartItemId}
                            className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={item.product.image}
                                alt={item.product.title}
                                className="w-11 h-11 object-cover rounded-lg bg-slate-900 border border-slate-800 shrink-0"
                              />
                              <div>
                                <h5 className="font-bold text-xs text-slate-100">{item.product.title}</h5>
                                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                  <span>Color: {item.variant.color}</span>
                                  <span>•</span>
                                  <span className="text-amber-400 font-bold">Size: {item.variant.size}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">SKU: {item.variant.sku}</div>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="font-mono font-bold text-xs text-slate-200 block">
                                KSh {(item.unitPrice * item.quantity - item.discountAmount).toLocaleString()}
                              </span>
                              <span className="text-[10px] text-slate-400">Qty: {item.quantity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Row: Refund & Restock Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Restock Status:</span>
                        {isRestocked ? (
                          <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Restocked to Inventory
                          </span>
                        ) : (
                          <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                            Not Restocked
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">Refund Channel: <strong className="text-slate-200">{refundMethodLabel}</strong></span>
                        <div className="bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-xl text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block leading-none">Total Refund</span>
                          <span className="font-mono font-extrabold text-rose-400 text-sm">
                            KSh {(tx.refundAmount || tx.total).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

    </div>
  );
};

