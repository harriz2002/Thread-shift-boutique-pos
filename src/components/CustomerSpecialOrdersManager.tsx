import React, { useState } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X, 
  Download, 
  Trash2, 
  ShoppingBag, 
  Store,
  FileText
} from 'lucide-react';
import { CustomerSpecialOrder, SpecialOrderStatus, StoreLocation, UserAccount } from '../types';
import { formatCurrency } from '../utils/format';

interface CustomerSpecialOrdersManagerProps {
  specialOrders: CustomerSpecialOrder[];
  stores: StoreLocation[];
  activeStoreId: string;
  currentUser: UserAccount | null;
  onAddSpecialOrder: (order: CustomerSpecialOrder) => void;
  onUpdateOrderStatus: (orderId: string, status: SpecialOrderStatus) => void;
  onDeleteSpecialOrder: (orderId: string) => void;
}

export const CustomerSpecialOrdersManager: React.FC<CustomerSpecialOrdersManagerProps> = ({
  specialOrders,
  stores,
  activeStoreId,
  currentUser,
  onAddSpecialOrder,
  onUpdateOrderStatus,
  onDeleteSpecialOrder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SpecialOrderStatus | 'all'>('all');
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+254 7');
  const [customerEmail, setCustomerEmail] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [quotedPrice, setQuotedPrice] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [estimatedArrivalDate, setEstimatedArrivalDate] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState(activeStoreId || 'store-1');

  const activeStore = stores.find(s => s.id === activeStoreId) || stores[0];

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !itemName.trim()) {
      alert('Please fill in Customer Name, Customer Phone, and Requested Item Name.');
      return;
    }

    const newOrder: CustomerSpecialOrder = {
      id: `special-order-${Date.now()}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || undefined,
      itemName: itemName.trim(),
      itemDescription: itemDescription.trim() || undefined,
      quantity: Number(quantity) || 1,
      quotedPrice: quotedPrice ? Number(quotedPrice) : undefined,
      depositAmount: depositAmount ? Number(depositAmount) : undefined,
      notes: notes.trim() || undefined,
      status: 'pending',
      storeId: selectedStoreId,
      createdBy: currentUser?.name || 'Unknown Staff',
      createdAt: new Date().toISOString().split('T')[0],
      estimatedArrivalDate: estimatedArrivalDate || undefined,
    };

    onAddSpecialOrder(newOrder);
    setIsAddModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('+254 7');
    setCustomerEmail('');
    setItemName('');
    setItemDescription('');
    setQuantity(1);
    setQuotedPrice('');
    setDepositAmount('');
    setNotes('');
    setEstimatedArrivalDate('');
    setSelectedStoreId(activeStoreId || 'store-1');
  };

  // Export Special Orders ledger to CSV
  const exportOrdersCSV = () => {
    const headers = [
      'Order ID',
      'Customer Name',
      'Phone',
      'Email',
      'Item Requested',
      'Description / Specification',
      'Quantity',
      'Quoted Price (KES)',
      'Deposit Paid (KES)',
      'Balance Due (KES)',
      'Store Location',
      'Status',
      'Recorded By',
      'Date Created',
      'Est. Arrival Date',
      'Notes'
    ];
    
    const rows = filteredOrders.map(o => {
      const price = o.quotedPrice || 0;
      const deposit = o.depositAmount || 0;
      const balance = Math.max(0, price - deposit);
      const storeName = stores.find(s => s.id === o.storeId)?.name || o.storeId;
      return [
        o.id,
        o.customerName,
        o.customerPhone,
        o.customerEmail || '',
        o.itemName,
        o.itemDescription || '',
        o.quantity,
        price,
        deposit,
        balance,
        storeName,
        o.status.toUpperCase(),
        o.createdBy,
        o.createdAt,
        o.estimatedArrivalDate || '',
        o.notes || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Customer_Requests_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered orders list
  const filteredOrders = specialOrders.filter(o => {
    // Search filter
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.includes(q) ||
      o.itemName.toLowerCase().includes(q) ||
      (o.notes && o.notes.toLowerCase().includes(q))
    );

    // Status filter
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;

    // Store filter - staff see their store, admin can filter any store
    const userRole = currentUser?.role || 'employee';
    let matchesStore = true;
    if (userRole === 'admin') {
      matchesStore = storeFilter === 'all' || o.storeId === storeFilter;
    } else {
      matchesStore = o.storeId === activeStoreId;
    }

    return matchesSearch && matchesStatus && matchesStore;
  });

  // Calculate order stats
  const pendingCount = specialOrders.filter(o => o.status === 'pending').length;
  const orderedCount = specialOrders.filter(o => o.status === 'ordered').length;
  const arrivedCount = specialOrders.filter(o => o.status === 'arrived').length;
  const completedCount = specialOrders.filter(o => o.status === 'completed').length;

  const getStatusBadge = (status: SpecialOrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Pending Request
          </span>
        );
      case 'ordered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <ShoppingBag className="w-3.5 h-3.5 animate-pulse" /> Ordered from Supplier
          </span>
        );
      case 'arrived':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-bounce">
            <Store className="w-3.5 h-3.5" /> Arrived in Store
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Fulfilled & Collected
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-amber-500" />
            Customer Special Requests & Orders
          </h1>
          <p className="text-sm text-slate-400">
            Manage customer request lists, out-of-stock styles, custom orders, deposits, and status workflows.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={exportOrdersCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all text-sm font-semibold shadow-sm"
            title="Export special orders list to CSV"
          >
            <Download className="w-4 h-4" /> Export Ledger
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl transition-all text-sm font-extrabold shadow-lg shadow-amber-500/25"
          >
            <Plus className="w-4.5 h-4.5" /> Log Customer Request
          </button>
        </div>
      </div>

      {/* KPI Cards / Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unresolved Requests</p>
            <h3 className="text-2xl font-bold text-amber-400 mt-1">{pendingCount}</h3>
          </div>
          <div className="h-10 w-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">On Supplier PO</p>
            <h3 className="text-2xl font-bold text-blue-400 mt-1">{orderedCount}</h3>
          </div>
          <div className="h-10 w-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Arrived In Store</p>
            <h3 className="text-2xl font-bold text-indigo-400 mt-1">{arrivedCount}</h3>
          </div>
          <div className="h-10 w-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fulfilled & Closed</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">{completedCount}</h3>
          </div>
          <div className="h-10 w-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center shadow-sm">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by customer, phone, requested item or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500/60 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-slate-200 text-xs font-medium outline-none cursor-pointer pr-4"
            >
              <option value="all" className="bg-slate-900">All Statuses</option>
              <option value="pending" className="bg-slate-900">Pending Request</option>
              <option value="ordered" className="bg-slate-900">Ordered from Supplier</option>
              <option value="arrived" className="bg-slate-900">Arrived In Store</option>
              <option value="completed" className="bg-slate-900">Fulfilled & Closed</option>
              <option value="cancelled" className="bg-slate-900">Cancelled</option>
            </select>
          </div>

          {/* Admin Location Filter */}
          {currentUser?.role === 'admin' && (
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
              <Store className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={storeFilter}
                onChange={(e) => setStoreFilter(e.target.value)}
                className="bg-transparent text-slate-200 text-xs font-medium outline-none cursor-pointer pr-4"
              >
                <option value="all" className="bg-slate-900">All Locations</option>
                {stores.map(st => (
                  <option key={st.id} value={st.id} className="bg-slate-900">
                    {st.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Orders Directory */}
      {filteredOrders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="font-bold text-slate-200 text-lg">No special orders found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            There are no customer request logs matching your current search parameters or store selection.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredOrders.map((o) => {
            const price = o.quotedPrice || 0;
            const deposit = o.depositAmount || 0;
            const balance = Math.max(0, price - deposit);
            const storeName = stores.find(s => s.id === o.storeId)?.name || 'Generic Location';

            return (
              <div 
                key={o.id} 
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Badge & Meta */}
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-[10px] text-slate-400 font-mono tracking-wider font-semibold">
                      LOGGED: {o.createdAt}
                    </span>
                    {getStatusBadge(o.status)}
                  </div>

                  {/* Customer Card */}
                  <div className="space-y-1.5 pb-3.5 border-b border-slate-800/80 mb-4">
                    <h3 className="font-bold text-slate-100 text-base">{o.customerName}</h3>
                    <div className="flex flex-col gap-1 text-slate-300 text-xs">
                      <a href={`tel:${o.customerPhone}`} className="flex items-center gap-1.5 hover:text-amber-400 transition-colors">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {o.customerPhone}
                      </a>
                      {o.customerEmail && (
                        <a href={`mailto:${o.customerEmail}`} className="flex items-center gap-1.5 hover:text-amber-400 transition-colors truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {o.customerEmail}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Requested Items */}
                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Requested Style / Item</p>
                      <h4 className="font-semibold text-slate-200 text-sm mt-0.5">{o.itemName}</h4>
                    </div>

                    {o.itemDescription && (
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Specifications (Size, Color, etc.)</p>
                        <p className="text-slate-300 text-xs mt-0.5 whitespace-pre-line bg-slate-950 p-2.5 rounded-lg border border-slate-800/60 font-mono">
                          {o.itemDescription}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Quantity</p>
                        <p className="text-slate-200 text-sm font-bold mt-0.5">{o.quantity} pcs</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Est. Arrival</p>
                        <p className="text-slate-300 text-xs flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-500" />
                          {o.estimatedArrivalDate || 'Flexible'}
                        </p>
                      </div>
                    </div>

                    {/* Deposit & Quoted Price block */}
                    {price > 0 && (
                      <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800/50 mt-1">
                        <div>
                          <p className="text-[9px] text-slate-400 uppercase font-semibold">Price</p>
                          <p className="text-xs font-bold text-slate-200 mt-0.5">{formatCurrency(price)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400 uppercase font-semibold">Deposit</p>
                          <p className="text-xs font-bold text-emerald-400 mt-0.5">{formatCurrency(deposit)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400 uppercase font-semibold">Balance Due</p>
                          <p className="text-xs font-bold text-amber-400 mt-0.5">{formatCurrency(balance)}</p>
                        </div>
                      </div>
                    )}

                    {o.notes && (
                      <div className="bg-amber-500/5 p-2.5 rounded-lg border border-amber-500/10 text-xs text-amber-300/90 italic mt-2">
                        💡 Notes: {o.notes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 mt-4 flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Store className="w-3.5 h-3.5 text-amber-500" />
                    <span>Location: <span className="font-semibold text-slate-200">{storeName}</span></span>
                  </div>

                  {/* Actions row */}
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-1.5 flex-1">
                      {o.status === 'pending' && (
                        <button
                          onClick={() => onUpdateOrderStatus(o.id, 'ordered')}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-bold py-1.5 px-2.5 rounded-lg transition-colors"
                          title="Mark style as ordered from supplier"
                        >
                          Mark Ordered
                        </button>
                      )}
                      {o.status === 'ordered' && (
                        <button
                          onClick={() => onUpdateOrderStatus(o.id, 'arrived')}
                          className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-bold py-1.5 px-2.5 rounded-lg transition-colors"
                          title="Mark items as received in shop"
                        >
                          Mark Arrived
                        </button>
                      )}
                      {o.status === 'arrived' && (
                        <button
                          onClick={() => onUpdateOrderStatus(o.id, 'completed')}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[11px] font-bold py-1.5 px-2.5 rounded-lg transition-colors"
                          title="Log as collected by customer"
                        >
                          Fulfill & Hand Over
                        </button>
                      )}
                      {(o.status === 'completed' || o.status === 'cancelled') && (
                        <span className="text-[11px] text-slate-400 font-medium italic">
                          Closed by {o.createdBy}
                        </span>
                      )}

                      {o.status !== 'completed' && o.status !== 'cancelled' && (
                        <button
                          onClick={() => onUpdateOrderStatus(o.id, 'cancelled')}
                          className="bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 hover:border-rose-500/30 text-[11px] font-bold py-1.5 px-2 rounded-lg transition-colors"
                          title="Cancel special order request"
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    {/* Trash bin action (Always allow admin to remove, staff can only delete if pending) */}
                    {(currentUser?.role === 'admin' || o.status === 'pending') && (
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to permanently delete this customer request?')) {
                            onDeleteSpecialOrder(o.id);
                          }
                        }}
                        className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-lg transition-colors"
                        title="Delete Request Log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Request Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col my-auto transition-all">
            
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-800">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <ClipboardList className="w-5.5 h-5.5 text-amber-500" />
                Log Customer Out-of-Stock Request
              </h2>
              <button 
                onClick={() => { setIsAddModalOpen(false); resetForm(); }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5.5 h-5.5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 space-y-4">
              
              {/* Customer Info row */}
              <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-800/80 space-y-3.5">
                <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest">Customer Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Customer Full Name *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Jane Mukuha"
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-amber-500/60 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. +254 712 345 678"
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-amber-500/60 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="e.g. jane.mukuha@gmail.com"
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-amber-500/60 transition-colors"
                  />
                </div>
              </div>

              {/* Product Info Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest">Requested Item / Specification</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Requested Style / Dress Name *</label>
                    <input
                      type="text"
                      required
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="e.g. Floral Ankara Midi Dress"
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-amber-500/60 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Quantity Needed</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-amber-500/60 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Specifications (Size, Color, Pattern Details)</label>
                  <textarea
                    rows={2}
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="e.g. Size UK 12, Peacock Blue pattern, chiffon blend fabric, identical to spring lookbook"
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-amber-500/60 transition-colors resize-none font-mono"
                  />
                </div>
              </div>

              {/* Price & Deposit info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Quoted Unit Price (KES, Optional)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 w-3.5 h-3.5" />
                    <input
                      type="number"
                      value={quotedPrice}
                      onChange={(e) => setQuotedPrice(e.target.value)}
                      placeholder="e.g. 4500"
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 pl-8 pr-3 py-2 rounded-xl text-sm focus:outline-none focus:border-amber-500/60 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Deposit Paid (KES, Optional)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 w-3.5 h-3.5" />
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="e.g. 1000"
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 pl-8 pr-3 py-2 rounded-xl text-sm focus:outline-none focus:border-amber-500/60 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Est. Arrival Date (Optional)</label>
                  <input
                    type="date"
                    value={estimatedArrivalDate}
                    onChange={(e) => setEstimatedArrivalDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-amber-500/60 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Target Fulfillment Store</label>
                  <select
                    value={selectedStoreId}
                    onChange={(e) => setSelectedStoreId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-amber-500/60 transition-colors"
                  >
                    {stores.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Internal Staff Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. VIP client, check with supplier of Nairobi branch"
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-amber-500/60 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-2">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); resetForm(); }}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl transition-all text-sm font-extrabold shadow-lg shadow-amber-500/20"
                >
                  Log Customer Request
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
