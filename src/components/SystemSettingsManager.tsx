import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Settings,
  Building2,
  FileText,
  ShieldAlert,
  Save,
  CheckCircle2,
  RotateCcw,
  Store,
  Database,
  Printer,
  Download,
  Upload,
  Sparkles,
  Phone,
  MapPin,
  HelpCircle,
  QrCode,
  DollarSign,
  Percent,
  Layers,
  RefreshCw,
  Image as ImageIcon,
  Trash2,
  Check,
  ShoppingBag,
  Bell,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { SystemSettings, StoreLocation, MasterProduct, UserAccount } from '../types';

interface SystemSettingsManagerProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: SystemSettings) => void;
  stores: StoreLocation[];
  activeStoreId: string;
  onOpenStoreManager: () => void;
  products: MasterProduct[];
  onUpdateMasterProduct: (product: MasterProduct) => void;
  currentUser?: UserAccount | null;
  dbMode?: 'firestore' | 'cloudsql';
  onOpenDatabaseModal?: () => void;
}

export const SystemSettingsManager: React.FC<SystemSettingsManagerProps> = ({
  settings,
  onUpdateSettings,
  stores,
  activeStoreId,
  onOpenStoreManager,
  products,
  onUpdateMasterProduct,
  currentUser,
  dbMode = 'firestore',
  onOpenDatabaseModal,
}) => {
  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [activeTab, setActiveTab] = useState<'profile' | 'receipt' | 'inventory' | 'stores' | 'backup'>('profile');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [applyThresholdMsg, setApplyThresholdMsg] = useState<string | null>(null);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(() => {
    return localStorage.getItem('ts_last_backup_date');
  });

  React.useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  const activeStore = stores.find((s) => s.id === activeStoreId) || stores[0];

  const handleChange = (field: keyof SystemSettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Logo image file size should be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 300;
            const MAX_HEIGHT = 300;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width = Math.round((width * MAX_HEIGHT) / height);
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedDataUrl = canvas.toDataURL('image/png');
              handleChange('logoUrl', compressedDataUrl);
            } else {
              handleChange('logoUrl', reader.result as string);
            }
          };
          img.onerror = () => {
            handleChange('logoUrl', reader.result as string);
          };
          img.src = reader.result;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    handleChange('logoUrl', '');
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      onUpdateSettings(formData);
      setSaveSuccessMessage('Business profile and system settings saved successfully!');
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Error saving system settings:', err);
      alert('An error occurred while saving system settings.');
    }
  };

  const handleResetToDefaults = () => {
    if (confirm('Are you sure you want to reset system settings to factory defaults?')) {
      const defaults: SystemSettings = {
        businessName: 'Threads & Style',
        businessSubtitle: 'Kenyan Apparel POS',
        tagline: 'Flagship Boutique (Downtown)',
        address: '450 Fashion Avenue, Suite 101, City Center',
        phone: '+254 700 123 456',
        currencySymbol: 'Ksh',
        currencyCode: 'KES',
        defaultTaxRate: 16,
        receiptHeader: 'Threads & Style',
        receiptFooterMessage: 'Thank you for shopping at Threads & Style!',
        receiptReturnPolicy: 'Exchanges accepted within 14 days with receipt tag intact.',
        showReceiptBarcode: true,
        defaultSafetyThreshold: 1,
        defaultSupplierName: 'Threads & Style Wholesalers',
      };
      setFormData(defaults);
      onUpdateSettings(defaults);
      setSaveSuccessMessage('Reset to factory default settings.');
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    }
  };

  const handleApplyThresholdToAllProducts = () => {
    const val = Math.max(0, Number(formData.defaultSafetyThreshold) || 1);
    let count = 0;
    products.forEach((p) => {
      const updatedVariants = p.variants.map((v) => ({
        ...v,
        reorderLevel: val,
      }));
      onUpdateMasterProduct({ ...p, variants: updatedVariants });
      count += updatedVariants.length;
    });
    setApplyThresholdMsg(`Applied safety threshold (${val} unit) across ${count} product variants!`);
    setTimeout(() => setApplyThresholdMsg(null), 4000);
  };

  const handleExportBackup = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      app: 'Threads & Style POS',
      systemSettings: formData,
      storesCount: stores.length,
      stores,
      productsCount: products.length,
      products,
      exportedAt: new Date().toISOString(),
      backupDate: todayStr,
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ts_pos_backup_${todayStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    localStorage.setItem('ts_last_backup_date', todayStr);
    setLastBackupDate(todayStr);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-slate-100">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-amber-500 to-rose-600 rounded-xl text-slate-950 font-bold shadow-lg shadow-amber-500/20">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              System Settings & Preferences
            </h1>
            <p className="text-xs text-slate-400">
              Customize business details, receipt formatting, tax rates, contact numbers, and reorder thresholds.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="py-2.5 px-3.5 rounded-xl font-semibold text-xs flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
            title="Reset to default settings"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            className="py-2.5 px-5 rounded-xl font-bold text-xs flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>

      {/* Save Toast Notification */}
      {saveSuccessMessage && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold animate-fade-in shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto no-scrollbar pb-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Business Identity</span>
        </button>

        <button
          onClick={() => setActiveTab('receipt')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'receipt'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>Receipt Layout</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'inventory'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Inventory & Thresholds</span>
        </button>

        <button
          onClick={() => setActiveTab('stores')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'stores'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Store Branches ({stores.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'backup'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Database & Backup</span>
        </button>
      </div>

      {/* TAB 1: Business Identity */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Building2 className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base text-slate-100">Business & Contact Profile</h3>
            </div>

            <div className="space-y-4">
              {/* Shop Logo Upload */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>Shop Brand Logo</span>
                  </span>
                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove Logo</span>
                    </button>
                  )}
                </div>

                {formData.logoUrl ? (
                  <div className="flex items-center gap-4 p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="w-20 h-20 bg-white rounded-lg p-2 flex items-center justify-center border border-slate-700 shadow-inner shrink-0">
                      <img
                        src={formData.logoUrl}
                        alt="Shop Logo"
                        className="max-h-full max-w-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Logo Active
                      </p>
                      <p className="text-[11px] text-slate-400">
                        This logo will print at the top of customer receipts and register summaries.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-xl p-4 text-center transition-all bg-slate-900/50 group">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp, image/svg+xml"
                      onChange={handleLogoUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                      <div className="p-2.5 bg-slate-800 rounded-full text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">
                          Click to upload or drag & drop shop logo
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          PNG, JPG, WEBP, or SVG (Max 3MB, monochrome or clean background recommended)
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleChange('businessName', e.target.value)}
                  placeholder="e.g. Threads & Style"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Primary brand name shown at the top of receipts and headers.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Business Subtitle / Tagline
                </label>
                <input
                  type="text"
                  value={formData.businessSubtitle}
                  onChange={(e) => handleChange('businessSubtitle', e.target.value)}
                  placeholder="e.g. Kenyan Apparel POS"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Street Address & Location
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="e.g. 450 Fashion Avenue, Suite 101, City Center"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Contact Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="e.g. +254 700 123 456"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-base text-slate-100">Currency & Financial Settings</h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    value={formData.currencySymbol}
                    onChange={(e) => handleChange('currencySymbol', e.target.value)}
                    placeholder="KES, $, €"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ISO Currency Code
                  </label>
                  <input
                    type="text"
                    value={formData.currencyCode}
                    onChange={(e) => handleChange('currencyCode', e.target.value)}
                    placeholder="KES, USD, EUR"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Default VAT Tax Rate (%)
                </label>
                <div className="relative">
                  <Percent className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.defaultTaxRate}
                    onChange={(e) => handleChange('defaultTaxRate', Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Standard Value-Added Tax percentage calculated at register checkout (e.g., 16% in Kenya).
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300 block">Active Store Context</span>
                <p className="text-xs text-slate-400">
                  Current Branch: <strong className="text-amber-400">{activeStore?.name}</strong> ({activeStore?.code})
                </p>
                <p className="text-xs text-slate-300">Address: {formData.address || activeStore?.address}</p>
                <p className="text-xs text-slate-300">TEL: {formData.phone || activeStore?.phone}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="py-2.5 px-5 rounded-xl font-bold text-xs flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Business Profile</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: Receipt Layout */}
      {activeTab === 'receipt' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Settings Controls */}
          <form onSubmit={handleSave} className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Printer className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base text-slate-100">Thermal Receipt Printing Settings</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Receipt Header Title
                </label>
                <input
                  type="text"
                  value={formData.receiptHeader}
                  onChange={(e) => handleChange('receiptHeader', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Footer Thank You Message
                </label>
                <input
                  type="text"
                  value={formData.receiptFooterMessage}
                  onChange={(e) => handleChange('receiptFooterMessage', e.target.value)}
                  placeholder="Thank you for shopping at Threads & Style!"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Return & Exchange Policy Terms
                </label>
                <textarea
                  rows={2}
                  value={formData.receiptReturnPolicy}
                  onChange={(e) => handleChange('receiptReturnPolicy', e.target.value)}
                  placeholder="Exchanges accepted within 14 days with receipt tag intact."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Print Transaction Barcode</span>
                  <span className="text-[11px] text-slate-500">Includes a scan barcode on thermal paper receipts for quick lookup</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.showReceiptBarcode}
                  onChange={(e) => handleChange('showReceiptBarcode', e.target.checked)}
                  className="w-5 h-5 accent-amber-500 cursor-pointer rounded"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="py-2.5 px-5 rounded-xl font-bold text-xs flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Receipt Format</span>
              </button>
            </div>
          </form>

          {/* Live Receipt Mockup Preview */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Live Receipt Preview</span>
              </h3>
              <span className="text-[10px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded font-mono">80mm Thermal</span>
            </div>

            <div className="bg-white text-slate-950 font-mono text-xs p-5 rounded-xl shadow-inner border border-slate-300 space-y-3 select-none">
              <div className="pb-3 border-b border-dashed border-slate-400 flex items-start justify-between gap-2">
                <div className="shrink-0 flex items-start pt-0.5">
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Shop Logo"
                      className="max-h-14 max-w-[90px] object-contain filter grayscale contrast-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-slate-950 text-amber-400 rounded-lg flex items-center justify-center p-1.5 border border-slate-800">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="text-right space-y-0.5 min-w-0 flex-1">
                  <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-950 leading-tight">
                    {formData.receiptHeader || formData.businessName || 'THREADS & STYLE'}
                  </h4>
                  <p className="text-[10px] font-sans text-slate-700 font-bold leading-tight">
                    {activeStore?.name || formData.tagline}
                  </p>
                  <p className="text-[10px] text-slate-600 leading-tight">{formData.address}</p>
                  <p className="text-[10px] text-slate-600 leading-tight">TEL: {formData.phone}</p>
                </div>
              </div>

              <div className="space-y-1 text-[10px] text-slate-700">
                <div className="flex justify-between">
                  <span>Receipt No:</span>
                  <strong className="text-slate-950">REC-2026-88012</strong>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier:</span>
                  <span>Admin User</span>
                </div>
              </div>

              <div className="border-t border-b border-dashed border-slate-400 py-2 space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span>Silk Evening Gown (M) x1</span>
                  <span>{formData.currencySymbol} 14,500</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>Linen Blazer (L) x1</span>
                  <span>{formData.currencySymbol} 8,200</span>
                </div>
              </div>

              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between font-extrabold text-xs text-slate-950 pt-1 border-t border-slate-300">
                  <span>TOTAL PAID:</span>
                  <span>{formData.currencySymbol} 22,700</span>
                </div>
              </div>

              {formData.showReceiptBarcode && (
                <div className="pt-2 border-t border-dashed border-slate-400 flex flex-col items-center justify-center text-center">
                  <div className="p-2 bg-white rounded-xl border-2 border-slate-900 shadow-md flex flex-col items-center">
                    <QRCodeSVG
                      value={`Receipt Preview - ${formData.businessName}`}
                      size={140}
                      level="Q"
                      includeMargin={true}
                    />
                    <span className="text-[9px] font-black text-slate-900 uppercase mt-1">SCAN TO VERIFY</span>
                  </div>
                </div>
              )}

              <div className="text-center pt-1 text-[9px] text-slate-600 space-y-0.5">
                <p>{formData.receiptFooterMessage}</p>
                <p className="text-[8px] text-slate-500">{formData.receiptReturnPolicy}</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: Inventory & Thresholds */}
      {activeTab === 'inventory' && (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base text-slate-100">Safety Threshold Preferences</h3>
            </div>

            {applyThresholdMsg && (
              <div className="p-3.5 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{applyThresholdMsg}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Default Reorder Safety Threshold Level
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={formData.defaultSafetyThreshold}
                  onChange={(e) => handleChange('defaultSafetyThreshold', Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Low-stock alerts trigger when a garment variant quantity falls below this threshold level.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Apply to All Existing Variants</span>
                  <span className="text-[10px] text-amber-400 font-mono">{products.length} Products</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Bulk update all existing product variants in the inventory to use the default safety reorder threshold of <strong className="text-amber-400">{formData.defaultSafetyThreshold} unit</strong>.
                </p>
                <button
                  type="button"
                  onClick={handleApplyThresholdToAllProducts}
                  className="py-2 px-4 rounded-xl font-bold text-xs flex items-center gap-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Bulk Apply Threshold ({formData.defaultSafetyThreshold}) to All Products</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Default Auto-Reorder Supplier Name
                </label>
                <input
                  type="text"
                  value={formData.defaultSupplierName}
                  onChange={(e) => handleChange('defaultSupplierName', e.target.value)}
                  placeholder="e.g. Threads & Style Wholesalers"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="py-2.5 px-5 rounded-xl font-bold text-xs flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Inventory Rules</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Overview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Layers className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-base text-slate-100">Inventory Status Overview</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 font-semibold block">Total Catalog Items</span>
                <span className="text-2xl font-bold text-slate-100 font-mono mt-1 block">{products.length}</span>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 font-semibold block">Total Store Locations</span>
                <span className="text-2xl font-bold text-amber-400 font-mono mt-1 block">{stores.length}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed pt-2">
              All reorder safety levels are evaluated dynamically in real time against active branch stock levels.
            </p>
          </div>
        </form>
      )}

      {/* TAB 4: Store Branches */}
      {activeTab === 'stores' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base text-slate-100">Store Branch Locations</h3>
            </div>
            <button
              onClick={onOpenStoreManager}
              className="py-2 px-4 rounded-xl font-bold text-xs flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all"
            >
              <Store className="w-4 h-4" />
              <span>Manage & Add Branches</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stores.map((s) => (
              <div
                key={s.id}
                className={`p-4 rounded-xl border transition-all ${
                  s.id === activeStoreId
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-100">{s.name}</span>
                  {s.id === activeStoreId && (
                    <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-bold">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{s.address}</span>
                </p>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>TEL: {s.phone}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Database & Backup */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Database className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-base text-slate-100">Database & Cloud Persistence</h3>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">Firebase Firestore Connection</span>
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online Synced
                </span>
              </div>
              <p className="text-xs text-slate-400">
                All store inventories, transactions, layaways, and system preferences are persisted across Firebase Firestore and local offline cache.
              </p>
              {onOpenDatabaseModal && (
                <button
                  type="button"
                  onClick={onOpenDatabaseModal}
                  className="py-2 px-3.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5 text-amber-400" />
                  <span>View Database Configuration</span>
                </button>
              )}
            </div>

            {/* Automated Daily Backup Schedule & Status */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-amber-400" />
                  Automated Daily Backup Status
                </span>
                {lastBackupDate === new Date().toISOString().slice(0, 10) ? (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Backed Up Today
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Backup Due
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                The system automatically prompts store managers once every calendar day to download a database snapshot and sync inventory records.
              </p>
              <div className="text-xs text-slate-300 font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Last Recorded Backup:</span>
                <span className="font-bold text-amber-300">{lastBackupDate || 'Never Recorded'}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('ts_last_backup_dismissed_date');
                  alert('Automated daily backup notification reset! The notification banner will now appear if backup is due.');
                }}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-medium underline cursor-pointer inline-block pt-1"
              >
                Reset Daily Backup Reminder Banner
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Download className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base text-slate-100">Export System Data Backup</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Download a complete JSON snapshot containing current system preferences, product catalog, store branches, and inventory threshold settings.
            </p>

            <button
              type="button"
              onClick={handleExportBackup}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Complete Backup (.JSON)</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
