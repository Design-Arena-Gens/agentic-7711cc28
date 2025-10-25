const express = require('express');
const router = express.Router();
const db = require('../db');

// Get payments for an order
router.get('/order/:orderId', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at',
      [req.params.orderId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Create payment
router.post('/', async (req, res) => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');

    const {
      orderId,
      paymentMethod,
      amount,
      transactionId,
      notes,
      createdBy = 1,
    } = req.body;

    // Create payment
    const paymentResult = await client.query(
      `INSERT INTO payments 
       (order_id, payment_method, amount, transaction_id, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [orderId, paymentMethod, amount, transactionId, notes, createdBy]
    );

    // Check if order is fully paid
    const paymentsResult = await client.query(
      'SELECT SUM(amount) as total_paid FROM payments WHERE order_id = $1',
      [orderId]
    );

    const orderResult = await client.query(
      'SELECT total_amount FROM orders WHERE id = $1',
      [orderId]
    );

    const totalPaid = parseFloat(paymentsResult.rows[0].total_paid || 0);
    const totalAmount = parseFloat(orderResult.rows[0].total_amount);

    if (totalPaid >= totalAmount) {
      await client.query(
        "UPDATE orders SET payment_status = 'paid' WHERE id = $1",
        [orderId]
      );
    } else {
      await client.query(
        "UPDATE orders SET payment_status = 'partial' WHERE id = $1",
        [orderId]
      );
    }

    await client.query('COMMIT');

    res.status(201).json(paymentResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  } finally {
    client.release();
  }
});

module.exports = router;
