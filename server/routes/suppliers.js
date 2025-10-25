const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all suppliers
router.get('/', async (req, res) => {
  try {
    const businessId = req.query.businessId || 1;
    const result = await db.query(
      'SELECT * FROM suppliers WHERE business_id = $1 ORDER BY name',
      [businessId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// Create supplier
router.post('/', async (req, res) => {
  try {
    const {
      businessId = 1,
      name,
      contactPerson,
      email,
      phone,
      address,
      taxId,
      notes,
    } = req.body;

    const result = await db.query(
      `INSERT INTO suppliers 
       (business_id, name, contact_person, email, phone, address, tax_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [businessId, name, contactPerson, email, phone, address, taxId, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

// Update supplier
router.put('/:id', async (req, res) => {
  try {
    const { name, contactPerson, email, phone, address, taxId, notes } = req.body;

    const result = await db.query(
      `UPDATE suppliers 
       SET name = $1, contact_person = $2, email = $3, phone = $4, address = $5, tax_id = $6, notes = $7
       WHERE id = $8
       RETURNING *`,
      [name, contactPerson, email, phone, address, taxId, notes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

// Delete supplier
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM suppliers WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

module.exports = router;
