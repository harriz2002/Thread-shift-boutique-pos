import { supabase } from '../supabaseClient';
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

// Table names mapping
export const SUPABASE_TABLES = {
  STORES: 'stores',
  PRODUCTS: 'products',
  CUSTOMERS: 'customers',
  TRANSACTIONS: 'sale_transactions',
  LAYAWAYS: 'layaway_plans',
  HOLDS: 'hold_carts',
  TRANSFERS: 'stock_transfers',
  PURCHASE_ORDERS: 'purchase_orders',
  USERS: 'user_accounts',
};

// Connection availability tracking
let isSupabaseOnline: boolean | null = null;

/**
 * Generic load function from Supabase with fallback
 */
export async function loadSupabaseTable<T extends { id: string }>(tableName: string): Promise<T[]> {
  if (isSupabaseOnline === false) return [];

  try {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) {
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        isSupabaseOnline = false;
      }
      return [];
    }
    isSupabaseOnline = true;
    if (!data || data.length === 0) return [];

    return data.map((row: any) => {
      if (row.payload && typeof row.payload === 'object') {
        return { ...row.payload, id: row.id || row.payload.id };
      }
      return row as T;
    });
  } catch (err: any) {
    if (err?.message?.includes('fetch') || err?.message?.includes('network') || String(err).includes('fetch')) {
      isSupabaseOnline = false;
    }
    return [];
  }
}

/**
 * Generic Save / Upsert function to Supabase
 */
export async function saveSupabaseDocument<T extends { id: string }>(tableName: string, item: T): Promise<void> {
  if (!item || !item.id || isSupabaseOnline === false) return;

  try {
    // Upsert with both flat properties and payload for dual-schema compatibility
    const record: Record<string, any> = {
      id: String(item.id),
      payload: item,
      updated_at: new Date().toISOString()
    };

    // Add common flat fields if available
    if ('title' in item) record.title = (item as any).title;
    if ('name' in item) record.name = (item as any).name;
    if ('receiptNumber' in item) record.receipt_number = (item as any).receiptNumber;
    if ('planNumber' in item) record.plan_number = (item as any).planNumber;
    if ('holdCode' in item) record.hold_code = (item as any).holdCode;
    if ('transferNumber' in item) record.transfer_number = (item as any).transferNumber;

    const { error } = await supabase.from(tableName).upsert(record, { onConflict: 'id' });
    if (error) {
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        isSupabaseOnline = false;
        return;
      }
      // Retry with minimal payload if error occurs
      await supabase.from(tableName).upsert({ id: String(item.id), payload: item }, { onConflict: 'id' });
    }
  } catch (err: any) {
    if (err?.message?.includes('fetch') || String(err).includes('fetch')) {
      isSupabaseOnline = false;
    }
  }
}

/**
 * Generic Delete function from Supabase
 */
export async function deleteSupabaseDocument(tableName: string, id: string): Promise<void> {
  if (!id || isSupabaseOnline === false) return;
  try {
    await supabase.from(tableName).delete().eq('id', id);
  } catch {
    // Quiet delete fallback
  }
}

/**
 * Test Supabase connection status
 */
export async function checkSupabaseConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    const { error } = await supabase.from(SUPABASE_TABLES.STORES).select('id').limit(1);
    if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
      isSupabaseOnline = false;
      return { connected: false, message: error.message };
    }
    isSupabaseOnline = true;
    return { connected: true, message: 'Connected to Supabase successfully' };
  } catch (err: any) {
    isSupabaseOnline = false;
    return { connected: false, message: err?.message || 'Network error connecting to Supabase' };
  }
}

/**
 * Load all app data from Supabase, auto-bootstrapping default state if tables are empty
 */
export async function bootstrapSupabaseData(): Promise<{
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
    const stores = await loadSupabaseTable<StoreLocation>(SUPABASE_TABLES.STORES);
    const products = await loadSupabaseTable<MasterProduct>(SUPABASE_TABLES.PRODUCTS);
    const customers = await loadSupabaseTable<Customer>(SUPABASE_TABLES.CUSTOMERS);
    const transactions = await loadSupabaseTable<SaleTransaction>(SUPABASE_TABLES.TRANSACTIONS);
    const layaways = await loadSupabaseTable<LayawayPlan>(SUPABASE_TABLES.LAYAWAYS);
    const holds = await loadSupabaseTable<HoldCart>(SUPABASE_TABLES.HOLDS);
    const transfers = await loadSupabaseTable<StockTransfer>(SUPABASE_TABLES.TRANSFERS);
    const purchaseOrders = await loadSupabaseTable<ReorderPO>(SUPABASE_TABLES.PURCHASE_ORDERS);
    const users = await loadSupabaseTable<UserAccount>(SUPABASE_TABLES.USERS);

    // Read localStorage fallbacks first so newly added items are never erased
    let localProducts = INITIAL_PRODUCTS;
    let localStores = INITIAL_STORES;
    let localCustomers = INITIAL_CUSTOMERS;
    let localTransactions = INITIAL_TRANSACTIONS;
    let localLayaways = INITIAL_LAYAWAYS;
    let localHolds = INITIAL_HOLDS;
    let localTransfers = INITIAL_TRANSFERS;
    let localUsers = INITIAL_USERS;

    if (typeof window !== 'undefined') {
      try {
        const lp = localStorage.getItem('ts_products');
        if (lp) {
          const parsed = JSON.parse(lp);
          if (Array.isArray(parsed) && parsed.length > 0) localProducts = parsed;
        }
        const ls = localStorage.getItem('ts_stores');
        if (ls) {
          const parsed = JSON.parse(ls);
          if (Array.isArray(parsed) && parsed.length > 0) localStores = parsed;
        }
        const lc = localStorage.getItem('ts_customers');
        if (lc) {
          const parsed = JSON.parse(lc);
          if (Array.isArray(parsed) && parsed.length > 0) localCustomers = parsed;
        }
        const lt = localStorage.getItem('ts_transactions');
        if (lt) {
          const parsed = JSON.parse(lt);
          if (Array.isArray(parsed) && parsed.length > 0) localTransactions = parsed;
        }
        const ll = localStorage.getItem('ts_layaways');
        if (ll) {
          const parsed = JSON.parse(ll);
          if (Array.isArray(parsed) && parsed.length > 0) localLayaways = parsed;
        }
        const lh = localStorage.getItem('ts_holds');
        if (lh) {
          const parsed = JSON.parse(lh);
          if (Array.isArray(parsed) && parsed.length > 0) localHolds = parsed;
        }
        const ltr = localStorage.getItem('ts_transfers');
        if (ltr) {
          const parsed = JSON.parse(ltr);
          if (Array.isArray(parsed) && parsed.length > 0) localTransfers = parsed;
        }
      } catch (e) {
        // Fallback silently
      }
    }

    let finalStores = stores.length > 0 ? stores : localStores;
    let finalProducts = products.length > 0 ? products : localProducts;
    let finalCustomers = customers.length > 0 ? customers : localCustomers;
    let finalTransactions = transactions.length > 0 ? transactions : localTransactions;
    let finalLayaways = layaways.length > 0 ? layaways : localLayaways;
    let finalHolds = holds.length > 0 ? holds : localHolds;
    let finalTransfers = transfers.length > 0 ? transfers : localTransfers;
    let finalPO = purchaseOrders;
    let finalUsers = users.length > 0 ? users : localUsers;

    // Seed empty tables in background for smooth initialization
    if (stores.length === 0) {
      INITIAL_STORES.forEach((s) => saveSupabaseDocument(SUPABASE_TABLES.STORES, s));
    }
    if (products.length === 0) {
      INITIAL_PRODUCTS.forEach((p) => saveSupabaseDocument(SUPABASE_TABLES.PRODUCTS, p));
    }
    if (customers.length === 0) {
      INITIAL_CUSTOMERS.forEach((c) => saveSupabaseDocument(SUPABASE_TABLES.CUSTOMERS, c));
    }
    if (transactions.length === 0) {
      INITIAL_TRANSACTIONS.forEach((t) => saveSupabaseDocument(SUPABASE_TABLES.TRANSACTIONS, t));
    }
    if (layaways.length === 0) {
      INITIAL_LAYAWAYS.forEach((l) => saveSupabaseDocument(SUPABASE_TABLES.LAYAWAYS, l));
    }
    if (holds.length === 0) {
      INITIAL_HOLDS.forEach((h) => saveSupabaseDocument(SUPABASE_TABLES.HOLDS, h));
    }
    if (transfers.length === 0) {
      INITIAL_TRANSFERS.forEach((tr) => saveSupabaseDocument(SUPABASE_TABLES.TRANSFERS, tr));
    }
    if (users.length === 0) {
      INITIAL_USERS.forEach((u) => saveSupabaseDocument(SUPABASE_TABLES.USERS, u));
    }

    return {
      stores: finalStores,
      products: finalProducts,
      customers: finalCustomers,
      transactions: finalTransactions,
      layaways: finalLayaways,
      holds: finalHolds,
      transfers: finalTransfers,
      purchaseOrders: finalPO,
      users: finalUsers
    };
  } catch (err) {
    console.warn('Supabase data bootstrap bypassed to local/Firestore fallback:', err);
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
