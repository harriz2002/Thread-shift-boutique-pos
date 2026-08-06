import React from 'react';
import {
  Menu,
  QrCode,
  AlertTriangle,
  LogIn,
  Sun,
  Moon,
  Database,
  Users,
} from 'lucide-react';
import { UserAccount } from '../types';

interface TopBarProps {
  onToggleMobileMenu?: () => void;
  lowStockCount?: number;
  onOpenBarcodeScanner: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  currentUser?: UserAccount | null;
  onOpenAuthModal?: () => void;
  onOpenStaffModal?: () => void;
  dbMode?: 'firestore' | 'cloudsql';
  onOpenDatabaseModal?: () => void;
  setActiveTab: (tab: 'pos' | 'inventory' | 'customers' | 'analytics' | 'layaway' | 'returns') => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  lowStockCount = 0,
  onOpenBarcodeScanner,
  isDarkMode = true,
  onToggleDarkMode,
  currentUser,
  onOpenAuthModal,
  onOpenStaffModal,
  dbMode = 'firestore',
  onOpenDatabaseModal,
  setActiveTab,
  onToggleMobileMenu,
}) => {
  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 z-20 shadow-sm px-4 sm:px-6 h-16 flex items-center justify-between shrink-0 sticky top-0 transition-colors dark:bg-slate-900 dark:border-slate-800 light:bg-white light:border-slate-200">
      <div className="flex items-center gap-2 md:hidden">
        {onToggleMobileMenu && (
          <button onClick={onToggleMobileMenu} className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="font-bold text-amber-500 text-sm">T&S POS</div>
      </div>
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
        
        {lowStockCount > 0 && (
          <button
            onClick={() => setActiveTab('inventory')}
            className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="hidden sm:inline">{lowStockCount} Low Stock Alert</span>
            <span className="sm:hidden">{lowStockCount} Low Stock</span>
          </button>
        )}

        <button
          onClick={onOpenBarcodeScanner}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 transition-all shadow-sm whitespace-nowrap"
        >
          <QrCode className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Scan Garment Tag</span>
          <span className="sm:hidden">Scan Tag</span>
        </button>

        {/* Dark / Light Mode Toggle */}
        {onToggleDarkMode && (
          <button
            onClick={onToggleDarkMode}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 transition-all shadow-sm whitespace-nowrap"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-400" />
                <span className="hidden md:inline">Dark</span>
              </>
            )}
          </button>
        )}

        {/* Cloud SQL / Firestore Database Status Indicator Button */}
        {onOpenDatabaseModal && (
          <button
            onClick={onOpenDatabaseModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shadow-sm whitespace-nowrap ${
              dbMode === 'cloudsql'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden md:inline">DB</span>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          </button>
        )}

        {/* Staff Directory & Roles Button (Admin Only) */}
        {currentUser?.role === 'admin' && onOpenStaffModal && (
          <button
            onClick={onOpenStaffModal}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold px-3 py-1.5 rounded-lg transition-all shadow-sm whitespace-nowrap"
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Staff & Roles</span>
            <span className="sm:hidden">Staff</span>
          </button>
        )}

        {/* Platform User Role Badge / Sign In Button */}
        {onOpenAuthModal && (
          <button
            onClick={onOpenAuthModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm border whitespace-nowrap ${
              currentUser
                ? currentUser.role === 'admin'
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-blue-500/20 border-blue-500/50 text-blue-300 hover:bg-blue-500/30'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold border-amber-400/30 hover:brightness-110'
            }`}
          >
            {currentUser ? (
              <>
                <span className="w-5 h-5 rounded-md bg-black/30 flex items-center justify-center text-[10px]">
                  {currentUser.role === 'admin' ? '👑' : '👔'}
                </span>
                <span className="truncate max-w-[140px] hidden sm:inline">
                  {currentUser.name.split(' ')[0]} ({currentUser.role === 'admin' ? 'Admin' : 'Cashier'})
                </span>
                <span className="truncate max-w-[80px] sm:hidden">
                  {currentUser.name.split(' ')[0]}
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
    </header>
  );
};
