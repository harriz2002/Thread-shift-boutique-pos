import React, { useState } from 'react';
import { Database, Server, RefreshCw, CheckCircle2, AlertCircle, Shield, HardDrive, Sparkles } from 'lucide-react';

interface DatabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbMode: 'cloudsql' | 'firestore' | 'loading';
  cloudSqlStatus: {
    connected: boolean;
    database?: string;
    time?: string;
    reason?: string;
    error?: string;
  };
  onRefreshDbHealth: () => void;
  onForceSyncToCloudSql: () => Promise<void>;
}

export const DatabaseStatusModal: React.FC<DatabaseStatusModalProps> = ({
  isOpen,
  onClose,
  dbMode,
  cloudSqlStatus,
  onRefreshDbHealth,
  onForceSyncToCloudSql,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  if (!isOpen) return null;

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncMessage('');
    try {
      await onForceSyncToCloudSql();
      setSyncMessage('Successfully synced all POS & Admin state to Cloud SQL PostgreSQL tables!');
    } catch (err: any) {
      setSyncMessage(`Sync failed: ${err.message || 'Please check Cloud SQL credentials.'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Cloud SQL & Firebase Storage Integration
              </h2>
              <p className="text-xs text-slate-400">
                PostgreSQL (europe-west2) with Drizzle ORM & Firestore Dual-Layer Persistence
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

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Active Storage Engine Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-start justify-between gap-4 ${
              dbMode === 'cloudsql'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold ${
                  dbMode === 'cloudsql'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}
              >
                {dbMode === 'cloudsql' ? 'SQL' : 'FB'}
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  Active Database Engine:{' '}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs uppercase font-extrabold ${
                      dbMode === 'cloudsql'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    }`}
                  >
                    {dbMode === 'cloudsql'
                      ? 'Cloud SQL PostgreSQL (Active)'
                      : 'Firebase Firestore (Dual-Layer Active)'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {dbMode === 'cloudsql'
                    ? 'Connected to Google Cloud SQL PostgreSQL instance (ai-studio-0d1bf115) in region europe-west2 with Drizzle ORM and connection pooling.'
                    : 'Currently using Firebase Firestore for persistent cloud storage. Cloud SQL is provisioned and ready for credentials.'}
                </p>
              </div>
            </div>

            <button
              onClick={onRefreshDbHealth}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors flex-shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Test Connection
            </button>
          </div>

          {/* Cloud SQL Instance Details Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Google Cloud SQL Instance Configuration</h3>
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1.5 ${
                  cloudSqlStatus.connected
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                {cloudSqlStatus.connected ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Connected to Postgres
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" />
                    Standby / Firestore Fallback
                  </>
                )}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block mb-1">Instance Name</span>
                <span className="font-mono text-white font-bold">ai-studio-0d1bf115</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block mb-1">Cloud Region</span>
                <span className="font-mono text-white font-bold">europe-west2 (London)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block mb-1">Engine & ORM</span>
                <span className="text-slate-200 font-semibold">PostgreSQL Developer Edition (Drizzle ORM)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block mb-1">Connection Pool</span>
                <span className="text-slate-200 font-semibold">pg.Pool (max: 10 connections)</span>
              </div>
            </div>

            {/* Tables Info */}
            <div className="border-t border-slate-800 pt-3">
              <span className="text-xs text-slate-400 font-semibold block mb-2">
                Provisioned Relational Tables (8 Synchronized Schemas):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'users',
                  'stores',
                  'products',
                  'customers',
                  'transactions',
                  'layaways',
                  'transfers',
                  'purchase_orders',
                ].map((tbl) => (
                  <span
                    key={tbl}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300"
                  >
                    {tbl}
                  </span>
                ))}
              </div>
            </div>

            {cloudSqlStatus.reason && !cloudSqlStatus.connected && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                <span className="font-bold">Note:</span> {cloudSqlStatus.reason}. The app is currently using Firebase Firestore for zero-downtime cloud persistence.
              </div>
            )}
          </div>

          {/* Sync Trigger Button */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/30 via-indigo-900/30 to-slate-900 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-400" />
                Synchronize All POS State to Cloud SQL
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Push all stores, products, users, customers, and transactions to PostgreSQL tables.
              </p>
            </div>
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 flex-shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing to PostgreSQL...' : 'Sync Now to Cloud SQL'}
            </button>
          </div>

          {syncMessage && (
            <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200">
              {syncMessage}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Dual-Engine: <span className="text-emerald-400 font-bold">PostgreSQL</span> +{' '}
            <span className="text-blue-400 font-bold">Firebase Firestore</span>
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
