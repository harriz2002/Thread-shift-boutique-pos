const fs = require('fs');

let storeModalContent = fs.readFileSync('src/components/StoreManagerModal.tsx', 'utf-8');

storeModalContent = storeModalContent.replace(
  "onUpdateStores: (updatedStores: StoreLocation[], updatedProducts: MasterProduct[], newActiveStoreId?: string) => void;",
  "onUpdateStores: (updatedStores: StoreLocation[], updatedProducts: MasterProduct[], newActiveStoreId?: string, deletedStoreId?: string) => void;"
);

storeModalContent = storeModalContent.replace(
  "    onUpdateStores(updatedStores, updatedProducts, nextActiveId);",
  "    onUpdateStores(updatedStores, updatedProducts, nextActiveId, storeToDelete.id);"
);

fs.writeFileSync('src/components/StoreManagerModal.tsx', storeModalContent);
