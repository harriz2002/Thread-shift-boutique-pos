import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Banknote, 
  CreditCard, 
  Smartphone, 
  Wallet, 
  Receipt, 
  TrendingUp, 
  Store, 
  User, 
  Calendar,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { SaleTransaction, StoreLocation, UserAccount, SystemSettings } from '../types';
import { formatCurrency } from '../utils/format';

interface ShiftBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: SaleTransaction[];
  activeStore?: StoreLocation;
  currentUser?: UserAccount | null;
  systemSettings?: SystemSettings;
}

export const ShiftBreakdownModal: React.FC<ShiftBreakdownModalProps> = ({
  isOpen,
  onClose,
  transactions,
  activeStore,
  currentUser,
  systemSettings
}) => {
  if (!isOpen) return null;

  const todayDateStr = new Date().toISOString().split('T')[0];

  // Filter transactions for current store & today
  const storeTodayTransactions = transactions.filter((tx) => {
    if (tx.storeId && activeStore?.id && tx.storeId !== activeStore.id) return false;
    if (!tx.date) return false;
    try {
      const txDateStr = new Date(tx.date).toISOString().split('T')[0];
      return txDateStr === todayDateStr || tx.date.startsWith(todayDateStr);
    } catch {
      return false;
    }
  });

  const completedTodayTx = storeTodayTransactions.filter((tx) => tx.status !== 'returned');
  const todaySalesCount = completedTodayTx.length;
  const shiftTotal = completedTodayTx.reduce((sum, tx) => sum + (tx.total || 0), 0);
  const avgOrderValue = todaySalesCount > 0 ? shiftTotal / todaySalesCount : 0;

  // Calculate Payment Method Breakdown
  let cashTotal = 0, cashCount = 0;
  let mpesaTotal = 0, mpesaCount = 0;
  let cardTotal = 0, cardCount = 0;
  let storeCreditTotal = 0, storeCreditCount = 0;

  completedTodayTx.forEach((tx) => {
    if (tx.payments && tx.payments.length > 0) {
      tx.payments.forEach((p) => {
        const amt = p.amount || 0;
        if (p.method === 'cash') {
          cashTotal += amt;
          cashCount += 1;
        } else if (p.method === 'mpesa') {
          mpesaTotal += amt;
          mpesaCount += 1;
        } else if (p.method === 'card') {
          cardTotal += amt;
          cardCount += 1;
        } else if (p.method === 'store_credit') {
          storeCreditTotal += amt;
          storeCreditCount += 1;
        } else {
          // default/other
          cashTotal += amt;
          cashCount += 1;
        }
      });
    } else {
      // fallback for older or direct total transactions
      const amt = tx.total || 0;
      cashTotal += amt;
      cashCount += 1;
    }
  });

  const getPercentage = (val: number) => {
    if (shiftTotal === 0) return '0.0%';
    return `${((val / shiftTotal) * 100).toFixed(1)}%`;
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    const lines: string[] = [];
    lines.push(`ACTIVE SHIFT PAYMENT BREAKDOWN REPORT`);
    lines.push(`Date,${new Date().toLocaleDateString()}`);
    lines.push(`Store,${activeStore?.name || 'Main Terminal'}`);
    lines.push(`Cashier,${currentUser?.name || 'Active Cashier'}`);
    lines.push(`Total Revenue,${shiftTotal}`);
    lines.push(`Total Transactions,${todaySalesCount}`);
    lines.push(``);
    lines.push(`PAYMENT METHOD BREAKDOWN`);
    lines.push(`Method,Transaction Count,Total Amount,Percentage of Revenue`);
    lines.push(`Cash,${cashCount},${cashTotal},${getPercentage(cashTotal)}`);
    lines.push(`M-Pesa (Mobile Money),${mpesaCount},${mpesaTotal},${getPercentage(mpesaTotal)}`);
    lines.push(`Card (Visa / Mastercard),${cardCount},${cardTotal},${getPercentage(cardTotal)}`);
    if (storeCreditTotal > 0) {
      lines.push(`Store Credit / Loyalty,${storeCreditCount},${storeCreditTotal},${getPercentage(storeCreditTotal)}`);
    }
    lines.push(``);
    lines.push(`TRANSACTION REGISTER LEDGER`);
    lines.push(`Receipt #,Time,Cashier,Customer,Payment Methods,Items Count,Total`);

    completedTodayTx.forEach((tx) => {
      const formattedTime = new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const methodsStr = tx.payments && tx.payments.length > 0 
        ? tx.payments.map((p) => `${p.method.toUpperCase()} (${p.amount})`).join(' + ')
        : 'CASH';
      const itemsCount = tx.items ? tx.items.reduce((s, i) => s + i.quantity, 0) : 0;
      const custName = tx.customerName ? `"${tx.customerName.replace(/"/g, '""')}"` : 'Walk-in Customer';

      lines.push(
        `"${tx.receiptNumber}",${formattedTime},"${tx.cashierName || 'Cashier'}",${custName},"${methodsStr}",${itemsCount},${tx.total}`
      );
    });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Shift_Payment_Breakdown_${todayDateStr}_${activeStore?.code || 'POS'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Print Handler
  const handlePrint = () => {
    const printContent = document.getElementById('printable-shift-report');
    if (!printContent) return;

    try {
      const printWin = window.open('', '_blank', 'width=800,height=900');
      if (printWin) {
        printWin.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Shift Summary - ${todayDateStr}</title>
              <style>
                body {
                  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                  font-size: 12px;
                  color: #0f172a;
                  padding: 24px;
                  margin: 0;
                  background: #ffffff;
                }
                h1, h2, h3, h4 { margin: 0; padding: 0; font-weight: 800; }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .border-b { border-bottom: 1px solid #e2e8f0; }
                .border-t { border-top: 1px solid #e2e8f0; }
                .py-2 { padding-top: 8px; padding-bottom: 8px; }
                .py-3 { padding-top: 12px; padding-bottom: 12px; }
                .my-4 { margin-top: 16px; margin-bottom: 16px; }
                .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
                .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; }
                table { width: 100%; border-collapse: collapse; margin-top: 12px; }
                th { text-align: left; padding: 8px; background: #f1f5f9; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; }
                td { padding: 8px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
                .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
                .font-bold { font-weight: 700; }
                .text-amber { color: #d97706; }
                .text-emerald { color: #059669; }
                .text-indigo { color: #4f46e5; }
                .signature-box { margin-top: 32px; display: flex; justify-content: space-between; gap: 24px; }
                .sig-line { flex: 1; border-top: 1px dashed #94a3b8; padding-top: 8px; text-align: center; font-size: 10px; color: #64748b; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
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
    } catch (err) {
      console.error('Print window error:', err);
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden text-slate-100 my-8">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
                Shift Payment Breakdown
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                  ACTIVE SHIFT
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeStore?.name || 'Main Register'} • Cashier: {currentUser?.name || 'Active Staff'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3 py-1.5 rounded-xl border border-slate-700 transition-colors"
              title="Export Shift Summary to CSV"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs px-3 py-1.5 rounded-xl border border-amber-400/30 transition-colors shadow-sm"
              title="Print Shift Summary Report"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-100 p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Top Key Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Total Sales Count
              </span>
              <p className="text-xl font-mono font-extrabold text-slate-100">
                {todaySalesCount} <span className="text-xs text-slate-400 font-normal">orders</span>
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-950 to-transparent space-y-1">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                Current Shift Total
              </span>
              <p className="text-xl font-mono font-extrabold text-amber-300">
                {formatCurrency(shiftTotal)}
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Avg. Order Value
              </span>
              <p className="text-xl font-mono font-extrabold text-indigo-300">
                {formatCurrency(avgOrderValue)}
              </p>
            </div>
          </div>

          {/* Payment Methods Breakdown Cards */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              Collections by Payment Method
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Cash */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-emerald-400 flex items-center gap-1.5">
                    <Banknote className="w-4 h-4" />
                    Cash
                  </span>
                  <span className="text-[10px] font-mono text-emerald-300/80 font-bold">
                    {getPercentage(cashTotal)}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-mono font-extrabold text-slate-100">
                    {formatCurrency(cashTotal)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {cashCount} transaction{cashCount === 1 ? '' : 's'}
                  </p>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${shiftTotal > 0 ? (cashTotal / shiftTotal) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* M-Pesa */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-emerald-600/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-emerald-400 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    M-Pesa
                  </span>
                  <span className="text-[10px] font-mono text-emerald-300/80 font-bold">
                    {getPercentage(mpesaTotal)}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-mono font-extrabold text-slate-100">
                    {formatCurrency(mpesaTotal)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {mpesaCount} transaction{mpesaCount === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${shiftTotal > 0 ? (mpesaTotal / shiftTotal) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Card */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-blue-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-blue-400 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" />
                    Card
                  </span>
                  <span className="text-[10px] font-mono text-blue-300/80 font-bold">
                    {getPercentage(cardTotal)}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-mono font-extrabold text-slate-100">
                    {formatCurrency(cardTotal)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {cardCount} transaction{cardCount === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${shiftTotal > 0 ? (cardTotal / shiftTotal) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Today's Transactions Register */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-amber-400" />
              Completed Shift Transactions ({todaySalesCount})
            </h4>

            {completedTodayTx.length === 0 ? (
              <div className="bg-slate-950 p-6 text-center rounded-xl border border-slate-800">
                <p className="text-xs text-slate-400">No completed sales recorded in this shift yet.</p>
              </div>
            ) : (
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[10px] sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Receipt #</th>
                        <th className="py-2.5 px-3">Time</th>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3">Payment Method</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                      {completedTodayTx.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-900/50">
                          <td className="py-2 px-3 font-bold text-amber-400">{tx.receiptNumber}</td>
                          <td className="py-2 px-3 text-slate-400 text-[11px]">
                            {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-2 px-3 text-slate-300 font-sans">{tx.customerName || 'Walk-in Customer'}</td>
                          <td className="py-2 px-3 text-[11px] font-sans">
                            {tx.payments && tx.payments.length > 0 ? (
                              <span className="flex flex-wrap gap-1">
                                {tx.payments.map((p, idx) => (
                                  <span 
                                    key={idx} 
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                      p.method === 'cash' ? 'bg-emerald-500/20 text-emerald-400' :
                                      p.method === 'mpesa' ? 'bg-emerald-600/20 text-emerald-300' :
                                      p.method === 'card' ? 'bg-blue-500/20 text-blue-400' :
                                      'bg-amber-500/20 text-amber-400'
                                    }`}
                                  >
                                    {p.method}
                                  </span>
                                ))}
                              </span>
                            ) : (
                              <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-[10px] font-extrabold">CASH</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-100">
                            {formatCurrency(tx.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hidden Container for Document Printing */}
        <div className="hidden">
          <div id="printable-shift-report">
            <div style={{ textAlign: 'center', marginBottom: '16px', borderBottom: '2px solid #0f172a', paddingBottom: '12px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {systemSettings?.businessName || 'Threads & Style Boutique'}
              </h1>
              <p style={{ fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>
                ACTIVE SHIFT REGISTER & PAYMENT BREAKDOWN REPORT
              </p>
              <p style={{ fontSize: '10px', color: '#64748b' }}>
                Store: {activeStore?.name || 'Main Location'} • Date: {new Date().toLocaleDateString()} • Time Generated: {new Date().toLocaleTimeString()}
              </p>
            </div>

            <div style={{ marginBottom: '16px', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <p style={{ fontSize: '11px', margin: '2px 0' }}><strong>Cashier / Terminal Operator:</strong> {currentUser?.name || 'Active Cashier'}</p>
              <p style={{ fontSize: '11px', margin: '2px 0' }}><strong>Total Shift Revenue:</strong> {formatCurrency(shiftTotal)}</p>
              <p style={{ fontSize: '11px', margin: '2px 0' }}><strong>Total Sales Count:</strong> {todaySalesCount} orders</p>
              <p style={{ fontSize: '11px', margin: '2px 0' }}><strong>Average Order Value:</strong> {formatCurrency(avgOrderValue)}</p>
            </div>

            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>Collections by Payment Method</h3>
            <table>
              <thead>
                <tr>
                  <th>Payment Method</th>
                  <th>Transaction Count</th>
                  <th>Total Amount Collected</th>
                  <th>% of Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Cash</strong></td>
                  <td>{cashCount}</td>
                  <td><strong>{formatCurrency(cashTotal)}</strong></td>
                  <td>{getPercentage(cashTotal)}</td>
                </tr>
                <tr>
                  <td><strong>M-Pesa (Mobile Money)</strong></td>
                  <td>{mpesaCount}</td>
                  <td><strong>{formatCurrency(mpesaTotal)}</strong></td>
                  <td>{getPercentage(mpesaTotal)}</td>
                </tr>
                <tr>
                  <td><strong>Card (Visa / Mastercard)</strong></td>
                  <td>{cardCount}</td>
                  <td><strong>{formatCurrency(cardTotal)}</strong></td>
                  <td>{getPercentage(cardTotal)}</td>
                </tr>
                {storeCreditTotal > 0 && (
                  <tr>
                    <td><strong>Store Credit / Loyalty</strong></td>
                    <td>{storeCreditCount}</td>
                    <td><strong>{formatCurrency(storeCreditTotal)}</strong></td>
                    <td>{getPercentage(storeCreditTotal)}</td>
                  </tr>
                )}
                <tr style={{ background: '#f1f5f9', fontWeight: 'bold' }}>
                  <td>TOTAL SHIFT COLLECTIONS</td>
                  <td>{todaySalesCount}</td>
                  <td>{formatCurrency(shiftTotal)}</td>
                  <td>100.0%</td>
                </tr>
              </tbody>
            </table>

            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', marginTop: '20px', marginBottom: '8px' }}>Shift Transaction Register</h3>
            <table>
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Time</th>
                  <th>Customer</th>
                  <th>Payment Methods</th>
                  <th style={{ textAlign: 'right' }}>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {completedTodayTx.map((tx) => (
                  <tr key={tx.id}>
                    <td><strong className="font-mono">{tx.receiptNumber}</strong></td>
                    <td>{new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{tx.customerName || 'Walk-in'}</td>
                    <td>
                      {tx.payments && tx.payments.length > 0 
                        ? tx.payments.map((p) => p.method.toUpperCase()).join(', ') 
                        : 'CASH'}
                    </td>
                    <td style={{ textAlign: 'right' }}><strong>{formatCurrency(tx.total)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Shift End Sign-off Block */}
            <div className="signature-box" style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', gap: '30px' }}>
              <div className="sig-line" style={{ flex: 1, borderTop: '1px border #94a3b8', paddingTop: '8px', textAlign: 'center' }}>
                <p style={{ margin: 0 }}>__________________________________</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#64748b' }}>Cashier Signature ({currentUser?.name || 'Cashier'})</p>
              </div>
              <div className="sig-line" style={{ flex: 1, borderTop: '1px border #94a3b8', paddingTop: '8px', textAlign: 'center' }}>
                <p style={{ margin: 0 }}>__________________________________</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#64748b' }}>Store Supervisor / Manager Verification</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
