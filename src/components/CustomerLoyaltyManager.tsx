import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Gift, 
  Star, 
  Phone, 
  Mail, 
  Tag, 
  CheckCircle2, 
  DollarSign, 
  ShoppingBag,
  Plus,
  X
} from 'lucide-react';
import { Customer, ClothingSize } from '../types';

interface CustomerLoyaltyManagerProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateStoreCredit: (customerId: string, newCredit: number) => void;
}

export const CustomerLoyaltyManager: React.FC<CustomerLoyaltyManagerProps> = ({
  customers,
  onAddCustomer,
  onUpdateStoreCredit,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustForCredit, setSelectedCustForCredit] = useState<Customer | null>(null);
  const [creditToAdd, setCreditToAdd] = useState<string>('20');

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+254 7');
  const [email, setEmail] = useState('');
  const [topSize, setTopSize] = useState<ClothingSize>('M');
  const [bottomSize, setBottomSize] = useState<ClothingSize>('M');
  const [favColors, setFavColors] = useState('Navy, Cream, Terracotta');
  const [notes, setNotes] = useState('');

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name,
      phone,
      email,
      loyaltyPoints: 100, // Welcome bonus
      storeCredit: 0,
      tier: 'Silver',
      sizePreferences: {
        topSize,
        bottomSize,
        favoriteColors: favColors.split(',').map((s) => s.trim()).filter(Boolean),
      },
      notes,
      totalSpent: 0,
      totalOrders: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onAddCustomer(newCust);
    setIsAddModalOpen(false);
    setName('');
  };

  const handleIssueCredit = () => {
    if (!selectedCustForCredit) return;
    const added = parseFloat(creditToAdd) || 0;
    onUpdateStoreCredit(
      selectedCustForCredit.id,
      selectedCustForCredit.storeCredit + added
    );
    setSelectedCustForCredit(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Customer Profiles & Integrated Loyalty</h2>
            <p className="text-xs text-slate-400">
              Garment size memory, tier rewards, point balances, & store credits
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>New Customer Profile</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search customer name, phone, or email..."
          className="w-full bg-slate-950 text-slate-100 text-xs px-4 py-2.5 rounded-xl border border-slate-800 outline-none focus:border-amber-500"
        />
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => (
          <div
            key={cust.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg hover:border-amber-500/40 transition-colors"
          >
            {/* Header / Tier */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 text-sm">
                  {cust.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">{cust.name}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">{cust.phone}</span>
                </div>
              </div>

              <span
                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                  cust.tier === 'Platinum'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    : cust.tier === 'Gold'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {cust.tier} Member
              </span>
            </div>

            {/* Size Memory & Preferences */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2 text-xs">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                Garment Size Memory:
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[9px]">TOP / JACKET:</span>
                  <strong className="text-slate-100 font-mono text-xs">{cust.sizePreferences.topSize}</strong>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[9px]">PANTS / BOTTOM:</span>
                  <strong className="text-slate-100 font-mono text-xs">{cust.sizePreferences.bottomSize}</strong>
                </div>
              </div>

              {cust.sizePreferences.favoriteColors.length > 0 && (
                <div className="text-[11px] text-slate-400 pt-1">
                  Fav Colors: <span className="text-slate-200">{cust.sizePreferences.favoriteColors.join(', ')}</span>
                </div>
              )}
            </div>

            {/* Loyalty & Store Credit Balances */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-center">
                <span className="text-[10px] text-amber-300/80 uppercase font-semibold block">Loyalty Points</span>
                <strong className="font-mono text-amber-400 font-extrabold text-base">
                  {cust.loyaltyPoints} pts
                </strong>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl text-center">
                <span className="text-[10px] text-emerald-300/80 uppercase font-semibold block">Store Credit</span>
                <strong className="font-mono text-emerald-400 font-extrabold text-base">
                  ${cust.storeCredit.toFixed(2)}
                </strong>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Total Spent: <strong className="text-slate-200">${cust.totalSpent.toFixed(2)}</strong></span>
              <button
                onClick={() => setSelectedCustForCredit(cust)}
                className="text-amber-400 hover:underline font-semibold text-[11px]"
              >
                + Issue Store Credit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Issue Store Credit Modal */}
      {selectedCustForCredit && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-slate-100">Issue Store Credit / Gift Voucher</h3>
              <button onClick={() => setSelectedCustForCredit(null)} className="text-slate-400 hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Adding credit balance for <strong>{selectedCustForCredit.name}</strong>
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Credit Amount ($):</label>
              <input
                type="number"
                value={creditToAdd}
                onChange={(e) => setCreditToAdd(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-emerald-400 font-mono font-bold text-base outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedCustForCredit(null)}
                className="flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleIssueCredit}
                className="flex-1 bg-amber-500 text-slate-950 py-2.5 rounded-xl text-xs font-bold"
              >
                Add Credit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-100 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-base text-slate-100">New Customer Profile</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Full Name:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Wanjiku Mwangi"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Phone Number (M-Pesa):</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254 712 345 678"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-amber-400 font-mono font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Top Size:</label>
                  <select
                    value={topSize}
                    onChange={(e) => setTopSize(e.target.value as ClothingSize)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 outline-none"
                  >
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Bottom Size:</label>
                  <select
                    value={bottomSize}
                    onChange={(e) => setBottomSize(e.target.value as ClothingSize)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 outline-none"
                  >
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Favorite Style Notes:</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Loves silk midi dresses and earth tone jackets..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none"
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 text-slate-950 py-2.5 rounded-xl font-bold"
                >
                  Save Profile (+100 Pts Bonus)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
