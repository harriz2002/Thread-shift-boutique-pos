import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Gift, 
  CheckCircle2, 
  ShieldCheck, 
  UserCheck, 
  Percent, 
  Sparkles,
  ArrowRight,
  Clock
} from 'lucide-react';
import { 
  CartItem, 
  Customer, 
  PaymentMethod, 
  PaymentDetail, 
  SaleTransaction, 
  StoreLocation 
} from '../types';
import { formatCurrency } from '../utils/format';

interface CheckoutModalProps {
  cart: CartItem[];
  customers: Customer[];
  activeStoreId: string;
  store?: StoreLocation;
  onClose: () => void;
  onCompleteSale: (transaction: SaleTransaction) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  cart,
  customers,
  activeStoreId,
  store,
  onClose,
  onCompleteSale,
}) => {
  // Customer selection
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Discount & Loyalty
  const [redeemedPoints, setRedeemedPoints] = useState<number>(0);
  const [usedStoreCredit, setUsedStoreCredit] = useState<number>(0);

  // Payment Method Selection
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  
  // Method specific fields
  const [tenderedCash, setTenderedCash] = useState<string>('');
  const [mpesaPhone, setMpesaPhone] = useState<string>(
    selectedCustomer?.phone || '+254 712 345 678'
  );
  const [mpesaRefCode, setMpesaRefCode] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Split payment state
  const [splitAmounts, setSplitAmounts] = useState<{ cash: number; mpesa: number; card: number }>({
    cash: 0,
    mpesa: 0,
    card: 0,
  });

  // Calculate totals
  const subtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const itemsDiscount = cart.reduce((acc, item) => acc + item.discountAmount, 0);
  
  // Points value: 100 pts = KSh 1,000
  const pointsDiscountValue = (redeemedPoints / 100) * 1000;
  const storeCreditApplied = Math.min(
    usedStoreCredit,
    selectedCustomer ? selectedCustomer.storeCredit : 0
  );

  const totalDiscount = itemsDiscount + pointsDiscountValue + storeCreditApplied;
  const grandTotal = Math.max(0, subtotal - totalDiscount);
  const tax = 0;

  // Auto-update phone if customer selected
  const handleCustomerChange = (id: string) => {
    setSelectedCustomerId(id);
    const cust = customers.find((c) => c.id === id);
    if (cust) {
      setMpesaPhone(cust.phone);
      setUsedStoreCredit(0);
      setRedeemedPoints(0);
    }
  };

  const handleProcessCheckout = () => {
    setIsProcessing(true);
    finalizeSale();
  };

  const finalizeSale = () => {
    const receiptNum = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const paymentsList: PaymentDetail[] = [];

    if (paymentMethod === 'cash') {
      paymentsList.push({
        method: 'cash',
        amount: grandTotal,
        timestamp: now,
      });
    } else if (paymentMethod === 'card') {
      paymentsList.push({
        method: 'card',
        amount: grandTotal,
        referenceNumber: `AUTH-${Math.floor(100000 + Math.random() * 900000)}-VISA`,
        timestamp: now,
      });
    } else if (paymentMethod === 'mpesa') {
      paymentsList.push({
        method: 'mpesa',
        amount: grandTotal,
        phoneNumber: mpesaPhone,
        referenceNumber: mpesaRefCode || `QK${Math.floor(70 + Math.random() * 20)}X${Math.floor(100 + Math.random() * 900)}M`,
        timestamp: now,
      });
    } else if (paymentMethod === 'split') {
      if (splitAmounts.cash > 0) {
        paymentsList.push({ method: 'cash', amount: splitAmounts.cash, timestamp: now });
      }
      if (splitAmounts.mpesa > 0) {
        paymentsList.push({
          method: 'mpesa',
          amount: splitAmounts.mpesa,
          phoneNumber: mpesaPhone,
          referenceNumber: `QK${Math.floor(70 + Math.random() * 20)}S${Math.floor(100 + Math.random() * 900)}`,
          timestamp: now,
        });
      }
      if (splitAmounts.card > 0) {
        paymentsList.push({
          method: 'card',
          amount: splitAmounts.card,
          referenceNumber: `AUTH-SPLIT-${Math.floor(100000 + Math.random() * 900000)}`,
          timestamp: now,
        });
      }
    }

    const earnedPoints = Math.floor(grandTotal / 100);

    const newTransaction: SaleTransaction = {
      id: `tx-${Date.now()}`,
      receiptNumber: receiptNum,
      date: now,
      storeId: activeStoreId,
      cashierName: `Cashier (${store?.code || 'Main'})`,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      items: cart,
      subtotal,
      discount: totalDiscount,
      tax,
      total: grandTotal,
      payments: paymentsList,
      loyaltyPointsEarned: earnedPoints,
      pointsRedeemed: redeemedPoints,
      status: 'completed',
    };

    setIsProcessing(false);
    onCompleteSale(newTransaction);
  };

  const cashNumber = parseFloat(tenderedCash) || 0;
  const cashChange = Math.max(0, cashNumber - grandTotal);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl text-slate-100 overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-100">Checkout Terminal</h2>
              <p className="text-xs text-slate-400">Flexible payments & customer loyalty (KES)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column: Customer & Loyalty */}
          <div className="md:col-span-6 space-y-5">
            
            {/* Customer Selector */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-amber-400" />
                Select Customer Profile:
              </label>

              <select
                value={selectedCustomerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full bg-slate-900 text-slate-100 text-xs rounded-xl p-2.5 border border-slate-800 focus:border-amber-500 outline-none cursor-pointer"
              >
                <option value="">Walk-in / Guest Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) — {c.tier} Tier ({c.loyaltyPoints} pts)
                  </option>
                ))}
              </select>

              {/* Customer Size Badge & Preferences */}
              {selectedCustomer && (
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400">{selectedCustomer.name}</span>
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30">
                      {selectedCustomer.tier} Member
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <div>
                      Top Size: <strong className="text-slate-100">{selectedCustomer.sizePreferences.topSize}</strong>
                    </div>
                    <div>
                      Bottom Size: <strong className="text-slate-100">{selectedCustomer.sizePreferences.bottomSize}</strong>
                    </div>
                  </div>

                  {/* Loyalty Points Redemption */}
                  {selectedCustomer.loyaltyPoints >= 100 && (
                    <div className="pt-2 border-t border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-300 font-semibold flex items-center gap-1">
                          <Gift className="w-3.5 h-3.5 text-amber-400" />
                          Redeem Points (Max {selectedCustomer.loyaltyPoints}):
                        </span>
                        <span className="text-emerald-400 font-bold font-mono text-xs">
                          -{formatCurrency(pointsDiscountValue)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={Math.floor(selectedCustomer.loyaltyPoints / 100) * 100}
                        step="100"
                        value={redeemedPoints}
                        onChange={(e) => setRedeemedPoints(Number(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                      <p className="text-[10px] text-slate-400">100 points = KSh 1,000 off order total</p>
                    </div>
                  )}

                  {/* Store Credit Application */}
                  {selectedCustomer.storeCredit > 0 && (
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-300">
                        Apply Store Credit ({formatCurrency(selectedCustomer.storeCredit)}):
                      </span>
                      <input
                        type="checkbox"
                        checked={usedStoreCredit > 0}
                        onChange={(e) =>
                          setUsedStoreCredit(
                            e.target.checked ? selectedCustomer.storeCredit : 0
                          )
                        }
                        className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Order Summary Box */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Items Subtotal ({cart.reduce((a, b) => a + b.quantity, 0)} units):</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-rose-400 font-semibold">
                  <span>Total Discounts Applied:</span>
                  <span>-{formatCurrency(totalDiscount)}</span>
                </div>
              )}
              {(() => {
                const totalCost = cart.reduce((sum, item) => sum + ((item.product?.costPrice || 0) * item.quantity), 0);
                const grossProfit = grandTotal - totalCost;
                const marginPct = grandTotal > 0 ? (grossProfit / grandTotal) * 100 : 0;
                return (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Total Cost of Goods:</span>
                      <span className="font-mono">{formatCurrency(totalCost)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-emerald-400">
                      <span>Estimated Profit Margin:</span>
                      <span className="font-mono">{grossProfit >= 0 ? '+' : ''}{formatCurrency(grossProfit)} ({marginPct.toFixed(1)}%)</span>
                    </div>
                  </div>
                );
              })()}
              <div className="flex justify-between text-base font-extrabold text-slate-100 pt-2 border-t border-slate-800">
                <span>Total Amount Due:</span>
                <span className="text-amber-400 font-mono">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

          </div>

          {/* Right Column: Payment Method Selection */}
          <div className="md:col-span-6 space-y-5">
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 block">
                Choose Payment Method:
              </label>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => setPaymentMethod('mpesa')}
                  className={`p-3 rounded-xl border text-left flex flex-col items-start transition-all cursor-pointer ${
                    paymentMethod === 'mpesa'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Smartphone className="w-5 h-5 mb-1 text-emerald-400" />
                  <span className="text-xs">M-Pesa / Mobile Cash</span>
                  <span className="text-[10px] text-slate-500 font-normal">Instant Payment</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border text-left flex flex-col items-start transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-bold'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mb-1 text-amber-400" />
                  <span className="text-xs">Credit / Debit Card</span>
                  <span className="text-[10px] text-slate-500 font-normal">Visa, Mastercard</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-xl border text-left flex flex-col items-start transition-all cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-300 font-bold'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Banknote className="w-5 h-5 mb-1 text-blue-400" />
                  <span className="text-xs">Cash (KSh)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Auto Change Calc</span>
                </button>

                <button
                  onClick={() => {
                    setPaymentMethod('split');
                    setSplitAmounts({
                      cash: Math.round(grandTotal / 2),
                      mpesa: Math.round(grandTotal / 2),
                      card: 0,
                    });
                  }}
                  className={`p-3 rounded-xl border text-left flex flex-col items-start transition-all cursor-pointer ${
                    paymentMethod === 'split'
                      ? 'border-purple-500 bg-purple-500/10 text-purple-300 font-bold'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Percent className="w-5 h-5 mb-1 text-purple-400" />
                  <span className="text-xs">Split Payment</span>
                  <span className="text-[10px] text-slate-500 font-normal">Cash + Mobile Cash</span>
                </button>
              </div>

              {/* Dynamic Payment Details Fields */}
              {paymentMethod === 'mpesa' && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div>
                    <label className="text-xs text-slate-300 font-medium block mb-1">
                      Customer M-Pesa Phone Number:
                    </label>
                    <input
                      type="text"
                      value={mpesaPhone}
                      onChange={(e) => setMpesaPhone(e.target.value)}
                      placeholder="+254 7XX XXX XXX"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-emerald-400 font-mono font-bold focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 font-medium block mb-1">
                      M-Pesa Transaction Reference / Code (Optional):
                    </label>
                    <input
                      type="text"
                      value={mpesaRefCode}
                      onChange={(e) => setMpesaRefCode(e.target.value)}
                      placeholder="e.g. QK88X902M"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 font-mono uppercase focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'cash' && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <label className="text-xs text-slate-300 font-medium block">
                    Tendered Cash Amount (KSh):
                  </label>
                  <input
                    type="number"
                    value={tenderedCash}
                    onChange={(e) => setTenderedCash(e.target.value)}
                    placeholder={`e.g. ${Math.ceil(grandTotal)}`}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-amber-400 font-mono font-bold focus:border-amber-500 outline-none"
                  />
                  {cashNumber > 0 && (
                    <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800">
                      <span className="text-slate-400">Change Due to Customer:</span>
                      <strong className={`font-mono text-sm ${cashNumber >= grandTotal ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatCurrency(cashChange)}
                      </strong>
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>POS Terminal Card Reader Ready</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Tap, insert chip, or swipe card on physical terminal. System will automatically record authorization code.
                  </p>
                </div>
              )}

              {paymentMethod === 'split' && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Cash Amount (KSh):</span>
                      <input
                        type="number"
                        value={splitAmounts.cash}
                        onChange={(e) =>
                          setSplitAmounts({ ...splitAmounts, cash: Number(e.target.value) })
                        }
                        className="w-28 bg-slate-900 border border-slate-800 rounded p-1 text-right font-mono"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">M-Pesa Amount (KSh):</span>
                      <input
                        type="number"
                        value={splitAmounts.mpesa}
                        onChange={(e) =>
                          setSplitAmounts({ ...splitAmounts, mpesa: Number(e.target.value) })
                        }
                        className="w-28 bg-slate-900 border border-slate-800 rounded p-1 text-right font-mono text-emerald-400"
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Complete Sale Button */}
            <button
              disabled={isProcessing}
              onClick={handleProcessCheckout}
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-98 cursor-pointer"
            >
              {isProcessing ? (
                <span className="animate-pulse">Processing Sale...</span>
              ) : (
                <>
                  <span>Complete Sale — {formatCurrency(grandTotal)}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
