const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all customers
router.get('/', async (req, res) => {
  try {
    const businessId = req.query.businessId || 1;
    const result = await db.query(
      'SELECT * FROM customers WHERE business_id = $1 ORDER BY name',
      [businessId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get customer by phone
router.get('/phone/:phone', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM customers WHERE phone = $1',
      [req.params.phone]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Create customer
router.post('/', async (req, res) => {
  try {
    const {
      businessId = 1,
      name,
      email,
      phone,
      address,
    } = req.body;

    const result = await db.query(
      `INSERT INTO customers 
       (business_id, name, email, phone, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [businessId, name, email, phone, address]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    const result = await db.query(
      'UPDATE customers SET name = $1, email = $2, phone = $3, address = $4 WHERE id = $5 RETURNING *',
      [name, email, phone, address, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Add loyalty points
router.post('/:id/points', async (req, res) => {
  try {
    const { points } = req.body;

    const result = await db.query(
      'UPDATE customers SET loyalty_points = loyalty_points + $1 WHERE id = $2 RETURNING *',
      [points, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error adding points:', error);
    res.status(500).json({ error: 'Failed to add points' });
  }
});

module.exports = router;
