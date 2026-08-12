export interface SystemSettings {
  businessName: string;
  businessSubtitle: string;
  tagline: string;
  address: string;
  phone: string;
  logoUrl?: string;
  currencySymbol: string;
  currencyCode: string;
  defaultTaxRate: number;
  receiptHeader: string;
  receiptFooterMessage: string;
  receiptReturnPolicy: string;
  showReceiptBarcode: boolean;
  defaultSafetyThreshold: number;
  defaultSupplierName: string;
}

export type ClothingSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | string;

export type ProductCategory = 
  | 'Jackets & Outerwear'
  | 'Tops & Shirts'
  | 'Dresses & Skirts'
  | 'Pants & Denim'
  | 'Knitwear & Sweaters'
  | 'Footwear & Shoes'
  | 'Accessories & Bags'
  | string;

export interface StoreLocation {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  isWarehouse?: boolean;
  isCentral?: boolean;
}

export interface ProductVariant {
  id: string;
  sku: string;
  barcode: string;
  color: string;
  colorHex: string;
  size: ClothingSize;
  stockByStore: Record<string, number>; // storeId -> quantity
  reorderLevel: number;
  priceOverride?: number;
}

export interface MasterProduct {
  id: string;
  styleNumber: string; // e.g. "STY-2026-JKT01"
  title: string;
  category: ProductCategory;
  description: string;
  basePrice: number;
  costPrice: number;
  image: string;
  fabricContent: string; // e.g., "100% Organic Linen" or "98% Cotton 2% Elastane"
  careInstructions: string;
  variants: ProductVariant[];
  tags: string[];
  createdAt: string;
}

export interface CartItem {
  cartItemId: string;
  product: MasterProduct;
  variant: ProductVariant;
  quantity: number;
  storeId: string;
  unitPrice: number;
  discountAmount: number; // item-level discount in currency
}

export type PaymentMethod = 'cash' | 'card' | 'mpesa' | 'store_credit' | 'split';

export interface PaymentDetail {
  method: PaymentMethod;
  amount: number;
  tenderedAmount?: number;
  changeAmount?: number;
  referenceNumber?: string;
  phoneNumber?: string;
  timestamp: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  loyaltyPoints: number;
  storeCredit: number;
  tier: 'Silver' | 'Gold' | 'Platinum';
  sizePreferences: {
    topSize: ClothingSize;
    bottomSize: ClothingSize;
    favoriteColors: string[];
  };
  notes?: string;
  totalSpent: number;
  totalOrders: number;
  createdAt: string;
}

export interface LayawayPayment {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  cashierName: string;
}

export interface LayawayPlan {
  id: string;
  planNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  storeId: string;
  cartItems: CartItem[];
  totalAmount: number;
  depositPaid: number;
  balanceDue: number;
  startDate: string;
  dueDate: string;
  status: 'active' | 'completed' | 'cancelled' | 'overdue';
  paymentsHistory: LayawayPayment[];
  notes?: string;
}

export interface HoldCart {
  id: string;
  holdCode: string;
  storeId: string;
  customerName: string;
  customerPhone?: string;
  note?: string;
  cartItems: CartItem[];
  totalAmount: number;
  holdDate: string;
  expiresAt: string;
}

export interface SaleTransaction {
  id: string;
  receiptNumber: string;
  sequentialNumber?: number | string;
  registerId?: string;
  date: string;
  storeId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payments: PaymentDetail[];
  tenderedAmount?: number;
  changeAmount?: number;
  loyaltyPointsEarned: number;
  pointsRedeemed: number;
  status: 'completed' | 'returned' | 'exchanged';
  signatureValue?: string;
  chainingValue?: string;
  returnReason?: string;
  refundMethod?: PaymentMethod;
  refundAmount?: number;
  returnedAt?: string;
  restocked?: boolean;
  returnedVariantIds?: string[];
  returnedItems?: { variantId: string; quantity: number; refundAmount: number }[];
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  date: string;
  fromStoreId: string;
  toStoreId: string;
  items: {
    productId: string;
    variantId: string;
    productTitle: string;
    styleNumber: string;
    color: string;
    size: ClothingSize;
    quantity: number;
  }[];
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  initiatedBy: string;
}

export interface ReorderPO {
  id: string;
  poNumber: string;
  supplierName: string;
  dateCreated: string;
  targetStoreId: string;
  items: {
    productId: string;
    variantId: string;
    productTitle: string;
    color: string;
    size: ClothingSize;
    suggestedQuantity: number;
    estimatedCost: number;
  }[];
  status: 'draft' | 'submitted' | 'received';
  totalEstimatedCost: number;
}

export type UserRole = 'admin' | 'employee';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  pin?: string;
  assignedStoreId?: string;
  department?: string;
  createdAt: string;
  isActive: boolean;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  storeId: string;
  createdAt: string;
}

export type SpecialOrderStatus = 'pending' | 'ordered' | 'arrived' | 'completed' | 'cancelled';

export interface CustomerSpecialOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  itemName: string;
  itemDescription?: string; // size, color, design specifics
  quantity: number;
  quotedPrice?: number;
  depositAmount?: number;
  notes?: string;
  status: SpecialOrderStatus;
  storeId: string;
  createdBy: string; // Employee/User ID or Name
  createdAt: string;
  estimatedArrivalDate?: string;
}

