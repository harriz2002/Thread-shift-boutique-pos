import React, { useState } from 'react';
import { StoreLocation, MasterProduct } from '../types';
import { Store, Plus, Trash2, Shield, MapPin, Phone, Building2, AlertTriangle, CheckCircle2, Pencil, Check, X, Edit3 } from 'lucide-react';

interface StoreManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stores: StoreLocation[];
  products: MasterProduct[];
  activeStoreId: string;
  onUpdateStores: (updatedStores: StoreLocation[], updatedProducts: MasterProduct[], newActiveStoreId?: string, deletedStoreId?: string) => void;
}

export const StoreManagerModal: React.FC<StoreManagerModalProps> = ({
  isOpen,
  onClose,
  stores,
  products,
  activeStoreId,
  onUpdateStores,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isWarehouse, setIsWarehouse] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [confirmStoreToDelete, setConfirmStoreToDelete] = useState<StoreLocation | null>(null);

  // Edit store state
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editIsWarehouse, setEditIsWarehouse] = useState(false);
  const [editIsCentral, setEditIsCentral] = useState(false);

  if (!isOpen) return null;

  // Central store is store-3, marked isCentral, or fallback to the first store in the list
  const centralStore = stores.find((s) => s.id === 'store-3' || s.isCentral) || stores[0];

  const startEditStore = (store: StoreLocation) => {
    setEditingStoreId(store.id);
    setEditName(store.name);
    setEditCode(store.code);
    setEditAddress(store.address || '');
    setEditPhone(store.phone || '');
    setEditIsWarehouse(Boolean(store.isWarehouse));
    setEditIsCentral(Boolean(store.isCentral || store.id === 'store-3' || store.id === centralStore?.id));
    setShowAddForm(false);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const cancelEditStore = () => {
    setEditingStoreId(null);
  };

  const handleSaveEditStore = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!editName.trim()) {
      setErrorMsg('Store name cannot be empty.');
      return;
    }
    if (!editCode.trim()) {
      setErrorMsg('Store code cannot be empty.');
      return;
    }

    const trimmedName = editName.trim();
    const updatedStores = stores.map((s) => {
      if (s.id === editingStoreId) {
        return {
          ...s,
          name: trimmedName,
          code: editCode.trim().toUpperCase(),
          address: editAddress.trim() || 'Nairobi, Kenya',
          phone: editPhone.trim() || '+254 700 000 000',
          isWarehouse: editIsWarehouse,
          isCentral: editIsCentral,
        };
      }
      if (editIsCentral && s.id !== editingStoreId) {
        return {
          ...s,
          isCentral: false,
        };
      }
      return s;
    });

    onUpdateStores(updatedStores, products);
    setSuccessMsg(`Store "${trimmedName}" updated successfully!`);
    setEditingStoreId(null);
  };

  const handleAddStore = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim() || !code.trim()) {
      setErrorMsg('Store name and code are required.');
      return;
    }

    const newStoreId = `store-${Date.now()}`;
    const newStore: StoreLocation = {
      id: newStoreId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      address: address.trim() || 'Nairobi, Kenya',
      phone: phone.trim() || '+254 700 000 000',
      isWarehouse: isWarehouse,
    };

    const updatedStores = [...stores, newStore];

    // Initialize 0 stock in this new store for all product variants
    const updatedProducts = products.map((prod) => ({
      ...prod,
      variants: prod.variants.map((v) => ({
        ...v,
        stockByStore: {
          ...v.stockByStore,
          [newStoreId]: 0,
        },
      })),
    }));

    onUpdateStores(updatedStores, updatedProducts);
    setSuccessMsg(`Successfully created new store: ${newStore.name}`);
    setName('');
    setCode('');
    setAddress('');
    setPhone('');
    setIsWarehouse(false);
    setShowAddForm(false);
  };

  const handleDeleteStoreRequest = (storeToDelete: StoreLocation) => {
    setErrorMsg('');
    setSuccessMsg('');

    if (stores.length <= 1) {
      setErrorMsg('Cannot delete the last remaining store.');
      return;
    }
    setConfirmStoreToDelete(storeToDelete);
  };

  const executeDeleteStore = (storeToDelete: StoreLocation) => {
    setErrorMsg('');
    setSuccessMsg('');
    setConfirmStoreToDelete(null);

    // Find a destination store for inventory transfer (any other store, preferring warehouse or store-3)
    const destinationStore = stores.find((s) => s.id !== storeToDelete.id && (s.id === 'store-3' || s.isWarehouse)) || stores.find((s) => s.id !== storeToDelete.id);

    if (!destinationStore) {
      setErrorMsg('No destination store available for inventory transfer.');
      return;
    }

    // Transfer inventory stock
    const updatedProducts = products.map((prod) => ({
      ...prod,
      variants: prod.variants.map((v) => {
        const stockToDelete = v.stockByStore[storeToDelete.id] || 0;
        const currentDestStock = v.stockByStore[destinationStore.id] || 0;
        const updatedStockByStore = { ...v.stockByStore };
        
        // Add stock to destination store
        updatedStockByStore[destinationStore.id] = currentDestStock + stockToDelete;
        // Remove deleted store stock entry
        delete updatedStockByStore[storeToDelete.id];

        return {
          ...v,
          stockByStore: updatedStockByStore,
        };
      }),
    }));

    const updatedStores = stores.filter((s) => s.id !== storeToDelete.id);
    let nextActiveId = activeStoreId;
    if (activeStoreId === storeToDelete.id) {
      nextActiveId = destinationStore.id;
    }

    onUpdateStores(updatedStores, updatedProducts, nextActiveId, storeToDelete.id);
    setSuccessMsg(`Successfully deleted "${storeToDelete.name}". All stock was transferred to ${destinationStore.name}.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Store Locations & Inventory Transfer Manager</h2>
              <p className="text-xs text-slate-400">
                Manage retail branches, warehouses, and automated stock transfer on store deletion
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Top Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Active Store Locations ({stores.length})</h3>
              <p className="text-xs text-slate-400">
                Central Store: <strong className="text-amber-400">{centralStore?.name || 'Central Warehouse'}</strong> (Protected / Undeletable)
              </p>
            </div>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add New Store
              </button>
            )}
          </div>

          {/* Add Store Form */}
          {showAddForm && (
            <form onSubmit={handleAddStore} className="bg-slate-950 border border-amber-500/30 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Add New Retail Branch or Warehouse</h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Store Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Karen Mega Branch"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Store Code *</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. KAREN-01"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase focus:border-amber-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Physical Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Karen Crossroads Mall, Nairobi"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +254 700 999 888"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isWarehouseCheck"
                  checked={isWarehouse}
                  onChange={(e) => setIsWarehouse(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="isWarehouseCheck" className="text-xs text-slate-300 cursor-pointer">
                  Designate as Logistics Warehouse
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/20"
                >
                  Save & Create Store
                </button>
              </div>
            </form>
          )}

          {/* Stores List */}
          <div className="space-y-3">
            {stores.map((store) => {
              const isCentral = store.id === centralStore?.id || store.id === 'store-3' || store.isCentral;
              const isCurrent = store.id === activeStoreId;
              const isEditingThis = editingStoreId === store.id;

              if (isEditingThis) {
                return (
                  <form
                    key={store.id}
                    onSubmit={handleSaveEditStore}
                    className="p-5 rounded-2xl border-2 border-amber-500 bg-slate-950 shadow-xl space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Pencil className="w-4 h-4 text-amber-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                          Edit Store Name & Details {isCentral ? '(Main / Central Store)' : ''}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={cancelEditStore}
                        className="text-slate-400 hover:text-white text-xs flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Store Name * {isCentral && <span className="text-amber-400">(Main Store)</span>}
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="e.g. Flagship Boutique (Downtown)"
                          className="w-full bg-slate-900 border border-amber-500/50 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white outline-none font-bold shadow-inner"
                          required
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Store Code *
                        </label>
                        <input
                          type="text"
                          value={editCode}
                          onChange={(e) => setEditCode(e.target.value)}
                          placeholder="e.g. FLAG-DT"
                          className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white uppercase outline-none font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Physical Address
                        </label>
                        <input
                          type="text"
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          placeholder="e.g. 450 Fashion Avenue, Suite 101, City Center"
                          className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Contact Phone Number
                        </label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="e.g. +254 700 123 456"
                          className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-1">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editIsWarehouse}
                          onChange={(e) => setEditIsWarehouse(e.target.checked)}
                          className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
                        />
                        <span>Designate as Logistics Warehouse</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editIsCentral}
                          onChange={(e) => setEditIsCentral(e.target.checked)}
                          className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-amber-300 font-semibold">Designate as Main / Central Store</span>
                      </label>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={cancelEditStore}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Save Store Changes</span>
                      </button>
                    </div>
                  </form>
                );
              }

              return (
                <div
                  key={store.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isCurrent
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold ${
                        isCentral
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {isCentral ? <Building2 className="w-5 h-5" /> : <Store className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">{store.name}</span>
                        <button
                          type="button"
                          onClick={() => startEditStore(store)}
                          className="p-1 rounded-md text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title={`Edit store name for ${store.name}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
                          {store.code}
                        </span>
                        {isCentral && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold border border-amber-500/30 flex items-center gap-1">
                            <Shield className="w-3 h-3" /> Central Store (Protected)
                          </span>
                        )}
                        {store.isWarehouse && !isCentral && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-semibold border border-blue-500/30">
                            Warehouse
                          </span>
                        )}
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                            Active Register View
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400 mt-1.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          {store.address || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          {store.phone || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => startEditStore(store)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title={`Edit name, code and details for ${store.name}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit Store Name</span>
                    </button>

                    {isCentral ? (
                      <span className="text-[11px] text-slate-500 italic bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                        Undeletable Central Store
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDeleteStoreRequest(store)}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Delete store and transfer all inventory stock to Central Store"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete & Transfer Stock
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Confirmation Banner for Deleting & Transferring Stock */}
        {confirmStoreToDelete && (
          <div className="mx-6 mb-4 p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="font-bold text-sm flex items-center gap-1.5 text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Confirm Deletion of "{confirmStoreToDelete.name}"?
              </div>
              <p className="text-xs text-rose-200/80">
                All inventory stock in this location will be automatically transferred to {centralStore?.name || 'Central Store'} before removing this store.
              </p>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => setConfirmStoreToDelete(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeDeleteStore(confirmStoreToDelete)}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-lg"
              >
                Confirm Delete & Transfer
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Note: Deleting a store automatically redistributes all variant stock quantities to the Central Store.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
