const express = require('express');
const router = express.Router();
const db = require('../db');

// Get dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const businessId = req.query.businessId || 1;
    const period = req.query.period || 'today'; // today, week, month, year

    let dateCondition = '';
    switch (period) {
      case 'today':
        dateCondition = "DATE(created_at) = CURRENT_DATE";
        break;
      case 'week':
        dateCondition = "created_at >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        dateCondition = "created_at >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      case 'year':
        dateCondition = "created_at >= CURRENT_DATE - INTERVAL '365 days'";
        break;
    }

    // Total sales
    const salesResult = await db.query(
      `SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as avg_order_value,
        COALESCE(SUM(tax_amount), 0) as total_tax,
        COALESCE(SUM(discount_amount), 0) as total_discount
       FROM orders 
       WHERE business_id = $1 
       AND status = 'completed'
       AND ${dateCondition}`,
      [businessId]
    );

    // Payment method breakdown
    const paymentResult = await db.query(
      `SELECT 
        p.payment_method,
        COUNT(*) as count,
        COALESCE(SUM(p.amount), 0) as total
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       WHERE o.business_id = $1 
       AND o.status = 'completed'
       AND ${dateCondition.replace('created_at', 'o.created_at')}
       GROUP BY p.payment_method`,
      [businessId]
    );

    // Top selling products
    const topProductsResult = await db.query(
      `SELECT 
        oi.product_name,
        SUM(oi.quantity) as quantity_sold,
        COALESCE(SUM(oi.total), 0) as revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.business_id = $1 
       AND o.status = 'completed'
       AND ${dateCondition.replace('created_at', 'o.created_at')}
       GROUP BY oi.product_name
       ORDER BY quantity_sold DESC
       LIMIT 10`,
      [businessId]
    );

    // Order type breakdown
    const orderTypeResult = await db.query(
      `SELECT 
        order_type,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as revenue
       FROM orders
       WHERE business_id = $1 
       AND status = 'completed'
       AND ${dateCondition}
       GROUP BY order_type`,
      [businessId]
    );

    // Hourly sales (for today)
    const hourlySalesResult = await db.query(
      `SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as orders,
        COALESCE(SUM(total_amount), 0) as revenue
       FROM orders
       WHERE business_id = $1 
       AND status = 'completed'
       AND DATE(created_at) = CURRENT_DATE
       GROUP BY hour
       ORDER BY hour`,
      [businessId]
    );

    res.json({
      summary: salesResult.rows[0],
      paymentMethods: paymentResult.rows,
      topProducts: topProductsResult.rows,
      orderTypes: orderTypeResult.rows,
      hourlySales: hourlySalesResult.rows,
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get sales trend
router.get('/sales-trend', async (req, res) => {
  try {
    const businessId = req.query.businessId || 1;
    const days = parseInt(req.query.days) || 30;

    const result = await db.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        COALESCE(SUM(total_amount), 0) as revenue,
        COALESCE(AVG(total_amount), 0) as avg_order_value
       FROM orders
       WHERE business_id = $1 
       AND status = 'completed'
       AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [businessId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sales trend:', error);
    res.status(500).json({ error: 'Failed to fetch sales trend' });
  }
});

// Get category performance
router.get('/category-performance', async (req, res) => {
  try {
    const businessId = req.query.businessId || 1;
    const days = parseInt(req.query.days) || 30;

    const result = await db.query(
      `SELECT 
        c.name as category,
        COUNT(oi.id) as items_sold,
        COALESCE(SUM(oi.total), 0) as revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN products p ON oi.product_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE o.business_id = $1 
       AND o.status = 'completed'
       AND o.created_at >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY c.name
       ORDER BY revenue DESC`,
      [businessId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching category performance:', error);
    res.status(500).json({ error: 'Failed to fetch category performance' });
  }
});

// AI Insights - Demand forecasting
router.get('/ai/forecast', async (req, res) => {
  try {
    const businessId = req.query.businessId || 1;

    // Get historical data for last 30 days
    const historicalResult = await db.query(
      `SELECT 
        DATE(o.created_at) as date,
        EXTRACT(DOW FROM o.created_at) as day_of_week,
        oi.product_id,
        p.name as product_name,
        SUM(oi.quantity) as quantity_sold,
        COALESCE(SUM(oi.total), 0) as revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN products p ON oi.product_id = p.id
       WHERE o.business_id = $1 
       AND o.status = 'completed'
       AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY DATE(o.created_at), day_of_week, oi.product_id, p.name
       ORDER BY date, quantity_sold DESC`,
      [businessId]
    );

    // Simple forecasting: calculate average by day of week
    const forecastData = {};
    const productStats = {};

    historicalResult.rows.forEach(row => {
      const productKey = row.product_id;
      const dow = row.day_of_week;

      if (!productStats[productKey]) {
        productStats[productKey] = {
          productId: row.product_id,
          productName: row.product_name,
          byDayOfWeek: {},
          totalSold: 0,
          avgDailySales: 0,
          trend: 'stable',
        };
      }

      if (!productStats[productKey].byDayOfWeek[dow]) {
        productStats[productKey].byDayOfWeek[dow] = {
          totalSold: 0,
          count: 0,
        };
      }

      productStats[productKey].byDayOfWeek[dow].totalSold += row.quantity_sold;
      productStats[productKey].byDayOfWeek[dow].count += 1;
      productStats[productKey].totalSold += row.quantity_sold;
    });

    // Calculate forecasts
    const forecasts = Object.values(productStats).map(product => {
      const days = Object.keys(product.byDayOfWeek).length;
      product.avgDailySales = days > 0 ? product.totalSold / days : 0;

      // Forecast for next 7 days
      const nextWeekForecast = [];
      const today = new Date();
      
      for (let i = 1; i <= 7; i++) {
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + i);
        const futureDow = futureDate.getDay();

        const dowData = product.byDayOfWeek[futureDow];
        const forecastQty = dowData 
          ? Math.round(dowData.totalSold / dowData.count)
          : Math.round(product.avgDailySales);

        nextWeekForecast.push({
          date: futureDate.toISOString().split('T')[0],
          forecastQuantity: forecastQty,
        });
      }

      return {
        productId: product.productId,
        productName: product.productName,
        avgDailySales: Math.round(product.avgDailySales * 100) / 100,
        nextWeekForecast: nextWeekForecast,
        recommendedRestock: Math.ceil(product.avgDailySales * 7 * 1.2), // 20% buffer
      };
    });

    res.json(forecasts);
  } catch (error) {
    console.error('Error generating forecast:', error);
    res.status(500).json({ error: 'Failed to generate forecast' });
  }
});

// AI Insights - Peak hours
router.get('/ai/peak-hours', async (req, res) => {
  try {
    const businessId = req.query.businessId || 1;

    const result = await db.query(
      `SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        EXTRACT(DOW FROM created_at) as day_of_week,
        COUNT(*) as order_count,
        COALESCE(AVG(total_amount), 0) as avg_order_value
       FROM orders
       WHERE business_id = $1 
       AND status = 'completed'
       AND created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY hour, day_of_week
       ORDER BY order_count DESC`,
      [businessId]
    );

    // Group by hour and find peaks
    const hourlyData = {};
    result.rows.forEach(row => {
      const hour = row.hour;
      if (!hourlyData[hour]) {
        hourlyData[hour] = {
          hour: hour,
          totalOrders: 0,
          avgOrders: 0,
          avgValue: 0,
          count: 0,
        };
      }
      hourlyData[hour].totalOrders += parseInt(row.order_count);
      hourlyData[hour].avgValue += parseFloat(row.avg_order_value);
      hourlyData[hour].count += 1;
    });

    const peakHours = Object.values(hourlyData)
      .map(h => ({
        hour: h.hour,
        avgOrders: Math.round(h.totalOrders / h.count),
        avgValue: Math.round(h.avgValue / h.count * 100) / 100,
      }))
      .sort((a, b) => b.avgOrders - a.avgOrders);

    res.json({
      peakHours: peakHours.slice(0, 5),
      allHours: peakHours,
      insights: {
        busiestHour: peakHours[0],
        quietestHour: peakHours[peakHours.length - 1],
      },
    });
  } catch (error) {
    console.error('Error analyzing peak hours:', error);
    res.status(500).json({ error: 'Failed to analyze peak hours' });
  }
});

// AI Insights - Product recommendations
router.get('/ai/recommendations', async (req, res) => {
  try {
    const businessId = req.query.businessId || 1;

    // Get underperforming products
    const underperformingResult = await db.query(
      `SELECT 
        p.id,
        p.name,
        p.price,
        p.stock_quantity,
        COALESCE(SUM(oi.quantity), 0) as total_sold
       FROM products p
       LEFT JOIN order_items oi ON p.id = oi.product_id
       LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'completed' 
         AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
       WHERE p.business_id = $1 AND p.is_available = true
       GROUP BY p.id, p.name, p.price, p.stock_quantity
       HAVING COALESCE(SUM(oi.quantity), 0) < 5
       ORDER BY total_sold`,
      [businessId]
    );

    // Get best performing products
    const bestPerformingResult = await db.query(
      `SELECT 
        p.id,
        p.name,
        p.price,
        p.stock_quantity,
        SUM(oi.quantity) as total_sold,
        COALESCE(SUM(oi.total), 0) as revenue
       FROM products p
       JOIN order_items oi ON p.id = oi.product_id
       JOIN orders o ON oi.order_id = o.id
       WHERE p.business_id = $1 
       AND o.status = 'completed'
       AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY p.id, p.name, p.price, p.stock_quantity
       ORDER BY revenue DESC
       LIMIT 10`,
      [businessId]
    );

    const recommendations = [
      {
        type: 'stock_alert',
        title: 'Low Stock Items Need Attention',
        description: 'Consider restocking these popular items',
        priority: 'high',
      },
      {
        type: 'menu_optimization',
        title: 'Remove Underperforming Items',
        description: `${underperformingResult.rows.length} items sold less than 5 units in 30 days`,
        priority: 'medium',
        items: underperformingResult.rows.slice(0, 5),
      },
      {
        type: 'promote',
        title: 'Best Sellers - Consider Promotion',
        description: 'These items are performing well, consider bundling or promoting',
        priority: 'low',
        items: bestPerformingResult.rows.slice(0, 3),
      },
    ];

    res.json(recommendations);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

module.exports = router;
