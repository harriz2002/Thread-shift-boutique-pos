// src/db/init.ts
import { createPool } from './index.ts';

export async function initDatabaseTables(): Promise<void> {
  const pool = createPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        uid TEXT UNIQUE,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'employee',
        pin TEXT DEFAULT '1234',
        assigned_store_id TEXT,
        department TEXT DEFAULT 'Sales Associate',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Stores Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id VARCHAR(50) PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        is_flagship BOOLEAN DEFAULT FALSE,
        active_register_count INTEGER DEFAULT 1
      );
    `);

    // 3. Products Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        sku TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        brand TEXT,
        color TEXT,
        size TEXT,
        cost_price DOUBLE PRECISION NOT NULL DEFAULT 0,
        selling_price DOUBLE PRECISION NOT NULL DEFAULT 0,
        default_supplier_id TEXT,
        stock_quantity INTEGER DEFAULT 0
      );
    `);

    // 4. Customers Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(50) PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        loyalty_points INTEGER DEFAULT 0,
        total_spent DOUBLE PRECISION DEFAULT 0,
        vip_tier TEXT DEFAULT 'Bronze',
        preferences TEXT
      );
    `);

    // 5. Transactions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(50) PRIMARY KEY,
        receipt_number TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        store_id TEXT NOT NULL,
        cashier_name TEXT,
        customer_id TEXT,
        customer_name TEXT,
        subtotal DOUBLE PRECISION NOT NULL DEFAULT 0,
        discount_amount DOUBLE PRECISION DEFAULT 0,
        total_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
        payment_method TEXT NOT NULL,
        status TEXT DEFAULT 'completed',
        items_json TEXT
      );
    `);

    // 6. Layaways Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS layaways (
        id VARCHAR(50) PRIMARY KEY,
        plan_number TEXT NOT NULL,
        customer_id TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        total_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
        amount_paid DOUBLE PRECISION DEFAULT 0,
        balance_due DOUBLE PRECISION NOT NULL DEFAULT 0,
        status TEXT DEFAULT 'active',
        created_date TEXT,
        due_date TEXT,
        items_json TEXT
      );
    `);

    // 7. Transfers Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transfers (
        id VARCHAR(50) PRIMARY KEY,
        transfer_number TEXT NOT NULL,
        from_store_id TEXT NOT NULL,
        to_store_id TEXT NOT NULL,
        created_by TEXT,
        created_date TEXT,
        status TEXT DEFAULT 'in-transit',
        items_json TEXT
      );
    `);

    // 8. Purchase Orders Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id VARCHAR(50) PRIMARY KEY,
        po_number TEXT NOT NULL,
        supplier_name TEXT NOT NULL,
        created_date TEXT,
        expected_date TEXT,
        status TEXT DEFAULT 'draft',
        total_estimated_cost DOUBLE PRECISION DEFAULT 0,
        items_json TEXT
      );
    `);

    await client.query('COMMIT');
    console.log('Successfully verified/created all Cloud SQL PostgreSQL tables.');
  } catch (error: any) {
    try {
      await client.query('ROLLBACK');
    } catch {}
    console.warn('Failed to initialize database tables (using Firestore fallback):', error.message || error);
    if (error.message && error.message.includes('permission denied for schema public')) {
      console.warn('Database user lacks public schema permissions. Falling back to dual-layer Firestore persistence.');
      return;
    }
    throw new Error('Database initialization failed.', { cause: error });
  } finally {
    client.release();
  }
}
