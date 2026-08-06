import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, QrCode, Search, Barcode, CheckCircle2, AlertCircle, Camera } from 'lucide-react';
import { MasterProduct, ProductVariant } from '../types';

interface BarcodeScannerModalProps {
  products: MasterProduct[];
  activeStoreId: string;
  onClose: () => void;
  onScanResult: (product: MasterProduct, variant: ProductVariant) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  products,
  activeStoreId,
  onClose,
  onScanResult,
}) => {
  const [scannedCode, setScannedCode] = useState('');
  const [feedback, setFeedback] = useState<{ success: boolean; msg: string } | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (isCameraActive) {
      // Small delay to ensure the DOM element exists
      setTimeout(() => {
        scanner = new Html5QrcodeScanner(
          "qr-reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            videoConstraints: { facingMode: "environment" },
            rememberLastUsedCamera: false,
          },
          false
        );
        scanner.render(
          (decodedText) => {
            setScannedCode(decodedText);
            handleScanSubmit(decodedText);
            setIsCameraActive(false);
            if (scanner) {
              scanner.clear().catch(console.error);
            }
          },
          (error) => {
            // ignore scan errors
          }
        );
      }, 100);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [isCameraActive]);

  // Flatten all variants across master products
  const allVariantsWithProducts: { product: MasterProduct; variant: ProductVariant }[] = [];
  products.forEach((p) => {
    p.variants.forEach((v) => {
      allVariantsWithProducts.push({ product: p, variant: v });
    });
  });

  const handleScanSubmit = (codeToScan: string) => {
    let code = codeToScan.trim().toUpperCase();
    if (!code) {
      // If user clicks Scan with empty input, auto-scan the first available garment barcode for quick testing
      if (allVariantsWithProducts.length > 0) {
        code = allVariantsWithProducts[0].variant.barcode.toUpperCase();
        setScannedCode(code);
      } else {
        setFeedback({
          success: false,
          msg: 'Please enter a Barcode, SKU, or Style Number to scan.',
        });
        return;
      }
    }

    const found = allVariantsWithProducts.find(
      (item) =>
        item.variant.barcode.toUpperCase() === code ||
        item.variant.sku.toUpperCase() === code ||
        item.variant.barcode.toUpperCase().includes(code) ||
        item.variant.sku.toUpperCase().includes(code) ||
        item.product.styleNumber.toUpperCase().includes(code) ||
        item.product.title.toUpperCase().includes(code)
    );

    if (found) {
      setFeedback({
        success: true,
        msg: `Scanned: ${found.product.title} (${found.variant.color} - Size ${found.variant.size})`,
      });
      onScanResult(found.product, found.variant);
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setFeedback({
        success: false,
        msg: `No garment found matching Barcode/SKU/Style: "${code}"`,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-100 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">Garment Tag Barcode Scanner</h3>
              <p className="text-xs text-slate-400">Scan or enter 9-digit barcode / SKU</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input field simulating laser scanner gun */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleScanSubmit(scannedCode);
          }}
          className="space-y-3"
        >
          <div className="relative">
            <Barcode className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={scannedCode}
              onChange={(e) => {
                setScannedCode(e.target.value);
                setFeedback(null);
              }}
              placeholder="Laser scan or type Barcode (e.g. 889100101)..."
              className="w-full bg-slate-950 text-slate-100 font-mono text-sm pl-11 pr-24 py-3 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
            />
            <button
              type="submit"
              onClick={(e) => {
                e.preventDefault();
                handleScanSubmit(scannedCode);
              }}
              className="absolute right-2 top-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg transition-all shadow-md"
            >
              Scan
            </button>
          </div>
        </form>
        {/* Camera Scanner Toggle */}
        <button
          type="button"
          onClick={() => setIsCameraActive(!isCameraActive)}
          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-sm px-4 py-3 rounded-xl border border-emerald-500/30 transition-all shadow-md"
        >
          <Camera className="w-5 h-5" />
          {isCameraActive ? "Close Camera" : "Open Camera Scanner"}
        </button>

        {isCameraActive && (
          <div className="w-full bg-slate-950 p-2 rounded-xl border border-slate-800 flex justify-center overflow-hidden">
            <div id="qr-reader" className="w-full max-w-sm"></div>
          </div>
        )}


        <style dangerouslySetInnerHTML={{__html: `
          #qr-reader { border: none !important; }
          #qr-reader__scan_region { background: #020617; }
          #qr-reader__dashboard_section_csr button { 
            background: #10b981 !important; 
            color: #020617 !important; 
            border: none !important; 
            padding: 8px 16px !important; 
            border-radius: 8px !important; 
            font-weight: bold !important; 
            margin: 4px;
          }
          #qr-reader__dashboard_section_swaplink { color: #10b981 !important; text-decoration: none !important; }
        `}} />
        {/* Feedback message */}
        {feedback && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
              feedback.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {feedback.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.msg}</span>
          </div>
        )}

        {/* Sample Quick Barcodes to test */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Sample Garment Barcodes (Click to simulate scan):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {allVariantsWithProducts.slice(0, 8).map(({ product, variant }) => {
              const stock = variant.stockByStore[activeStoreId] || 0;
              return (
                <button
                  key={variant.id}
                  onClick={() => {
                    setScannedCode(variant.barcode);
                    handleScanSubmit(variant.barcode);
                  }}
                  className="flex flex-col items-start p-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:border-emerald-500/50 hover:bg-slate-900 text-left transition-all group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono text-[11px] font-bold text-emerald-400 group-hover:underline">
                      {variant.barcode}
                    </span>
                    <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono">
                      {variant.sku}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-200 truncate w-full mt-0.5">
                    {product.title}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                    <span>{variant.color}</span>
                    <span>•</span>
                    <span className="font-bold text-amber-400">Size {variant.size}</span>
                    <span>•</span>
                    <span>{stock} in stock</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
