import React, { useState } from 'react';
import { 
  X, 
  Tag, 
  User, 
  Phone, 
  FileText, 
  DollarSign, 
  Calendar, 
  ShieldCheck, 
  ShoppingBag,
  Smartphone,
  CreditCard,
  Banknote,
  CheckCircle2,
  UserPlus
} from 'lucide-react';
import { CartItem, Customer, PaymentMethod } from '../types';
import { formatCurrency } from '../utils/format';

interface NewLayawayModalProps {
  cart: CartItem[];
  customers: Customer[];
  onClose: () => void;
  onSaveLayaway: (data: {
    customerName: string;
    customerPhone: string;
    customerId?: string;
    depositPaid: number;
    paymentMethod: PaymentMethod;
    paymentReference: string;
    notes?: string;
    dueDate: string;
  }) => void;
}

export const NewLayawayModal: React.FC<NewLayawayModalProps> = ({
  cart,
  customers,
  onClose,
  onSaveLayaway,
}) => {
  // Selected existing customer or custom entry
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [clientIdNumber, setClientIdNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Calculate order total
  const subtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const grandTotal = subtotal;

  // Deposit calculation (default 20% minimum)
  const minDeposit = Math.round(grandTotal * 0.2);
  const [depositPaid, setDepositPaid] = useState<number>(minDeposit);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [paymentReference, setPaymentReference] = useState<string>(
    `MP-DEP-${Math.floor(10000 + Math.random() * 90000)}`
  );

  // Layaway Period in days (30, 60, 90)
  const [durationDays, setDurationDays] = useState<number>(30);

  // Calculate due date
  const dueDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  // Auto fill if customer selected
  const handleCustomerSelect = (id: string) => {
    setSelectedCustomerId(id);
    if (!id) {
      setCustomerName('');
      setCustomerPhone('');
      return;
    }
    const found = customers.find((c) => c.id === id);
    if (found) {
      setCustomerName(found.name);
      setCustomerPhone(found.phone);
    }
  };

  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Please enter the customer name before saving the layaway plan.');
      return;
    }
    if (!customerPhone.trim()) {
      alert('Please enter the customer phone number.');
      return;
    }
    if (depositPaid < 0) {
      alert('Deposit amount cannot be negative.');
      return;
    }

    const compiledNotes = [
      notes.trim(),
      clientIdNumber.trim() ? `National ID/Passport: ${clientIdNumber.trim()}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    onSaveLayaway({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerId: selectedCustomerId || 'cust-guest',
      depositPaid: Number(depositPaid),
      paymentMethod,
      paymentReference,
      notes: compiledNotes || 'Standard Layaway Deposit Plan',
      dueDate,
    });
  };

  const remainingBalance = Math.max(0, grandTotal - depositPaid);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 text-slate-100 shadow-2xl space-y-6 my-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-100">
                Save Layaway & Client Registration
              </h2>
              <p className="text-xs text-slate-400">
                Prompt to capture customer details and initial deposit before reserving garments
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirmSubmit} className="space-y-6">
          
          {/* Section 1: Client Details Prompt */}
          <div className="space-y-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                <span>1. Client Information Details</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">Required for active layaway tracking</span>
            </div>

            {/* Existing Customer Dropdown */}
            {customers.length > 0 && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Quick Select Existing Customer:
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="">-- Choose registered customer or enter new below --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) - {c.tier} Tier
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Customer Full Name <span className="text-rose-400">*</span>:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Sarah Kiptoo"
                    className="w-full bg-slate-900 text-slate-100 text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Phone Number (M-Pesa) <span className="text-rose-400">*</span>:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. +254 712 345 678"
                    className="w-full bg-slate-900 text-slate-100 text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 focus:border-amber-500 outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  National ID / Passport Number (Optional):
                </label>
                <input
                  type="text"
                  value={clientIdNumber}
                  onChange={(e) => setClientIdNumber(e.target.value)}
                  placeholder="e.g. ID # 28491029"
                  className="w-full bg-slate-900 text-slate-100 text-xs px-3 py-2.5 rounded-xl border border-slate-800 focus:border-amber-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Layaway Remarks / Fit Notes:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Reserved for Eid festival pickup"
                  className="w-full bg-slate-900 text-slate-100 text-xs px-3 py-2.5 rounded-xl border border-slate-800 focus:border-amber-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Financials & Deposit Terms */}
          <div className="space-y-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span>2. Deposit & Layaway Terms</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">
                Total Value: {formatCurrency(grandTotal)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Total Order Price</span>
                <strong className="text-amber-400 text-sm font-mono block">{formatCurrency(grandTotal)}</strong>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Initial Deposit (Min 20%):
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={grandTotal}
                  value={depositPaid}
                  onChange={(e) => setDepositPaid(Number(e.target.value))}
                  className="w-full bg-slate-900 text-amber-400 font-mono font-extrabold text-sm p-2.5 rounded-xl border border-slate-800 focus:border-amber-500 outline-none"
                />
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Min suggested: {formatCurrency(minDeposit)}
                </span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-rose-400 block font-semibold">Remaining Balance Due</span>
                <strong className="text-rose-400 text-sm font-mono block">{formatCurrency(remainingBalance)}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Payment Method:
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none cursor-pointer"
                >
                  <option value="mpesa">📱 M-Pesa Mobile Money</option>
                  <option value="cash">💵 Cash Register</option>
                  <option value="card">💳 Credit / Debit Card</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Transaction Ref / Code:
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full bg-slate-900 text-slate-200 text-xs p-2.5 rounded-xl border border-slate-800 outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Layaway Duration:
                </label>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none cursor-pointer"
                >
                  <option value={30}>30 Days (Standard)</option>
                  <option value={60}>60 Days (2 Months)</option>
                  <option value={90}>90 Days (3 Months)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Reserved Garments Preview */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-400 font-bold border-b border-slate-800 pb-1.5">
              <span>Garments Being Held ({cart.length} items)</span>
              <span>Subtotal: {formatCurrency(subtotal)}</span>
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {cart.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    {item.product.image ? (
                      <img src={item.product.image} alt={item.product.title} className="w-8 h-8 object-cover rounded-lg" />
                    ) : (
                      <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-[10px]">
                        {item.product.title.charAt(0)}
                      </div>
                    )}
                    <div>
                      <span className="font-bold text-slate-200 block">{item.product.title}</span>
                      <span className="text-[10px] text-slate-500">
                        {item.variant.color} • Sz {item.variant.size}
                      </span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-amber-400 font-bold block">{formatCurrency(item.unitPrice * item.quantity)}</span>
                    <span className="text-[10px] text-slate-500">x{item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 py-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Register Client Layaway</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
