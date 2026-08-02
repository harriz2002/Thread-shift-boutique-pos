const fs = require('fs');
let appContent = fs.readFileSync('src/App.tsx', 'utf-8');

appContent = appContent.replace(
  "import { StaffManagerModal } from './components/StaffManagerModal';",
  "import { StaffManagerModal } from './components/StaffManagerModal';\nimport { useGlobalBarcodeScanner } from './hooks/useBarcodeScanner';"
);

const hookCode = `
  // Global Barcode Scanner Listener (Physical Scanners)
  useGlobalBarcodeScanner((barcode) => {
    let foundProduct = null;
    let foundVariant = null;

    for (const prod of products) {
      const match = prod.variants.find(v => v.barcode === barcode || v.sku === barcode);
      if (match) {
        foundProduct = prod;
        foundVariant = match;
        break;
      }
    }

    if (foundProduct && foundVariant) {
      handleAddToCart(foundProduct, foundVariant, 1);
    } else {
      console.warn('Scanned item not found in inventory:', barcode);
    }
  });

  const activeStoreObj = stores.find((s) => s.id === activeStoreId);
`;

appContent = appContent.replace(
  "  const activeStoreObj = stores.find((s) => s.id === activeStoreId);",
  hookCode
);

fs.writeFileSync('src/App.tsx', appContent);
