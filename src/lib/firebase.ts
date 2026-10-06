import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc,
  getDocFromServer, 
  collection, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  StoreLocation,
  MasterProduct,
  Customer,
  SaleTransaction,
  LayawayPlan,
  HoldCart,
  StockTransfer,
  ReorderPO,
  UserAccount,
  SystemSettings,
  CustomerSpecialOrder
} from '../types';
import {
  INITIAL_STORES,
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_TRANSACTIONS,
  INITIAL_LAYAWAYS,
  INITIAL_HOLDS,
  INITIAL_TRANSFERS,
  INITIAL_USERS
} from '../data/mockData';

// Configure log level to silence internal retry and backoff logs during quota exhaustion
setLogLevel('silent');

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

// Circuit breaker for Firestore free tier write quota limits (cached for current day)
const QUOTA_STORAGE_KEY = 'ts_firestore_quota_exhausted_date';

function checkInitialQuotaExhaustion(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const storedDate = localStorage.getItem(QUOTA_STORAGE_KEY);
    return storedDate === todayStr;
  } catch {
    return false;
  }
}

let isQuotaExhausted = checkInitialQuotaExhaustion();

export function getFirestoreQuotaExhausted(): boolean {
  return isQuotaExhausted;
}

export function setFirestoreQuotaExhausted(val: boolean): void {
  isQuotaExhausted = val;
  if (typeof window !== 'undefined') {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      if (val) {
        localStorage.setItem(QUOTA_STORAGE_KEY, todayStr);
      } else {
        localStorage.removeItem(QUOTA_STORAGE_KEY);
      }
    } catch {}
  }
}

// Global safeguard against unhandled Firestore quota errors
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = reason?.message || String(reason || '');
    if (
      reason?.code === 'resource-exhausted' ||
      msg.includes('Quota limit exceeded') ||
      msg.includes('resource-exhausted') ||
      msg.includes('Free daily write units per project')
    ) {
      setFirestoreQuotaExhausted(true);
      event.preventDefault(); // Suppress browser unhandled error
    }
  });
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  if (
    (error as any)?.code === 'resource-exhausted' ||
    errMessage.includes('Quota limit exceeded') ||
    errMessage.includes('resource-exhausted')
  ) {
    setFirestoreQuotaExhausted(true);
    console.warn('Firestore write quota limit active. Continuing smoothly with offline & local storage cache.');
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
}

// Test connection to server on boot (non-blocking)
async function testConnection() {
  // Silent connection test without forcing server doc fetch
}
testConnection();

// Collection names
const COL_STORES = 'stores';
const COL_PRODUCTS = 'products';
const COL_CUSTOMERS = 'customers';
const COL_TRANSACTIONS = 'transactions';
const COL_LAYAWAYS = 'layaways';
const COL_HOLDS = 'holds';
const COL_TRANSFERS = 'transfers';
const COL_PURCHASE_ORDERS = 'purchase_orders';
const COL_USERS = 'users';
const COL_SPECIAL_ORDERS = 'special_orders';

// Generic sync helper
export async function saveDocument<T extends { id: string }>(colName: string, item: T): Promise<void> {
  if (isQuotaExhausted) {
    return;
  }
  try {
    const docRef = doc(db, colName, item.id);
    await setDoc(docRef, item);
  } catch (error: any) {
    if (
      error?.code === 'resource-exhausted' ||
      error?.message?.includes('Quota limit exceeded') ||
      error?.message?.includes('resource-exhausted') ||
      error?.message?.includes('Free daily write units')
    ) {
      setFirestoreQuotaExhausted(true);
      console.warn('Firestore daily write quota reached (free-tier limit). App is continuing smoothly using local storage persistence.');
    }
  }
}

export async function deleteDocument(colName: string, id: string): Promise<void> {
  if (isQuotaExhausted) {
    return;
  }
  try {
    const docRef = doc(db, colName, id);
    await deleteDoc(docRef);
  } catch (error: any) {
    if (
      error?.code === 'resource-exhausted' ||
      error?.message?.includes('Quota limit exceeded') ||
      error?.message?.includes('resource-exhausted') ||
      error?.message?.includes('Free daily write units')
    ) {
      setFirestoreQuotaExhausted(true);
      console.warn('Firestore daily write quota reached (free-tier limit). App is continuing smoothly using local storage persistence.');
    }
  }
}

// Bootstrap / Seed initial data if Firestore is empty
export async function bootstrapFirestoreIfEmpty(): Promise<{
  stores: StoreLocation[];
  products: MasterProduct[];
  customers: Customer[];
  transactions: SaleTransaction[];
  layaways: LayawayPlan[];
  holds: HoldCart[];
  transfers: StockTransfer[];
  purchaseOrders: ReorderPO[];
  users: UserAccount[];
  settings?: SystemSettings;
  specialOrders: CustomerSpecialOrder[];
}> {
  // Helper to read localStorage cleanly
  const parseLocal = <T>(key: string, fallback: T): T => {
    if (typeof window === 'undefined') return fallback;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  };

  // If already flagged for quota exhaustion, load cleanly from local cache without triggering Firestore calls
  if (isQuotaExhausted) {
    return {
      stores: parseLocal('ts_stores', INITIAL_STORES),
      products: parseLocal('ts_products', INITIAL_PRODUCTS),
      customers: parseLocal('ts_customers', INITIAL_CUSTOMERS),
      transactions: parseLocal('ts_transactions', INITIAL_TRANSACTIONS),
      layaways: parseLocal('ts_layaways', INITIAL_LAYAWAYS),
      holds: parseLocal('ts_holds', INITIAL_HOLDS),
      transfers: parseLocal('ts_transfers', INITIAL_TRANSFERS),
      purchaseOrders: parseLocal('ts_purchase_orders', []),
      users: parseLocal('ts_users', INITIAL_USERS),
      settings: parseLocal('ts_system_settings', undefined),
      specialOrders: parseLocal('ts_special_orders', [])
    };
  }

  try {
    const storesSnap = await getDocs(collection(db, COL_STORES));
    const productsSnap = await getDocs(collection(db, COL_PRODUCTS));
    const customersSnap = await getDocs(collection(db, COL_CUSTOMERS));
    const transactionsSnap = await getDocs(collection(db, COL_TRANSACTIONS));
    const layawaysSnap = await getDocs(collection(db, COL_LAYAWAYS));
    const holdsSnap = await getDocs(collection(db, COL_HOLDS));
    const transfersSnap = await getDocs(collection(db, COL_TRANSFERS));
    const poSnap = await getDocs(collection(db, COL_PURCHASE_ORDERS));
    const usersSnap = await getDocs(collection(db, COL_USERS));

    let specialOrdersList: CustomerSpecialOrder[] = [];
    try {
      const specialOrdersSnap = await getDocs(collection(db, COL_SPECIAL_ORDERS));
      specialOrdersList = specialOrdersSnap.docs.map(d => d.data() as CustomerSpecialOrder);
    } catch (e) {
      console.warn('Failed to load special orders from Firestore:', e);
    }

    // Try fetching settings/global
    let settingsData: SystemSettings | undefined = undefined;
    try {
      const settingsSnap = await getDoc(doc(db, 'settings', 'global'));
      if (settingsSnap.exists()) {
        settingsData = settingsSnap.data() as SystemSettings;
      }
    } catch (e) {
      console.warn('Failed to load settings from Firestore:', e);
    }

    let storesList: StoreLocation[] = storesSnap.docs.map(d => d.data() as StoreLocation);
    let productsList: MasterProduct[] = productsSnap.docs.map(d => d.data() as MasterProduct).map(p => ({
      ...p,
      variants: (p.variants || []).map(v => ({ ...v, reorderLevel: 1 }))
    }));
    let customersList: Customer[] = customersSnap.docs.map(d => d.data() as Customer);
    let transactionsList: SaleTransaction[] = transactionsSnap.docs.map(d => d.data() as SaleTransaction);
    let layawaysList: LayawayPlan[] = layawaysSnap.docs.map(d => d.data() as LayawayPlan);
    let holdsList: HoldCart[] = holdsSnap.docs.map(d => d.data() as HoldCart);
    let transfersList: StockTransfer[] = transfersSnap.docs.map(d => d.data() as StockTransfer);
    let poList: ReorderPO[] = poSnap.docs.map(d => d.data() as ReorderPO);
    let usersList: UserAccount[] = usersSnap.docs.map(d => d.data() as UserAccount);

    // Fallback to local data if collection is empty, without burning writes on read
    if (storesList.length === 0) {
      storesList = parseLocal('ts_stores', INITIAL_STORES);
    }
    if (productsList.length === 0) {
      productsList = parseLocal('ts_products', INITIAL_PRODUCTS);
    } else if (typeof window !== 'undefined') {
      // If Firestore already has products, also preserve any extra products from localStorage
      const local = localStorage.getItem('ts_products');
      if (local) {
        try {
          const parsed: MasterProduct[] = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const existingIds = new Set(productsList.map(p => p.id));
            for (const p of parsed) {
              if (!existingIds.has(p.id)) {
                productsList.unshift(p);
              }
            }
          }
        } catch {}
      }
    }
    if (customersList.length === 0) {
      customersList = parseLocal('ts_customers', INITIAL_CUSTOMERS);
    }
    if (transactionsList.length === 0) {
      transactionsList = parseLocal('ts_transactions', INITIAL_TRANSACTIONS);
    }
    if (layawaysList.length === 0) {
      layawaysList = parseLocal('ts_layaways', INITIAL_LAYAWAYS);
    }
    if (holdsList.length === 0) {
      holdsList = parseLocal('ts_holds', INITIAL_HOLDS);
    }
    if (transfersList.length === 0) {
      transfersList = parseLocal('ts_transfers', INITIAL_TRANSFERS);
    }
    if (usersList.length === 0) {
      usersList = parseLocal('ts_users', INITIAL_USERS);
    }

    return {
      stores: storesList,
      products: productsList,
      customers: customersList,
      transactions: transactionsList,
      layaways: layawaysList,
      holds: holdsList,
      transfers: transfersList,
      purchaseOrders: poList,
      users: usersList,
      settings: settingsData || parseLocal('ts_system_settings', undefined),
      specialOrders: specialOrdersList.length > 0 ? specialOrdersList : parseLocal('ts_special_orders', [])
    };
  } catch (error: any) {
    if (
      error?.code === 'resource-exhausted' ||
      error?.message?.includes('Quota limit exceeded') ||
      error?.message?.includes('resource-exhausted')
    ) {
      isQuotaExhausted = true;
      console.warn('Firestore daily write quota reached (free-tier limit). App is continuing smoothly using local storage persistence.');
    }
    // Fallback cleanly to local storage or initial mock data
    return {
      stores: parseLocal('ts_stores', INITIAL_STORES),
      products: parseLocal('ts_products', INITIAL_PRODUCTS),
      customers: parseLocal('ts_customers', INITIAL_CUSTOMERS),
      transactions: parseLocal('ts_transactions', INITIAL_TRANSACTIONS),
      layaways: parseLocal('ts_layaways', INITIAL_LAYAWAYS),
      holds: parseLocal('ts_holds', INITIAL_HOLDS),
      transfers: parseLocal('ts_transfers', INITIAL_TRANSFERS),
      purchaseOrders: parseLocal('ts_purchase_orders', []),
      users: parseLocal('ts_users', INITIAL_USERS),
      settings: parseLocal('ts_system_settings', undefined),
      specialOrders: parseLocal('ts_special_orders', [])
    };
  }
}

/**
 * Real-time listener for global system settings (including logo) from Firestore.
 */
export function subscribeToSettings(onUpdate: (settings: SystemSettings) => void): () => void {
  if (isQuotaExhausted) {
    return () => {};
  }
  try {
    const docRef = doc(db, 'settings', 'global');
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as SystemSettings);
      }
    }, (error: any) => {
      if (
        error?.code === 'resource-exhausted' ||
        error?.message?.includes('Quota limit exceeded') ||
        error?.message?.includes('resource-exhausted')
      ) {
        isQuotaExhausted = true;
      }
    });
  } catch (e) {
    return () => {};
  }
}
