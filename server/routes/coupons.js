const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all coupons
router.get('/', async (req, res) => {
  try {
    const businessId = req.query.businessId || 1;
    const result = await db.query(
      'SELECT * FROM coupons WHERE business_id = $1 ORDER BY created_at DESC',
      [businessId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// Validate coupon
router.post('/validate', async (req, res) => {
  try {
    const { code, orderAmount, businessId = 1 } = req.body;

    const result = await db.query(
      `SELECT * FROM coupons 
       WHERE business_id = $1 
       AND code = $2 
       AND active = true
       AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
       AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
       AND (usage_limit IS NULL OR used_count < usage_limit)`,
      [businessId, code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired coupon' });
    }

    const coupon = result.rows[0];

    if (orderAmount < coupon.min_order_amount) {
      return res.status(400).json({ 
        error: `Minimum order amount of ${coupon.min_order_amount} required` 
      });
    }

    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = (orderAmount * coupon.discount_value) / 100;
      if (coupon.max_discount && discountAmount > coupon.max_discount) {
        discountAmount = coupon.max_discount;
      }
    } else {
      discountAmount = coupon.discount_value;
    }

    res.json({
      valid: true,
      coupon: coupon,
      discountAmount: discountAmount,
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

// Create coupon
router.post('/', async (req, res) => {
  try {
    const {
      businessId = 1,
      code,
      name,
      discountType,
      discountValue,
      minOrderAmount = 0,
      maxDiscount,
      validFrom,
      validUntil,
      usageLimit,
    } = req.body;

    const result = await db.query(
      `INSERT INTO coupons 
       (business_id, code, name, discount_type, discount_value, min_order_amount, 
        max_discount, valid_from, valid_until, usage_limit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        businessId, code.toUpperCase(), name, discountType, discountValue,
        minOrderAmount, maxDiscount, validFrom, validUntil, usageLimit,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

// Use coupon (increment usage)
router.post('/:id/use', async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE coupons SET used_count = used_count + 1 WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error using coupon:', error);
    res.status(500).json({ error: 'Failed to use coupon' });
  }
});

module.exports = router;
