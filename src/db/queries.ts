// src/db/queries.ts
import { createPool } from './index.ts';
import { initDatabaseTables } from './init.ts';

export async function fetchAllDatabaseState(): Promise<any> {
  const pool = createPool();
  await initDatabaseTables();
  const client = await pool.connect();
  try {
    const [
      storesRes,
      productsRes,
      usersRes,
      customersRes,
      txRes,
      layawaysRes,
      transfersRes,
      poRes
    ] = await Promise.all([
      client.query('SELECT * FROM stores'),
      client.query('SELECT * FROM products'),
      client.query('SELECT * FROM users'),
      client.query('SELECT * FROM customers'),
      client.query('SELECT * FROM transactions'),
      client.query('SELECT * FROM layaways'),
      client.query('SELECT * FROM transfers'),
      client.query('SELECT * FROM purchase_orders'),
    ]);

    const stores = storesRes.rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      address: r.address || '',
      phone: r.phone || '',
      isFlagship: r.is_flagship,
      activeRegisterCount: r.active_register_count || 1,
    }));

    const products = productsRes.rows.map((r: any) => ({
      id: r.id,
      sku: r.sku,
      name: r.name,
      category: r.category,
      brand: r.brand || '',
      color: r.color || '',
      size: r.size || '',
      costPrice: Number(r.cost_price || 0),
      sellingPrice: Number(r.selling_price || 0),
      defaultSupplierId: r.default_supplier_id || '',
      stockQuantity: Number(r.stock_quantity || 0),
    }));

    const users = usersRes.rows.map((r: any) => ({
      id: String(r.id),
      uid: r.uid || String(r.id),
      email: r.email,
      name: r.name,
      role: r.role || 'employee',
      pin: r.pin || '1234',
      assignedStoreId: r.assigned_store_id || '',
      department: r.department || 'Sales Associate',
      isActive: r.is_active,
      createdAt: r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : '2026-01-01',
    }));

    const customers = customersRes.rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      phone: r.phone || '',
      email: r.email || '',
      loyaltyPoints: Number(r.loyalty_points || 0),
      totalSpent: Number(r.total_spent || 0),
      vipTier: r.vip_tier || 'Bronze',
      preferences: r.preferences ? JSON.parse(r.preferences) : undefined,
    }));

    const transactions = txRes.rows.map((r: any) => ({
      id: r.id,
      receiptNumber: r.receipt_number,
      timestamp: r.timestamp,
      storeId: r.store_id,
      cashierName: r.cashier_name || '',
      customerId: r.customer_id || '',
      customerName: r.customer_name || '',
      subtotal: Number(r.subtotal || 0),
      discountAmount: Number(r.discount_amount || 0),
      totalAmount: Number(r.total_amount || 0),
      paymentMethod: r.payment_method,
      status: r.status || 'completed',
      items: r.items_json ? JSON.parse(r.items_json) : [],
    }));

    const layaways = layawaysRes.rows.map((r: any) => ({
      id: r.id,
      planNumber: r.plan_number,
      customerId: r.customer_id,
      customerName: r.customer_name,
      customerPhone: r.customer_phone || '',
      totalAmount: Number(r.total_amount || 0),
      amountPaid: Number(r.amount_paid || 0),
      balanceDue: Number(r.balance_due || 0),
      status: r.status || 'active',
      createdDate: r.created_date || '',
      dueDate: r.due_date || '',
      items: r.items_json ? JSON.parse(r.items_json) : [],
    }));

    const transfers = transfersRes.rows.map((r: any) => ({
      id: r.id,
      transferNumber: r.transfer_number,
      fromStoreId: r.from_store_id,
      toStoreId: r.to_store_id,
      createdBy: r.created_by || '',
      createdDate: r.created_date || '',
      status: r.status || 'in-transit',
      items: r.items_json ? JSON.parse(r.items_json) : [],
    }));

    const purchaseOrders = poRes.rows.map((r: any) => ({
      id: r.id,
      poNumber: r.po_number,
      supplierName: r.supplier_name,
      createdDate: r.created_date || '',
      expectedDate: r.expected_date || '',
      status: r.status || 'draft',
      totalEstimatedCost: Number(r.total_estimated_cost || 0),
      items: r.items_json ? JSON.parse(r.items_json) : [],
    }));

    return {
      stores,
      products,
      users,
      customers,
      transactions,
      layaways,
      transfers,
      purchaseOrders,
    };
  } catch (error) {
    console.error('Database query failed in fetchAllDatabaseState:', error);
    throw new Error('Database query failed while fetching state.', { cause: error });
  } finally {
    client.release();
  }
}

export async function upsertDocumentSQL(collectionName: string, item: any): Promise<void> {
  const pool = createPool();
  const client = await pool.connect();
  try {
    switch (collectionName) {
      case 'stores': {
        await client.query(
          `INSERT INTO stores (id, name, code, address, phone, is_flagship, active_register_count)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             code = EXCLUDED.code,
             address = EXCLUDED.address,
             phone = EXCLUDED.phone,
             is_flagship = EXCLUDED.is_flagship,
             active_register_count = EXCLUDED.active_register_count`,
          [
            item.id,
            item.name || 'Store Branch',
            item.code || 'STR',
            item.address || '',
            item.phone || '',
            item.isFlagship || false,
            item.activeRegisterCount || 1,
          ]
        );
        break;
      }
      case 'products': {
        await client.query(
          `INSERT INTO products (id, sku, name, category, brand, color, size, cost_price, selling_price, default_supplier_id, stock_quantity)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET
             sku = EXCLUDED.sku,
             name = EXCLUDED.name,
             category = EXCLUDED.category,
             brand = EXCLUDED.brand,
             color = EXCLUDED.color,
             size = EXCLUDED.size,
             cost_price = EXCLUDED.cost_price,
             selling_price = EXCLUDED.selling_price,
             default_supplier_id = EXCLUDED.default_supplier_id,
             stock_quantity = EXCLUDED.stock_quantity`,
          [
            item.id,
            item.sku || item.styleCode || item.id || 'SKU-000',
            item.name || item.title || 'Apparel Garment',
            item.category || 'Apparel',
            item.brand || '',
            item.color || (item.variants && item.variants[0]?.color) || '',
            item.size || (item.variants && item.variants[0]?.size) || '',
            item.costPrice || item.basePrice || (item.variants && item.variants[0]?.costPrice) || 0,
            item.sellingPrice || item.basePrice || (item.variants && item.variants[0]?.sellingPrice) || 0,
            item.defaultSupplierId || (item.variants && item.variants[0]?.supplierName) || '',
            item.stockQuantity || (item.variants ? item.variants.reduce((acc: number, v: any) => acc + (Object.values(v.stockByStore || {}) as number[]).reduce((a: number, b: number) => a + Number(b), 0), 0) : 0),
          ]
        );
        break;
      }
      case 'users': {
        await client.query(
          `INSERT INTO users (uid, email, name, role, pin, assigned_store_id, department, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (uid) DO UPDATE SET
             email = EXCLUDED.email,
             name = EXCLUDED.name,
             role = EXCLUDED.role,
             pin = EXCLUDED.pin,
             assigned_store_id = EXCLUDED.assigned_store_id,
             department = EXCLUDED.department,
             is_active = EXCLUDED.is_active`,
          [
            String(item.id || item.uid || 'USER-000'),
            item.email || 'user@threadsstyle.com',
            item.name || 'Staff User',
            item.role || 'employee',
            item.pin || '1234',
            item.assignedStoreId || '',
            item.department || 'Sales Associate',
            item.isActive !== undefined ? item.isActive : true,
          ]
        );
        break;
      }
      case 'customers': {
        await client.query(
          `INSERT INTO customers (id, name, phone, email, loyalty_points, total_spent, vip_tier, preferences)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             phone = EXCLUDED.phone,
             email = EXCLUDED.email,
             loyalty_points = EXCLUDED.loyalty_points,
             total_spent = EXCLUDED.total_spent,
             vip_tier = EXCLUDED.vip_tier,
             preferences = EXCLUDED.preferences`,
          [
            item.id,
            item.name || 'Customer',
            item.phone || '',
            item.email || '',
            item.loyaltyPoints || 0,
            item.totalSpent || 0,
            item.vipTier || 'Bronze',
            item.preferences ? JSON.stringify(item.preferences) : null,
          ]
        );
        break;
      }
      case 'transactions': {
        const txTimestamp = item.timestamp
          ? (typeof item.timestamp === 'string' ? item.timestamp : new Date(item.timestamp).toISOString())
          : (item.date || new Date().toISOString());

        await client.query(
          `INSERT INTO transactions (id, receipt_number, timestamp, store_id, cashier_name, customer_id, customer_name, subtotal, discount_amount, total_amount, payment_method, status, items_json)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (id) DO UPDATE SET
             receipt_number = EXCLUDED.receipt_number,
             timestamp = EXCLUDED.timestamp,
             store_id = EXCLUDED.store_id,
             cashier_name = EXCLUDED.cashier_name,
             customer_id = EXCLUDED.customer_id,
             customer_name = EXCLUDED.customer_name,
             subtotal = EXCLUDED.subtotal,
             discount_amount = EXCLUDED.discount_amount,
             total_amount = EXCLUDED.total_amount,
             payment_method = EXCLUDED.payment_method,
             status = EXCLUDED.status,
             items_json = EXCLUDED.items_json`,
          [
            item.id,
            item.receiptNumber || item.receiptNo || (item.id ? `REC-${item.id}` : 'REC-000'),
            txTimestamp,
            item.storeId || item.store_id || 'STORE-01',
            item.cashierName || '',
            item.customerId || '',
            item.customerName || '',
            item.subtotal || 0,
            item.discountAmount || 0,
            item.totalAmount || 0,
            item.paymentMethod || 'cash',
            item.status || 'completed',
            JSON.stringify(item.items || []),
          ]
        );
        break;
      }
      case 'layaways': {
        await client.query(
          `INSERT INTO layaways (id, plan_number, customer_id, customer_name, customer_phone, total_amount, amount_paid, balance_due, status, created_date, due_date, items_json)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id) DO UPDATE SET
             amount_paid = EXCLUDED.amount_paid,
             balance_due = EXCLUDED.balance_due,
             status = EXCLUDED.status,
             items_json = EXCLUDED.items_json`,
          [
            item.id,
            item.planNumber || item.id || 'LAY-000',
            item.customerId || 'CUST-000',
            item.customerName || 'Customer',
            item.customerPhone || '',
            item.totalAmount || 0,
            item.amountPaid || 0,
            item.balanceDue || 0,
            item.status || 'active',
            item.createdDate || '',
            item.dueDate || '',
            JSON.stringify(item.items || []),
          ]
        );
        break;
      }
      case 'transfers': {
        await client.query(
          `INSERT INTO transfers (id, transfer_number, from_store_id, to_store_id, created_by, created_date, status, items_json)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET
             status = EXCLUDED.status,
             items_json = EXCLUDED.items_json`,
          [
            item.id,
            item.transferNumber || item.id || 'TRF-000',
            item.fromStoreId || 'STORE-01',
            item.toStoreId || 'STORE-02',
            item.createdBy || '',
            item.createdDate || '',
            item.status || 'in-transit',
            JSON.stringify(item.items || []),
          ]
        );
        break;
      }
      case 'purchase_orders': {
        await client.query(
          `INSERT INTO purchase_orders (id, po_number, supplier_name, created_date, expected_date, status, total_estimated_cost, items_json)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET
             status = EXCLUDED.status,
             items_json = EXCLUDED.items_json`,
          [
            item.id,
            item.poNumber || item.id || 'PO-000',
            item.supplierName || 'Supplier',
            item.createdDate || '',
            item.expectedDate || '',
            item.status || 'draft',
            item.totalEstimatedCost || 0,
            JSON.stringify(item.items || []),
          ]
        );
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error(`Database upsert failed for table ${collectionName}:`, error);
    throw new Error(`Database upsert failed for ${collectionName}.`, { cause: error });
  } finally {
    client.release();
  }
}
