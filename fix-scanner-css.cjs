const fs = require('fs');

let scannerContent = fs.readFileSync('src/components/BarcodeScannerModal.tsx', 'utf-8');

const badCss = `
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

const goodCss = `
        <style dangerouslySetInnerHTML={{__html: \`
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
        \`}} />`;

scannerContent = scannerContent.replace(badCss, goodCss);

fs.writeFileSync('src/components/BarcodeScannerModal.tsx', scannerContent);
