const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all products
router.get('/', async (req, res) => {
  try {
    const businessId = req.query.businessId || 1;
    const result = await db.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.business_id = $1 
       ORDER BY p.name`,
      [businessId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM products WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product
router.post('/', async (req, res) => {
  try {
    const {
      businessId = 1,
      categoryId,
      name,
      description,
      sku,
      barcode,
      price,
      cost,
      taxRate = 0,
      stockQuantity = 0,
      lowStockThreshold = 10,
      imageUrl,
      variants = [],
      addons = [],
      isAvailable = true,
      trackInventory = true,
    } = req.body;

    const result = await db.query(
      `INSERT INTO products 
       (business_id, category_id, name, description, sku, barcode, price, cost, 
        tax_rate, stock_quantity, low_stock_threshold, image_url, variants, addons, 
        is_available, track_inventory)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        businessId, categoryId, name, description, sku, barcode, price, cost,
        taxRate, stockQuantity, lowStockThreshold, imageUrl,
        JSON.stringify(variants), JSON.stringify(addons),
        isAvailable, trackInventory,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const {
      categoryId,
      name,
      description,
      sku,
      barcode,
      price,
      cost,
      taxRate,
      stockQuantity,
      lowStockThreshold,
      imageUrl,
      variants,
      addons,
      isAvailable,
      trackInventory,
    } = req.body;

    const result = await db.query(
      `UPDATE products 
       SET category_id = $1, name = $2, description = $3, sku = $4, barcode = $5,
           price = $6, cost = $7, tax_rate = $8, stock_quantity = $9,
           low_stock_threshold = $10, image_url = $11, variants = $12, addons = $13,
           is_available = $14, track_inventory = $15, updated_at = CURRENT_TIMESTAMP
       WHERE id = $16
       RETURNING *`,
      [
        categoryId, name, description, sku, barcode, price, cost, taxRate,
        stockQuantity, lowStockThreshold, imageUrl,
        JSON.stringify(variants), JSON.stringify(addons),
        isAvailable, trackInventory, req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM products WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get low stock products
router.get('/alerts/low-stock', async (req, res) => {
  try {
    const businessId = req.query.businessId || 1;
    const result = await db.query(
      `SELECT * FROM products 
       WHERE business_id = $1 
       AND track_inventory = true 
       AND stock_quantity <= low_stock_threshold
       ORDER BY stock_quantity ASC`,
      [businessId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching low stock:', error);
    res.status(500).json({ error: 'Failed to fetch low stock products' });
  }
});

module.exports = router;
