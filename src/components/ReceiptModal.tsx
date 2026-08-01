import React from 'react';
import { X, Printer, CheckCircle2, ShoppingBag, Phone, MapPin, QrCode } from 'lucide-react';
import { SaleTransaction, StoreLocation } from '../types';
import { formatCurrency } from '../utils/format';

interface ReceiptModalProps {
  transaction: SaleTransaction;
  store?: StoreLocation;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  store,
  onClose,
}) => {
  const handlePrint = () => {
    let directPrintTriggered = false;
    try {
      window.print();
      directPrintTriggered = true;
    } catch (err) {
      console.warn('Direct window.print restricted in iframe, using popup fallback:', err);
    }

    // Secondary fallback for iframe environments where window.print is restricted or silent
    try {
      const receiptEl = document.querySelector('.printable-receipt');
      if (receiptEl) {
        const printWin = window.open('', '_blank', 'width=480,height=700');
        if (printWin) {
          printWin.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Receipt - ${transaction.receiptNumber || 'Thermal Receipt'}</title>
                <style>
                  body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; padding: 20px; margin: 0; background: #ffffff; color: #000000; }
                  .printable-receipt { width: 100%; max-width: 80mm; margin: 0 auto; }
                  .text-center { text-align: center; }
                  .flex { display: flex; }
                  .justify-between { justify-content: space-between; }
                  .border-b { border-bottom: 1px dashed #000; }
                  .border-t { border-top: 1px dashed #000; }
                  .py-3 { padding-top: 10px; padding-bottom: 10px; }
                  .space-y-1 > * + * { margin-top: 4px; }
                  .space-y-2 > * + * { margin-top: 8px; }
                  .font-bold { font-weight: bold; }
                  .font-extrabold { font-weight: 800; }
                  .text-right { text-align: right; }
                  .uppercase { text-transform: uppercase; }
                  .grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); }
                  .col-span-6 { grid-column: span 6 / span 6; }
                  .col-span-2 { grid-column: span 2 / span 2; }
                  .col-span-4 { grid-column: span 4 / span 4; }
                </style>
              </head>
              <body>
                ${receiptEl.outerHTML}
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
      }
    } catch (fallbackErr) {
      console.error('Fallback popup printing error:', fallbackErr);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden text-slate-100 my-8">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80 no-print">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-slate-100">Transaction Complete</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Thermal Receipt Card */}
        <div className="p-6">
          <div className="bg-white text-slate-950 font-mono text-xs p-6 rounded-xl shadow-lg border border-slate-200 printable-receipt space-y-4">
            
            {/* Store Header */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
              <h2 className="text-base font-extrabold uppercase tracking-widest text-slate-900">
                Threads & Style
              </h2>
              <p className="text-[11px] font-sans text-slate-600 font-semibold">
                {store?.name || 'Apparel Boutique'}
              </p>
              <p className="text-[10px] text-slate-500">{store?.address}</p>
              <p className="text-[10px] text-slate-500">TEL: {store?.phone}</p>
            </div>

            {/* Receipt Meta */}
            <div className="space-y-1 text-[11px] text-slate-700">
              <div className="flex justify-between">
                <span>Receipt No:</span>
                <strong className="text-slate-950">{transaction.receiptNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date(transaction.date).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{transaction.cashierName}</span>
              </div>
              {transaction.customerName && (
                <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
                  <span>Customer:</span>
                  <strong className="text-slate-900">{transaction.customerName}</strong>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="border-t border-b border-dashed border-slate-300 py-3 space-y-2">
              <div className="grid grid-cols-12 font-bold text-[10px] text-slate-500 uppercase">
                <span className="col-span-6">Item / Variant</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-4 text-right">Amount</span>
              </div>

              {transaction.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 text-[11px] leading-tight">
                  <div className="col-span-6 pr-1">
                    <div className="font-bold text-slate-900">{item.product.title}</div>
                    <div className="text-[10px] text-slate-500">
                      {item.variant.color} • Sz {item.variant.size} • {item.variant.sku}
                    </div>
                  </div>
                  <div className="col-span-2 text-center text-slate-800">{item.quantity}</div>
                  <div className="col-span-4 text-right font-bold text-slate-950">
                    {formatCurrency(item.unitPrice * item.quantity - item.discountAmount)}
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-1.5 text-[11px] text-slate-700 pt-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(transaction.subtotal)}</span>
              </div>
              {transaction.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount Off:</span>
                  <span>-{formatCurrency(transaction.discount)}</span>
                </div>
              )}
              {transaction.tax > 0 && (
                <div className="flex justify-between">
                  <span>VAT Tax:</span>
                  <span>{formatCurrency(transaction.tax)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm text-slate-950 pt-1 border-t border-slate-300">
                <span>TOTAL PAID:</span>
                <span>{formatCurrency(transaction.total)}</span>
              </div>
            </div>

            {/* Payments breakdown */}
            <div className="border-t border-slate-200 pt-2 text-[10px] space-y-1 text-slate-600">
              <span className="font-bold text-slate-800 block">PAYMENT SUMMARY:</span>
              {transaction.payments.map((p, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="capitalize">
                    {p.method === 'mpesa' ? '📱 M-Pesa / Mobile Cash' : p.method === 'card' ? '💳 Credit Card' : '💵 Cash'}
                    {p.phoneNumber ? ` (${p.phoneNumber})` : ''}:
                  </span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(p.amount)}</span>
                </div>
              ))}
              {transaction.payments.some((p) => p.referenceNumber) && (
                <div className="text-[9px] text-slate-500 font-mono mt-1">
                  REF NO: {transaction.payments.map((p) => p.referenceNumber).filter(Boolean).join(', ')}
                </div>
              )}
            </div>

            {/* Loyalty points info */}
            {transaction.loyaltyPointsEarned > 0 && (
              <div className="bg-amber-50 p-2 rounded text-center text-[10px] text-amber-900 border border-amber-200">
                🎁 Earned <strong>+{transaction.loyaltyPointsEarned} Loyalty Points</strong> on this visit!
              </div>
            )}

            {/* Simulated Barcode */}
            <div className="text-center pt-2 border-t border-dashed border-slate-300 space-y-1">
              <div className="flex justify-center">
                <div className="h-10 w-48 bg-slate-900 flex items-center justify-center rounded px-2">
                  <span className="font-mono text-white tracking-[0.3em] text-[10px] font-bold">
                    |||| ||| ||||| || |||
                  </span>
                </div>
              </div>
              <p className="text-[9px] text-slate-500">Thank you for shopping at Threads & Style!</p>
              <p className="text-[9px] text-slate-400">Exchanges accepted within 14 days with receipt tag intact.</p>
            </div>

          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3 no-print">
          <button
            onClick={handlePrint}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print Receipt</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 py-2.5 px-4 rounded-xl font-bold text-xs transition-colors"
          >
            New Transaction
          </button>
        </div>

      </div>
    </div>
  );
};
