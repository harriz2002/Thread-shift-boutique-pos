const fs = require('fs');

let scannerContent = fs.readFileSync('src/components/BarcodeScannerModal.tsx', 'utf-8');

if (!scannerContent.includes("import { Html5QrcodeScanner }")) {
  scannerContent = scannerContent.replace(
    "import React, { useState } from 'react';",
    "import React, { useState, useEffect } from 'react';\nimport { Html5QrcodeScanner } from 'html5-qrcode';"
  );
  scannerContent = scannerContent.replace(
    "import { X, QrCode, Search, Barcode, CheckCircle2, AlertCircle } from 'lucide-react';",
    "import { X, QrCode, Search, Barcode, CheckCircle2, AlertCircle, Camera } from 'lucide-react';"
  );

  const cameraStateCode = `  const [isCameraActive, setIsCameraActive] = useState(false);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (isCameraActive) {
      // Small delay to ensure the DOM element exists
      setTimeout(() => {
        scanner = new Html5QrcodeScanner(
          "qr-reader",
          { fps: 10, qrbox: { width: 250, height: 150 } },
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
  }, [isCameraActive]);`;

  scannerContent = scannerContent.replace(
    "  const [feedback, setFeedback] = useState<{ success: boolean; msg: string } | null>(null);",
    "  const [feedback, setFeedback] = useState<{ success: boolean; msg: string } | null>(null);\n" + cameraStateCode
  );

  const cameraButtonCode = `        {/* Camera Scanner Toggle */}
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
        )}`;

  scannerContent = scannerContent.replace(
    "        </form>",
    "        </form>\n" + cameraButtonCode
  );
  
  // Cleanup CSS to make html5-qrcode look better in dark mode
  const cssInject = `
        <style>
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
        </style>`;
  
  scannerContent = scannerContent.replace(
    "        {/* Feedback message */}",
    cssInject + "\n        {/* Feedback message */}"
  );

  fs.writeFileSync('src/components/BarcodeScannerModal.tsx', scannerContent);
}
