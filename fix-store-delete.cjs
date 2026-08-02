const fs = require('fs');

let appContent = fs.readFileSync('src/App.tsx', 'utf-8');

appContent = appContent.replace(
  "import { bootstrapFirestoreIfEmpty, saveDocument } from './lib/firebase';",
  "import { bootstrapFirestoreIfEmpty, saveDocument, deleteDocument } from './lib/firebase';"
);

appContent = appContent.replace(
  "const handleUpdateStores = (updatedStores: StoreLocation[], updatedProducts: MasterProduct[], newActiveStoreId?: string) => {",
  "const handleUpdateStores = (updatedStores: StoreLocation[], updatedProducts: MasterProduct[], newActiveStoreId?: string, deletedStoreId?: string) => {"
);

appContent = appContent.replace(
  "    updatedProducts.forEach((p) => saveDocument('products', p));\n  };",
  "    updatedProducts.forEach((p) => saveDocument('products', p));\n    if (deletedStoreId) {\n      deleteDocument('stores', deletedStoreId);\n    }\n  };"
);

fs.writeFileSync('src/App.tsx', appContent);

let storeModalContent = fs.readFileSync('src/components/StoreManagerModal.tsx', 'utf-8');

storeModalContent = storeModalContent.replace(
  "onUpdateStores: (stores: StoreLocation[], products: MasterProduct[], newActiveStoreId?: string) => void;",
  "onUpdateStores: (stores: StoreLocation[], products: MasterProduct[], newActiveStoreId?: string, deletedStoreId?: string) => void;"
);

storeModalContent = storeModalContent.replace(
  "    onUpdateStores(updatedStores, updatedProducts, nextActiveId);",
  "    onUpdateStores(updatedStores, updatedProducts, nextActiveId, storeToDelete.id);"
);

fs.writeFileSync('src/components/StoreManagerModal.tsx', storeModalContent);
