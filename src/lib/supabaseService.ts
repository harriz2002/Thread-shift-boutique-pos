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

/**
 * Generic load function from Supabase with fallback
 */
export async function loadSupabaseTable<T extends { id: string }>(tableName: string): Promise<T[]> {
  try {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) {
      console.warn(`Supabase query warning for table ${tableName}:`, error.message);
      return [];
    }
    if (!data || data.length === 0) return [];

    return data.map((row: any) => {
      if (row.payload && typeof row.payload === 'object') {
        return { ...row.payload, id: row.id || row.payload.id };
      }
      return row as T;
    });
  } catch (err) {
    console.error(`Failed to load ${tableName} from Supabase:`, err);
    return [];
  }
}

/**
 * Generic Save / Upsert function to Supabase
 */
export async function saveSupabaseDocument<T extends { id: string }>(tableName: string, item: T): Promise<void> {
  if (!item || !item.id) return;

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
      // Retry with minimal payload if error occurs
      await supabase.from(tableName).upsert({ id: String(item.id), payload: item }, { onConflict: 'id' });
    }
  } catch (err) {
    console.warn(`Local save fallback for ${tableName}:`, err);
  }
}

/**
 * Generic Delete function from Supabase
 */
export async function deleteSupabaseDocument(tableName: string, id: string): Promise<void> {
  if (!id) return;
  try {
    await supabase.from(tableName).delete().eq('id', id);
  } catch (err) {
    console.error(`Failed deleting ${id} from ${tableName} in Supabase:`, err);
  }
}

/**
 * Test Supabase connection status
 */
export async function checkSupabaseConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    const { data, error } = await supabase.from(SUPABASE_TABLES.STORES).select('id').limit(1);
    if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
      return { connected: false, message: error.message };
    }
    return { connected: true, message: 'Connected to Supabase successfully' };
  } catch (err: any) {
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

    let finalStores = stores.length > 0 ? stores : INITIAL_STORES;
    let finalProducts = products.length > 0 ? products : INITIAL_PRODUCTS;
    let finalCustomers = customers.length > 0 ? customers : INITIAL_CUSTOMERS;
    let finalTransactions = transactions.length > 0 ? transactions : INITIAL_TRANSACTIONS;
    let finalLayaways = layaways.length > 0 ? layaways : INITIAL_LAYAWAYS;
    let finalHolds = holds.length > 0 ? holds : INITIAL_HOLDS;
    let finalTransfers = transfers.length > 0 ? transfers : INITIAL_TRANSFERS;
    let finalPO = purchaseOrders;
    let finalUsers = users.length > 0 ? users : INITIAL_USERS;

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
    console.error('Error during Supabase data initialization:', err);
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
