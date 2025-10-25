const express = require('express');
const router = express.Router();
const db = require('../db');

// Get inventory batches for a product
router.get('/product/:productId/batches', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM inventory_batches WHERE product_id = $1 ORDER BY expiry_date',
      [req.params.productId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

// Get expiring products
router.get('/expiring', async (req, res) => {
  try {
    const businessId = req.query.businessId || 1;
    const days = parseInt(req.query.days) || 30;

    const result = await db.query(
      `SELECT p.name, p.sku, ib.* 
       FROM inventory_batches ib
       JOIN products p ON ib.product_id = p.id
       WHERE p.business_id = $1
       AND ib.expiry_date <= CURRENT_DATE + INTERVAL '${days} days'
       AND ib.expiry_date >= CURRENT_DATE
       ORDER BY ib.expiry_date`,
      [businessId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching expiring products:', error);
    res.status(500).json({ error: 'Failed to fetch expiring products' });
  }
});

// Add inventory batch
router.post('/batch', async (req, res) => {
  try {
    const {
      productId,
      batchNumber,
      quantity,
      costPerUnit,
      manufactureDate,
      expiryDate,
      supplierId,
    } = req.body;

    const result = await db.query(
      `INSERT INTO inventory_batches 
       (product_id, batch_number, quantity, cost_per_unit, manufacture_date, expiry_date, supplier_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [productId, batchNumber, quantity, costPerUnit, manufactureDate, expiryDate, supplierId]
    );

    // Update product stock
    await db.query(
      'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
      [quantity, productId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding batch:', error);
    res.status(500).json({ error: 'Failed to add batch' });
  }
});

// Adjust stock
router.post('/adjust', async (req, res) => {
  try {
    const { productId, quantity, reason } = req.body;

    const result = await db.query(
      'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2 RETURNING *',
      [quantity, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error adjusting stock:', error);
    res.status(500).json({ error: 'Failed to adjust stock' });
  }
});

module.exports = router;
