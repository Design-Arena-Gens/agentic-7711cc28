const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all categories
router.get('/', async (req, res) => {
  try {
    const businessId = req.query.businessId || 1;
    const result = await db.query(
      'SELECT * FROM categories WHERE business_id = $1 AND active = true ORDER BY sort_order, name',
      [businessId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create category
router.post('/', async (req, res) => {
  try {
    const { businessId = 1, name, description, imageUrl, sortOrder = 0 } = req.body;

    const result = await db.query(
      'INSERT INTO categories (business_id, name, description, image_url, sort_order) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [businessId, name, description, imageUrl, sortOrder]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
router.put('/:id', async (req, res) => {
  try {
    const { name, description, imageUrl, sortOrder, active } = req.body;

    const result = await db.query(
      'UPDATE categories SET name = $1, description = $2, image_url = $3, sort_order = $4, active = $5 WHERE id = $6 RETURNING *',
      [name, description, imageUrl, sortOrder, active, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM categories WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
