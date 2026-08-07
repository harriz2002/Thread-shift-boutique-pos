-- ==============================================================================
-- SUPABASE POSTGRESQL DATABASE SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- Threads Style POS & Retail Management System
-- Paste and execute this entire file in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. STORES TABLE
CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  user_id UUID DEFAULT auth.uid(),
  name TEXT,
  code TEXT,
  address TEXT,
  phone TEXT,
  is_warehouse BOOLEAN DEFAULT false,
  is_central BOOLEAN DEFAULT false,
  payload JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  user_id UUID DEFAULT auth.uid(),
  style_number TEXT,
  title TEXT,
  category TEXT,
  description TEXT,
  base_price NUMERIC DEFAULT 0,
  cost_price NUMERIC DEFAULT 0,
  image TEXT,
  fabric_content TEXT,
  care_instructions TEXT,
  variants JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  payload JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  user_id UUID DEFAULT auth.uid(),
  name TEXT,
  phone TEXT,
  email TEXT,
  loyalty_points INT DEFAULT 0,
  store_credit NUMERIC DEFAULT 0,
  tier TEXT DEFAULT 'Silver',
  size_preferences JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  total_spent NUMERIC DEFAULT 0,
  total_orders INT DEFAULT 0,
  payload JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SALE TRANSACTIONS TABLE (With full garment return & swap metadata)
CREATE TABLE IF NOT EXISTS sale_transactions (
  id TEXT PRIMARY KEY,
  user_id UUID DEFAULT auth.uid(),
  receipt_number TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  store_id TEXT,
  cashier_name TEXT,
  customer_id TEXT,
  customer_name TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  subtotal NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  payments JSONB DEFAULT '[]'::jsonb,
  loyalty_points_earned INT DEFAULT 0,
  points_redeemed INT DEFAULT 0,
  status TEXT DEFAULT 'completed', -- 'completed', 'returned', 'exchanged'
  return_reason TEXT,
  refund_method TEXT,
  refund_amount NUMERIC DEFAULT 0,
  returned_at TIMESTAMPTZ,
  restocked BOOLEAN DEFAULT true,
  returned_variant_ids JSONB DEFAULT '[]'::jsonb,
  returned_items JSONB DEFAULT '[]'::jsonb,
  payload JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. LAYAWAY PLANS TABLE
CREATE TABLE IF NOT EXISTS layaway_plans (
  id TEXT PRIMARY KEY,
  user_id UUID DEFAULT auth.uid(),
  plan_number TEXT,
  customer_id TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  store_id TEXT,
  cart_items JSONB DEFAULT '[]'::jsonb,
  total_amount NUMERIC DEFAULT 0,
  deposit_paid NUMERIC DEFAULT 0,
  balance_due NUMERIC DEFAULT 0,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  payments_history JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. HOLD CARTS TABLE
CREATE TABLE IF NOT EXISTS hold_carts (
  id TEXT PRIMARY KEY,
  user_id UUID DEFAULT auth.uid(),
  hold_code TEXT,
  store_id TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  note TEXT,
  cart_items JSONB DEFAULT '[]'::jsonb,
  total_amount NUMERIC DEFAULT 0,
  hold_date TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  payload JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. STOCK TRANSFERS TABLE
CREATE TABLE IF NOT EXISTS stock_transfers (
  id TEXT PRIMARY KEY,
  user_id UUID DEFAULT auth.uid(),
  transfer_number TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  from_store_id TEXT,
  to_store_id TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  initiated_by TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PURCHASE ORDERS TABLE
CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  user_id UUID DEFAULT auth.uid(),
  po_number TEXT,
  supplier_name TEXT,
  date_created TIMESTAMPTZ DEFAULT NOW(),
  target_store_id TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'draft',
  total_estimated_cost NUMERIC DEFAULT 0,
  payload JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. USER ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS user_accounts (
  id TEXT PRIMARY KEY,
  user_id UUID DEFAULT auth.uid(),
  name TEXT,
  email TEXT,
  role TEXT DEFAULT 'employee',
  pin TEXT,
  assigned_store_id TEXT,
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  payload JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. RETURNED GOODS LOGS TABLE (Dedicated audit log for returned & swapped garments)
CREATE TABLE IF NOT EXISTS returned_goods_logs (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id UUID DEFAULT auth.uid(),
  transaction_id TEXT,
  receipt_number TEXT NOT NULL,
  store_id TEXT,
  customer_id TEXT,
  customer_name TEXT,
  cashier_name TEXT,
  returned_items JSONB DEFAULT '[]'::jsonb,
  refund_amount NUMERIC DEFAULT 0,
  refund_method TEXT DEFAULT 'mpesa',
  return_reason TEXT DEFAULT 'Size Swap',
  restocked BOOLEAN DEFAULT true,
  returned_at TIMESTAMPTZ DEFAULT NOW(),
  payload JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- SCHEMA MIGRATIONS (Safely adds return columns to existing sale_transactions)
-- ==============================================================================
ALTER TABLE sale_transactions ADD COLUMN IF NOT EXISTS return_reason TEXT;
ALTER TABLE sale_transactions ADD COLUMN IF NOT EXISTS refund_method TEXT;
ALTER TABLE sale_transactions ADD COLUMN IF NOT EXISTS refund_amount NUMERIC DEFAULT 0;
ALTER TABLE sale_transactions ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ;
ALTER TABLE sale_transactions ADD COLUMN IF NOT EXISTS restocked BOOLEAN DEFAULT true;
ALTER TABLE sale_transactions ADD COLUMN IF NOT EXISTS returned_variant_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sale_transactions ADD COLUMN IF NOT EXISTS returned_items JSONB DEFAULT '[]'::jsonb;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) & IDEMPOTENT POLICY DELETION/CREATION
-- ==============================================================================

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE layaway_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE hold_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE returned_goods_logs ENABLE ROW LEVEL SECURITY;

-- 1. STORES POLICIES
DROP POLICY IF EXISTS "stores_policy" ON stores;
DROP POLICY IF EXISTS "Public or authenticated access to stores" ON stores;
CREATE POLICY "stores_policy" ON stores FOR ALL USING (true) WITH CHECK (true);

-- 2. PRODUCTS POLICIES
DROP POLICY IF EXISTS "products_policy" ON products;
DROP POLICY IF EXISTS "Public or authenticated access to products" ON products;
CREATE POLICY "products_policy" ON products FOR ALL USING (true) WITH CHECK (true);

-- 3. CUSTOMERS POLICIES
DROP POLICY IF EXISTS "customers_policy" ON customers;
DROP POLICY IF EXISTS "Public or authenticated access to customers" ON customers;
CREATE POLICY "customers_policy" ON customers FOR ALL USING (true) WITH CHECK (true);

-- 4. SALE TRANSACTIONS POLICIES
DROP POLICY IF EXISTS "sale_transactions_policy" ON sale_transactions;
DROP POLICY IF EXISTS "Public or authenticated access to sale_transactions" ON sale_transactions;
CREATE POLICY "sale_transactions_policy" ON sale_transactions FOR ALL USING (true) WITH CHECK (true);

-- 5. LAYAWAY PLANS POLICIES
DROP POLICY IF EXISTS "layaway_plans_policy" ON layaway_plans;
DROP POLICY IF EXISTS "Public or authenticated access to layaway_plans" ON layaway_plans;
CREATE POLICY "layaway_plans_policy" ON layaway_plans FOR ALL USING (true) WITH CHECK (true);

-- 6. HOLD CARTS POLICIES
DROP POLICY IF EXISTS "hold_carts_policy" ON hold_carts;
DROP POLICY IF EXISTS "Public or authenticated access to hold_carts" ON hold_carts;
CREATE POLICY "hold_carts_policy" ON hold_carts FOR ALL USING (true) WITH CHECK (true);

-- 7. STOCK TRANSFERS POLICIES
DROP POLICY IF EXISTS "stock_transfers_policy" ON stock_transfers;
DROP POLICY IF EXISTS "Public or authenticated access to stock_transfers" ON stock_transfers;
CREATE POLICY "stock_transfers_policy" ON stock_transfers FOR ALL USING (true) WITH CHECK (true);

-- 8. PURCHASE ORDERS POLICIES
DROP POLICY IF EXISTS "purchase_orders_policy" ON purchase_orders;
DROP POLICY IF EXISTS "Public or authenticated access to purchase_orders" ON purchase_orders;
CREATE POLICY "purchase_orders_policy" ON purchase_orders FOR ALL USING (true) WITH CHECK (true);

-- 9. USER ACCOUNTS POLICIES
DROP POLICY IF EXISTS "user_accounts_policy" ON user_accounts;
DROP POLICY IF EXISTS "Public or authenticated access to user_accounts" ON user_accounts;
CREATE POLICY "user_accounts_policy" ON user_accounts FOR ALL USING (true) WITH CHECK (true);

-- 10. RETURNED GOODS LOGS POLICIES
DROP POLICY IF EXISTS "returned_goods_logs_policy" ON returned_goods_logs;
DROP POLICY IF EXISTS "Public or authenticated access to returned_goods_logs" ON returned_goods_logs;
CREATE POLICY "returned_goods_logs_policy" ON returned_goods_logs FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- INDEXES & CONVENIENCE VIEWS FOR RETURNED GOODS REPORTING
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_sale_transactions_status ON sale_transactions(status);
CREATE INDEX IF NOT EXISTS idx_returned_goods_receipt ON returned_goods_logs(receipt_number);
CREATE INDEX IF NOT EXISTS idx_returned_goods_store ON returned_goods_logs(store_id);

CREATE OR REPLACE VIEW returned_goods_summary AS
SELECT 
  st.id AS transaction_id,
  st.receipt_number,
  st.date AS original_sale_date,
  st.returned_at,
  st.customer_name,
  st.store_id,
  st.cashier_name,
  st.return_reason,
  st.refund_method,
  st.refund_amount,
  st.restocked,
  st.items AS returned_items
FROM sale_transactions st
WHERE st.status = 'returned';

-- ==============================================================================
-- SUPABASE STORAGE BUCKET & ROW LEVEL SECURITY (RLS) POLICIES
-- Resolves: "new row violates row-level security policy" on storage uploads
-- ==============================================================================

-- 1. Ensure 'app-files' bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('app-files', 'app-files', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Storage Objects RLS Policies for 'app-files'
DROP POLICY IF EXISTS "Allow public select on app-files" ON storage.objects;
CREATE POLICY "Allow public select on app-files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'app-files');

DROP POLICY IF EXISTS "Allow public insert on app-files" ON storage.objects;
CREATE POLICY "Allow public insert on app-files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'app-files');

DROP POLICY IF EXISTS "Allow public update on app-files" ON storage.objects;
CREATE POLICY "Allow public update on app-files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'app-files')
  WITH CHECK (bucket_id = 'app-files');

DROP POLICY IF EXISTS "Allow public delete on app-files" ON storage.objects;
CREATE POLICY "Allow public delete on app-files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'app-files');

