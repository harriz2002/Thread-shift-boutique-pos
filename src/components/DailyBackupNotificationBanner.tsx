import React, { useState, useEffect } from 'react';
import { Database, Download, X, CheckCircle2, RefreshCw, Bell, ShieldCheck, Clock } from 'lucide-react';
import { SystemSettings, StoreLocation, MasterProduct, SaleTransaction, LayawayPlan, UserAccount } from '../types';

interface DailyBackupNotificationBannerProps {
  systemSettings: SystemSettings;
  stores: StoreLocation[];
  products: MasterProduct[];
  transactions: SaleTransaction[];
  layaways: LayawayPlan[];
  currentUser: UserAccount | null;
  onOpenSettingsBackup: () => void;
  onSyncDatabase?: () => Promise<void> | void;
}

export const DailyBackupNotificationBanner: React.FC<DailyBackupNotificationBannerProps> = ({
  systemSettings,
  stores,
  products,
  transactions,
  layaways,
  currentUser,
  onOpenSettingsBackup,
  onSyncDatabase,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const todayStr = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const savedLastBackup = localStorage.getItem('ts_last_backup_date');
    const savedDismissedDate = localStorage.getItem('ts_last_backup_dismissed_date');
    
    setLastBackupDate(savedLastBackup);

    // Show banner if backup hasn't been performed today AND user didn't dismiss it today
    if (savedLastBackup !== todayStr && savedDismissedDate !== todayStr) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [todayStr]);

  const handlePerformBackup = async () => {
    setIsSyncing(true);
    try {
      // 1. Trigger database sync if provided
      if (onSyncDatabase) {
        await onSyncDatabase();
      }

      // 2. Prepare JSON backup file
      const backupPayload = {
        app: 'Threads & Style POS',
        exportedAt: new Date().toISOString(),
        backupDate: todayStr,
        systemSettings,
        storesCount: stores.length,
        stores,
        productsCount: products.length,
        products,
        transactionsCount: transactions.length,
        transactions,
        layawaysCount: layaways.length,
        layaways,
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `ts_daily_backup_${todayStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      // 3. Mark last backup completed
      localStorage.setItem('ts_last_backup_date', todayStr);
      setLastBackupDate(todayStr);
      setIsVisible(false);

      // 4. Show success toast
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 5000);
    } catch (err) {
      console.error('Daily backup failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDismissToday = () => {
    localStorage.setItem('ts_last_backup_dismissed_date', todayStr);
    setIsVisible(false);
  };

  return (
    <>
      {/* SUCCESS TOAST CONFIRMATION */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-950 border border-emerald-500/40 text-emerald-100 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-200">Daily Backup Complete!</h4>
            <p className="text-[11px] text-emerald-300/80">
              System settings and inventory database backed up and synced for {todayStr}.
            </p>
          </div>
          <button 
            onClick={() => setShowSuccessToast(false)}
            className="text-emerald-400 hover:text-emerald-200 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* AUTOMATED DAILY BACKUP REMINDER BANNER */}
      {isVisible && (
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-500/30 text-slate-100 px-4 py-3 shadow-xl relative z-40 transition-all no-print">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0 mt-0.5 sm:mt-0 animate-pulse">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-amber-500/20 text-amber-300 font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border border-amber-500/30 flex items-center gap-1">
                    <Bell className="w-3 h-3 text-amber-400" />
                    Automated Daily Backup Reminder
                  </span>
                  <span className="text-slate-400 text-xs flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Due for {todayStr}
                  </span>
                </div>
                <p className="text-xs text-slate-200 mt-1 leading-snug">
                  Store managers are requested to backup system settings & inventory database today to guarantee data safety.
                  {lastBackupDate ? ` (Last backup: ${lastBackupDate})` : ' (No backup recorded yet)'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-1 sm:pt-0">
              <button
                type="button"
                onClick={handlePerformBackup}
                disabled={isSyncing}
                className="py-1.5 px-3.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
              >
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{isSyncing ? 'Syncing...' : 'Backup & Sync Now'}</span>
              </button>

              <button
                type="button"
                onClick={onOpenSettingsBackup}
                className="py-1.5 px-3 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
              >
                Manage
              </button>

              <button
                type="button"
                onClick={handleDismissToday}
                title="Dismiss for today"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors ml-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
