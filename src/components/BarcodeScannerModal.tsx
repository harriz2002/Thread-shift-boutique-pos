import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, QrCode, Barcode, CheckCircle2, AlertCircle, Camera, SwitchCamera, RefreshCw } from 'lucide-react';
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
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn("Error stopping camera scanner:", e);
      }
      html5QrCodeRef.current = null;
    }
  };

  useEffect(() => {
    let mounted = true;

    async function startScanner() {
      if (!isCameraActive) return;

      setIsCameraLoading(true);
      setCameraError(null);

      // Stop existing instance if any
      await stopScanner();

      // Small delay for DOM element #qr-reader to mount
      await new Promise((r) => setTimeout(r, 150));
      if (!mounted) return;

      try {
        const qrCode = new Html5Qrcode("qr-reader");
        html5QrCodeRef.current = qrCode;

        // Try getting cameras list for switching option
        try {
          const devices = await Html5Qrcode.getCameras();
          if (mounted && devices && devices.length > 0) {
            setCameras(devices);
            // If user hasn't explicitly chosen a camera ID yet, check if there's a back/rear camera in labels
            if (!selectedCameraId) {
              const backCamera = devices.find(d => 
                d.label.toLowerCase().includes('back') || 
                d.label.toLowerCase().includes('rear') || 
                d.label.toLowerCase().includes('environment')
              );
              if (backCamera) {
                setSelectedCameraId(backCamera.id);
              }
            }
          }
        } catch (e) {
          console.warn("Could not list camera devices:", e);
        }

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 160 },
          aspectRatio: 1.0,
        };

        const onScanSuccess = (decodedText: string) => {
          setScannedCode(decodedText);
          handleScanSubmit(decodedText);
          setIsCameraActive(false);
        };

        const onScanFailure = () => {
          // ignore frame scan errors
        };

        // Determine constraint: prefer selected camera ID or environment facingMode (rear camera)
        let cameraConstraint: any = selectedCameraId || { facingMode: cameraFacingMode };

        try {
          await qrCode.start(cameraConstraint, config, onScanSuccess, onScanFailure);
        } catch (firstErr) {
          console.warn("Camera start failed with preferred constraint, trying fallback to facingMode 'environment'", firstErr);
          try {
            await qrCode.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure);
          } catch (secondErr) {
            console.warn("Fallback failed, trying facingMode 'user'", secondErr);
            await qrCode.start({ facingMode: "user" }, config, onScanSuccess, onScanFailure);
          }
        }

        if (mounted) {
          setIsCameraLoading(false);
        }
      } catch (err: any) {
        console.error("Camera start final error:", err);
        if (mounted) {
          setIsCameraLoading(false);
          setCameraError(err?.message || "Failed to access camera. Please allow camera permissions in your browser.");
        }
      }
    }

    if (isCameraActive) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      mounted = false;
      stopScanner();
    };
  }, [isCameraActive, cameraFacingMode, selectedCameraId]);

  const toggleCamera = async () => {
    if (cameras.length > 1) {
      const currentIndex = selectedCameraId ? cameras.findIndex(c => c.id === selectedCameraId) : 0;
      const nextIndex = (currentIndex + 1) % cameras.length;
      setSelectedCameraId(cameras[nextIndex].id);
    } else {
      const nextMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
      setCameraFacingMode(nextMode);
      setSelectedCameraId(null);
    }
  };

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
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsCameraActive(!isCameraActive)}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-sm px-4 py-3 rounded-xl border border-emerald-500/30 transition-all shadow-md"
          >
            <Camera className="w-5 h-5" />
            {isCameraActive ? "Close Camera" : "Open Rear Camera Scanner"}
          </button>

          {isCameraActive && (
            <button
              type="button"
              onClick={toggleCamera}
              title="Switch Camera (Rear / Front)"
              className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-3 rounded-xl border border-slate-700 transition-all shrink-0"
            >
              <SwitchCamera className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Flip</span>
            </button>
          )}
        </div>

        {isCameraActive && (
          <div className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col items-center justify-center overflow-hidden gap-2">
            <div className="flex items-center justify-between w-full text-xs text-slate-400 px-1">
              <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {cameraFacingMode === 'environment' || selectedCameraId ? 'Rear Camera (Barcode Scanner)' : 'Front Camera'}
              </span>
              {cameras.length > 0 && (
                <span className="text-[11px] text-slate-500">
                  {cameras.length} camera(s) detected
                </span>
              )}
            </div>

            {isCameraLoading && (
              <div className="py-8 flex flex-col items-center gap-2 text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                <span>Starting camera...</span>
              </div>
            )}

            {cameraError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-xs flex items-center gap-2 w-full">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            <div id="qr-reader" className="w-full max-w-sm rounded-lg overflow-hidden border border-slate-800"></div>
          </div>
        )}

        <style dangerouslySetInnerHTML={{__html: `
          #qr-reader { border: none !important; }
          #qr-reader video { width: 100% !important; object-fit: cover !important; border-radius: 8px !important; }
          #qr-reader__scan_region { background: #020617; }
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
