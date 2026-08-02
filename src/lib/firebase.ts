import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
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
  UserAccount
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

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

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
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection to server on boot (non-blocking)
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    // Operating in offline/local fallback mode
    console.log("Operating in offline/local fallback mode.");
  }
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

// Generic sync helper
export async function saveDocument<T extends { id: string }>(colName: string, item: T): Promise<void> {
  try {
    const docRef = doc(db, colName, item.id);
    await setDoc(docRef, item);
  } catch (error) {
    // Silent local fallback if offline
  }
}

export async function deleteDocument(colName: string, id: string): Promise<void> {
  try {
    const docRef = doc(db, colName, id);
    await deleteDoc(docRef);
  } catch (error) {
    // Silent local fallback if offline
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
}> {
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

    let storesList: StoreLocation[] = storesSnap.docs.map(d => d.data() as StoreLocation);
    let productsList: MasterProduct[] = productsSnap.docs.map(d => d.data() as MasterProduct);
    let customersList: Customer[] = customersSnap.docs.map(d => d.data() as Customer);
    let transactionsList: SaleTransaction[] = transactionsSnap.docs.map(d => d.data() as SaleTransaction);
    let layawaysList: LayawayPlan[] = layawaysSnap.docs.map(d => d.data() as LayawayPlan);
    let holdsList: HoldCart[] = holdsSnap.docs.map(d => d.data() as HoldCart);
    let transfersList: StockTransfer[] = transfersSnap.docs.map(d => d.data() as StockTransfer);
    let poList: ReorderPO[] = poSnap.docs.map(d => d.data() as ReorderPO);
    let usersList: UserAccount[] = usersSnap.docs.map(d => d.data() as UserAccount);

    // If Firestore has no stores yet, seed with INITIAL_STORES and INITIAL_PRODUCTS, etc.
    if (storesList.length === 0) {
      storesList = INITIAL_STORES;
      for (const s of INITIAL_STORES) {
        await saveDocument(COL_STORES, s);
      }
    }
    if (productsList.length === 0) {
      productsList = INITIAL_PRODUCTS;
      for (const p of INITIAL_PRODUCTS) {
        await saveDocument(COL_PRODUCTS, p);
      }
    }
    if (customersList.length === 0) {
      customersList = INITIAL_CUSTOMERS;
      for (const c of INITIAL_CUSTOMERS) {
        await saveDocument(COL_CUSTOMERS, c);
      }
    }
    if (transactionsList.length === 0) {
      transactionsList = INITIAL_TRANSACTIONS;
      for (const t of INITIAL_TRANSACTIONS) {
        await saveDocument(COL_TRANSACTIONS, t);
      }
    }
    if (layawaysList.length === 0) {
      layawaysList = INITIAL_LAYAWAYS;
      for (const l of INITIAL_LAYAWAYS) {
        await saveDocument(COL_LAYAWAYS, l);
      }
    }
    if (holdsList.length === 0) {
      holdsList = INITIAL_HOLDS;
      for (const h of INITIAL_HOLDS) {
        await saveDocument(COL_HOLDS, h);
      }
    }
    if (transfersList.length === 0) {
      transfersList = INITIAL_TRANSFERS;
      for (const tr of INITIAL_TRANSFERS) {
        await saveDocument(COL_TRANSFERS, tr);
      }
    }
    if (usersList.length === 0) {
      usersList = INITIAL_USERS;
      for (const u of INITIAL_USERS) {
        await saveDocument(COL_USERS, u);
      }
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
      users: usersList
    };
  } catch (error) {
    // Fallback to initial mock data if offline or network unavailable
    return {
      stores: INITIAL_STORES,
      products: INITIAL_PRODUCTS,
      customers: INITIAL_CUSTOMERS,
      transactions: INITIAL_TRANSACTIONS,
      layaways: INITIAL_LAYAWAYS,
      holds: INITIAL_HOLDS,
      transfers: INITIAL_TRANSFERS,
      purchaseOrders: [],
      users: INITIAL_USERS
    };
  }
}
