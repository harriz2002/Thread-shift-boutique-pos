import React, { useState } from 'react';
import { 
  Clock, 
  Tag, 
  Trash2, 
  Play, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  DollarSign, 
  Smartphone, 
  X,
  CreditCard,
  User,
  ShoppingBag,
  Search,
  Printer,
  FileCheck,
  Phone,
  ShieldCheck
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { HoldCart, LayawayPlan, CartItem, PaymentMethod, StoreLocation, SystemSettings } from '../types';
import { formatCurrency, maskPhoneNumber } from '../utils/format';

interface HoldAndLayawayModalProps {
  holds: HoldCart[];
  layaways: LayawayPlan[];
  stores: StoreLocation[];
  activeStoreId: string;
  systemSettings?: SystemSettings;
  onRestoreHoldCart: (hold: HoldCart) => void;
  onDeleteHoldCart: (holdId: string) => void;
  onAddLayawayPayment: (
    layawayId: string,
    amount: number,
    method: PaymentMethod,
    reference: string
  ) => void;
  onCompleteLayaway: (layawayId: string) => void;
}

export const HoldAndLayawayModal: React.FC<HoldAndLayawayModalProps> = ({
  holds,
  layaways,
  stores,
  activeStoreId,
  systemSettings,
  onRestoreHoldCart,
  onDeleteHoldCart,
  onAddLayawayPayment,
  onCompleteLayaway,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'holds' | 'layaways' | 'cleared'>('layaways');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected layaway for recording payment
  const [selectedLayaway, setSelectedLayaway] = useState<LayawayPlan | null>(null);

  // Selected layaway for viewing/printing receipt
  const [receiptLayaway, setReceiptLayaway] = useState<LayawayPlan | null>(null);

  const receiptStore = receiptLayaway 
    ? (stores.find((s) => s.id === receiptLayaway.storeId) || stores.find((s) => s.id === activeStoreId) || stores[0])
    : null;
  const storeName = receiptStore?.name || systemSettings?.businessName || 'Threads & Style Boutique';

  const qrDataText = receiptLayaway ? [
    `=== LAYAWAY RECEIPT VERIFICATION ===`,
    `Boutique / Store: ${storeName}`,
    `Plan Number: ${receiptLayaway.planNumber}`,
    `Customer Name: ${receiptLayaway.customerName}`,
    `Status: ${receiptLayaway.status.toUpperCase()}`,
    ``,
    `--- ITEMS RESERVED ---`,
    receiptLayaway.cartItems.map((item, idx) => 
      `${idx + 1}. ${item.product.title} (${item.variant.color}/${item.variant.size}) x${item.quantity}`
    ).join('\n'),
    ``,
    `Total Value: ${formatCurrency(receiptLayaway.totalAmount)}`,
    `Amount Paid: ${formatCurrency(receiptLayaway.depositPaid)}`,
    `Balance Due: ${formatCurrency(receiptLayaway.balanceDue)}`
  ].join('\n') : '';

  // Layaway payment popup state
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [paymentRef, setPaymentRef] = useState<string>('');

  // Handle Recording Installment
  const handleRecordPayment = () => {
    if (!selectedLayaway) return;
    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0) return;

    const ref = paymentRef || `MP-LAY-${Math.floor(1000 + Math.random() * 9000)}`;
    onAddLayawayPayment(selectedLayaway.id, amt, paymentMethod, ref);

    setSelectedLayaway(null);
    setPaymentAmount('');
    setPaymentRef('');
  };

  // Handle Release Goods -> Generate Receipt & Complete
  const handleReleaseGoods = (plan: LayawayPlan) => {
    onCompleteLayaway(plan.id);
    // Open Release Receipt
    setReceiptLayaway({
      ...plan,
      status: 'completed',
      balanceDue: 0,
    });
  };

  // Filter Layaways & Holds based on Search Query (Customer name, phone number, or product name)
  const filteredLayaways = layaways.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const matchName = p.customerName.toLowerCase().includes(q);
    const matchPhone = (p.customerPhone || '').toLowerCase().includes(q);
    const matchPlan = p.planNumber.toLowerCase().includes(q);
    const matchProduct = p.cartItems.some(
      (item) =>
        item.product.title.toLowerCase().includes(q) ||
        item.variant.color.toLowerCase().includes(q) ||
        item.variant.sku.toLowerCase().includes(q)
    );
    return matchName || matchPhone || matchPlan || matchProduct;
  });

  const activeLayawaysList = filteredLayaways.filter((p) => p.status !== 'completed');
  const clearedLayawaysList = filteredLayaways.filter((p) => p.status === 'completed');

  const filteredHolds = holds.filter((h) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const matchName = h.customerName.toLowerCase().includes(q);
    const matchCode = h.holdCode.toLowerCase().includes(q);
    const matchProduct = h.cartItems.some((item) => item.product.title.toLowerCase().includes(q));
    return matchName || matchCode || matchProduct;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Search Bar & Sub Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800 gap-4">
        
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSubTab('layaways')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'layaways'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Active Layaways ({activeLayawaysList.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('cleared')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'cleared'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Cleared & Released Clothes ({clearedLayawaysList.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('holds')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'holds'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Held Carts ({filteredHolds.length})</span>
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone #, or product..."
            className="w-full bg-slate-950 text-slate-100 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-800 outline-none focus:border-amber-500"
          />
        </div>

      </div>

      {/* Holds Content */}
      {activeSubTab === 'holds' && (
        <div className="space-y-4">
          {filteredHolds.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-2">
              <Clock className="w-12 h-12 mx-auto text-slate-700 stroke-1" />
              <h3 className="text-sm font-bold text-slate-400">No Carts On Hold Found</h3>
              <p className="text-xs text-slate-600">
                When a customer needs time, click "Hold Cart" on the POS register to save their items here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHolds.map((h) => {
                const store = stores.find((s) => s.id === h.storeId);
                return (
                  <div
                    key={h.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg hover:border-amber-500/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <span className="font-mono font-bold text-amber-400 text-xs bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {h.holdCode}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(h.holdDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1">
                        <h4 className="font-bold text-slate-100 text-sm">{h.customerName}</h4>
                        {h.note && (
                          <p className="text-xs text-slate-400 italic">"{h.note}"</p>
                        )}
                        <p className="text-[11px] text-slate-500">Store: {store?.name}</p>
                      </div>

                      {/* Items Preview */}
                      <div className="mt-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 space-y-1.5 max-h-32 overflow-y-auto">
                        {h.cartItems.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-[11px]">
                            <span className="text-slate-300 truncate">
                              {item.product.title} (Sz {item.variant.size})
                            </span>
                            <span className="font-mono text-amber-400 shrink-0 font-bold">
                              x{item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <div className="text-xs">
                        <span className="text-slate-400 block text-[10px]">Total Value:</span>
                        <span className="font-mono font-extrabold text-amber-400 text-sm">
                          {formatCurrency(h.totalAmount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onDeleteHoldCart(h.id)}
                          className="p-2 text-slate-400 hover:text-rose-400 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors cursor-pointer"
                          title="Delete Hold"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onRestoreHoldCart(h)}
                          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Load to POS</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Active Layaways Content */}
      {activeSubTab === 'layaways' && (
        <div className="space-y-4">
          {activeLayawaysList.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-2">
              <Tag className="w-12 h-12 mx-auto text-slate-700 stroke-1" />
              <h3 className="text-sm font-bold text-slate-400">No Active Layaway Plans Found</h3>
              <p className="text-xs text-slate-600">
                Set up layaway deposit plans from the POS register for customers reserving apparel lines for future pickup.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeLayawaysList.map((plan) => {
                const percentPaid = Math.round((plan.depositPaid / plan.totalAmount) * 100);
                const isFullyPaid = plan.balanceDue <= 0;

                return (
                  <div
                    key={plan.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg hover:border-amber-500/40 transition-colors"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400 text-xs bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                          {plan.planNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isFullyPaid
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {isFullyPaid ? 'Fully Paid — Ready for Release' : 'Active Installments'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Date: {plan.startDate}</span>
                      </div>
                    </div>

                    {/* Customer & Items */}
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                          <User className="w-4 h-4 text-amber-400" />
                          {plan.customerName}
                        </h4>
                        <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-amber-400" />
                          {plan.customerPhone}
                        </span>
                      </div>

                      {plan.notes && (
                        <p className="text-xs text-slate-400 italic mt-0.5">"{plan.notes}"</p>
                      )}

                      <div className="mt-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1 max-h-28 overflow-y-auto">
                        {plan.cartItems.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-[11px]">
                            <span className="text-slate-300 truncate">
                              {it.product.title} ({it.variant.color} - Sz {it.variant.size})
                            </span>
                            <span className="font-mono text-amber-400 font-bold">{formatCurrency(it.unitPrice)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Installment Progress Bar */}
                    <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Total Plan Amount:</span>
                        <strong className="text-slate-100 font-mono">{formatCurrency(plan.totalAmount)}</strong>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-emerald-400">Amount Paid:</span>
                        <strong className="text-emerald-400 font-mono">{formatCurrency(plan.depositPaid)}</strong>
                      </div>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-rose-400">Balance to be Cleared:</span>
                        <strong className="text-rose-400 font-mono">{formatCurrency(plan.balanceDue)}</strong>
                      </div>

                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                          style={{ width: `${percentPaid}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setReceiptLayaway(plan)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
                        title="Print Layaway Receipt"
                      >
                        <Printer className="w-4 h-4 text-amber-400" />
                        <span>Receipt</span>
                      </button>

                      {!isFullyPaid ? (
                        <button
                          onClick={() => {
                            setSelectedLayaway(plan);
                            setPaymentAmount(plan.balanceDue.toString());
                          }}
                          className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                        >
                          <DollarSign className="w-4 h-4" />
                          <span>Record Installment Payment</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReleaseGoods(plan)}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Release Goods to Customer</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Cleared & Released Layaways Section */}
      {activeSubTab === 'cleared' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Cleared & Released Garments Log</span>
              </h3>
              <p className="text-xs text-slate-400">
                History of cleared layaway plans where goods have been handed over to customers
              </p>
            </div>
          </div>

          {clearedLayawaysList.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-2">
              <FileCheck className="w-12 h-12 mx-auto text-slate-700 stroke-1" />
              <h3 className="text-sm font-bold text-slate-400">No Cleared Layaways Yet</h3>
              <p className="text-xs text-slate-600">
                When a layaway plan balance is fully paid and "Release Goods" is clicked, it will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clearedLayawaysList.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 space-y-3 shadow-lg"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-mono font-bold text-emerald-400 text-xs bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                      {plan.planNumber}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Goods Released & Layaway Cleared
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-100 text-sm">{plan.customerName} ({plan.customerPhone})</h4>
                    <p className="text-xs text-slate-400 font-mono">Date Initiated: {plan.startDate}</p>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Cleared Clothes:</span>
                    {plan.cartItems.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-slate-300">
                        <span>{it.product.title} ({it.variant.color} - Sz {it.variant.size})</span>
                        <span className="font-mono text-emerald-400">x{it.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between text-xs pt-1 border-t border-slate-800">
                    <span className="text-slate-400">Total Cleared Amount:</span>
                    <strong className="text-emerald-400 font-mono">{formatCurrency(plan.totalAmount)}</strong>
                  </div>

                  <button
                    onClick={() => setReceiptLayaway(plan)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Print Release Receipt</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Record Layaway Payment Popup */}
      {selectedLayaway && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100">
                Record Installment — {selectedLayaway.planNumber}
              </h3>
              <button
                onClick={() => setSelectedLayaway(null)}
                className="text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Customer Name:</span>
                <strong className="text-slate-200">{selectedLayaway.customerName}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Phone Number:</span>
                <strong className="text-slate-200 font-mono">{selectedLayaway.customerPhone}</strong>
              </div>
              <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                <span>Current Balance Due:</span>
                <strong className="text-rose-400 font-mono">{formatCurrency(selectedLayaway.balanceDue)}</strong>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Payment Amount (Ksh):
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-amber-400 font-mono font-bold focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Payment Channel:
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none cursor-pointer"
                >
                  <option value="mpesa">📱 M-Pesa Mobile Money</option>
                  <option value="card">💳 Credit/Debit Card</option>
                  <option value="cash">💵 Cash</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Reference Code / Tx ID (Optional):
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. QK91Z882M"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-slate-200 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedLayaway(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                Save Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE LAYAWAY / RELEASE RECEIPT MODAL */}
      {receiptLayaway && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <style>{`
            @media print {
              /* Hide all screen components */
              body * {
                visibility: hidden !important;
              }
              /* Show ONLY the thermal receipt content */
              .printable-receipt, .printable-receipt * {
                visibility: visible !important;
              }
              /* Format the receipt to exact standard 80mm paper dimensions */
              .printable-receipt {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 80mm !important;
                max-width: 80mm !important;
                box-sizing: border-box !important;
                padding: 4mm 2mm !important;
                margin: 0 !important;
                border: none !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                background: #ffffff !important;
                color: #000000 !important;
              }
              /* Control print dimensions and margins for standard thermal printers */
              @page {
                size: 80mm auto;
                margin: 0;
              }
            }
          `}</style>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-100 space-y-4 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 no-print">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-400" />
                <span>
                  {receiptLayaway.status === 'completed' ? 'Release Goods Receipt' : 'Layaway Receipt'}
                </span>
              </h3>
              <button
                onClick={() => setReceiptLayaway(null)}
                className="text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Thermal Layaway Receipt Card */}
            <div className="bg-white text-slate-950 font-mono text-xs p-6 rounded-xl border border-slate-200 printable-receipt space-y-4 shadow-inner">
              
              {/* Store Header */}
              <div className="flex items-start justify-between pb-3 border-b border-dashed border-slate-300 gap-2">
                <div className="shrink-0 flex items-start pt-0.5">
                  {systemSettings?.logoUrl ? (
                    <img
                      src={systemSettings.logoUrl}
                      alt="Shop Logo"
                      className="max-h-16 max-w-[90px] object-contain filter grayscale contrast-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-slate-950 text-amber-400 rounded-lg flex items-center justify-center p-2 shadow-sm border border-slate-800">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="text-right space-y-0.5 min-w-0 flex-1">
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 leading-tight">
                    {systemSettings?.receiptHeader || systemSettings?.businessName || 'Threads & Style'}
                  </h2>
                  <p className="text-[10px] font-mono text-slate-600 font-bold uppercase leading-tight mt-0.5">
                    {receiptLayaway.status === 'completed' ? '*** LAYAWAY RELEASE RECEIPT ***' : '*** LAYAWAY PLAN STATEMENT ***'}
                  </p>
                  <p className="text-[11px] font-sans text-slate-700 font-bold leading-tight mt-0.5">
                    {storeName}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight">{receiptStore?.address || systemSettings?.address}</p>
                  <p className="text-[10px] text-slate-500 leading-tight">TEL: {receiptStore?.phone || systemSettings?.phone}</p>
                </div>
              </div>

              {/* Customer & Plan Details */}
              <div className="space-y-1 text-[11px] text-slate-700">
                <div className="flex justify-between">
                  <span>Plan No:</span>
                  <strong className="text-slate-950 font-bold">{receiptLayaway.planNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{receiptLayaway.startDate}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1">
                  <span>Customer Name:</span>
                  <strong className="text-slate-950">{receiptLayaway.customerName}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Phone Number:</span>
                  <span className="font-mono">{maskPhoneNumber(receiptLayaway.customerPhone)}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1.5">
                <div className="font-bold text-[10px] text-slate-500 uppercase">Clothes Reserved:</div>
                {receiptLayaway.cartItems.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <div>
                      <span className="font-bold text-slate-900">{it.product.title}</span>
                      <span className="text-[10px] text-slate-500 block">{it.variant.color} • Sz {it.variant.size}</span>
                    </div>
                    <span className="font-bold text-slate-900">{formatCurrency(it.unitPrice * it.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Financial Summary */}
              <div className="space-y-1.5 text-[11px] text-slate-800 pt-1">
                <div className="flex justify-between">
                  <span>Total Value:</span>
                  <strong className="text-slate-950">{formatCurrency(receiptLayaway.totalAmount)}</strong>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Amount Paid So Far:</span>
                  <strong className="font-bold">{formatCurrency(receiptLayaway.depositPaid)}</strong>
                </div>
                <div className="flex justify-between text-rose-700 font-extrabold text-sm pt-1 border-t border-slate-300">
                  <span>Balance To Be Cleared:</span>
                  <span>{formatCurrency(receiptLayaway.balanceDue)}</span>
                </div>
              </div>

              {/* Payment History Log */}
              {receiptLayaway.paymentsHistory && receiptLayaway.paymentsHistory.length > 0 && (
                <div className="border-t border-slate-200 pt-2 text-[10px] space-y-1 text-slate-600">
                  <span className="font-bold text-slate-800 block">PAYMENTS HISTORY:</span>
                  {receiptLayaway.paymentsHistory.map((p, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{new Date(p.date).toLocaleDateString()} ({p.method.toUpperCase()}):</span>
                      <span className="font-bold">{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              {receiptLayaway.status === 'completed' && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-2.5 rounded text-center text-[10px] font-bold">
                  ✓ GOODS RELEASED TO CUSTOMER. LAYAWAY CLEARED IN FULL.
                </div>
              )}

              {/* Highly Visible QR Code for Camera Scanning & Official Verification */}
              {systemSettings?.showReceiptBarcode !== false && (
                <div className="pt-2 border-t border-dashed border-slate-300 flex flex-col items-center justify-center text-center">
                  <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-inner">
                    <QRCodeSVG
                      value={qrDataText}
                      size={140}
                      level="Q"
                      includeMargin={true}
                      fgColor="#000000"
                      bgColor="#FFFFFF"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-900">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline shrink-0" />
                    <span>SCAN TO VERIFY RELEASE</span>
                  </div>
                </div>
              )}

              <div className="text-center text-[9px] text-slate-500 pt-2 border-t border-dashed border-slate-300">
                Thank you for choosing Threads & Style!
              </div>

            </div>

            <button
              onClick={() => {
                try {
                  window.print();
                } catch (e) {
                  console.warn('Direct print restricted:', e);
                }
                try {
                  const receiptEl = document.querySelector('.printable-receipt');
                  if (receiptEl) {
                    const printWin = window.open('', '_blank', 'width=480,height=700');
                    if (printWin) {
                      printWin.document.write(`
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <title>Receipt - ${receiptLayaway.planNumber}</title>
                            <style>
                              @page { size: 80mm auto; margin: 0; }
                              body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; padding: 0; margin: 0; background: #ffffff; color: #000000; width: 80mm; }
                              .printable-receipt { width: 80mm; max-width: 80mm; margin: 0 auto; box-sizing: border-box; padding: 4mm 2mm; }
                              .text-center { text-align: center; }
                              .flex { display: flex; }
                              .justify-between { justify-content: space-between; }
                              .items-start { align-items: flex-start; }
                              .border-b { border-bottom: 1px dashed #000; }
                              .border-t { border-top: 1px dashed #000; }
                              .font-bold { font-weight: bold; }
                              .font-extrabold { font-weight: 800; }
                              .uppercase { text-transform: uppercase; }
                              .shrink-0 { flex-shrink: 0; }
                              .text-right { text-align: right; }
                              .space-y-0\\.5 > * + * { margin-top: 2px; }
                              .min-w-0 { min-width: 0; }
                              .flex-1 { flex: 1 1 0%; }
                              .leading-tight { line-height: 1.25; }
                              .mt-0\\.5 { margin-top: 2px; }
                              .gap-2 { gap: 8px; }
                              img { max-height: 64px; max-width: 90px; object-fit: contain; }
                              svg { display: block; max-width: 100%; height: auto; margin: 0 auto; }
                            </style>
                          </head>
                          <body>
                            ${receiptEl.outerHTML}
                            <script>
                              window.onload = function() { window.focus(); window.print(); };
                            </script>
                          </body>
                        </html>
                      `);
                      printWin.document.close();
                    }
                  }
                } catch (err) {
                  console.error('Fallback print error:', err);
                }
              }}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg no-print"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Receipt</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
