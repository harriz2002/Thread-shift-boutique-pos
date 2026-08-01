import React, { useState, useEffect } from 'react';
import { bootstrapFirestoreIfEmpty, saveDocument } from './lib/firebase';
import { 
  INITIAL_STORES, 
  INITIAL_PRODUCTS, 
  INITIAL_CUSTOMERS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_LAYAWAYS, 
  INITIAL_HOLDS, 
  INITIAL_TRANSFERS 
} from './data/mockData';
import { 
  StoreLocation, 
  MasterProduct, 
  ProductVariant, 
  Customer, 
  SaleTransaction, 
  LayawayPlan, 
  HoldCart, 
  StockTransfer, 
  ReorderPO, 
  CartItem, 
  PaymentMethod 
} from './types';

// Components
import { Header } from './components/Header';
import { RegisterPOS } from './components/RegisterPOS';
import { ProductMatrixModal } from './components/ProductMatrixModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { CheckoutModal } from './components/CheckoutModal';
import { ReceiptModal } from './components/ReceiptModal';
import { HoldAndLayawayModal } from './components/HoldAndLayawayModal';
import { ReturnsAndExchangesModal } from './components/ReturnsAndExchangesModal';
import { CustomerLoyaltyManager } from './components/CustomerLoyaltyManager';
import { InventoryMatrixManager } from './components/InventoryMatrixManager';
import { SalesAnalytics } from './components/SalesAnalytics';
import { NewLayawayModal } from './components/NewLayawayModal';

export default function App() {
  // Application State with LocalStorage fallbacks for persistent sessions
  const [stores, setStores] = useState<StoreLocation[]>(() => {
    const saved = localStorage.getItem('ts_stores');
    return saved ? JSON.parse(saved) : INITIAL_STORES;
  });

  const [activeStoreId, setActiveStoreId] = useState<string>('store-1');

  const [products, setProducts] = useState<MasterProduct[]>(() => {
    const saved = localStorage.getItem('ts_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('ts_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [transactions, setTransactions] = useState<SaleTransaction[]>(() => {
    const saved = localStorage.getItem('ts_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [holds, setHolds] = useState<HoldCart[]>(() => {
    const saved = localStorage.getItem('ts_holds');
    return saved ? JSON.parse(saved) : INITIAL_HOLDS;
  });

  const [layaways, setLayaways] = useState<LayawayPlan[]>(() => {
    const saved = localStorage.getItem('ts_layaways');
    return saved ? JSON.parse(saved) : INITIAL_LAYAWAYS;
  });

  const [transfers, setTransfers] = useState<StockTransfer[]>(() => {
    const saved = localStorage.getItem('ts_transfers');
    return saved ? JSON.parse(saved) : INITIAL_TRANSFERS;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<ReorderPO[]>([]);

  // Theme state (Dark / Light Mode)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('ts_theme');
    return saved ? saved === 'dark' : true;
  });

  // Active Register Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Active UI tab
  const [activeTab, setActiveTab] = useState<
    'pos' | 'inventory' | 'customers' | 'analytics' | 'layaway' | 'returns'
  >('pos');

  // Modal states
  const [selectedMatrixProduct, setSelectedMatrixProduct] = useState<MasterProduct | null>(null);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState<boolean>(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [isNewLayawayModalOpen, setIsNewLayawayModalOpen] = useState<boolean>(false);
  const [activeReceiptTx, setActiveReceiptTx] = useState<SaleTransaction | null>(null);

  // Firebase Database Sync Status
  const [isFirebaseLoaded, setIsFirebaseLoaded] = useState<boolean>(false);

  // Load initial data from Firebase Firestore on boot
  useEffect(() => {
    let mounted = true;
    bootstrapFirestoreIfEmpty()
      .then((data) => {
        if (!mounted) return;
        if (data && data.products && data.products.length > 0) {
          if (data.stores && data.stores.length > 0) setStores(data.stores);
          setProducts(data.products);
          setCustomers(data.customers);
          setTransactions(data.transactions);
          setLayaways(data.layaways);
          setHolds(data.holds);
          setTransfers(data.transfers);
          if (data.purchaseOrders) setPurchaseOrders(data.purchaseOrders);
        }
        setIsFirebaseLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load from Firebase Firestore:', err);
        setIsFirebaseLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Sync state to localStorage & Firebase Firestore
  useEffect(() => {
    localStorage.setItem('ts_stores', JSON.stringify(stores));
    if (isFirebaseLoaded) {
      stores.forEach((s) => saveDocument('stores', s));
    }
  }, [stores, isFirebaseLoaded]);

  useEffect(() => {
    localStorage.setItem('ts_products', JSON.stringify(products));
    if (isFirebaseLoaded) {
      products.forEach((p) => saveDocument('products', p));
    }
  }, [products, isFirebaseLoaded]);

  useEffect(() => {
    localStorage.setItem('ts_customers', JSON.stringify(customers));
    if (isFirebaseLoaded) {
      customers.forEach((c) => saveDocument('customers', c));
    }
  }, [customers, isFirebaseLoaded]);

  useEffect(() => {
    localStorage.setItem('ts_transactions', JSON.stringify(transactions));
    if (isFirebaseLoaded) {
      transactions.forEach((t) => saveDocument('transactions', t));
    }
  }, [transactions, isFirebaseLoaded]);

  useEffect(() => {
    localStorage.setItem('ts_holds', JSON.stringify(holds));
    if (isFirebaseLoaded) {
      holds.forEach((h) => saveDocument('holds', h));
    }
  }, [holds, isFirebaseLoaded]);

  useEffect(() => {
    localStorage.setItem('ts_layaways', JSON.stringify(layaways));
    if (isFirebaseLoaded) {
      layaways.forEach((l) => saveDocument('layaways', l));
    }
  }, [layaways, isFirebaseLoaded]);

  useEffect(() => {
    localStorage.setItem('ts_transfers', JSON.stringify(transfers));
    if (isFirebaseLoaded) {
      transfers.forEach((tr) => saveDocument('transfers', tr));
    }
  }, [transfers, isFirebaseLoaded]);

  useEffect(() => {
    if (isFirebaseLoaded && purchaseOrders.length > 0) {
      purchaseOrders.forEach((po) => saveDocument('purchase_orders', po));
    }
  }, [purchaseOrders, isFirebaseLoaded]);

  useEffect(() => {
    localStorage.setItem('ts_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Calculate low stock items count
  const lowStockCount = products.reduce((count, p) => {
    const hasLow = p.variants.some((v) => (v.stockByStore[activeStoreId] || 0) <= v.reorderLevel);
    return count + (hasLow ? 1 : 0);
  }, 0);

  // Cart operations
  const handleAddToCart = (product: MasterProduct, variant: ProductVariant, quantity: number) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id && item.variant.id === variant.id
      );

      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].quantity += quantity;
        return next;
      }

      const newItem: CartItem = {
        cartItemId: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        product,
        variant,
        quantity,
        storeId: activeStoreId,
        unitPrice: variant.priceOverride || product.basePrice,
        discountAmount: 0,
      };

      return [...prev, newItem];
    });
  };

  const handleUpdateCartItemQty = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.cartItemId === cartItemId ? { ...item, quantity } : item))
    );
  };

  const handleUpdateCartItemPrice = (cartItemId: string, newUnitPrice: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId
          ? { ...item, unitPrice: Math.max(0, newUnitPrice) }
          : item
      )
    );
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Save Cart to Holds
  const handleSaveHoldCart = () => {
    if (cart.length === 0) return;

    const custName = prompt('Enter Customer Name or Note for this Hold Cart:', 'Walk-in Client') || 'Client Hold';
    const total = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

    const newHold: HoldCart = {
      id: `hold-${Date.now()}`,
      holdCode: `HLD-${Math.floor(1000 + Math.random() * 9000)}`,
      storeId: activeStoreId,
      customerName: custName,
      cartItems: cart,
      totalAmount: total,
      holdDate: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    setHolds((prev) => [newHold, ...prev]);
    setCart([]);
    alert(`Cart saved on hold! Hold Code: ${newHold.holdCode}`);
  };

  // Restore Hold Cart back to POS register
  const handleRestoreHoldCart = (hold: HoldCart) => {
    setCart(hold.cartItems);
    setHolds((prev) => prev.filter((h) => h.id !== hold.id));
    setActiveTab('pos');
  };

  const handleDeleteHoldCart = (holdId: string) => {
    setHolds((prev) => prev.filter((h) => h.id !== holdId));
  };

  // Create Layaway Plan with Client Details Prompt Modal
  const handleOpenLayawayModal = () => {
    if (cart.length === 0) return;
    setIsNewLayawayModalOpen(true);
  };

  const handleSaveNewLayaway = (data: {
    customerName: string;
    customerPhone: string;
    customerId?: string;
    depositPaid: number;
    paymentMethod: PaymentMethod;
    paymentReference: string;
    notes?: string;
    dueDate: string;
  }) => {
    const subtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const total = subtotal;
    const deposit = data.depositPaid;

    const newLayaway: LayawayPlan = {
      id: `lay-${Date.now()}`,
      planNumber: `LAY-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerId: data.customerId || 'cust-guest',
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      storeId: activeStoreId,
      cartItems: cart,
      totalAmount: total,
      depositPaid: deposit,
      balanceDue: Math.max(0, total - deposit),
      startDate: new Date().toISOString().split('T')[0],
      dueDate: data.dueDate,
      status: 'active',
      notes: data.notes || 'Client Layaway Plan',
      paymentsHistory: [
        {
          id: `pay-${Date.now()}`,
          date: new Date().toISOString(),
          amount: deposit,
          method: data.paymentMethod,
          reference: data.paymentReference,
          cashierName: 'Cashier',
        },
      ],
    };

    setLayaways((prev) => [newLayaway, ...prev]);
    setCart([]);
    setIsNewLayawayModalOpen(false);
    setActiveTab('layaway');
  };

  // Record Layaway Installment Payment
  const handleAddLayawayPayment = (
    layawayId: string,
    amount: number,
    method: PaymentMethod,
    reference: string
  ) => {
    setLayaways((prev) =>
      prev.map((plan) => {
        if (plan.id !== layawayId) return plan;

        const newPaid = plan.depositPaid + amount;
        const newBal = Math.max(0, plan.totalAmount - newPaid);

        return {
          ...plan,
          depositPaid: newPaid,
          balanceDue: newBal,
          status: newBal === 0 ? 'completed' : 'active',
          paymentsHistory: [
            ...plan.paymentsHistory,
            {
              id: `pay-${Date.now()}`,
              date: new Date().toISOString(),
              amount,
              method,
              reference,
              cashierName: 'Cashier',
            },
          ],
        };
      })
    );
  };

  const handleCompleteLayaway = (layawayId: string) => {
    setLayaways((prev) =>
      prev.map((p) => (p.id === layawayId ? { ...p, status: 'completed' } : p))
    );
    alert('Layaway plan completed! Goods released to customer.');
  };

  // Finalize Sale & Deduct Inventory Stock in Real-Time
  const handleCompleteSale = (transaction: SaleTransaction) => {
    // 1. Add to sales history
    setTransactions((prev) => [transaction, ...prev]);

    // 2. Deduct quantities from products stock for active store
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        const containsCartItem = transaction.items.some((item) => item.product.id === p.id);
        if (!containsCartItem) return p;

        const updatedVariants = p.variants.map((v) => {
          const cartItem = transaction.items.find((item) => item.variant.id === v.id);
          if (!cartItem) return v;

          const currentStock = v.stockByStore[activeStoreId] || 0;
          const nextStock = Math.max(0, currentStock - cartItem.quantity);

          return {
            ...v,
            stockByStore: {
              ...v.stockByStore,
              [activeStoreId]: nextStock,
            },
          };
        });

        return { ...p, variants: updatedVariants };
      })
    );

    // 3. Update customer loyalty points if customer selected
    if (transaction.customerId) {
      setCustomers((prevCustomers) =>
        prevCustomers.map((c) => {
          if (c.id !== transaction.customerId) return c;

          const netPoints = c.loyaltyPoints + transaction.loyaltyPointsEarned - transaction.pointsRedeemed;
          const nextSpent = c.totalSpent + transaction.total;

          return {
            ...c,
            loyaltyPoints: Math.max(0, netPoints),
            totalSpent: nextSpent,
            totalOrders: c.totalOrders + 1,
            tier: nextSpent > 1000 ? 'Platinum' : nextSpent > 400 ? 'Gold' : 'Silver',
          };
        })
      );
    }

    // 4. Open Receipt Modal & Clear Register Cart
    setActiveReceiptTx(transaction);
    setIsCheckoutModalOpen(false);
    setCart([]);
  };

  // Process Item Returns & Automatic Restock
  const handleProcessReturn = (
    transactionId: string,
    returnedVariantIds: string[],
    refundAmount: number,
    restock: boolean,
    refundMethod: PaymentMethod
  ) => {
    if (restock) {
      setProducts((prev) =>
        prev.map((p) => {
          const updatedVariants = p.variants.map((v) => {
            if (returnedVariantIds.includes(v.id)) {
              const currentStock = v.stockByStore[activeStoreId] || 0;
              return {
                ...v,
                stockByStore: {
                  ...v.stockByStore,
                  [activeStoreId]: currentStock + 1,
                },
              };
            }
            return v;
          });
          return { ...p, variants: updatedVariants };
        })
      );
    }

    // Update transaction status
    setTransactions((prev) =>
      prev.map((t) => (t.id === transactionId ? { ...t, status: 'returned' } : t))
    );
  };

  // Add Master Product
  const handleAddMasterProduct = (newProduct: MasterProduct) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  // Update Master Product
  const handleUpdateMasterProduct = (updatedProduct: MasterProduct) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
  };

  // Delete Master Product
  const handleDeleteMasterProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  // Update Stock directly
  const handleUpdateVariantStock = (variantId: string, storeId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => ({
        ...p,
        variants: p.variants.map((v) => {
          if (v.id === variantId) {
            return {
              ...v,
              stockByStore: {
                ...v.stockByStore,
                [storeId]: newStock,
              },
            };
          }
          return v;
        }),
      }))
    );
  };

  // Add Customer
  const handleAddCustomer = (newCustomer: Customer) => {
    setCustomers((prev) => [newCustomer, ...prev]);
  };

  const handleUpdateStoreCredit = (customerId: string, newCredit: number) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, storeCredit: newCredit } : c))
    );
  };

  const activeStoreObj = stores.find((s) => s.id === activeStoreId);

  return (
    <div
      className={`min-h-screen font-sans selection:bg-amber-500 selection:text-slate-950 transition-colors duration-200 ${
        isDarkMode ? 'bg-slate-950 text-slate-100 dark' : 'bg-slate-100 text-slate-900 light'
      }`}
    >
      
      {/* Top Header & Store Switcher Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stores={stores}
        activeStoreId={activeStoreId}
        setActiveStoreId={setActiveStoreId}
        lowStockCount={lowStockCount}
        holdCount={holds.length}
        layawayCount={layaways.length}
        onOpenBarcodeScanner={() => setIsBarcodeScannerOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
      />

      {/* Main Content Area */}
      <main className="pb-16">
        {activeTab === 'pos' && (
          <RegisterPOS
            products={products}
            cart={cart}
            stores={stores}
            activeStoreId={activeStoreId}
            onAddToCart={handleAddToCart}
            onUpdateCartItemQty={handleUpdateCartItemQty}
            onUpdateCartItemPrice={handleUpdateCartItemPrice}
            onRemoveCartItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onOpenMatrixModal={(prod) => setSelectedMatrixProduct(prod)}
            onOpenBarcodeModal={() => setIsBarcodeScannerOpen(true)}
            onOpenCheckoutModal={() => setIsCheckoutModalOpen(true)}
            onOpenHoldModal={() => setActiveTab('layaway')}
            onSaveHoldCart={handleSaveHoldCart}
            onOpenLayawayModal={handleOpenLayawayModal}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryMatrixManager
            products={products}
            stores={stores}
            activeStoreId={activeStoreId}
            transfers={transfers}
            purchaseOrders={purchaseOrders}
            onAddMasterProduct={handleAddMasterProduct}
            onUpdateMasterProduct={handleUpdateMasterProduct}
            onDeleteMasterProduct={handleDeleteMasterProduct}
            onUpdateVariantStock={handleUpdateVariantStock}
            onCreateStockTransfer={(tr) => setTransfers((prev) => [tr, ...prev])}
            onCreatePurchaseOrder={(po) => setPurchaseOrders((prev) => [po, ...prev])}
          />
        )}

        {activeTab === 'layaway' && (
          <HoldAndLayawayModal
            holds={holds}
            layaways={layaways}
            stores={stores}
            activeStoreId={activeStoreId}
            onRestoreHoldCart={handleRestoreHoldCart}
            onDeleteHoldCart={handleDeleteHoldCart}
            onAddLayawayPayment={handleAddLayawayPayment}
            onCompleteLayaway={handleCompleteLayaway}
          />
        )}

        {activeTab === 'returns' && (
          <ReturnsAndExchangesModal
            transactions={transactions}
            products={products}
            stores={stores}
            activeStoreId={activeStoreId}
            onProcessReturn={handleProcessReturn}
          />
        )}

        {activeTab === 'customers' && (
          <CustomerLoyaltyManager
            customers={customers}
            onAddCustomer={handleAddCustomer}
            onUpdateStoreCredit={handleUpdateStoreCredit}
          />
        )}

        {activeTab === 'analytics' && (
          <SalesAnalytics
            transactions={transactions}
            products={products}
            stores={stores}
          />
        )}
      </main>

      {/* Modals */}

      {/* 1. Color x Size Matrix Modal */}
      {selectedMatrixProduct && (
        <ProductMatrixModal
          product={selectedMatrixProduct}
          stores={stores}
          activeStoreId={activeStoreId}
          onClose={() => setSelectedMatrixProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* 2. Garment Barcode Scanner Modal */}
      {isBarcodeScannerOpen && (
        <BarcodeScannerModal
          products={products}
          activeStoreId={activeStoreId}
          onClose={() => setIsBarcodeScannerOpen(false)}
          onScanResult={(product, variant) => {
            handleAddToCart(product, variant, 1);
          }}
        />
      )}

      {/* 3. Checkout Modal */}
      {isCheckoutModalOpen && (
        <CheckoutModal
          cart={cart}
          customers={customers}
          activeStoreId={activeStoreId}
          store={activeStoreObj}
          onClose={() => setIsCheckoutModalOpen(false)}
          onCompleteSale={handleCompleteSale}
        />
      )}

      {/* 4. Digital Thermal Receipt Viewer Modal */}
      {activeReceiptTx && (
        <ReceiptModal
          transaction={activeReceiptTx}
          store={stores.find((s) => s.id === activeReceiptTx.storeId)}
          onClose={() => setActiveReceiptTx(null)}
        />
      )}

      {/* 5. Save Layaway & Client Registration Modal */}
      {isNewLayawayModalOpen && (
        <NewLayawayModal
          cart={cart}
          customers={customers}
          onClose={() => setIsNewLayawayModalOpen(false)}
          onSaveLayaway={handleSaveNewLayaway}
        />
      )}

    </div>
  );
}
