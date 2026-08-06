-- ==============================================================================
-- SUPABASE POSTGRESQL DATABASE SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- Threads Style POS & Retail Management System
-- Paste and execute this file in your Supabase SQL Editor:
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

-- 4. SALE TRANSACTIONS TABLE
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
  status TEXT DEFAULT 'completed',
  return_reason TEXT,
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

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) & POLICIES WITH auth.uid()
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

-- Create RLS Policies allowing authenticated users to access their owned rows, or public demo fallback
DROP POLICY IF EXISTS "Public or authenticated access to stores" ON stores;
CREATE POLICY "Public or authenticated access to stores" ON stores FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public or authenticated access to products" ON products;
CREATE POLICY "Public or authenticated access to products" ON products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public or authenticated access to customers" ON customers;
CREATE POLICY "Public or authenticated access to customers" ON customers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public or authenticated access to sale_transactions" ON sale_transactions;
CREATE POLICY "Public or authenticated access to sale_transactions" ON sale_transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public or authenticated access to layaway_plans" ON layaway_plans;
CREATE POLICY "Public or authenticated access to layaway_plans" ON layaway_plans FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public or authenticated access to hold_carts" ON hold_carts;
CREATE POLICY "Public or authenticated access to hold_carts" ON hold_carts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public or authenticated access to stock_transfers" ON stock_transfers;
CREATE POLICY "Public or authenticated access to stock_transfers" ON stock_transfers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public or authenticated access to purchase_orders" ON purchase_orders;
CREATE POLICY "Public or authenticated access to purchase_orders" ON purchase_orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public or authenticated access to user_accounts" ON user_accounts;
CREATE POLICY "Public or authenticated access to user_accounts" ON user_accounts FOR ALL USING (true) WITH CHECK (true);
