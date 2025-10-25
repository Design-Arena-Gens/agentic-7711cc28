const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

// Get all orders
router.get('/', async (req, res) => {
  try {
    const businessId = req.query.businessId || 1;
    const status = req.query.status;
    const limit = parseInt(req.query.limit) || 50;

    let query = `
      SELECT o.*, t.table_number, u.name as created_by_name
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN users u ON o.created_by = u.id
      WHERE o.business_id = $1
    `;
    const params = [businessId];

    if (status) {
      query += ' AND o.status = $2';
      params.push(status);
    }

    query += ' ORDER BY o.created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get order by ID with items
router.get('/:id', async (req, res) => {
  try {
    const orderResult = await db.query(
      'SELECT * FROM orders WHERE id = $1',
      [req.params.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const itemsResult = await db.query(
      'SELECT * FROM order_items WHERE order_id = $1 ORDER BY id',
      [req.params.id]
    );

    const paymentsResult = await db.query(
      'SELECT * FROM payments WHERE order_id = $1',
      [req.params.id]
    );

    res.json({
      ...orderResult.rows[0],
      items: itemsResult.rows,
      payments: paymentsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Create order
router.post('/', async (req, res) => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');

    const {
      businessId = 1,
      tableId,
      orderType = 'dine-in',
      customerName,
      customerPhone,
      items,
      subtotal,
      taxAmount = 0,
      discountAmount = 0,
      totalAmount,
      notes,
      createdBy = 1,
    } = req.body;

    const orderNumber = 'ORD-' + Date.now();

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders 
       (business_id, order_number, table_id, order_type, customer_name, customer_phone,
        subtotal, tax_amount, discount_amount, total_amount, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        businessId, orderNumber, tableId, orderType, customerName, customerPhone,
        subtotal, taxAmount, discountAmount, totalAmount, notes, createdBy,
      ]
    );

    const order = orderResult.rows[0];

    // Create order items
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items 
         (order_id, product_id, product_name, quantity, unit_price, tax_rate, discount, total, variant_info, addons, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          order.id,
          item.productId,
          item.productName,
          item.quantity,
          item.unitPrice,
          item.taxRate || 0,
          item.discount || 0,
          item.total,
          JSON.stringify(item.variantInfo || {}),
          JSON.stringify(item.addons || []),
          item.notes,
        ]
      );

      // Update product stock
      if (item.trackInventory) {
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
          [item.quantity, item.productId]
        );
      }
    }

    // Update table status if applicable
    if (tableId) {
      await client.query(
        "UPDATE tables SET status = 'occupied' WHERE id = $1",
        [tableId]
      );
    }

    await client.query('COMMIT');

    // Fetch complete order with items
    const itemsResult = await db.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [order.id]
    );

    res.status(201).json({
      ...order,
      items: itemsResult.rows,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    const result = await db.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Update order item status
router.patch('/:orderId/items/:itemId/status', async (req, res) => {
  try {
    const { status } = req.body;

    const result = await db.query(
      'UPDATE order_items SET status = $1 WHERE id = $2 AND order_id = $3 RETURNING *',
      [status, req.params.itemId, req.params.orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order item not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating order item status:', error);
    res.status(500).json({ error: 'Failed to update order item status' });
  }
});

// Complete order
router.post('/:id/complete', async (req, res) => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');

    // Update order
    const orderResult = await client.query(
      `UPDATE orders 
       SET status = 'completed', payment_status = 'paid', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 
       RETURNING *`,
      [req.params.id]
    );

    if (orderResult.rows.length === 0) {
      throw new Error('Order not found');
    }

    const order = orderResult.rows[0];

    // Free up table
    if (order.table_id) {
      await client.query(
        "UPDATE tables SET status = 'available' WHERE id = $1",
        [order.table_id]
      );
    }

    await client.query('COMMIT');

    res.json(order);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error completing order:', error);
    res.status(500).json({ error: 'Failed to complete order' });
  } finally {
    client.release();
  }
});

module.exports = router;
