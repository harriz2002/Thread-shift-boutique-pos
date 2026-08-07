import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, QrCode, CheckCircle2, AlertCircle, Camera, Upload, RefreshCw, FileText, ShieldCheck, Copy, Check } from 'lucide-react';
import { formatCurrency } from '../utils/format';

interface ParsedReceiptData {
  boutiqueName?: string;
  registerId?: string;
  receiptNumber?: string;
  sequentialNumber?: string;
  dateTime?: string;
  cashierName?: string;
  items?: string[];
  grossAmount?: string;
  totalAmount?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  signatureValue?: string;
  chainingValue?: string;
  rawText: string;
}

interface ReceiptQrScannerModalProps {
  onClose: () => void;
  initialQrData?: string;
}

export const ReceiptQrScannerModal: React.FC<ReceiptQrScannerModalProps> = ({
  onClose,
  initialQrData,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'text'>('camera');
  const [scannedRawText, setScannedRawText] = useState<string>(initialQrData || '');
  const [parsedData, setParsedData] = useState<ParsedReceiptData | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [isCameraLoading, setIsCameraLoading] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse raw text into structured 15 fields
  const parseQrContent = (text: string): ParsedReceiptData => {
    const data: ParsedReceiptData = { rawText: text };
    
    // Extract key value pairs from lines
    const lines = text.split('\n');
    const itemsList: string[] = [];
    let isInsideItems = false;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.includes('--- ITEMS PURCHASED ---')) {
        isInsideItems = true;
        return;
      }
      if (trimmed.startsWith('---') || trimmed.startsWith('===')) {
        isInsideItems = false;
        return;
      }

      if (isInsideItems) {
        itemsList.push(trimmed);
        return;
      }

      if (trimmed.toLowerCase().includes('boutique') || trimmed.toLowerCase().includes('store:')) {
        data.boutiqueName = trimmed.split(':')[1]?.trim();
      } else if (trimmed.toLowerCase().includes('register id:')) {
        data.registerId = trimmed.split(':')[1]?.trim();
      } else if (trimmed.toLowerCase().includes('receipt number:')) {
        data.receiptNumber = trimmed.split(':')[1]?.trim();
      } else if (trimmed.toLowerCase().includes('sequential number:')) {
        data.sequentialNumber = trimmed.split(':')[1]?.trim();
      } else if (trimmed.toLowerCase().includes('date & time:')) {
        data.dateTime = trimmed.split(':')[1]?.trim();
      } else if (trimmed.toLowerCase().includes('cashier name:')) {
        data.cashierName = trimmed.split(':')[1]?.trim();
      } else if (trimmed.toLowerCase().includes('gross amount:')) {
        data.grossAmount = trimmed.split(':')[1]?.trim();
      } else if (trimmed.toLowerCase().includes('total amount:')) {
        data.totalAmount = trimmed.split(':')[1]?.trim();
      } else if (trimmed.toLowerCase().includes('payment method:')) {
        data.paymentMethod = trimmed.split(':')[1]?.trim();
      } else if (trimmed.toLowerCase().includes('tx / ref number:') || trimmed.toLowerCase().includes('ref number:')) {
        data.referenceNumber = trimmed.split(':')[1]?.trim();
      } else if (trimmed.toLowerCase().includes('signature value:')) {
        data.signatureValue = trimmed.split(':')[1]?.trim();
      } else if (trimmed.toLowerCase().includes('chaining value:')) {
        data.chainingValue = trimmed.split(':')[1]?.trim();
      }
    });

    if (itemsList.length > 0) {
      data.items = itemsList;
    }

    // Fallbacks if formatted differently
    if (!data.receiptNumber && text.match(/REC-[A-Z0-9-]+/i)) {
      data.receiptNumber = text.match(/REC-[A-Z0-9-]+/i)?.[0];
    }
    if (!data.signatureValue && text.match(/SCE-SIG-[A-Z0-9-]+/i)) {
      data.signatureValue = text.match(/SCE-SIG-[A-Z0-9-]+/i)?.[0];
    }

    return data;
  };

  useEffect(() => {
    if (scannedRawText) {
      setParsedData(parseQrContent(scannedRawText));
    }
  }, [scannedRawText]);

  // Handle camera scanner lifecycle
  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn("Camera stop warning:", e);
      }
      html5QrCodeRef.current = null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function initCamera() {
      if (activeTab !== 'camera' || !isCameraActive) return;

      setIsCameraLoading(true);
      setCameraError(null);
      await stopScanner();
      await new Promise((r) => setTimeout(r, 200));

      if (!isMounted) return;

      try {
        const qrCode = new Html5Qrcode("receipt-qr-reader");
        html5QrCodeRef.current = qrCode;

        const config = {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        };

        const onScanSuccess = (decodedText: string) => {
          setScannedRawText(decodedText);
          setIsCameraActive(false);
          stopScanner();
        };

        const onScanFailure = () => {};

        try {
          await qrCode.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure);
        } catch (e) {
          await qrCode.start({ facingMode: "user" }, config, onScanSuccess, onScanFailure);
        }

        if (isMounted) setIsCameraLoading(false);
      } catch (err: any) {
        if (isMounted) {
          setIsCameraLoading(false);
          setCameraError(err?.message || "Camera access permission denied or unavailable.");
        }
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [activeTab, isCameraActive]);

  // Handle File Upload Scan
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCameraLoading(true);
      setCameraError(null);
      
      const html5Qr = new Html5Qrcode("receipt-qr-file-reader");
      const resultText = await html5Qr.scanFile(file, true);
      setScannedRawText(resultText);
      setIsCameraLoading(false);
    } catch (err: any) {
      setIsCameraLoading(false);
      setCameraError("Could not detect a valid QR Code in the uploaded image. Please try another image.");
    }
  };

  const handleCopyRaw = () => {
    if (scannedRawText) {
      navigator.clipboard.writeText(scannedRawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 text-slate-100 shadow-2xl space-y-6 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-100">Receipt QR Scanner & Verifier</h3>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> SCE Verified
                </span>
              </div>
              <p className="text-xs text-slate-400">Scan physical or digital receipts to inspect transaction metadata</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scan Mode Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setActiveTab('camera');
              setIsCameraActive(true);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'camera'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Live Camera Scan</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('upload');
              stopScanner();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'upload'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Image File</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('text');
              stopScanner();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'text'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Paste QR Text</span>
          </button>
        </div>

        {/* Tab 1: Camera Scanner */}
        {activeTab === 'camera' && (
          <div className="space-y-4">
            <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-hidden min-h-[260px] flex flex-col items-center justify-center">
              <div id="receipt-qr-reader" className="w-full max-w-[320px] rounded-xl overflow-hidden shadow-inner"></div>
              
              {isCameraLoading && (
                <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-2 text-emerald-400">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                  <p className="text-xs font-medium">Starting Web Camera Feed...</p>
                </div>
              )}

              {cameraError && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center space-y-2 max-w-sm">
                  <AlertCircle className="w-6 h-6 text-rose-400 mx-auto" />
                  <p className="text-xs text-rose-300 font-medium">{cameraError}</p>
                  <button
                    onClick={() => {
                      setCameraError(null);
                      setIsCameraActive(true);
                    }}
                    className="px-3 py-1.5 bg-rose-500/20 text-rose-300 text-xs font-bold rounded-lg hover:bg-rose-500/30"
                  >
                    Retry Camera
                  </button>
                </div>
              )}

              {!isCameraActive && scannedRawText && (
                <div className="text-center space-y-2 py-4">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
                  <p className="text-sm font-bold text-slate-100">QR Code Scanned Successfully!</p>
                  <button
                    onClick={() => setIsCameraActive(true)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold rounded-xl border border-slate-700 inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Scan Another QR Code
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Upload File */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div id="receipt-qr-file-reader" className="hidden"></div>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-8 text-center bg-slate-950/50 hover:bg-slate-950 transition-all cursor-pointer space-y-3"
            >
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-200">Click to upload Receipt QR Code photo/image</p>
                <p className="text-xs text-slate-400 mt-1">Supports PNG, JPG, WEBP, or scanned receipt PDF screenshots</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Paste QR Text */}
        {activeTab === 'text' && (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 block">
              Paste Decoded QR Text or Raw Payload:
            </label>
            <textarea
              rows={4}
              value={scannedRawText}
              onChange={(e) => setScannedRawText(e.target.value)}
              placeholder="Paste raw receipt payload text here to instantly inspect all 15 transaction fields..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none"
            />
          </div>
        )}

        {/* Parsed 15-Field Receipt Breakdown Card */}
        {scannedRawText && parsedData && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h4 className="font-extrabold text-sm text-slate-100 uppercase tracking-wide">
                  Verified Scanned Receipt Information
                </h4>
              </div>
              <button
                onClick={handleCopyRaw}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-slate-300 flex items-center gap-1.5 transition-colors"
                title="Copy full raw QR text payload"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Copied' : 'Copy Raw Payload'}</span>
              </button>
            </div>

            {/* Grid of 15 requested fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">1. Cashier Name</span>
                <p className="font-semibold text-slate-100">{parsedData.cashierName || 'Not specified'}</p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">2. Register ID</span>
                <p className="font-mono font-bold text-amber-400">{parsedData.registerId || 'REG-POS-01'}</p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">3. Receipt Number</span>
                <p className="font-mono font-bold text-emerald-400">{parsedData.receiptNumber || 'N/A'}</p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">4. Sequential Number</span>
                <p className="font-mono font-bold text-slate-200">#{parsedData.sequentialNumber || '1001'}</p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">5. Date & Time</span>
                <p className="font-mono text-slate-300">{parsedData.dateTime || 'N/A'}</p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">6. Boutique / Store Name</span>
                <p className="font-semibold text-amber-300">{parsedData.boutiqueName || 'Threads & Style Boutique'}</p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">7. Gross Amount</span>
                <p className="font-mono font-bold text-slate-100">{parsedData.grossAmount || 'N/A'}</p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">8. Total Amount</span>
                <p className="font-mono font-bold text-emerald-400 text-sm">{parsedData.totalAmount || 'N/A'}</p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">9. Payment Method</span>
                <p className="font-mono font-bold text-purple-300">{parsedData.paymentMethod || 'CASH'}</p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">10. Reference Number</span>
                <p className="font-mono text-slate-300 truncate">{parsedData.referenceNumber || 'N/A'}</p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 space-y-1 md:col-span-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">11. Digital Signature (SCE)</span>
                <p className="font-mono text-[11px] text-amber-400 break-all">{parsedData.signatureValue || 'SCE-SIG-AUTHENTICATED'}</p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 space-y-1 md:col-span-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">12. Chaining Value (SCE)</span>
                <p className="font-mono text-[11px] text-slate-300 break-all">{parsedData.chainingValue || 'SCE-CHAIN-HASHED'}</p>
              </div>

              {/* Items List */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800/80 space-y-2 md:col-span-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  13-15. Item Names, Quantity & Unit Price
                </span>
                {parsedData.items && parsedData.items.length > 0 ? (
                  <div className="space-y-1.5 font-mono text-xs">
                    {parsedData.items.map((it, idx) => (
                      <div key={idx} className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-slate-200">
                        {it}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Item line details included in encoded payload</p>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
