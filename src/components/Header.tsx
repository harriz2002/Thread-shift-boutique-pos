import React from 'react';
import { 
  Store, 
  ShoppingBag, 
  Layers, 
  Users, 
  BarChart3, 
  Clock, 
  RotateCcw, 
  AlertTriangle, 
  QrCode,
  Sparkles,
  Sun,
  Moon,
  Coins,
  Shield,
  Lock,
  UserCheck,
  LogIn,
  UserPlus
} from 'lucide-react';
import { StoreLocation, UserAccount } from '../types';

interface HeaderProps {
  activeTab: 'pos' | 'inventory' | 'customers' | 'analytics' | 'layaway' | 'returns';
  setActiveTab: (tab: 'pos' | 'inventory' | 'customers' | 'analytics' | 'layaway' | 'returns') => void;
  stores: StoreLocation[];
  activeStoreId: string;
  setActiveStoreId: (id: string) => void;
  lowStockCount: number;
  holdCount: number;
  layawayCount: number;
  onOpenBarcodeScanner: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  currentUser?: UserAccount | null;
  onOpenAuthModal?: () => void;
  onOpenStaffModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  stores,
  activeStoreId,
  setActiveStoreId,
  lowStockCount,
  holdCount,
  layawayCount,
  onOpenBarcodeScanner,
  isDarkMode = true,
  onToggleDarkMode,
  currentUser,
  onOpenAuthModal,
  onOpenStaffModal,
}) => {
  const activeStore = stores.find((s) => s.id === activeStoreId) || stores[0];

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-30 shadow-md transition-colors dark:bg-slate-900 dark:border-slate-800 light:bg-white light:border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-amber-500/20">
              T&S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-100 dark:text-slate-100">Threads & Style</span>
                <span className="bg-amber-500/20 text-amber-300 text-xs font-semibold px-2 py-0.5 rounded-full border border-amber-500/30">
                  POS Matrix
                </span>
                <span className="hidden lg:flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <Coins className="w-3 h-3" />
                  KES (KSh)
                </span>
                <span className="flex items-center gap-1.5 bg-blue-500/20 text-blue-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-500/30" title="All POS data is synced with Firebase Firestore">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                  Firebase DB Connected
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Kenyan Apparel & Boutique POS System</p>
            </div>
          </div>

          {/* Store Switcher */}
          <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-lg border border-slate-700">
            <Store className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-medium text-slate-300 hidden md:inline">Store Location:</span>
            <select
              value={activeStoreId}
              onChange={(e) => setActiveStoreId(e.target.value)}
              className="bg-slate-900 text-slate-200 text-xs font-semibold rounded px-2 py-1 outline-none border border-slate-700 focus:border-amber-500 transition-colors cursor-pointer"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.isWarehouse ? '📦 (Warehouse)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Action Tools, Low Stock Alert & Theme Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenBarcodeScanner}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 transition-all shadow-sm"
              title="Open Barcode Scanner / SKU Input"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Scan Garment Tag</span>
            </button>

            {/* Dark / Light Mode Toggle */}
            {onToggleDarkMode && (
              <button
                onClick={onToggleDarkMode}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-700 transition-all shadow-sm cursor-pointer"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="hidden md:inline text-xs font-semibold text-slate-200">Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span className="hidden md:inline text-xs font-semibold text-slate-200">Dark Mode</span>
                  </>
                )}
              </button>
            )}

            {lowStockCount > 0 && (
              <button
                onClick={() => setActiveTab('inventory')}
                className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                title={`${lowStockCount} items low on stock`}
              >
                <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>{lowStockCount} Low Stock</span>
              </button>
            )}

            {/* Staff Directory & Roles Button (Admin Only) */}
            {currentUser?.role === 'admin' && onOpenStaffModal && (
              <button
                onClick={onOpenStaffModal}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all shadow-sm"
                title="Manage Staff, Roles & POS PINs"
              >
                <Users className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Staff & Roles</span>
              </button>
            )}

            {/* Platform User Role Badge / Sign In Button */}
            {onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm border ${
                  currentUser
                    ? currentUser.role === 'admin'
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
                      : 'bg-blue-500/20 border-blue-500/50 text-blue-300 hover:bg-blue-500/30'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold border-amber-400/30 hover:brightness-110'
                }`}
                title="Switch Account / Sign In / Register Staff"
              >
                {currentUser ? (
                  <>
                    <span className="w-5 h-5 rounded-md bg-black/30 flex items-center justify-center text-[10px]">
                      {currentUser.role === 'admin' ? '👑' : '👔'}
                    </span>
                    <span className="truncate max-w-[120px]">
                      {currentUser.name.split(' ')[0]} ({currentUser.role === 'admin' ? 'Admin' : 'Cashier'})
                    </span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In / Staff Portal</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Main Navigation Bar */}
        <div className="flex items-center space-x-1 border-t border-slate-800/80 pt-1 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'pos'
                ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>POS Register</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Variant Matrix & Stock</span>
            {lowStockCount > 0 && (
              <span className="ml-1 bg-amber-900 text-amber-300 text-[10px] px-1.5 py-0.2 rounded-full">
                {lowStockCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('layaway')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'layaway'
                ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Hold & Layaway</span>
            {(holdCount > 0 || layawayCount > 0) && (
              <span className="bg-slate-700 text-slate-200 text-[10px] px-1.5 py-0.2 rounded-full">
                {holdCount + layawayCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('returns')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'returns'
                ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Returns & Exchanges</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'customers'
                ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customers & Loyalty</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title={currentUser?.role === 'employee' ? 'Admin Executive Platform feature' : 'Executive Sales & Revenue Analytics'}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Executive Analytics</span>
            {currentUser?.role === 'employee' ? (
              <span className="flex items-center gap-1 bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded-full border border-amber-500/30">
                <Lock className="w-2.5 h-2.5" />
                Admin
              </span>
            ) : (
              <Sparkles className="w-3 h-3 text-amber-200" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
