import React from 'react';
import {
  Store,
  Users,
  BarChart3,
  Layers,
  ShoppingBag,
  RotateCcw,
  Clock,
  Coins,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Settings,
} from 'lucide-react';
import { StoreLocation, UserAccount } from '../types';

interface SidebarProps {
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapsed?: () => void;
  activeTab: 'pos' | 'inventory' | 'customers' | 'analytics' | 'layaway' | 'returns' | 'settings';
  setActiveTab: (tab: 'pos' | 'inventory' | 'customers' | 'analytics' | 'layaway' | 'returns' | 'settings') => void;
  stores: StoreLocation[];
  activeStoreId: string;
  setActiveStoreId: (id: string) => void;
  lowStockCount?: number;
  holdCount?: number;
  layawayCount?: number;
  currentUser?: UserAccount | null;
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
  currentUser,
  onOpenStoreManager,
  isMobileMenuOpen = false,
  setIsMobileMenuOpen,
  isSidebarCollapsed = false,
  onToggleSidebarCollapsed,
}) => {
  const activeStore = stores.find((s) => s.id === activeStoreId) || stores[0];

  return (
    <aside
      className={`bg-slate-900 text-slate-100 border-r border-slate-800 z-[100] shadow-md transition-all duration-300 dark:bg-slate-900 dark:border-slate-800 light:bg-white light:border-slate-200 shrink-0 flex flex-col h-screen fixed md:sticky top-0 overflow-y-auto no-scrollbar ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      } ${
        isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
      }`}
    >
      <div className={`flex flex-col h-full gap-5 ${isSidebarCollapsed ? 'p-2.5 items-center' : 'p-4'}`}>
        
        {/* Logo & Brand + Collapse Toggle */}
        <div className={`flex flex-col gap-3 w-full ${isSidebarCollapsed ? 'items-center' : ''}`}>
          {setIsMobileMenuOpen && (
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden absolute top-4 right-4 p-2 bg-slate-800 text-white rounded-lg"
              title="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} w-full`}>
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-amber-500/20 cursor-pointer"
                onClick={onToggleSidebarCollapsed}
                title={isSidebarCollapsed ? "Expand Sidebar" : "Threads & Style POS"}
              >
                T&S
              </div>
              {!isSidebarCollapsed && (
                <div>
                  <div className="font-bold tracking-tight text-slate-100 dark:text-slate-100 leading-tight">
                    Threads & Style
                  </div>
                  <p className="text-[10px] text-slate-400">Kenyan Apparel POS</p>
                </div>
              )}
            </div>

            {/* Desktop Toggle Button */}
            {onToggleSidebarCollapsed && !isSidebarCollapsed && (
              <button
                onClick={onToggleSidebarCollapsed}
                className="hidden md:flex p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 border border-slate-700/60 transition-colors"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>

          {!isSidebarCollapsed && (
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
          )}
        </div>

        {/* Store Switcher */}
        {isSidebarCollapsed ? (
          <div className="w-full flex justify-center">
            <select
              value={activeStoreId}
              onChange={(e) => setActiveStoreId(e.target.value)}
              title={`Store: ${activeStore?.name}`}
              className="w-12 h-10 bg-slate-800 text-amber-400 text-xs font-bold rounded-xl border border-slate-700 text-center cursor-pointer outline-none focus:border-amber-500"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white text-left">
                  {s.name} {s.isWarehouse ? '📦' : ''}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex flex-col gap-2 bg-slate-800/80 p-3 rounded-xl border border-slate-700 w-full">
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
              className="w-full bg-slate-900 text-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1.5 outline-none border border-slate-700 focus:border-amber-500 transition-colors cursor-pointer"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.isWarehouse ? '📦' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Main Navigation Bar */}
        <nav className={`flex flex-col space-y-1.5 w-full ${isSidebarCollapsed ? 'items-center' : ''}`}>
          {/* POS Register */}
          <button
            onClick={() => setActiveTab('pos')}
            title="POS Register"
            className={`flex items-center transition-all ${
              isSidebarCollapsed
                ? 'w-12 h-12 justify-center rounded-xl text-sm font-semibold'
                : 'w-full gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold'
            } ${
              activeTab === 'pos'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShoppingBag className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span>POS Register</span>}
          </button>

          {/* Variant Matrix (Admin Only) */}
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('inventory')}
              title="Variant Matrix"
              className={`flex items-center transition-all relative ${
                isSidebarCollapsed
                  ? 'w-12 h-12 justify-center rounded-xl text-sm font-semibold'
                  : 'w-full justify-between px-3.5 py-2.5 rounded-lg text-sm font-semibold'
              } ${
                activeTab === 'inventory'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 shrink-0" />
                {!isSidebarCollapsed && <span>Variant Matrix</span>}
              </div>
              {lowStockCount > 0 && (
                <span
                  className={`${
                    isSidebarCollapsed
                      ? 'absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-extrabold text-[9px] w-5 h-5 flex items-center justify-center rounded-full border border-slate-900 shadow'
                      : 'bg-amber-900 text-amber-300 text-[10px] px-1.5 py-0.5 rounded-full'
                  }`}
                >
                  {lowStockCount}
                </span>
              )}
            </button>
          )}

          {/* Hold & Layaway */}
          <button
            onClick={() => setActiveTab('layaway')}
            title="Hold & Layaway"
            className={`flex items-center transition-all relative ${
              isSidebarCollapsed
                ? 'w-12 h-12 justify-center rounded-xl text-sm font-semibold'
                : 'w-full justify-between px-3.5 py-2.5 rounded-lg text-sm font-semibold'
            } ${
              activeTab === 'layaway'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 shrink-0" />
              {!isSidebarCollapsed && <span>Hold & Layaway</span>}
            </div>
            {(holdCount > 0 || layawayCount > 0) && (
              <span
                className={`${
                  isSidebarCollapsed
                    ? 'absolute -top-1 -right-1 bg-slate-700 text-amber-300 font-extrabold text-[9px] w-5 h-5 flex items-center justify-center rounded-full border border-slate-900 shadow'
                    : 'bg-slate-700 text-slate-200 text-[10px] px-1.5 py-0.5 rounded-full'
                }`}
              >
                {holdCount + layawayCount}
              </span>
            )}
          </button>

          {/* Returns & Exchanges */}
          <button
            onClick={() => setActiveTab('returns')}
            title="Returns & Exchanges"
            className={`flex items-center transition-all ${
              isSidebarCollapsed
                ? 'w-12 h-12 justify-center rounded-xl text-sm font-semibold'
                : 'w-full gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold'
            } ${
              activeTab === 'returns'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <RotateCcw className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span>Returns & Exch.</span>}
          </button>

          {/* Customers */}
          <button
            onClick={() => setActiveTab('customers')}
            title="Customer Profiles & Loyalty"
            className={`flex items-center transition-all ${
              isSidebarCollapsed
                ? 'w-12 h-12 justify-center rounded-xl text-sm font-semibold'
                : 'w-full gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold'
            } ${
              activeTab === 'customers'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span>Customers</span>}
          </button>

          {/* Analytics (Admin Only) */}
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('analytics')}
              title="Executive Sales & Revenue Analytics"
              className={`flex items-center transition-all ${
                isSidebarCollapsed
                  ? 'w-12 h-12 justify-center rounded-xl text-sm font-semibold'
                  : 'w-full justify-between px-3.5 py-2.5 rounded-lg text-sm font-semibold'
              } ${
                activeTab === 'analytics'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-5 h-5 shrink-0" />
                {!isSidebarCollapsed && <span>Analytics</span>}
              </div>
              {!isSidebarCollapsed && <Sparkles className="w-3.5 h-3.5 text-amber-200" />}
            </button>
          )}

          {/* System Settings */}
          <button
            onClick={() => setActiveTab('settings')}
            title="System Settings & Preferences"
            className={`flex items-center transition-all ${
              isSidebarCollapsed
                ? 'w-12 h-12 justify-center rounded-xl text-sm font-semibold'
                : 'w-full gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold'
            } ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span>System Settings</span>}
          </button>
        </nav>

        {/* Bottom Toggle Button for Desktop */}
        {onToggleSidebarCollapsed && (
          <div className="mt-auto w-full pt-4 border-t border-slate-800/80 hidden md:block">
            <button
              onClick={onToggleSidebarCollapsed}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-800 transition-all ${
                isSidebarCollapsed ? 'justify-center' : 'justify-start px-3'
              }`}
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-5 h-5 text-amber-400" />
              ) : (
                <>
                  <PanelLeftClose className="w-5 h-5 text-slate-400" />
                  <span className="text-xs font-semibold">Collapse Sidebar</span>
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </aside>
  );
};

