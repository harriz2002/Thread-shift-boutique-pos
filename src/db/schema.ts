// src/db/schema.ts
import { pgTable, serial, text, integer, boolean, doublePrecision, timestamp, varchar } from 'drizzle-orm/pg-core';

// 1. Users Table (Admin & Employee Staff Directory)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID or internal ID
  email: text('email').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('employee'), // 'admin' | 'employee'
  pin: text('pin').default('1234'),
  assignedStoreId: text('assigned_store_id'),
  department: text('department').default('Sales Associate'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Stores Table (Store Locations)
export const stores = pgTable('stores', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  address: text('address'),
  phone: text('phone'),
  isFlagship: boolean('is_flagship').default(false),
  activeRegisterCount: integer('active_register_count').default(1),
});

// 3. Products Table (Apparel Catalog & Inventory)
export const products = pgTable('products', {
  id: varchar('id', { length: 50 }).primaryKey(),
  sku: text('sku').notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  brand: text('brand'),
  color: text('color'),
  size: text('size'),
  costPrice: doublePrecision('cost_price').notNull(),
  sellingPrice: doublePrecision('selling_price').notNull(),
  defaultSupplierId: text('default_supplier_id'),
  stockQuantity: integer('stock_quantity').default(0),
});

// 4. Customers Table (Loyalty & VIP Tiers)
export const customers = pgTable('customers', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  loyaltyPoints: integer('loyalty_points').default(0),
  totalSpent: doublePrecision('total_spent').default(0),
  vipTier: text('vip_tier').default('Bronze'),
  preferences: text('preferences'), // JSON string
});

// 5. Transactions Table (POS Receipts)
export const transactions = pgTable('transactions', {
  id: varchar('id', { length: 50 }).primaryKey(),
  receiptNumber: text('receipt_number').notNull(),
  timestamp: text('timestamp').notNull(),
  storeId: text('store_id').notNull(),
  cashierName: text('cashier_name'),
  customerId: text('customer_id'),
  customerName: text('customer_name'),
  subtotal: doublePrecision('subtotal').notNull(),
  discountAmount: doublePrecision('discount_amount').default(0),
  totalAmount: doublePrecision('total_amount').notNull(),
  paymentMethod: text('payment_method').notNull(),
  status: text('status').default('completed'),
  itemsJson: text('items_json'), // JSON string of items sold
});

// 6. Layaways Table (Installment Plans)
export const layaways = pgTable('layaways', {
  id: varchar('id', { length: 50 }).primaryKey(),
  planNumber: text('plan_number').notNull(),
  customerId: text('customer_id').notNull(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone'),
  totalAmount: doublePrecision('total_amount').notNull(),
  amountPaid: doublePrecision('amount_paid').default(0),
  balanceDue: doublePrecision('balance_due').notNull(),
  status: text('status').default('active'),
  createdDate: text('created_date'),
  dueDate: text('due_date'),
  itemsJson: text('items_json'),
});

// 7. Transfers Table (Multi-store stock movements)
export const transfers = pgTable('transfers', {
  id: varchar('id', { length: 50 }).primaryKey(),
  transferNumber: text('transfer_number').notNull(),
  fromStoreId: text('from_store_id').notNull(),
  toStoreId: text('to_store_id').notNull(),
  createdBy: text('created_by'),
  createdDate: text('created_date'),
  status: text('status').default('in-transit'),
  itemsJson: text('items_json'),
});

// 8. Purchase Orders Table (Supplier Reorders)
export const purchaseOrders = pgTable('purchase_orders', {
  id: varchar('id', { length: 50 }).primaryKey(),
  poNumber: text('po_number').notNull(),
  supplierName: text('supplier_name').notNull(),
  createdDate: text('created_date'),
  expectedDate: text('expected_date'),
  status: text('status').default('draft'),
  totalEstimatedCost: doublePrecision('total_estimated_cost').default(0),
  itemsJson: text('items_json'),
});
