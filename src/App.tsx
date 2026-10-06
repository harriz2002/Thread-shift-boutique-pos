import React, { useState, useEffect } from 'react';
import { bootstrapFirestoreIfEmpty, saveDocument, deleteDocument, subscribeToSettings } from './lib/firebase';
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
  CustomerSpecialOrder,
  SpecialOrderStatus,
} from './types';

// Components
import { Wifi, WifiOff, X } from 'lucide-react';
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
import { CustomerSpecialOrdersManager } from './components/CustomerSpecialOrdersManager';
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

// Helper to guarantee the presence of the requested admin user account
const ensureAdminUserExists = (userList: UserAccount[]): UserAccount[] => {
  const targetAdmin: UserAccount = {
    id: 'user-admin-1',
    name: 'admin',
    email: 'admin@gmail.com',
    role: 'admin',
    password: 'admin',
    pin: '1234',
    department: 'Executive Store Director',
    assignedStoreId: 'store-1',
    createdAt: '2026-01-01',
    isActive: true,
  };
  const list = [...(userList || [])];
  const adminIndex = list.findIndex(u => u.email?.toLowerCase() === 'admin@gmail.com' || u.name?.toLowerCase() === 'admin');
  if (adminIndex > -1) {
    list[adminIndex] = { ...list[adminIndex], ...targetAdmin };
  } else {
    const idIndex = list.findIndex(u => u.id === 'user-admin-1');
    if (idIndex > -1) {
      list[idIndex] = targetAdmin;
    } else {
      list.push(targetAdmin);
    }
  }
  return list;
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
    'pos' | 'inventory' | 'customers' | 'analytics' | 'layaway' | 'returns' | 'settings' | 'special_orders'
  >('pos');

  // Customer Special Orders / Requests State
  const [specialOrders, setSpecialOrders] = useState<CustomerSpecialOrder[]>(() => {
    const saved = localStorage.getItem('ts_special_orders');
    return saved ? JSON.parse(saved) : [];
  });

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
    const parsed = saved ? JSON.parse(saved) : INITIAL_USERS;
    return ensureAdminUserExists(parsed);
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
        if (data) {
          if (data.stores && data.stores.length > 0) {
            setStores((current) => (current.length > 0 ? current : data.stores));
          }
          if (data.products && data.products.length > 0) {
            setProducts((current) => {
              // Smart merge: preserve all current products in state / localStorage
              const productMap = new Map<string, MasterProduct>();
              current.forEach((p) => productMap.set(p.id, p));
              data.products.forEach((p) => {
                if (!productMap.has(p.id)) {
                  productMap.set(p.id, p);
                }
              });
              const merged = Array.from(productMap.values());
              try {
                localStorage.setItem('ts_products', JSON.stringify(merged));
              } catch (e) {
                console.warn('LocalStorage save error:', e);
              }
              return normalizeProductsThreshold(merged);
            });
          }
          if (data.customers && data.customers.length > 0) {
            setCustomers((current) => (current.length > 0 ? current : data.customers));
          }
          if (data.transactions && data.transactions.length > 0) {
            setTransactions((current) => (current.length > 0 ? current : data.transactions));
          }
          if (data.layaways && data.layaways.length > 0) {
            setLayaways((current) => (current.length > 0 ? current : data.layaways));
          }
          if (data.holds && data.holds.length > 0) {
            setHolds((current) => (current.length > 0 ? current : data.holds));
          }
          if (data.transfers && data.transfers.length > 0) {
            setTransfers((current) => (current.length > 0 ? current : data.transfers));
          }
          if (data.purchaseOrders && data.purchaseOrders.length > 0) setPurchaseOrders(data.purchaseOrders);
          if (data.users && data.users.length > 0) setUsers(ensureAdminUserExists(data.users));
        }
        setIsSupabaseLoaded(true);
      })
      .catch((err) => {
        console.warn('Supabase data load fallback:', err);
        setIsSupabaseLoaded(true);
      });

    // Also sync from Firestore as backup
    bootstrapFirestoreIfEmpty()
      .then((data) => {
        if (!mounted) return;
        if (data.settings) {
          setSystemSettings(data.settings);
          localStorage.setItem('ts_system_settings', JSON.stringify(data.settings));
        }
        if (data.specialOrders && data.specialOrders.length > 0) {
          setSpecialOrders(data.specialOrders);
          localStorage.setItem('ts_special_orders', JSON.stringify(data.specialOrders));
        }
        if (data.products && data.products.length > 0) {
          setProducts((current) => {
            const productMap = new Map<string, MasterProduct>();
            // Keep all current user-added products in state and localStorage
            current.forEach((p) => productMap.set(p.id, p));
            // Add any remote Firestore products not yet in state
            data.products.forEach((p) => {
              if (!productMap.has(p.id)) {
                productMap.set(p.id, p);
              }
            });
            const merged = Array.from(productMap.values());
            try {
              localStorage.setItem('ts_products', JSON.stringify(merged));
            } catch (e) {
              console.warn('LocalStorage save error:', e);
            }
            return normalizeProductsThreshold(merged);
          });
        }
        setIsFirebaseLoaded(true);
      })
      .catch((err) => {
        console.warn('Firebase Firestore fallback:', err);
        setIsFirebaseLoaded(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Real-time sync for system settings (including logo URL) from Firestore
  useEffect(() => {
    if (!isFirebaseLoaded) return;
    const unsubscribe = subscribeToSettings((remoteSettings) => {
      if (remoteSettings) {
        setSystemSettings(remoteSettings);
        localStorage.setItem('ts_system_settings', JSON.stringify(remoteSettings));
      }
    });
    return () => {
      unsubscribe();
    };
  }, [isFirebaseLoaded]);

  // Sync state to localStorage smoothly without burning Firestore write quota in loops
  useEffect(() => {
    localStorage.setItem('ts_stores', JSON.stringify(stores));
  }, [stores]);

  useEffect(() => {
    localStorage.setItem('ts_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('ts_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('ts_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('ts_holds', JSON.stringify(holds));
  }, [holds]);

  useEffect(() => {
    localStorage.setItem('ts_layaways', JSON.stringify(layaways));
  }, [layaways]);

  useEffect(() => {
    localStorage.setItem('ts_transfers', JSON.stringify(transfers));
  }, [transfers]);

  useEffect(() => {
    if (purchaseOrders.length > 0) {
      localStorage.setItem('ts_purchase_orders', JSON.stringify(purchaseOrders));
    }
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem('ts_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('ts_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('ts_special_orders', JSON.stringify(specialOrders));
  }, [specialOrders]);

  useEffect(() => {
    localStorage.setItem('ts_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Calculate low stock items count
  const lowStockCount = products.reduce((count, p) => {
    const hasLow = p.variants.some((v) => (v.stockByStore[activeStoreId] || 0) < v.reorderLevel);
    return count + (hasLow ? 1 : 0);
  }, 0);

  // Stock notification toast state
  const [stockToast, setStockToast] = useState<{ message: string; type?: 'error' | 'warning' | 'info' } | null>(null);

  const showStockToast = (message: string, type: 'error' | 'warning' | 'info' = 'warning') => {
    setStockToast({ message, type });
  };

  useEffect(() => {
    if (!stockToast) return;
    const timer = setTimeout(() => {
      setStockToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [stockToast]);

  // Cart operations with strict available stock validation
  const handleAddToCart = (product: MasterProduct, variant: ProductVariant, quantity: number) => {
    // Determine the latest available stock for this variant in the active store
    const liveProduct = products.find((p) => p.id === product.id) || product;
    const liveVariant = liveProduct.variants.find((v) => v.id === variant.id) || variant;
    const availableStock = Math.max(0, liveVariant.stockByStore[activeStoreId] ?? 0);
    const storeObj = stores.find((s) => s.id === activeStoreId);
    const storeName = storeObj?.name || 'this store';

    if (availableStock <= 0) {
      showStockToast(
        `"${product.title} (${variant.color}, Sz ${variant.size})" is currently out of stock at ${storeName}.`,
        'error'
      );
      return;
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id && item.variant.id === variant.id
      );

      if (existingIdx > -1) {
        const currentQty = prev[existingIdx].quantity;
        const maxAddable = Math.max(0, availableStock - currentQty);

        if (maxAddable <= 0) {
          showStockToast(
            `Cannot add more items: You already have all ${availableStock} available units of "${product.title} (${variant.color}, Sz ${variant.size})" in your cart.`,
            'warning'
          );
          return prev;
        }

        const actualAdd = Math.min(quantity, maxAddable);
        if (actualAdd < quantity) {
          showStockToast(
            `Only ${maxAddable} more unit(s) available in stock. Added ${actualAdd} to cart (total ${currentQty + actualAdd}).`,
            'info'
          );
        }

        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: currentQty + actualAdd,
        };
        return next;
      }

      // Not in cart yet
      const actualQty = Math.min(quantity, availableStock);
      if (actualQty < quantity) {
        showStockToast(
          `Only ${availableStock} unit(s) available in stock for "${product.title}". Added ${actualQty} to cart.`,
          'info'
        );
      }

      const newItem: CartItem = {
        cartItemId: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        product,
        variant,
        quantity: actualQty,
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

    setCart((prev) => {
      const item = prev.find((i) => i.cartItemId === cartItemId);
      if (!item) return prev;

      const liveProduct = products.find((p) => p.id === item.product.id) || item.product;
      const liveVariant = liveProduct.variants.find((v) => v.id === item.variant.id) || item.variant;
      const availableStock = Math.max(0, liveVariant.stockByStore[activeStoreId] ?? 0);

      if (quantity > availableStock) {
        showStockToast(
          `Cannot exceed available stock (${availableStock} units available for "${item.product.title}").`,
          'warning'
        );
        return prev.map((it) =>
          it.cartItemId === cartItemId ? { ...it, quantity: availableStock } : it
        );
      }

      return prev.map((it) => (it.cartItemId === cartItemId ? { ...it, quantity } : it));
    });
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
    saveDocument('holds', newHold).catch(() => {});
    setCart([]);
    alert(`Cart saved on hold! Hold Code: ${newHold.holdCode}`);
  };

  // Restore Hold Cart back to POS register
  const handleRestoreHoldCart = (hold: HoldCart) => {
    setCart(hold.cartItems);
    setHolds((prev) => prev.filter((h) => h.id !== hold.id));
    deleteDocument('holds', hold.id).catch(() => {});
    setActiveTab('pos');
  };

  const handleDeleteHoldCart = (holdId: string) => {
    setHolds((prev) => prev.filter((h) => h.id !== holdId));
    deleteDocument('holds', holdId).catch(() => {});
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
    saveDocument('layaways', newLayaway).catch(() => {});
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

        const updatedPlan: LayawayPlan = {
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
        saveDocument('layaways', updatedPlan).catch(() => {});
        return updatedPlan;
      })
    );
  };

  const handleCompleteLayaway = (layawayId: string) => {
    setLayaways((prev) =>
      prev.map((p) => {
        if (p.id === layawayId) {
          const completed = { ...p, status: 'completed' as const };
          saveDocument('layaways', completed).catch(() => {});
          return completed;
        }
        return p;
      })
    );
    alert('Layaway plan completed! Goods released to customer.');
  };

  // Finalize Sale & Deduct Inventory Stock in Real-Time
  const handleCompleteSale = (transaction: SaleTransaction) => {
    // 1. Add to sales history
    setTransactions((prev) => [transaction, ...prev]);
    saveDocument('transactions', transaction).catch(() => {});

    // 2. Deduct quantities from products stock for active store
    setProducts((prevProducts) => {
      const updated = prevProducts.map((p) => {
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
      });

      try {
        localStorage.setItem('ts_products', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
      return updated;
    });

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
      setProducts((prev) => {
        const updated = prev.map((p) => {
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
        });

        try {
          localStorage.setItem('ts_products', JSON.stringify(updated));
        } catch (e) {
          console.warn('LocalStorage save error:', e);
        }
        return updated;
      });
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
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === newProduct.id);
      const updated = exists ? prev.map((p) => (p.id === newProduct.id ? newProduct : p)) : [newProduct, ...prev];
      try {
        localStorage.setItem('ts_products', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
      return updated;
    });
    saveDocument('products', newProduct).catch((e) =>
      console.warn('Firestore product save error:', e)
    );
    if (isSupabaseLoaded) {
      saveSupabaseDocument(SUPABASE_TABLES.PRODUCTS, newProduct).catch(() => {});
    }
  };

  // Update Master Product
  const handleUpdateMasterProduct = (updatedProduct: MasterProduct) => {
    setProducts((prev) => {
      const updated = prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
      try {
        localStorage.setItem('ts_products', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
      return updated;
    });
    saveDocument('products', updatedProduct).catch((e) =>
      console.warn('Firestore product update error:', e)
    );
    if (isSupabaseLoaded) {
      saveSupabaseDocument(SUPABASE_TABLES.PRODUCTS, updatedProduct).catch(() => {});
    }
  };

  // Delete Master Product
  const handleDeleteMasterProduct = (productId: string) => {
    const prodToDelete = products.find((p) => p.id === productId);
    if (prodToDelete?.image) {
      deleteFileFromSupabaseStorage(prodToDelete.image).catch(() => {});
    }
    deleteSupabaseDocument(SUPABASE_TABLES.PRODUCTS, productId).catch(() => {});
    deleteDocument('products', productId).catch(() => {});
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      try {
        localStorage.setItem('ts_products', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
      return updated;
    });
  };

  // Update Stock directly
  const handleUpdateVariantStock = (variantId: string, storeId: string, newStock: number) => {
    setProducts((prev) => {
      const updated = prev.map((p) => {
        const hasVariant = p.variants.some((v) => v.id === variantId);
        if (!hasVariant) return p;
        const updatedVariants = p.variants.map((v) => {
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
        });
        const updatedProduct = { ...p, variants: updatedVariants };
        saveDocument('products', updatedProduct).catch(() => {});
        return updatedProduct;
      });
      try {
        localStorage.setItem('ts_products', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
      return updated;
    });
  };

  // Add Customer
  const handleAddCustomer = (newCustomer: Customer) => {
    setCustomers((prev) => [newCustomer, ...prev]);
    saveDocument('customers', newCustomer).catch(() => {});
  };

  const handleUpdateStoreCredit = (customerId: string, newCredit: number) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const updated = { ...c, storeCredit: newCredit };
          saveDocument('customers', updated).catch(() => {});
          return updated;
        }
        return c;
      })
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
    updatedStores.forEach((s) => saveDocument('stores', s).catch(() => {}));
    if (deletedStoreId) {
      deleteDocument('stores', deletedStoreId).catch(() => {});
      deleteSupabaseDocument(SUPABASE_TABLES.STORES, deletedStoreId).catch(() => {});
    }
  };

  const handleAddSpecialOrder = (order: CustomerSpecialOrder) => {
    setSpecialOrders(prev => [order, ...prev]);
    saveDocument('special_orders', order);
  };

  const handleUpdateSpecialOrderStatus = (orderId: string, status: SpecialOrderStatus) => {
    setSpecialOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updated = { ...o, status };
        saveDocument('special_orders', updated);
        return updated;
      }
      return o;
    }));
  };

  const handleDeleteSpecialOrder = (orderId: string) => {
    setSpecialOrders(prev => prev.filter(o => o.id !== orderId));
    deleteDocument('special_orders', orderId);
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
      if (activeTab === 'settings') {
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
      

      {/* Network Status Toast (Non-obstructive) */}
      {!isOnline && (
        <div className="fixed bottom-4 right-4 z-[100] bg-rose-600 hover:bg-rose-700 text-white py-2.5 px-4 rounded-xl flex items-center gap-2.5 text-xs font-bold shadow-xl border border-rose-500/40 transition-all">
          <WifiOff className="w-4 h-4 text-rose-200 animate-pulse" />
          <div className="flex flex-col text-left">
            <span>Offline Mode</span>
            <span className="text-[10px] font-normal text-rose-200">Local edits will sync when back online.</span>
          </div>
          <button
            onClick={() => setIsOnline(true)}
            className="ml-2 p-1 hover:bg-white/10 rounded-lg text-rose-200 hover:text-white transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {showOnlineAlert && (
        <div className="fixed bottom-4 right-4 z-[100] bg-emerald-600 text-white py-2.5 px-4 rounded-xl flex items-center gap-2.5 text-xs font-bold shadow-xl border border-emerald-500/40 transition-all">
          <Wifi className="w-4 h-4 text-emerald-200 animate-bounce" />
          <div className="flex flex-col text-left">
            <span>Back Online!</span>
            <span className="text-[10px] font-normal text-emerald-200">All data has been synced to the database.</span>
          </div>
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
        <main className="flex-1 pb-16 overflow-y-auto overflow-x-hidden min-w-0 w-full max-w-full">
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
            currentUser={currentUser}
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
            systemSettings={systemSettings}
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

        {activeTab === 'special_orders' && (
          <CustomerSpecialOrdersManager
            specialOrders={specialOrders}
            stores={stores}
            activeStoreId={activeStoreId}
            currentUser={currentUser}
            onAddSpecialOrder={handleAddSpecialOrder}
            onUpdateOrderStatus={handleUpdateSpecialOrderStatus}
            onDeleteSpecialOrder={handleDeleteSpecialOrder}
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
            onUpdateStores={handleUpdateStores}
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
          cart={cart}
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

      {/* Floating Stock Notification Toast */}
      {stockToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-md w-full px-4">
          <div
            className={`p-3.5 rounded-xl shadow-2xl border flex items-center justify-between gap-3 text-xs font-semibold backdrop-blur-md ${
              stockToast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                : stockToast.type === 'info'
                ? 'bg-amber-950/90 border-amber-500/50 text-amber-200'
                : 'bg-amber-950/90 border-amber-500/50 text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-base shrink-0">
                {stockToast.type === 'error' ? '🚫' : '⚠️'}
              </span>
              <p className="leading-snug">{stockToast.message}</p>
            </div>
            <button
              onClick={() => setStockToast(null)}
              className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800 shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
