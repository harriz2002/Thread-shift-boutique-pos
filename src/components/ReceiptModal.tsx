import React, { useState } from 'react';
import { X, Printer, CheckCircle2, ShoppingBag, Phone, MapPin, QrCode, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { SaleTransaction, StoreLocation, SystemSettings } from '../types';
import { formatCurrency, maskPhoneNumber } from '../utils/format';
import { ReceiptQrScannerModal } from './ReceiptQrScannerModal';

interface ReceiptModalProps {
  transaction: SaleTransaction;
  store?: StoreLocation;
  systemSettings?: SystemSettings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  store,
  systemSettings,
  onClose,
}) => {
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  // 1. Boutique / Store Name
  const storeName = store?.name || systemSettings?.businessName || 'Threads & Style Boutique';

  // 2. Register Identifier
  const registerId = transaction.registerId || `REG-${store?.code || 'POS'}-01`;

  // 3. Receipt Number
  const receiptNumber = transaction.receiptNumber || `REC-${transaction.id}`;

  // 4. Sequential Number
  const sequentialNumber = transaction.sequentialNumber || (transaction.receiptNumber?.match(/\d+/)?.[0] || '1001');

  // 5. Date & Time of Transaction
  const dateTime = new Date(transaction.date).toLocaleString();

  // 6. Cashier Name (even if admin did sale)
  const cashierName = transaction.cashierName || 'Admin / Cashier';

  // 7. Gross Amount
  const grossAmount = formatCurrency(transaction.subtotal || transaction.total);

  // 8. Total Amount
  const totalAmount = formatCurrency(transaction.total);

  // 9. Signature Value (SCE)
  const signatureValue = transaction.signatureValue || `SCE-SIG-${transaction.id.replace('tx-', '').toUpperCase()}-8F7A`;

  // 10. Chaining Value (SCE)
  const chainingValue = transaction.chainingValue || `SCE-CHAIN-PREV-${(transaction.id.slice(-6) || '000000').toUpperCase()}-A1B2`;

  // 11. Item Names, Quantity, Unit Price
  const itemSummaryList = transaction.items.map((item, idx) => 
    `${idx + 1}. ${item.product.title} (${item.variant.color}/${item.variant.size}) x${item.quantity} @ ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.unitPrice * item.quantity - item.discountAmount)}`
  ).join('\n');

  // 12. Payment Method
  const paymentMethods = transaction.payments && transaction.payments.length > 0 
    ? transaction.payments.map((p) => p.method.toUpperCase()).join(', ') 
    : 'CASH';

  // 13. Transaction / Reference Number
  const referenceNumber = transaction.payments?.map(p => p.referenceNumber).filter(Boolean).join(', ') || transaction.id;

  // Formatted QR Code payload text
  const qrDataText = [
    `=== OFFICIAL RECEIPT VERIFICATION ===`,
    `Boutique / Store: ${storeName}`,
    `Receipt Number: ${receiptNumber}`,
    `Date & Time: ${dateTime}`,
    `Cashier Name: ${cashierName}`,
    ``,
    `--- ITEMS PURCHASED ---`,
    itemSummaryList,
    ``,
    `Total Amount: ${totalAmount}`,
    `Payment Method: ${paymentMethods}`
  ].join('\n');

  const handlePrint = () => {
    let directPrintTriggered = false;
    try {
      window.print();
      directPrintTriggered = true;
    } catch (err) {
      console.warn('Direct window.print restricted in iframe, using popup fallback:', err);
    }

    try {
      const receiptEl = document.querySelector('.printable-receipt');
      if (receiptEl) {
        const printWin = window.open('', '_blank', 'width=480,height=700');
        if (printWin) {
          printWin.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Receipt - ${receiptNumber}</title>
                <style>
                  @page { size: 80mm auto; margin: 0; }
                  body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; padding: 0; margin: 0; background: #ffffff; color: #000000; width: 80mm; }
                  .printable-receipt { width: 80mm; max-width: 80mm; margin: 0 auto; box-sizing: border-box; padding: 4mm 2mm; }
                  .text-center { text-align: center; }
                  .flex { display: flex; }
                  .justify-between { justify-content: space-between; }
                  .items-start { align-items: flex-start; }
                  .items-center { align-items: center; }
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
                  .bg-slate-50 { background-color: #f8fafc; }
                  .p-2 { padding: 8px; }
                  .p-1\.5 { padding: 6px; }
                  .rounded { border-radius: 4px; }
                  .rounded-lg { border-radius: 6px; }
                  .border { border: 1px solid #cbd5e1; }
                  .text-emerald-700 { color: #047857; }
                  .mt-1 { margin-top: 4px; }
                  .pt-2 { padding-top: 8px; }
                  .gap-3 { gap: 12px; }
                  .shrink-0 { flex-shrink: 0; }
                  .flex-col { flex-direction: column; }
                  svg { display: block; max-width: 100%; height: auto; }
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
            <div className="flex items-start justify-between pb-3 border-b border-dashed border-slate-300 gap-2">
              <div className="shrink-0 flex items-start pt-0.5">
                {systemSettings?.logoUrl ? (
                  <img
                    src={systemSettings.logoUrl}
                    alt="Shop Logo"
                    className="max-h-16 max-w-[90px] object-contain filter grayscale contrast-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 bg-slate-950 text-amber-400 rounded-lg flex items-center justify-center p-2 shadow-sm border border-slate-800">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="text-right space-y-0.5 min-w-0 flex-1">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 leading-tight">
                  {systemSettings?.receiptHeader || systemSettings?.businessName || 'Threads & Style'}
                </h2>
                <p className="text-[11px] font-sans text-slate-700 font-bold leading-tight mt-0.5">
                  {storeName}
                </p>
                <p className="text-[10px] text-slate-500 leading-tight">{store?.address || systemSettings?.address}</p>
                <p className="text-[10px] text-slate-500 leading-tight">TEL: {store?.phone || systemSettings?.phone}</p>
              </div>
            </div>

            {/* Receipt Meta */}
            <div className="space-y-1 text-[11px] text-slate-700">
              <div className="flex justify-between">
                <span>Receipt No:</span>
                <strong className="text-slate-950">{receiptNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <span>{dateTime}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span className="font-semibold text-slate-900">{cashierName}</span>
              </div>
              {transaction.customerName && (
                <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
                  <span>Customer:</span>
                  <strong className="text-slate-900">
                    {/\d{6,}/.test(transaction.customerName)
                      ? maskPhoneNumber(transaction.customerName)
                      : transaction.customerName}
                  </strong>
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
              <div className="flex justify-between font-extrabold text-sm text-slate-950 pt-1 border-t border-slate-300">
                <span>TOTAL PAID:</span>
                <span>{totalAmount}</span>
              </div>

              {/* Cash Tendered & Change Breakdown */}
              {(() => {
                const cashPayment = transaction.payments.find((p) => p.method === 'cash');
                if (cashPayment || transaction.tenderedAmount !== undefined) {
                  const tendered = transaction.tenderedAmount ?? cashPayment?.tenderedAmount ?? transaction.total;
                  const change = transaction.changeAmount ?? cashPayment?.changeAmount ?? Math.max(0, tendered - transaction.total);
                  return (
                    <div className="pt-2 mt-1 border-t border-dashed border-slate-400 space-y-1 text-[11px] bg-slate-50 p-2 rounded border border-slate-200">
                      <div className="flex justify-between text-slate-800">
                        <span>Cash Tendered:</span>
                        <span className="font-mono font-bold text-slate-950">{formatCurrency(tendered)}</span>
                      </div>
                      <div className="flex justify-between font-extrabold text-slate-950 text-[12px] pt-1 border-t border-slate-200">
                        <span>CHANGE RETURNED:</span>
                        <span className="font-mono text-emerald-700">{formatCurrency(change)}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Payments breakdown */}
            <div className="border-t border-slate-200 pt-2 text-[10px] space-y-1 text-slate-600">
              <span className="font-bold text-slate-800 block">PAYMENT SUMMARY:</span>
              {transaction.payments.map((p, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="capitalize">
                    {p.method === 'mpesa' ? '📱 M-Pesa / Mobile Cash' : p.method === 'card' ? '💳 Credit Card' : '💵 Cash'}
                    {p.phoneNumber ? ` (${maskPhoneNumber(p.phoneNumber)})` : ''}:
                  </span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </div>

            {/* Loyalty points info */}
            {transaction.loyaltyPointsEarned > 0 && (
              <div className="bg-amber-50 p-2 rounded text-center text-[10px] text-amber-900 border border-amber-200">
                🎁 Earned <strong>+{transaction.loyaltyPointsEarned} Loyalty Points</strong> on this visit!
              </div>
            )}

            {/* Highly Visible QR Code for Camera Scanning & Official Verification */}
            {systemSettings?.showReceiptBarcode !== false && (
              <div className="pt-2 border-t border-dashed border-slate-300 flex flex-col items-center justify-center text-center">
                <div 
                  className="inline-flex flex-col items-center bg-white p-3.5 rounded-2xl border-2 border-slate-900 shadow-md cursor-pointer hover:bg-slate-50 transition-all group max-w-full"
                  onClick={() => setIsQrScannerOpen(true)}
                  title="Click to open Receipt QR Scanner & Verifier Tool"
                >
                  <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-inner">
                    <QRCodeSVG
                      value={qrDataText}
                      size={175}
                      level="Q"
                      includeMargin={true}
                      fgColor="#000000"
                      bgColor="#FFFFFF"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-900 group-hover:text-emerald-700">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 inline shrink-0" />
                    <span>SCAN TO VERIFY RECEIPT</span>
                  </div>
                  <span className="text-[8.5px] text-slate-500 font-mono mt-0.5">
                    Click QR code to test camera scanner
                  </span>
                </div>
              </div>
            )}

            {/* Footer Messages */}
            <div className="text-center pt-2 border-t border-dashed border-slate-300 space-y-1">
              <p className="text-[9px] text-slate-500">
                {systemSettings?.receiptFooterMessage || 'Thank you for shopping at Threads & Style!'}
              </p>
              <p className="text-[9px] text-slate-400">
                {systemSettings?.receiptReturnPolicy || 'Exchanges accepted within 14 days with receipt tag intact.'}
              </p>
            </div>

          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 no-print">
          <button
            onClick={() => setIsQrScannerOpen(true)}
            className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors border border-emerald-500/30"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>Scan & Verify QR</span>
          </button>
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

      {/* Real Working Receipt QR Scanner & Verifier Modal */}
      {isQrScannerOpen && (
        <ReceiptQrScannerModal
          initialQrData={qrDataText}
          onClose={() => setIsQrScannerOpen(false)}
        />
      )}
    </div>
  );
};
