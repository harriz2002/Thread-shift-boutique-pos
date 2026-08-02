const fs = require('fs');
const content = `import React from 'react';
import {
  Store,
  QrCode,
  Users,
  BarChart3,
  Layers,
  ShoppingBag,
  RotateCcw,
  Clock,
  AlertTriangle,
  LogIn,
  Sun,
  Moon,
  Database,
  Coins,
  Sparkles,
} from 'lucide-react';
import { StoreLocation, UserAccount } from '../types';

interface SidebarProps {
  activeTab: 'pos' | 'inventory' | 'customers' | 'analytics' | 'layaway' | 'returns';
  setActiveTab: (tab: 'pos' | 'inventory' | 'customers' | 'analytics' | 'layaway' | 'returns') => void;
  stores: StoreLocation[];
  activeStoreId: string;
  setActiveStoreId: (id: string) => void;
  lowStockCount?: number;
  holdCount?: number;
  layawayCount?: number;
  onOpenBarcodeScanner: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  currentUser?: UserAccount | null;
  onOpenAuthModal?: () => void;
  onOpenStaffModal?: () => void;
  dbMode?: 'firestore' | 'cloudsql';
  onOpenDatabaseModal?: () => void;
  onOpenStoreManager?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  stores,
  activeStoreId,
  setActiveStoreId,
  lowStockCount = 0,
  holdCount = 0,
  layawayCount = 0,
  onOpenBarcodeScanner,
  isDarkMode = true,
  onToggleDarkMode,
  currentUser,
  onOpenAuthModal,
  onOpenStaffModal,
  dbMode = 'firestore',
  onOpenDatabaseModal,
  onOpenStoreManager,
}) => {
  const activeStore = stores.find((s) => s.id === activeStoreId) || stores[0];

  return (
    <aside className="bg-slate-900 text-slate-100 border-b md:border-b-0 md:border-r border-slate-800 z-30 shadow-md transition-colors dark:bg-slate-900 dark:border-slate-800 light:bg-white light:border-slate-200 w-full md:w-64 shrink-0 flex flex-col md:h-screen sticky top-0 overflow-y-auto no-scrollbar">
      <div className="p-4 flex flex-col h-full gap-6">
        
        {/* Logo & Brand */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-amber-500/20">
              T&S
            </div>
            <div>
              <div className="font-bold tracking-tight text-slate-100 dark:text-slate-100 leading-tight">Threads & Style</div>
              <p className="text-[10px] text-slate-400">Kenyan Apparel POS</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1.5">
            <span className="bg-amber-500/20 text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-500/30">
              POS Matrix
            </span>
            <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
              <Coins className="w-2.5 h-2.5" />
              KES
            </span>
            <span className="flex items-center gap-1 bg-blue-500/20 text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-blue-500/30" title="All POS data is synced with Firebase Firestore">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
              Firebase DB
            </span>
          </div>
        </div>

        {/* Store Switcher */}
        <div className="flex flex-col gap-2 bg-slate-800/80 p-3 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Store className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-slate-300">Location:</span>
            </div>
            {onOpenStoreManager && currentUser?.role === 'admin' && (
              <button
                onClick={onOpenStoreManager}
                className="bg-slate-900 hover:bg-slate-700 text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-700 transition-colors"
                title="Manage Stores & Inventory Transfer"
              >
                Manage
              </button>
            )}
          </div>
          <select
            value={activeStoreId}
            onChange={(e) => setActiveStoreId(e.target.value)}
            className="w-full bg-slate-900 text-slate-200 text-xs font-semibold rounded px-2 py-1.5 outline-none border border-slate-700 focus:border-amber-500 transition-colors cursor-pointer"
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.isWarehouse ? '📦' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Main Navigation Bar */}
        <nav className="flex flex-col space-y-1">
          <button
            onClick={() => setActiveTab('pos')}
            className={\`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all \${
              activeTab === 'pos'
                ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }\`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>POS Register</span>
          </button>

          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('inventory')}
              className={\`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all \${
                activeTab === 'inventory'
                  ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }\`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4" />
                <span>Variant Matrix</span>
              </div>
              {lowStockCount > 0 && (
                <span className="bg-amber-900 text-amber-300 text-[10px] px-1.5 py-0.5 rounded-full">
                  {lowStockCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab('layaway')}
            className={\`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all \${
              activeTab === 'layaway'
                ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }\`}
          >
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4" />
              <span>Hold & Layaway</span>
            </div>
            {(holdCount > 0 || layawayCount > 0) && (
              <span className="bg-slate-700 text-slate-200 text-[10px] px-1.5 py-0.5 rounded-full">
                {holdCount + layawayCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('returns')}
            className={\`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all \${
              activeTab === 'returns'
                ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }\`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Returns & Exch.</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={\`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all \${
              activeTab === 'customers'
                ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }\`}
          >
            <Users className="w-4 h-4" />
            <span>Customers</span>
          </button>

          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('analytics')}
              className={\`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all \${
                activeTab === 'analytics'
                  ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }\`}
              title="Executive Sales & Revenue Analytics"
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </div>
              <Sparkles className="w-3 h-3 text-amber-200" />
            </button>
          )}
        </nav>

        {/* Action Tools, Low Stock Alert & Theme Switcher */}
        <div className="mt-auto flex flex-col gap-2 border-t border-slate-800 pt-4">
          
          {lowStockCount > 0 && (
            <button
              onClick={() => setActiveTab('inventory')}
              className="flex items-center justify-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold px-2.5 py-2 rounded-lg transition-colors w-full"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>{lowStockCount} Low Stock Alert</span>
            </button>
          )}

          <button
            onClick={onOpenBarcodeScanner}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-2 rounded-lg border border-slate-700 transition-all shadow-sm w-full"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>Scan Garment Tag</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            {/* Dark / Light Mode Toggle */}
            {onToggleDarkMode && (
              <button
                onClick={onToggleDarkMode}
                className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-medium px-2.5 py-2 rounded-lg border border-slate-700 transition-all shadow-sm"
              >
                {isDarkMode ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span>Dark</span>
                  </>
                )}
              </button>
            )}

            {/* Cloud SQL / Firestore Database Status Indicator Button */}
            {onOpenDatabaseModal && (
              <button
                onClick={onOpenDatabaseModal}
                className={\`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-bold border transition-all shadow-sm \${
                  dbMode === 'cloudsql'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30'
                }\`}
              >
                <Database className="w-3 h-3" />
                <span>DB</span>
                <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
              </button>
            )}
          </div>

          {/* Staff Directory & Roles Button (Admin Only) */}
          {currentUser?.role === 'admin' && onOpenStaffModal && (
            <button
              onClick={onOpenStaffModal}
              className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold px-2.5 py-2 rounded-lg transition-all shadow-sm w-full"
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>Staff & Roles</span>
            </button>
          )}

          {/* Platform User Role Badge / Sign In Button */}
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className={\`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm border w-full \${
                currentUser
                  ? currentUser.role === 'admin'
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
                    : 'bg-blue-500/20 border-blue-500/50 text-blue-300 hover:bg-blue-500/30'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold border-amber-400/30 hover:brightness-110'
              }\`}
            >
              {currentUser ? (
                <>
                  <span className="w-5 h-5 rounded-md bg-black/30 flex items-center justify-center text-[10px]">
                    {currentUser.role === 'admin' ? '👑' : '👔'}
                  </span>
                  <span className="truncate max-w-[140px]">
                    {currentUser.name.split(' ')[0]} ({currentUser.role === 'admin' ? 'Admin' : 'Cashier'})
                  </span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </aside>
  );
};
`
fs.writeFileSync('src/components/Sidebar.tsx', content);
