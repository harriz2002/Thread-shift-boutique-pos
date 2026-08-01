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
  RefreshCw
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
    refundMethod: PaymentMethod
  ) => void;
}

export const ReturnsAndExchangesModal: React.FC<ReturnsAndExchangesModalProps> = ({
  transactions,
  products,
  stores,
  activeStoreId,
  onProcessReturn,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<SaleTransaction | null>(null);
  
  // Return items selection
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(new Set());
  const [returnReason, setReturnReason] = useState<string>('Size Swap');
  const [restockInventory, setRestockInventory] = useState<boolean>(true);
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>('mpesa');
  const [processedSuccess, setProcessedSuccess] = useState<boolean>(false);

  const filteredTransactions = transactions.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      t.receiptNumber.toLowerCase().includes(q) ||
      (t.customerName && t.customerName.toLowerCase().includes(q))
    );
  });

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
      refundMethod
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
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Returns & Garment Swaps</h2>
            <p className="text-xs text-slate-400">
              Lookup receipts, exchange garment sizes, & automatically restock inventory
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Receipt # (e.g. REC-2026-8901)..."
            className="w-full bg-slate-950 text-slate-100 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:border-amber-500 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Transaction Search List (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Past Sales Receipts ({filteredTransactions.length}):
          </h3>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
            {filteredTransactions.map((tx) => {
              const isSelected = selectedTx?.id === tx.id;
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
                      : 'border-slate-800 bg-slate-900 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800/80 text-xs">
                    <strong className="font-mono text-amber-400">{tx.receiptNumber}</strong>
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
                      <div className="font-mono font-bold text-amber-400 text-sm">${tx.total.toFixed(2)}</div>
                      <span className="text-[10px] text-emerald-400 font-semibold uppercase">{tx.status}</span>
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
              <p className="text-xs text-slate-600">
                Choose a receipt from the left list to initiate item returns or size exchanges.
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
                  </div>
                  <p className="text-xs text-slate-400">
                    Customer: {selectedTx.customerName || 'Walk-In'} • Date:{' '}
                    {new Date(selectedTx.date).toLocaleString()}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Original Total:</span>
                  <span className="font-mono font-extrabold text-amber-400 text-base">
                    ${selectedTx.total.toFixed(2)}
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
                          ${(item.unitPrice * item.quantity - item.discountAmount).toFixed(2)}
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
                        <option value="Size Swap">Size Swap (e.g. Medium to Large)</option>
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
                    <span className="text-emerald-400 font-mono text-base">${refundAmount.toFixed(2)}</span>
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
                  <span>Process Garment Return (${refundAmount.toFixed(2)})</span>
                </button>
              )}

            </>
          )}
        </div>

      </div>

    </div>
  );
};
