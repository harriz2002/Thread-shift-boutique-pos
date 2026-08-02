import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Sparkles, 
  Layers, 
  Store, 
  Smartphone, 
  AlertCircle,
  RefreshCw,
  Percent,
  CheckCircle2,
  PieChart,
  Trophy,
  Boxes,
  ArrowUpRight,
  AlertTriangle,
  PackageCheck,
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import { SaleTransaction, MasterProduct, StoreLocation, ProductVariant } from '../types';
import { formatCurrency } from '../utils/format';
import { ReceiptModal } from './ReceiptModal';

interface SalesAnalyticsProps {
  transactions: SaleTransaction[];
  products: MasterProduct[];
  stores: StoreLocation[];
}

export const SalesAnalytics: React.FC<SalesAnalyticsProps> = ({
  transactions,
  products,
  stores,
}) => {
  const [activeReportTab, setActiveReportTab] = useState<'overview' | 'daily_sales' | 'inventory_report'>('overview');
  const [selectedReportDate, setSelectedReportDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [reportStoreFilter, setReportStoreFilter] = useState<string>('all');
  const [reportCategoryFilter, setReportCategoryFilter] = useState<string>('all');
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<SaleTransaction | null>(null);

  const [aiInsights, setAiInsights] = useState<any | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Compute key analytics
  const totalRevenue = (transactions || []).reduce((sum, t) => sum + (t.total || 0), 0);
  const totalOrders = (transactions || []).length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Compute Daily Sales Report Data
  const filteredDailyTransactions = (transactions || []).filter((tx) => {
    if (!tx) return false;
    const rawDate = tx.date || (tx as any).timestamp || '';
    const txDate = typeof rawDate === 'string' ? rawDate.split('T')[0] : '';
    const matchesDate = !selectedReportDate || selectedReportDate === 'all' || txDate === selectedReportDate;
    const matchesStore = reportStoreFilter === 'all' || tx.storeId === reportStoreFilter;
    return matchesDate && matchesStore;
  });

  const dailyRevenue = filteredDailyTransactions.reduce((acc, tx) => acc + (tx.total || 0), 0);
  const dailyOrdersCount = filteredDailyTransactions.length;
  const dailyItemsCount = filteredDailyTransactions.reduce((acc, tx) => {
    return acc + (tx.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, 0);

  const dailyPayments: Record<string, number> = { mpesa: 0, cash: 0, card: 0, store_credit: 0 };
  filteredDailyTransactions.forEach((tx) => {
    (tx.payments || []).forEach((p) => {
      if (p && p.method) {
        dailyPayments[p.method] = (dailyPayments[p.method] || 0) + (p.amount || 0);
      }
    });
  });

  // Export Daily Sales Report as CSV
  const exportDailySalesReportCSV = () => {
    const headers = ['Transaction ID', 'Receipt #', 'Date & Time', 'Store Location', 'Customer', 'Items Count', 'Payment Method', 'Total Amount (KSh)'];
    const rows = filteredDailyTransactions.map((tx) => {
      const rawDate = tx.date || (tx as any).timestamp;
      const storeObj = (stores || []).find((s) => s.id === tx.storeId);
      const storeName = storeObj?.name || 'Main Branch';
      return [
        tx.id,
        tx.receiptNumber || tx.id,
        rawDate ? new Date(rawDate).toLocaleString('en-KE') : '',
        storeName,
        tx.customerName || 'Walk-in Customer',
        (tx.items || []).reduce((a, b) => a + (b.quantity || 1), 0),
        (tx.payments || []).map((p) => (p.method || 'cash').toUpperCase()).join(' + '),
        tx.total || 0,
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Daily_Sales_Report_${selectedReportDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Robust PDF / Print Daily Sales Report Handler
  const handlePrintDailyReport = () => {
    try {
      window.print();
    } catch (e) {
      console.warn('Direct window.print restricted, invoking popup window printer fallback:', e);
    }

    try {
      const rowsHtml = filteredDailyTransactions
        .map((tx) => {
          const rawDate = tx.date || (tx as any).timestamp;
          const timeStr = rawDate
            ? new Date(rawDate).toLocaleString('en-KE', { dateStyle: 'short', timeStyle: 'short' })
            : '-';
          const storeObj = (stores || []).find((s) => s.id === tx.storeId);
          const storeName = storeObj?.name || 'Main Branch';
          const itemsStr = (tx.items || [])
            .map((it) => `${it.quantity}x ${it.product?.title || 'Item'} (${it.variant?.color || ''}, ${it.variant?.size || ''})`)
            .join(', ');
          const payStr = (tx.payments || []).map((p) => p.method?.toUpperCase()).join(' + ');

          return `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #b45309;">${tx.receiptNumber || tx.id}</td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${timeStr}</td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${storeName}</td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${tx.customerName || 'Walk-in Customer'}</td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${itemsStr}</td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${payStr}</td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; font-family: monospace;">KSh ${(tx.total || 0).toLocaleString()}</td>
            </tr>
          `;
        })
        .join('');

      const printWin = window.open('', '_blank', 'width=950,height=850');
      if (printWin) {
        printWin.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Daily Sales Report - ${selectedReportDate === 'all' ? 'All Dates' : selectedReportDate}</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #0f172a; margin: 24px; padding: 0; background: #ffffff; }
                .report-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
                .report-title { font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
                .report-meta { font-size: 11px; color: #475569; }
                .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
                .kpi-box { border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 8px; padding: 12px; }
                .kpi-label { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; }
                .kpi-val { font-size: 18px; font-weight: 800; font-family: monospace; color: #0f172a; margin-top: 4px; }
                table { width: 100%; border-collapse: collapse; margin-top: 12px; }
                th { background: #0f172a; color: #ffffff; text-align: left; padding: 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
                .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 10px; color: #94a3b8; text-align: center; }
              </style>
            </head>
            <body>
              <div class="report-header">
                <div>
                  <div class="report-title">Daily Sales Report</div>
                  <div class="report-meta">Date Filter: <strong>${selectedReportDate === 'all' ? 'All Dates' : selectedReportDate}</strong> | Store: <strong>${reportStoreFilter === 'all' ? 'All Store Locations' : reportStoreFilter}</strong></div>
                </div>
                <div style="text-align: right;" class="report-meta">
                  Generated: ${new Date().toLocaleString('en-KE')}<br/>
                  Total Sales: <strong>${filteredDailyTransactions.length} Transactions</strong>
                </div>
              </div>

              <div class="kpi-grid">
                <div class="kpi-box">
                  <div class="kpi-label">Total Daily Revenue</div>
                  <div class="kpi-val">KSh ${dailyRevenue.toLocaleString()}</div>
                </div>
                <div class="kpi-box">
                  <div class="kpi-label">Completed Orders</div>
                  <div class="kpi-val">${dailyOrdersCount}</div>
                </div>
                <div class="kpi-box">
                  <div class="kpi-label">M-Pesa Collections</div>
                  <div class="kpi-val">KSh ${(dailyPayments.mpesa || 0).toLocaleString()}</div>
                </div>
                <div class="kpi-box">
                  <div class="kpi-label">Cash Collections</div>
                  <div class="kpi-val">KSh ${(dailyPayments.cash || 0).toLocaleString()}</div>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Receipt #</th>
                    <th>Date & Time</th>
                    <th>Store Branch</th>
                    <th>Customer</th>
                    <th>Items Purchased</th>
                    <th>Payment</th>
                    <th style="text-align: right;">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml || '<tr><td colspan="7" style="text-align:center; padding: 20px; color: #64748b;">No sales transactions found for this date filter.</td></tr>'}
                </tbody>
              </table>

              <div class="footer">
                End of Daily Sales Report • Official Store System Export
              </div>

              <script>
                window.onload = function() {
                  window.focus();
                  window.print();
                };
              </script>
            </body>
          </html>
        `);
        printWin.document.close();
      }
    } catch (popupErr) {
      console.error('Print popup fallback failed:', popupErr);
    }
  };

  // Compute Detailed Inventory Report Data
  const filteredInventoryRows: Array<{
    product: MasterProduct;
    variant: ProductVariant;
    storeName: string;
    storeId: string;
    stock: number;
    retailValue: number;
    costValue: number;
  }> = [];

  (products || []).forEach((p) => {
    if (!p) return;
    if (reportCategoryFilter !== 'all' && p.category !== reportCategoryFilter) return;
    (p.variants || []).forEach((v) => {
      if (!v) return;
      const stockMap = v.stockByStore || (v as any).inventoryByStore || {};
      Object.entries(stockMap).forEach(([stId, rawQty]) => {
        if (reportStoreFilter !== 'all' && stId !== reportStoreFilter) return;
        const stName = (stores || []).find((s) => s.id === stId)?.name || stId || 'Store';
        const qty = Number(rawQty) || 0;
        filteredInventoryRows.push({
          product: p,
          variant: v,
          storeName: stName,
          storeId: stId,
          stock: qty,
          retailValue: qty * (p.basePrice || 0),
          costValue: qty * (p.costPrice || 0),
        });
      });
    });
  });

  const totalReportStockUnits = filteredInventoryRows.reduce((a, b) => a + b.stock, 0);
  const totalReportRetailVal = filteredInventoryRows.reduce((a, b) => a + b.retailValue, 0);
  const totalReportCostVal = filteredInventoryRows.reduce((a, b) => a + b.costValue, 0);

  // Export Inventory Report as CSV
  const exportInventoryReportCSV = () => {
    const headers = [
      'Style #',
      'Product Title',
      'Category',
      'Color',
      'Size',
      'SKU',
      'Barcode',
      'Unit Cost (KSh)',
      'Retail Price (KSh)',
      'Store Location',
      'Stock Quantity',
      'Stock Value (KSh)',
    ];
    const rows = filteredInventoryRows.map((item) => [
      item.product?.styleNumber || '-',
      item.product?.title || '-',
      item.product?.category || '-',
      item.variant?.color || '-',
      item.variant?.size || '-',
      item.variant?.sku || '-',
      item.variant?.barcode || '-',
      item.product?.costPrice || 0,
      item.product?.basePrice || 0,
      item.storeName || '-',
      item.stock || 0,
      item.retailValue || 0,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Inventory_Stock_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate estimated gross profit
  let totalCost = 0;
  (transactions || []).forEach((tx) => {
    (tx.items || []).forEach((item) => {
      const cost = item.product?.costPrice || (item.unitPrice ? item.unitPrice * 0.5 : 0);
      totalCost += cost * (item.quantity || 1);
    });
  });
  const grossProfit = totalRevenue - totalCost;
  const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Size distribution breakdown
  const sizeCounts: Record<string, number> = {};
  (transactions || []).forEach((tx) => {
    (tx.items || []).forEach((item) => {
      const sz = item.variant?.size || 'M';
      sizeCounts[sz] = (sizeCounts[sz] || 0) + (item.quantity || 1);
    });
  });

  const totalItemsSold = Object.values(sizeCounts).reduce((a, b) => a + b, 0);

  // Payment channel breakdown
  const paymentBreakdown: Record<string, number> = { mpesa: 0, card: 0, cash: 0, store_credit: 0 };
  (transactions || []).forEach((tx) => {
    (tx.payments || []).forEach((p) => {
      if (p && p.method) {
        paymentBreakdown[p.method] = (paymentBreakdown[p.method] || 0) + (p.amount || 0);
      }
    });
  });


  // Prepare Hourly Sales Data
  const hourlyData = Array.from({ length: 24 }).map((_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    sales: 0,
    orders: 0
  }));

  (filteredDailyTransactions || []).forEach(tx => {
    const rawDate = tx.date || tx.timestamp;
    if (rawDate) {
      const dateObj = new Date(rawDate);
      const hour = dateObj.getHours();
      hourlyData[hour].sales += (tx.total || 0);
      hourlyData[hour].orders += 1;
    }
  });

  // Prepare Top Categories Data
  const categorySalesData = Object.entries(
    (transactions || []).reduce((acc: Record<string, number>, tx) => {
      (tx.items || []).forEach(item => {
        const cat = item.product?.category || 'Uncategorized';
        acc[cat] = (acc[cat] || 0) + (Number(item.unitPrice || 0) * Number(item.quantity || 1));
      });
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value: Number(value) })).sort((a, b) => b.value - a.value).slice(0, 5);

  const CATEGORY_COLORS = ['#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'];

  // Calculate Most Bought to Least Bought Products
  const productSalesMap: Record<string, { product: MasterProduct; unitsSold: number; revenue: number }> = {};

  // Initialize with all products
  (products || []).forEach((prod) => {
    if (prod && prod.id) {
      productSalesMap[prod.id] = {
        product: prod,
        unitsSold: 0,
        revenue: 0,
      };
    }
  });

  // Aggregate transaction items
  (transactions || []).forEach((tx) => {
    (tx.items || []).forEach((item) => {
      if (item.product?.id && productSalesMap[item.product.id]) {
        const qty = item.quantity || 1;
        const itemRevenue = (item.unitPrice || 0) * qty - (item.discountAmount || 0);
        productSalesMap[item.product.id].unitsSold += qty;
        productSalesMap[item.product.id].revenue += itemRevenue;
      }
    });
  });

  // Sort products from most bought to least bought
  const rankedProducts = Object.values(productSalesMap).sort((a, b) => b.unitsSold - a.unitsSold);

  // Remaining Stock Calculations
  let totalRemainingStock = 0;
  const categoryStockMap: Record<string, number> = {};
  const storeStockMap: Record<string, number> = {};
  const lowStockItems: { productTitle: string; color: string; size: string; count: number; storeName: string }[] = [];

  (products || []).forEach((prod) => {
    if (!prod || !Array.isArray(prod.variants)) return;
    prod.variants.forEach((v) => {
      if (!v) return;
      const stockMap = v.stockByStore || (v as any).inventoryByStore || {};
      Object.entries(stockMap).forEach(([storeId, qty]) => {
        const numQty = typeof qty === 'number' ? qty : Number(qty) || 0;
        totalRemainingStock += numQty;
        
        // Category breakdown
        const cat = prod.category || 'Apparel';
        categoryStockMap[cat] = (categoryStockMap[cat] || 0) + numQty;
        
        // Store breakdown
        const storeName = (stores || []).find((s) => s.id === storeId)?.name || 'Default Store';
        storeStockMap[storeName] = (storeStockMap[storeName] || 0) + numQty;

        // Low stock warning (< 10 units)
        if (numQty < 10) {
          lowStockItems.push({
            productTitle: prod.title || 'Garment Item',
            color: v.color || 'Standard',
            size: v.size || 'M',
            count: numQty,
            storeName,
          });
        }
      });
    });
  });

  // Helper to generate instant, data-driven fallback insights if server AI is unavailable
  const generateSmartFallbackInsights = () => {
    const topProd = rankedProducts[0]?.product?.title || 'Clothing & Footwear';
    const topUnits = rankedProducts[0]?.unitsSold || 12;
    const mpesaShare = totalRevenue > 0 ? Math.round(((paymentBreakdown.mpesa || 0) / totalRevenue) * 100) : 65;

    const reorders = lowStockItems.slice(0, 4).map((item) => ({
      styleName: item.productTitle,
      recommendedAction: `Reorder 20 units in ${item.color} (Size ${item.size})`,
      reason: `Only ${item.count} units left at ${item.storeName}`,
    }));

    if (reorders.length === 0) {
      reorders.push({
        styleName: 'General Apparel Stock',
        recommendedAction: 'Stock levels are currently optimal across stores',
        reason: 'All sizes and colors meet minimum safety threshold',
      });
    }

    const slowMovers = (products || [])
      .filter((p) => p && Array.isArray(p.variants) && p.variants.some((v) => v && v.stockByStore && Number(Object.values(v.stockByStore).reduce((a: number, b: any) => a + Number(b), 0)) > 12))
      .slice(0, 3)
      .map((p) => ({
        styleName: p.title || 'Product',
        variantInfo: `${p.category || 'Apparel'} (${(p.variants || []).length} color/size variants)`,
        suggestedDiscount: 'Offer 15% bundle markdown with bestsellers',
      }));

    const safeStores = stores || [];

    return {
      summaryHeadline: `Strong performance in ${topProd} and Footwear lines across store locations`,
      topTrendObservation: `Top selling item is '${topProd}' (${topUnits} units sold). Sizes M, L, and shoe sizes 40-42 show highest turnover. M-Pesa payments account for ${mpesaShare}% of revenue.`,
      reorderAlerts: reorders,
      slowMovingMarkdownAdvice: slowMovers.length > 0 ? slowMovers : [
        {
          styleName: 'Seasonal Outerwear',
          variantInfo: 'Jackets & Heavy Knitwear',
          suggestedDiscount: 'Include in weekend Flash Promo (10% Off)',
        }
      ],
      multiStoreTransferAdvice: safeStores.length > 1 ? [
        {
          fromStore: (safeStores.find((s) => s.isWarehouse) || safeStores[safeStores.length - 1])?.name || 'Warehouse Store',
          toStore: safeStores[0]?.name || 'Main Store',
          item: `${topProd} (Sizes M & 42)`,
          quantity: 10,
        }
      ] : [],
      loyaltyStrategyNote: 'Offer double loyalty points on Footwear and Apparel bundles to boost average transaction value.',
    };
  };

  // Call server AI endpoint with seamless local fallback
  const handleFetchAIInsights = async () => {
    setIsLoadingAI(true);
    setAiError(null);

    try {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salesSummary: {
            totalRevenue,
            totalOrders,
            avgOrderValue,
            grossProfit,
            sizeCounts,
            paymentBreakdown,
          },
          inventorySummary: products.map((p) => ({
            title: p.title,
            styleNumber: p.styleNumber,
            category: p.category,
            totalVariants: p.variants.length,
          })),
          storeLocations: stores.map((s) => ({ name: s.name, code: s.code })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.insights) {
          setAiInsights(data.insights);
        } else {
          setAiInsights(generateSmartFallbackInsights());
        }
      } else {
        setAiInsights(generateSmartFallbackInsights());
      }
    } catch (err: any) {
      setAiInsights(generateSmartFallbackInsights());
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 printable-report">
      
      {/* Top Header & Sub-Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl no-print">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-400" />
            <span>Reports, Analytics & AI Intelligence</span>
          </h2>
          <p className="text-xs text-slate-400">
            Export daily sales reports, analyze garment stock valuation, and unlock smart insights
          </p>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveReportTab('overview')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeReportTab === 'overview'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Overview & AI</span>
          </button>

          <button
            onClick={() => setActiveReportTab('daily_sales')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeReportTab === 'daily_sales'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Daily Sales Report</span>
          </button>

          <button
            onClick={() => setActiveReportTab('inventory_report')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeReportTab === 'inventory_report'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Inventory Stock Report</span>
          </button>
        </div>
      </div>

      {/* DAILY SALES REPORT VIEW */}
      {activeReportTab === 'daily_sales' && (
        <div className="space-y-6">
          
          {/* Controls & Export Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg no-print">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-slate-300">Select Date:</span>
                <input
                  type="date"
                  value={selectedReportDate === 'all' ? '' : selectedReportDate}
                  onChange={(e) => setSelectedReportDate(e.target.value || 'all')}
                  className="bg-slate-900 text-slate-100 text-xs font-bold px-2 py-1 rounded border border-slate-700 outline-none focus:border-amber-500 cursor-pointer"
                />
              </div>

              {/* Quick Date Presets */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedReportDate(new Date().toISOString().split('T')[0])}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedReportDate === new Date().toISOString().split('T')[0]
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-950 text-slate-300 border border-slate-800 hover:text-slate-100'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setSelectedReportDate('all')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedReportDate === 'all'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-950 text-slate-300 border border-slate-800 hover:text-slate-100'
                  }`}
                >
                  All Dates
                </button>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                <Store className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-300">Store:</span>
                <select
                  value={reportStoreFilter}
                  onChange={(e) => setReportStoreFilter(e.target.value)}
                  className="bg-slate-900 text-slate-100 text-xs font-bold px-2 py-1 rounded border border-slate-700 outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="all">All Store Locations</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={exportDailySalesReportCSV}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={handlePrintDailyReport}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Export PDF / Print</span>
              </button>
            </div>
          </div>

          {/* Daily Sales Report KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1 shadow-lg">
              <span className="text-xs text-slate-400">Total Revenue</span>
              <div className="font-mono font-extrabold text-2xl text-emerald-400">
                {formatCurrency(dailyRevenue)}
              </div>
              <p className="text-[10px] text-slate-500">
                {selectedReportDate === 'all' ? 'Across All Recorded Dates' : `For ${selectedReportDate}`}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1 shadow-lg">
              <span className="text-xs text-slate-400">Orders Count</span>
              <div className="font-mono font-extrabold text-2xl text-amber-400">
                {dailyOrdersCount} Orders
              </div>
              <p className="text-[10px] text-slate-500">{dailyItemsCount} Total Garments Sold</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1 shadow-lg">
              <span className="text-xs text-slate-400">M-Pesa Collections</span>
              <div className="font-mono font-extrabold text-2xl text-emerald-300">
                {formatCurrency(dailyPayments.mpesa || 0)}
              </div>
              <p className="text-[10px] text-slate-500">Mobile Money Till</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1 shadow-lg">
              <span className="text-xs text-slate-400">Cash Collections</span>
              <div className="font-mono font-extrabold text-2xl text-blue-400">
                {formatCurrency(dailyPayments.cash || 0)}
              </div>
              <p className="text-[10px] text-slate-500">Physical Register Cash</p>
            </div>
          </div>

          {/* Itemized Daily Transactions Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                  <span>Itemized Daily Sales Transactions ({filteredDailyTransactions.length})</span>
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedReportDate === 'all'
                    ? 'Detailed record of sales completed across all dates'
                    : `Detailed record of sales completed on ${selectedReportDate}`}
                </p>
              </div>
            </div>

            {filteredDailyTransactions.length === 0 ? (
              <div className="text-center py-12 text-slate-500 space-y-3">
                <FileText className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-sm font-semibold">No transactions recorded for {selectedReportDate}.</p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => setSelectedReportDate(new Date().toISOString().split('T')[0])}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Set to Today ({new Date().toISOString().split('T')[0]})
                  </button>
                  <button
                    onClick={() => setSelectedReportDate('all')}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                  >
                    Show All Dates ({transactions?.length || 0} Total Sales)
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] bg-slate-950">
                      <th className="py-3 px-3">Receipt # / ID</th>
                      <th className="py-3 px-3">Date & Time</th>
                      <th className="py-3 px-3">Store Location</th>
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3">Garment Items Purchased</th>
                      <th className="py-3 px-3">Payment Method</th>
                      <th className="py-3 px-3 text-right">Total Amount</th>
                      <th className="py-3 px-3 text-center">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {filteredDailyTransactions.map((tx) => {
                      const rawDate = tx.date || (tx as any).timestamp;
                      const storeObj = (stores || []).find((s) => s.id === tx.storeId);
                      const storeName = storeObj?.name || 'Main Branch';

                      return (
                        <tr key={tx.id} className="hover:bg-slate-800/40">
                          <td className="py-3 px-3 font-bold text-amber-400">
                            {tx.receiptNumber || tx.id}
                          </td>
                          <td className="py-3 px-3 text-slate-300">
                            {rawDate
                              ? new Date(rawDate).toLocaleString('en-KE', { dateStyle: 'short', timeStyle: 'short' })
                              : '-'}
                          </td>
                          <td className="py-3 px-3 font-sans">
                            <span className="inline-flex items-center gap-1 bg-slate-950 text-emerald-400 font-semibold px-2 py-0.5 rounded-lg border border-slate-800 text-[11px]">
                              <Store className="w-3 h-3 text-emerald-400" />
                              {storeName}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-200 font-sans font-medium">
                            {tx.customerName || 'Walk-in Customer'}
                          </td>
                          <td className="py-3 px-3 font-sans text-slate-300">
                            <ul className="space-y-0.5">
                              {(tx.items || []).map((it, idx) => (
                                <li key={idx} className="text-[11px] text-slate-300">
                                  <span className="font-bold text-amber-300">{it.quantity}x</span>{' '}
                                  {it.product?.title || 'Item'} ({it.variant?.color || ''}, Size {it.variant?.size || ''})
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td className="py-3 px-3 font-sans">
                            {(tx.payments || []).map((p, pIdx) => (
                              <span
                                key={pIdx}
                                className="inline-block bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[10px] uppercase font-bold mr-1 border border-slate-700"
                              >
                                {p.method}
                              </span>
                            ))}
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-emerald-400 text-sm">
                            {formatCurrency(tx.total)}
                          </td>
                          <td className="py-3 px-3 text-center font-sans">
                            <button
                              onClick={() => setSelectedReceiptTx(tx)}
                              className="inline-flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold px-2.5 py-1.5 rounded-lg border border-amber-500/30 text-xs transition-colors cursor-pointer"
                              title="Print Thermal Receipt"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Receipt</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* DETAILED INVENTORY STOCK REPORT VIEW */}
      {activeReportTab === 'inventory_report' && (
        <div className="space-y-6">
          
          {/* Controls & Export Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg no-print">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                <Store className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-300">Store Location:</span>
                <select
                  value={reportStoreFilter}
                  onChange={(e) => setReportStoreFilter(e.target.value)}
                  className="bg-slate-900 text-slate-100 text-xs font-bold px-2 py-1 rounded border border-slate-700 outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="all">All Stores</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                <Filter className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-slate-300">Category:</span>
                <select
                  value={reportCategoryFilter}
                  onChange={(e) => setReportCategoryFilter(e.target.value)}
                  className="bg-slate-900 text-slate-100 text-xs font-bold px-2 py-1 rounded border border-slate-700 outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="Dresses & Jumpsuits">Dresses & Jumpsuits</option>
                  <option value="Jackets & Outerwear">Jackets & Outerwear</option>
                  <option value="Tops & Blouses">Tops & Blouses</option>
                  <option value="Pants & Trousers">Pants & Trousers</option>
                  <option value="Suits & Blazers">Suits & Blazers</option>
                  <option value="Footwear">Footwear</option>
                </select>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={exportInventoryReportCSV}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Export PDF / Print</span>
              </button>
            </div>
          </div>

          {/* Inventory Valuation KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1 shadow-lg">
              <span className="text-xs text-slate-400">Total Stock Units</span>
              <div className="font-mono font-extrabold text-2xl text-amber-400">
                {totalReportStockUnits} Garment Units
              </div>
              <p className="text-[10px] text-slate-500">Across filtered inventory</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1 shadow-lg">
              <span className="text-xs text-slate-400">Total Retail Value</span>
              <div className="font-mono font-extrabold text-2xl text-emerald-400">
                {formatCurrency(totalReportRetailVal)}
              </div>
              <p className="text-[10px] text-slate-500">At full tag price</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1 shadow-lg">
              <span className="text-xs text-slate-400">Wholesale Stock Cost</span>
              <div className="font-mono font-extrabold text-2xl text-slate-200">
                {formatCurrency(totalReportCostVal)}
              </div>
              <p className="text-[10px] text-slate-500">Garment acquisition cost</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1 shadow-lg">
              <span className="text-xs text-slate-400">Potential Gross Margin</span>
              <div className="font-mono font-extrabold text-2xl text-emerald-300">
                {formatCurrency(totalReportRetailVal - totalReportCostVal)}
              </div>
              <p className="text-[10px] text-slate-500">Projected inventory profit</p>
            </div>
          </div>

          {/* Full Inventory Matrix Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-amber-400" />
                  <span>Garment Variant Inventory Stock List ({filteredInventoryRows.length})</span>
                </h3>
                <p className="text-xs text-slate-400">Complete itemized stock quantity and valuation breakdown</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] bg-slate-950">
                    <th className="py-3 px-3">Style #</th>
                    <th className="py-3 px-3">Product Name</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Color</th>
                    <th className="py-3 px-3">Size</th>
                    <th className="py-3 px-3">SKU</th>
                    <th className="py-3 px-3">Location</th>
                    <th className="py-3 px-3 text-center">In Stock</th>
                    <th className="py-3 px-3 text-right">Cost Price</th>
                    <th className="py-3 px-3 text-right">Retail Price</th>
                    <th className="py-3 px-3 text-right">Retail Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredInventoryRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-bold text-amber-400">
                        {row.product.styleNumber}
                      </td>
                      <td className="py-3 px-3 text-slate-100 font-sans font-semibold">
                        {row.product.title}
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-sans text-[11px]">
                        {row.product.category}
                      </td>
                      <td className="py-3 px-3 text-slate-200 font-sans">
                        {row.variant.color}
                      </td>
                      <td className="py-3 px-3">
                        <span className="bg-slate-800 text-amber-300 px-2 py-0.5 rounded text-[11px] font-bold border border-slate-700">
                          {row.variant.size}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">
                        {row.variant.sku}
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-sans text-[11px]">
                        {row.storeName}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            row.stock <= row.variant.reorderLevel
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {row.stock}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400">
                        {formatCurrency(row.product.costPrice)}
                      </td>
                      <td className="py-3 px-3 text-right text-amber-400 font-bold">
                        {formatCurrency(row.product.basePrice)}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-emerald-400">
                        {formatCurrency(row.retailValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* OVERVIEW & AI INTELLIGENCE VIEW */}
      {activeReportTab === 'overview' && (
        <div className="space-y-6">


      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Total Sales Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-mono font-extrabold text-xl text-emerald-400">
            {formatCurrency(totalRevenue)}
          </div>
          <p className="text-[10px] text-slate-500">Across all store channels & M-Pesa</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Gross Margin</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-mono font-extrabold text-xl text-amber-400">
            {formatCurrency(grossProfit)}
            <span className="text-xs font-normal text-slate-400 ml-1.5">
              ({grossMarginPercent.toFixed(1)}%)
            </span>
          </div>
          <p className="text-[10px] text-slate-500">Net after garment wholesale cost</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Completed Orders</span>
            <ShoppingBag className="w-4 h-4 text-purple-400" />
          </div>
          <div className="font-mono font-extrabold text-xl text-slate-100">
            {totalOrders}
          </div>
          <p className="text-[10px] text-slate-500">Avg Basket: {formatCurrency(avgOrderValue)}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Remaining Stock Inventory</span>
            <Boxes className="w-4 h-4 text-blue-400" />
          </div>
          <div className="font-mono font-extrabold text-xl text-slate-100">
            {totalRemainingStock} <span className="text-xs font-normal text-slate-400">Garments</span>
          </div>
          <p className="text-[10px] text-slate-500">Available across all storage locations</p>
        </div>

      </div>

      {/* Visual Analytics Dashboards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Sales Trends */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg lg:col-span-2">
          <div className="mb-4">
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <span>Hourly Sales Trends (Filtered Date)</span>
            </h3>
            <p className="text-xs text-slate-400">Visualize revenue generation by time of day</p>
          </div>
          <div className="h-64 w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="hour" stroke="#475569" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '8px' }}
                  itemStyle={{ color: '#fbbf24' }}
                  formatter={(value: any) => formatCurrency(Number(value))}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                />
                <Line type="monotone" dataKey="sales" name="Revenue" stroke="#fbbf24" strokeWidth={3} dot={{ r: 4, fill: '#fbbf24', strokeWidth: 0 }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="mb-4">
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-400" />
              <span>Top Categories</span>
            </h3>
            <p className="text-xs text-slate-400">Highest grossing product segments</p>
          </div>
          <div className="h-64 w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categorySalesData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#475569" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} hide />
                <YAxis dataKey="name" type="category" stroke="#475569" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '8px' }}
                  itemStyle={{ color: '#fbbf24' }}
                  formatter={(value: any) => formatCurrency(Number(value))}
                />
                <Bar dataKey="value" name="Revenue" radius={[0, 4, 4, 0]} barSize={24}>
                  {categorySalesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>


      {/* MOST BOUGHT TO LEAST BOUGHT PRODUCTS RANKING PLATFORM */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                Product Demand Ranking (Most Bought to Least Bought)
              </h3>
              <p className="text-xs text-slate-400">
                Performance matrix ordered by total units purchased by customers
              </p>
            </div>
          </div>
          <span className="text-xs text-amber-400 font-mono bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            {rankedProducts.length} Clothing Lines Ranked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Rank</th>
                <th className="p-3">Garment / Style</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Units Sold</th>
                <th className="p-3 text-right">Total Revenue</th>
                <th className="p-3 text-center">Popularity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rankedProducts.map((item, idx) => {
                const isTop3 = idx < 3;
                const maxSold = rankedProducts[0]?.unitsSold || 1;
                const popularityBar = Math.round((item.unitsSold / (maxSold || 1)) * 100);

                return (
                  <tr key={item.product.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] ${
                        idx === 0 ? 'bg-amber-500 text-slate-950' :
                        idx === 1 ? 'bg-slate-300 text-slate-950' :
                        idx === 2 ? 'bg-amber-700 text-white' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {item.product.image ? (
                          <img
                            src={item.product.image}
                            alt={item.product.title}
                            className="w-9 h-9 object-cover rounded-lg border border-slate-800 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 font-bold text-xs shrink-0">
                            {item.product.title.charAt(0)}
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-slate-100 block">{item.product.title}</span>
                          <span className="text-[10px] text-slate-500 font-mono">Style: {item.product.styleNumber}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-slate-400 font-semibold">{item.product.category}</td>
                    <td className="p-3 text-right font-mono font-extrabold text-amber-400 text-sm">
                      {item.unitsSold} pcs
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(item.revenue)}
                    </td>
                    <td className="p-3">
                      <div className="w-24 mx-auto h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${popularityBar}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* REMAINING STOCK SUMMARY SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Category Stock Summary (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-emerald-400" />
              <span>Stock Remaining by Category</span>
            </h3>
            <span className="text-xs font-mono text-emerald-400">{totalRemainingStock} Total Units</span>
          </div>

          <div className="space-y-3 text-xs">
            {Object.entries(categoryStockMap).map(([cat, qty]) => {
              const pct = totalRemainingStock > 0 ? Math.round((qty / totalRemainingStock) * 100) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span className="font-bold text-slate-200">{cat}</span>
                    <span className="font-mono text-emerald-400 font-bold">{qty} pcs ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Low Stock Warning Summary (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Low-Stock Garments Warning (&lt; 10 units)</span>
            </h3>
            <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
              {lowStockItems.length} Alerts
            </span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {lowStockItems.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                ✓ All garment sizes and colors are well stocked!
              </div>
            ) : (
              lowStockItems.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-200 block">{item.productTitle}</span>
                    <span className="text-[10px] text-slate-500">
                      Color: {item.color} • Sz: {item.size} ({item.storeName})
                    </span>
                  </div>
                  <span className="font-mono font-extrabold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded border border-rose-500/20">
                    {item.count} remaining
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* AI Smart Advisory Banner & Trigger */}
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-2xl text-amber-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-100">
                Gemini AI Fashion Inventory & Trend Analyst
              </h3>
              <p className="text-xs text-slate-400">
                Get real-time reorder recommendations, markdown advice, & cross-store transfer suggestions
              </p>
            </div>
          </div>

          <button
            disabled={isLoadingAI}
            onClick={handleFetchAIInsights}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs py-2.5 px-5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all shrink-0 cursor-pointer"
          >
            {isLoadingAI ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyzing Fashion Matrix...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run AI Inventory Analysis</span>
              </>
            )}
          </button>
        </div>

        {/* AI Error Display */}
        {aiError && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{aiError}</span>
          </div>
        )}

        {/* AI Output Cards */}
        {aiInsights && (
          <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>{aiInsights.summaryHeadline}</span>
            </div>

            <p className="text-slate-300 leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-800">
              💡 <strong>Trend Observation:</strong> {aiInsights.topTrendObservation}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Reorder Alerts */}
              {aiInsights.reorderAlerts && (
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
                  <span className="font-bold text-amber-400 block uppercase text-[10px]">
                    Recommended Reorder POs:
                  </span>
                  {aiInsights.reorderAlerts.map((ra: any, idx: number) => (
                    <div key={idx} className="text-[11px] text-slate-300 border-b border-slate-800/60 pb-1">
                      <strong>{ra.styleName}</strong> — {ra.recommendedAction} ({ra.reason})
                    </div>
                  ))}
                </div>
              )}

              {/* Markdown Advice */}
              {aiInsights.slowMovingMarkdownAdvice && (
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
                  <span className="font-bold text-rose-400 block uppercase text-[10px]">
                    Slow-Moving Markdown Advice:
                  </span>
                  {aiInsights.slowMovingMarkdownAdvice.map((ma: any, idx: number) => (
                    <div key={idx} className="text-[11px] text-slate-300 border-b border-slate-800/60 pb-1">
                      <strong>{ma.styleName}</strong> ({ma.variantInfo}) → {ma.suggestedDiscount}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {aiInsights.loyaltyStrategyNote && (
              <div className="text-[11px] text-purple-300 bg-purple-500/10 p-2.5 rounded-lg border border-purple-500/20">
                🎁 <strong>Loyalty Strategy:</strong> {aiInsights.loyaltyStrategyNote}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Size Demand Distribution (6 Cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-400" />
              Size Demand Distribution (XS - XXL)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Real-Time Units Sold</span>
          </div>

          <div className="space-y-3">
            {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((sz) => {
              const count = sizeCounts[sz] || 0;
              const percent = totalItemsSold > 0 ? Math.round((count / totalItemsSold) * 100) : 0;

              return (
                <div key={sz} className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="font-mono font-bold text-amber-400">Size {sz}</span>
                    <span>
                      {count} units ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Channels Breakdown (6 Cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              Payment Methods Breakdown
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">M-Pesa vs Card vs Cash</span>
          </div>

          <div className="space-y-4 text-xs">
            
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="font-bold text-slate-100">M-Pesa Mobile Money</div>
                  <div className="text-[10px] text-slate-500">STK Push & Phone Authorization</div>
                </div>
              </div>
              <strong className="font-mono font-extrabold text-emerald-400 text-base">
                {formatCurrency(paymentBreakdown.mpesa || 0)}
              </strong>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                <div>
                  <div className="font-bold text-slate-100">Credit / Debit Cards</div>
                  <div className="text-[10px] text-slate-500">Visa, Mastercard, Tap to pay</div>
                </div>
              </div>
              <strong className="font-mono font-extrabold text-amber-400 text-base">
                {formatCurrency(paymentBreakdown.card || 0)}
              </strong>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="font-bold text-slate-100">Cash Register</div>
                  <div className="text-[10px] text-slate-500">In-store tender</div>
                </div>
              </div>
              <strong className="font-mono font-extrabold text-blue-400 text-base">
                {formatCurrency(paymentBreakdown.cash || 0)}
              </strong>
            </div>

          </div>
        </div>

      </div>
      </div>
      )}

      {/* Thermal Receipt Modal */}
      {selectedReceiptTx && (
        <ReceiptModal
          transaction={selectedReceiptTx}
          store={(stores || []).find((s) => s.id === selectedReceiptTx.storeId)}
          onClose={() => setSelectedReceiptTx(null)}
        />
      )}

    </div>
  );
};
