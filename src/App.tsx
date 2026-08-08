import React, { useState, useEffect } from 'react';
import { bootstrapFirestoreIfEmpty, saveDocument, deleteDocument } from './lib/firebase';
import {
  bootstrapSupabaseData,
  saveSupabaseDocument,
  deleteSupabaseDocument,
  SUPABASE_TABLES
} from './lib/supabaseService';
import { deleteFileFromSupabaseStorage } from './lib/supabaseStorage';
import { 
  INITIAL_STORES, 
  INITIAL_PRODUCTS, 
  INITIAL_CUSTOMERS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_LAYAWAYS, 
  INITIAL_HOLDS, 
  INITIAL_TRANSFERS,
  INITIAL_USERS,
  INITIAL_SYSTEM_SETTINGS,
  INITIAL_EXPENSES,
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
  PaymentMethod,
  UserAccount,
  SystemSettings,
  Expense,
} from './types';

// Components
import { Wifi, WifiOff } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
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
import { DatabaseStatusModal } from './components/DatabaseStatusModal';
import { StoreManagerModal } from './components/StoreManagerModal';
import { AuthModal } from './components/AuthModal';
import { StaffManagerModal } from './components/StaffManagerModal';
import { SystemSettingsManager } from './components/SystemSettingsManager';
import { ReceiptQrScannerModal } from './components/ReceiptQrScannerModal';
import { DailyBackupNotificationBanner } from './components/DailyBackupNotificationBanner';
import { useGlobalBarcodeScanner } from './hooks/useBarcodeScanner';

// Helper to normalize safety threshold level to 1 for all product variants
const normalizeProductsThreshold = (prods: MasterProduct[]): MasterProduct[] => {
  if (!prods) return [];
  return prods.map((p) => ({
    ...p,
    variants: (p.variants || []).map((v) => ({
      ...v,
      reorderLevel: 1,
    })),
  }));
};

export default function App() {
  // Application State with LocalStorage fallbacks for persistent sessions
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOnlineAlert, setShowOnlineAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineAlert(true);
      setTimeout(() => setShowOnlineAlert(false), 3000);
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [stores, setStores] = useState<StoreLocation[]>(() => {
    const saved = localStorage.getItem('ts_stores');
    return saved ? JSON.parse(saved) : INITIAL_STORES;
  });

  const [activeStoreId, setActiveStoreId] = useState<string>('store-1');

  const [products, setProducts] = useState<MasterProduct[]>(() => {
    const saved = localStorage.getItem('ts_products');
    const raw = saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    return normalizeProductsThreshold(raw);
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

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('ts_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  // System Settings state
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('ts_system_settings');
    return saved ? JSON.parse(saved) : INITIAL_SYSTEM_SETTINGS;
  });

  const handleUpdateSystemSettings = (newSettings: SystemSettings) => {
    setSystemSettings(newSettings);
    try {
      localStorage.setItem('ts_system_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
    saveDocument('settings', { id: 'global', ...newSettings }).catch((e) =>
      console.warn('Firebase settings sync error:', e)
    );

    // Sync active store location address and phone in stores list
    setStores((prevStores) => {
      const updated = prevStores.map((s) => {
        if (s.id === activeStoreId) {
          return {
            ...s,
            address: newSettings.address || s.address,
            phone: newSettings.phone || s.phone,
          };
        }
        return s;
      });
      try {
        localStorage.setItem('ts_stores', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage stores save error:', e);
      }
      updated.forEach((s) => saveDocument('stores', s));
      return updated;
    });
  };

  // Theme state (Dark / Light Mode)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('ts_theme');
    return saved ? saved === 'dark' : true;
  });

  // Active Register Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Active UI tab
  const [activeTab, setActiveTab] = useState<
    'pos' | 'inventory' | 'customers' | 'analytics' | 'layaway' | 'returns' | 'settings'
  >('pos');

  // Modal states
  const [selectedMatrixProduct, setSelectedMatrixProduct] = useState<MasterProduct | null>(null);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState<boolean>(false);
  const [isReceiptScannerOpen, setIsReceiptScannerOpen] = useState<boolean>(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [isNewLayawayModalOpen, setIsNewLayawayModalOpen] = useState<boolean>(false);
  const [activeReceiptTx, setActiveReceiptTx] = useState<SaleTransaction | null>(null);
  const [isStoreManagerOpen, setIsStoreManagerOpen] = useState<boolean>(false);

  // User Authentication & Staff Roles State
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('ts_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('ts_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('ts_current_user');
    return !saved;
  });
  const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('ts_sidebar_collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const toggleSidebarCollapsed = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('ts_sidebar_collapsed', JSON.stringify(next));
      return next;
    });
  };

  // Auto-logout after 20 minutes of inactivity
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      if (currentUser) {
        timeoutId = setTimeout(() => {
          setCurrentUser(null);
          localStorage.removeItem('ts_current_user');
          setIsAuthModalOpen(true);
        }, 20 * 60 * 1000); // 20 minutes
      }
    };

    if (currentUser) {
      resetTimer(); // Initialize timer
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      events.forEach(event => document.addEventListener(event, resetTimer, { passive: true }));
      
      return () => {
        clearTimeout(timeoutId);
        events.forEach(event => document.removeEventListener(event, resetTimer));
      };
    }
  }, [currentUser]);

  // Firebase Database & Cloud SQL PostgreSQL Dual-Layer Sync Status
  const [isFirebaseLoaded, setIsFirebaseLoaded] = useState<boolean>(false);
  const [dbMode, setDbMode] = useState<'cloudsql' | 'firestore' | 'loading'>('firestore');
  const [cloudSqlStatus, setCloudSqlStatus] = useState<{
    connected: boolean;
    database?: string;
    time?: string;
    reason?: string;
    error?: string;
  }>({ connected: false });
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState<boolean>(false);

  const checkCloudSqlHealth = async () => {
    try {
      const res = await fetch('/api/sql/health');
      if (res.ok) {
        const data = await res.json();
        setCloudSqlStatus(data);
        if (data.connected) {
          setDbMode('cloudsql');
        } else {
          setDbMode('firestore');
        }
      }
    } catch (err) {
      console.warn('Cloud SQL health check offline, using Firestore dual-layer:', err);
      setDbMode('firestore');
      setCloudSqlStatus({ connected: false, reason: 'Standby / Firestore Fallback active' });
    }
  };

  const handleForceSyncToCloudSql = async () => {
    for (const s of stores) {
      await fetch('/api/sql/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionName: 'stores', item: s }),
      });
    }
    for (const p of products) {
      await fetch('/api/sql/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionName: 'products', item: p }),
      });
    }
    for (const c of customers) {
      await fetch('/api/sql/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionName: 'customers', item: c }),
      });
    }
    for (const t of transactions) {
      await fetch('/api/sql/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionName: 'transactions', item: t }),
      });
    }
  };

  // Load initial data from Supabase & Firebase Firestore on boot & check Cloud SQL
  const [isSupabaseLoaded, setIsSupabaseLoaded] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    checkCloudSqlHealth();

    // Load from Supabase
    bootstrapSupabaseData()
      .then((data) => {
        if (!mounted) return;
        if (data && data.products && data.products.length > 0) {
          if (data.stores && data.stores.length > 0) setStores(data.stores);
          setProducts(normalizeProductsThreshold(data.products));
          setCustomers(data.customers);
          setTransactions(data.transactions);
          setLayaways(data.layaways);
          setHolds(data.holds);
          setTransfers(data.transfers);
          if (data.purchaseOrders) setPurchaseOrders(data.purchaseOrders);
          if (data.users && data.users.length > 0) setUsers(data.users);
        }
        setIsSupabaseLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load from Supabase:', err);
        setIsSupabaseLoaded(true);
      });

    // Also sync from Firestore as backup
    bootstrapFirestoreIfEmpty()
      .then((data) => {
        if (!mounted) return;
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

  // Sync state to localStorage, Supabase, & Firebase Firestore
  useEffect(() => {
    localStorage.setItem('ts_stores', JSON.stringify(stores));
    if (isSupabaseLoaded) {
      stores.forEach((s) => saveSupabaseDocument(SUPABASE_TABLES.STORES, s));
    }
    if (isFirebaseLoaded) {
      stores.forEach((s) => saveDocument('stores', s));
    }
  }, [stores, isSupabaseLoaded, isFirebaseLoaded]);

  useEffect(() => {
    localStorage.setItem('ts_products', JSON.stringify(products));
    if (isSupabaseLoaded) {
      products.forEach((p) => saveSupabaseDocument(SUPABASE_TABLES.PRODUCTS, p));
    }
    if (isFirebaseLoaded) {
      products.forEach((p) => saveDocument('products', p));
    }
  }, [products, isSupabaseLoaded, isFirebaseLoaded]);

  useEffect(() => {
    localStorage.setItem('ts_customers', JSON.stringify(customers));
    if (isSupabaseLoaded) {
      customers.forEach((c) => saveSupabaseDocument(SUPABASE_TABLES.CUSTOMERS, c));
    }
    if (isFirebaseLoaded) {
      customers.forEach((c) => saveDocument('customers', c));
    }
  }, [customers, isSupabaseLoaded, isFirebaseLoaded]);

  useEffect(() => {
    localStorage.setItem('ts_transactions', JSON.stringify(transactions));
    if (isSupabaseLoaded) {
      transactions.forEach((t) => saveSupabaseDocument(SUPABASE_TABLES.TRANSACTIONS, t));
    }
    if (isFirebaseLoaded) {
      transactions.forEach((t) => saveDocument('transactions', t));
    }
  }, [transactions, isSupabaseLoaded, isFirebaseLoaded]);

  useEffect(() => {
    localStorage.setItem('ts_holds', JSON.stringify(holds));
    if (isSupabaseLoaded) {
      holds.forEach((h) => saveSupabaseDocument(SUPABASE_TABLES.HOLDS, h));
    }
    if (isFirebaseLoaded) {
      holds.forEach((h) => saveDocument('holds', h));
    }
  }, [holds, isSupabaseLoaded, isFirebaseLoaded]);

  useEffect(() => {
    localStorage.setItem('ts_layaways', JSON.stringify(layaways));
    if (isSupabaseLoaded) {
      layaways.forEach((l) => saveSupabaseDocument(SUPABASE_TABLES.LAYAWAYS, l));
    }
    if (isFirebaseLoaded) {
      layaways.forEach((l) => saveDocument('layaways', l));
    }
  }, [layaways, isSupabaseLoaded, isFirebaseLoaded]);

  useEffect(() => {
    localStorage.setItem('ts_transfers', JSON.stringify(transfers));
    if (isSupabaseLoaded) {
      transfers.forEach((tr) => saveSupabaseDocument(SUPABASE_TABLES.TRANSFERS, tr));
    }
    if (isFirebaseLoaded) {
      transfers.forEach((tr) => saveDocument('transfers', tr));
    }
  }, [transfers, isSupabaseLoaded, isFirebaseLoaded]);

  useEffect(() => {
    if (isSupabaseLoaded && purchaseOrders.length > 0) {
      purchaseOrders.forEach((po) => saveSupabaseDocument(SUPABASE_TABLES.PURCHASE_ORDERS, po));
    }
    if (isFirebaseLoaded && purchaseOrders.length > 0) {
      purchaseOrders.forEach((po) => saveDocument('purchase_orders', po));
    }
  }, [purchaseOrders, isSupabaseLoaded, isFirebaseLoaded]);

  useEffect(() => {
    localStorage.setItem('ts_users', JSON.stringify(users));
    if (isSupabaseLoaded) {
      users.forEach((u) => saveSupabaseDocument(SUPABASE_TABLES.USERS, u));
    }
  }, [users, isSupabaseLoaded]);

  useEffect(() => {
    localStorage.setItem('ts_expenses', JSON.stringify(expenses));
    if (isFirebaseLoaded) {
      expenses.forEach((e) => saveDocument('expenses', e));
    }
  }, [expenses, isFirebaseLoaded]);

  useEffect(() => {
    localStorage.setItem('ts_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Calculate low stock items count
  const lowStockCount = products.reduce((count, p) => {
    const hasLow = p.variants.some((v) => (v.stockByStore[activeStoreId] || 0) < v.reorderLevel);
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
    refundMethod: PaymentMethod,
    returnReason: string = 'Garment Return / Swap'
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

    // Update transaction status and store return log metadata
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId
          ? {
              ...t,
              status: 'returned',
              returnReason,
              refundMethod,
              refundAmount,
              returnedAt: new Date().toISOString(),
              restocked: restock,
              returnedVariantIds,
            }
          : t
      )
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
    const prodToDelete = products.find((p) => p.id === productId);
    if (prodToDelete?.image) {
      deleteFileFromSupabaseStorage(prodToDelete.image);
    }
    deleteSupabaseDocument(SUPABASE_TABLES.PRODUCTS, productId);
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

  const handleUpdateStores = (updatedStores: StoreLocation[], updatedProducts: MasterProduct[], newActiveStoreId?: string, deletedStoreId?: string) => {
    setStores(updatedStores);
    setProducts(updatedProducts);
    if (newActiveStoreId) {
      setActiveStoreId(newActiveStoreId);
    }
    localStorage.setItem('ts_stores', JSON.stringify(updatedStores));
    localStorage.setItem('ts_products', JSON.stringify(updatedProducts));
    updatedStores.forEach((s) => saveDocument('stores', s));
    updatedProducts.forEach((p) => saveDocument('products', p));
    if (deletedStoreId) {
      deleteDocument('stores', deletedStoreId);
      deleteSupabaseDocument(SUPABASE_TABLES.STORES, deletedStoreId);
    }
  };


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


  // Security & Role Restrictions: Auto-redirect employees from restricted tabs and lock active store to assigned store
  useEffect(() => {
    if (currentUser?.role === 'employee') {
      if (activeTab === 'inventory' || activeTab === 'settings') {
        setActiveTab('pos');
      }
      if (currentUser.assignedStoreId && activeStoreId !== currentUser.assignedStoreId) {
        setActiveStoreId(currentUser.assignedStoreId);
      }
    }
  }, [currentUser, activeTab, activeStoreId]);

  return (
    <div
      className={`min-h-screen flex font-sans selection:bg-amber-500 selection:text-slate-950 transition-colors duration-200 ${
        isDarkMode ? 'bg-slate-950 text-slate-100 dark' : 'bg-slate-100 text-slate-900 light'
      }`}
    >
      

      {/* Network Status Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-red-500 text-white py-1.5 px-4 flex items-center justify-center gap-2 text-sm font-bold shadow-md shadow-red-500/20">
          <WifiOff className="w-4 h-4" />
          <span>You are currently offline. Changes will be synced when connection is restored.</span>
        </div>
      )}
      
      {/* Side Navigation Bar */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebarCollapsed={toggleSidebarCollapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stores={stores}
        activeStoreId={activeStoreId}
        setActiveStoreId={setActiveStoreId}
        lowStockCount={lowStockCount}
        holdCount={holds.length}
        layawayCount={layaways.length}
        currentUser={currentUser}
        onOpenStoreManager={() => setIsStoreManagerOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopBar
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapsed={toggleSidebarCollapsed}
          lowStockCount={lowStockCount}
          onOpenBarcodeScanner={() => setIsBarcodeScannerOpen(true)}
          onOpenReceiptScanner={() => setIsReceiptScannerOpen(true)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
          currentUser={currentUser}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onOpenStaffModal={() => setIsStaffModalOpen(true)}
          dbMode={dbMode}
          onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
          setActiveTab={setActiveTab}
        />

        {/* Daily Backup Notification Banner */}
        <DailyBackupNotificationBanner
          systemSettings={systemSettings}
          stores={stores}
          products={products}
          transactions={transactions}
          layaways={layaways}
          currentUser={currentUser}
          onOpenSettingsBackup={() => setActiveTab('settings')}
          onSyncDatabase={handleForceSyncToCloudSql}
        />

        {/* Main Content Area */}
        <main className="flex-1 pb-16 overflow-y-auto">
        {activeTab === 'pos' && (
          <RegisterPOS
            products={products}
            cart={cart}
            stores={stores}
            activeStoreId={activeStoreId}
            transactions={transactions}
            currentUser={currentUser}
            systemSettings={systemSettings}
            onViewReceipt={(tx) => setActiveReceiptTx(tx)}
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
            currentUser={currentUser}
            systemSettings={systemSettings}
            expenses={expenses}
            onUpdateExpenses={setExpenses}
          />
        )}

        {activeTab === 'settings' && (
          <SystemSettingsManager
            settings={systemSettings}
            onUpdateSettings={handleUpdateSystemSettings}
            stores={stores}
            activeStoreId={activeStoreId}
            onOpenStoreManager={() => setIsStoreManagerOpen(true)}
            products={products}
            onUpdateMasterProduct={handleUpdateMasterProduct}
            currentUser={currentUser}
            dbMode={dbMode}
            onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
          />
        )}
      </main>
      </div>

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

      {/* 2.1. Receipt QR Code Real Camera & File Scanner Modal */}
      {isReceiptScannerOpen && (
        <ReceiptQrScannerModal
          onClose={() => setIsReceiptScannerOpen(false)}
        />
      )}

      {/* 3. Checkout Modal */}
      {isCheckoutModalOpen && (
        <CheckoutModal
          cart={cart}
          customers={customers}
          activeStoreId={activeStoreId}
          store={activeStoreObj}
          currentUser={currentUser}
          onClose={() => setIsCheckoutModalOpen(false)}
          onCompleteSale={handleCompleteSale}
        />
      )}

      {/* 4. Digital Thermal Receipt Viewer Modal */}
      {activeReceiptTx && (
        <ReceiptModal
          transaction={activeReceiptTx}
          store={stores.find((s) => s.id === activeReceiptTx.storeId)}
          systemSettings={systemSettings}
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

      {/* 6. Cloud SQL & Firebase Dual-Layer Database Status Modal */}
      <DatabaseStatusModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        dbMode={dbMode}
        cloudSqlStatus={cloudSqlStatus}
        onRefreshDbHealth={checkCloudSqlHealth}
        onForceSyncToCloudSql={handleForceSyncToCloudSql}
      />

      {/* 7. Store Locations & Inventory Transfer Manager Modal */}
      <StoreManagerModal
        isOpen={isStoreManagerOpen}
        onClose={() => setIsStoreManagerOpen(false)}
        stores={stores}
        products={products}
        activeStoreId={activeStoreId}
        onUpdateStores={handleUpdateStores}
      />

      {/* 8. Authentication & Sign In / Sign Up Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        users={users}
        stores={stores}
        onSignIn={(user) => {
          setCurrentUser(user);
          localStorage.setItem('ts_current_user', JSON.stringify(user));
        }}
        onSignUp={(newUser) => {
          const updated = [newUser, ...users];
          setUsers(updated);
          setCurrentUser(newUser);
          localStorage.setItem('ts_users', JSON.stringify(updated));
          localStorage.setItem('ts_current_user', JSON.stringify(newUser));
        }}
      />

      {/* 9. Staff Manager Modal */}
      {isStaffModalOpen && currentUser && (
        <StaffManagerModal
          isOpen={isStaffModalOpen}
          onClose={() => setIsStaffModalOpen(false)}
          currentUser={currentUser}
          users={users}
          stores={stores}
          onAddUser={(u) => {
            const updated = [u, ...users];
            setUsers(updated);
            localStorage.setItem('ts_users', JSON.stringify(updated));
          }}
          onUpdateUser={(u) => {
            const updated = users.map((x) => (x.id === u.id ? u : x));
            setUsers(updated);
            localStorage.setItem('ts_users', JSON.stringify(updated));
          }}
          onSwitchUser={(u) => {
            setCurrentUser(u);
            localStorage.setItem('ts_current_user', JSON.stringify(u));
          }}
        />
      )}

    </div>
  );
}
