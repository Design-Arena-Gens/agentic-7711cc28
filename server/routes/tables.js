const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all tables
router.get('/', async (req, res) => {
  try {
    const businessId = req.query.businessId || 1;
    const result = await db.query(
      'SELECT * FROM tables WHERE business_id = $1 ORDER BY table_number',
      [businessId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// Create table
router.post('/', async (req, res) => {
  try {
    const {
      businessId = 1,
      tableNumber,
      seats = 4,
      positionX = 0,
      positionY = 0,
      section,
    } = req.body;

    const result = await db.query(
      `INSERT INTO tables 
       (business_id, table_number, seats, position_x, position_y, section)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [businessId, tableNumber, seats, positionX, positionY, section]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating table:', error);
    res.status(500).json({ error: 'Failed to create table' });
  }
});

// Update table
router.put('/:id', async (req, res) => {
  try {
    const {
      tableNumber,
      seats,
      positionX,
      positionY,
      status,
      section,
    } = req.body;

    const result = await db.query(
      `UPDATE tables 
       SET table_number = $1, seats = $2, position_x = $3, position_y = $4, status = $5, section = $6
       WHERE id = $7
       RETURNING *`,
      [tableNumber, seats, positionX, positionY, status, section, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Table not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating table:', error);
    res.status(500).json({ error: 'Failed to update table' });
  }
});

// Delete table
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM tables WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Table not found' });
    }

    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(500).json({ error: 'Failed to delete table' });
  }
});

// Get table with current order
router.get('/:id/order', async (req, res) => {
  try {
    const orderResult = await db.query(
      `SELECT o.*, 
       (SELECT json_agg(oi.*) FROM order_items oi WHERE oi.order_id = o.id) as items
       FROM orders o
       WHERE o.table_id = $1 AND o.status NOT IN ('completed', 'cancelled')
       ORDER BY o.created_at DESC
       LIMIT 1`,
      [req.params.id]
    );

    if (orderResult.rows.length === 0) {
      return res.json(null);
    }

    res.json(orderResult.rows[0]);
  } catch (error) {
    console.error('Error fetching table order:', error);
    res.status(500).json({ error: 'Failed to fetch table order' });
  }
});

module.exports = router;
