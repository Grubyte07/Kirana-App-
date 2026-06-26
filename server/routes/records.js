const express = require('express');
const { queryOne, queryAll, run } = require('../utils/db');
const auth = require('../middleware/auth');

const router = express.Router();

const calcProfit = (sales, purchase, expenses) => sales - purchase - (expenses || 0);

router.post('/', auth, (req, res) => {
  try {
    const { date, totalSales, productPurchase, otherExpenses, notes } = req.body;
    const recordDate = new Date(date).toISOString().split('T')[0];
    const dailyProfit = calcProfit(totalSales, productPurchase, otherExpenses);

    const existing = queryOne('SELECT id FROM daily_records WHERE user_id = ? AND date = ?', [req.user.id, recordDate]);
    if (existing) {
      return res.status(400).json({ message: 'A record already exists for this date. Use update instead.' });
    }

    const result = run(
      'INSERT INTO daily_records (user_id, date, total_sales, product_purchase, other_expenses, daily_profit, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, recordDate, totalSales, productPurchase, otherExpenses || 0, dailyProfit, notes || '']
    );

    const record = queryOne('SELECT * FROM daily_records WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', auth, (req, res) => {
  try {
    const { month, year, search, page = 1, limit = 50 } = req.query;
    let query = 'SELECT * FROM daily_records WHERE user_id = ?';
    const params = [req.user.id];

    if (month && year) {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      query += ' AND date >= ? AND date <= ?';
      params.push(startDate, endDate);
    } else if (search) {
      query += ' AND date = ?';
      params.push(search);
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = queryOne(countQuery, params);
    const total = countResult ? countResult.total : 0;

    query += ' ORDER BY date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const records = queryAll(query, params);

    res.json({ records, total, pages: Math.ceil(total / parseInt(limit)), currentPage: parseInt(page) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/today', auth, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const record = queryOne('SELECT * FROM daily_records WHERE user_id = ? AND date = ?', [req.user.id, today]);
    res.json(record || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/dashboard', auth, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-31`;

    const todayRecord = queryOne('SELECT * FROM daily_records WHERE user_id = ? AND date = ?', [req.user.id, today]);

    const monthlyRecords = queryAll(
      'SELECT * FROM daily_records WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date ASC',
      [req.user.id, monthStart, monthEnd]
    );

    const monthlyStats = monthlyRecords.reduce(
      (acc, r) => ({
        totalSales: acc.totalSales + r.total_sales,
        totalPurchases: acc.totalPurchases + r.product_purchase,
        totalExpenses: acc.totalExpenses + r.other_expenses,
        totalProfit: acc.totalProfit + r.daily_profit,
        daysCount: acc.daysCount + 1
      }),
      { totalSales: 0, totalPurchases: 0, totalExpenses: 0, totalProfit: 0, daysCount: 0 }
    );

    const recentRecords = queryAll(
      'SELECT * FROM daily_records WHERE user_id = ? ORDER BY date DESC LIMIT 7',
      [req.user.id]
    );

    const chartData = monthlyRecords.map(r => ({
      date: r.date,
      sales: r.total_sales,
      purchase: r.product_purchase,
      expenses: r.other_expenses,
      profit: r.daily_profit
    }));

    res.json({
      today: todayRecord ? {
        ...todayRecord,
        totalSales: todayRecord.total_sales,
        productPurchase: todayRecord.product_purchase,
        otherExpenses: todayRecord.other_expenses,
        dailyProfit: todayRecord.daily_profit
      } : null,
      monthly: {
        ...monthlyStats,
        avgDailyProfit: monthlyStats.daysCount > 0 ? Math.round(monthlyStats.totalProfit / monthlyStats.daysCount) : 0,
        highestProfit: monthlyRecords.length > 0 ? Math.max(...monthlyRecords.map(r => r.daily_profit)) : 0,
        lowestProfit: monthlyRecords.length > 0 ? Math.min(...monthlyRecords.map(r => r.daily_profit)) : 0,
        highestProfitDay: monthlyRecords.length > 0
          ? monthlyRecords.reduce((max, r) => r.daily_profit > max.daily_profit ? r : max, monthlyRecords[0]).date
          : null,
        lowestProfitDay: monthlyRecords.length > 0
          ? monthlyRecords.reduce((min, r) => r.daily_profit < min.daily_profit ? r : min, monthlyRecords[0]).date
          : null
      },
      recentRecords: recentRecords.map(r => ({
        ...r,
        totalSales: r.total_sales,
        productPurchase: r.product_purchase,
        otherExpenses: r.other_expenses,
        dailyProfit: r.daily_profit
      })),
      chartData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/monthly-report', auth, (req, res) => {
  try {
    const { month, year } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();

    const monthStart = `${y}-${String(m).padStart(2, '0')}-01`;
    const monthEnd = `${y}-${String(m).padStart(2, '0')}-31`;

    const records = queryAll(
      'SELECT * FROM daily_records WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date ASC',
      [req.user.id, monthStart, monthEnd]
    );

    const stats = records.reduce(
      (acc, r) => ({
        totalSales: acc.totalSales + r.total_sales,
        totalPurchases: acc.totalPurchases + r.product_purchase,
        totalExpenses: acc.totalExpenses + r.other_expenses,
        totalProfit: acc.totalProfit + r.daily_profit
      }),
      { totalSales: 0, totalPurchases: 0, totalExpenses: 0, totalProfit: 0 }
    );

    const avgDailyProfit = records.length > 0 ? Math.round(stats.totalProfit / records.length) : 0;
    const highestProfit = records.length > 0 ? Math.max(...records.map(r => r.daily_profit)) : 0;
    const lowestProfit = records.length > 0 ? Math.min(...records.map(r => r.daily_profit)) : 0;
    const highestDay = records.find(r => r.daily_profit === highestProfit);
    const lowestDay = records.find(r => r.daily_profit === lowestProfit);

    res.json({
      month: m,
      year: y,
      records: records.map(r => ({
        ...r,
        totalSales: r.total_sales,
        productPurchase: r.product_purchase,
        otherExpenses: r.other_expenses,
        dailyProfit: r.daily_profit
      })),
      stats: {
        ...stats,
        avgDailyProfit,
        highestProfit,
        lowestProfit,
        highestProfitDay: highestDay ? highestDay.date : null,
        lowestProfitDay: lowestDay ? lowestDay.date : null,
        daysWithRecords: records.length,
        profitPercentage: stats.totalSales > 0 ? ((stats.totalProfit / stats.totalSales) * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/analytics', auth, (req, res) => {
  try {
    const { months = 6 } = req.query;
    const endDate = new Date().toISOString().split('T')[0];
    const startDateObj = new Date();
    startDateObj.setMonth(startDateObj.getMonth() - parseInt(months));
    const startDate = startDateObj.toISOString().split('T')[0];

    const records = queryAll(
      'SELECT * FROM daily_records WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date ASC',
      [req.user.id, startDate, endDate]
    );

    const monthlyData = {};
    records.forEach(r => {
      const d = new Date(r.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[key]) {
        monthlyData[key] = { sales: 0, purchases: 0, expenses: 0, profit: 0, days: 0 };
      }
      monthlyData[key].sales += r.total_sales;
      monthlyData[key].purchases += r.product_purchase;
      monthlyData[key].expenses += r.other_expenses;
      monthlyData[key].profit += r.daily_profit;
      monthlyData[key].days += 1;
    });

    const dailyTrend = records.map(r => ({
      date: r.date,
      profit: r.daily_profit,
      sales: r.total_sales,
      purchase: r.product_purchase,
      expenses: r.other_expenses
    }));

    const totalStats = records.reduce(
      (acc, r) => ({
        totalSales: acc.totalSales + r.total_sales,
        totalPurchases: acc.totalPurchases + r.product_purchase,
        totalExpenses: acc.totalExpenses + r.other_expenses,
        totalProfit: acc.totalProfit + r.daily_profit
      }),
      { totalSales: 0, totalPurchases: 0, totalExpenses: 0, totalProfit: 0 }
    );

    res.json({
      monthlyData,
      dailyTrend,
      totalStats,
      profitPercentage: totalStats.totalSales > 0
        ? ((totalStats.totalProfit / totalStats.totalSales) * 100).toFixed(1)
        : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', auth, (req, res) => {
  try {
    const record = queryOne('SELECT * FROM daily_records WHERE id = ? AND user_id = ?', [parseInt(req.params.id), req.user.id]);
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', auth, (req, res) => {
  try {
    const { totalSales, productPurchase, otherExpenses, notes, date } = req.body;
    const existing = queryOne('SELECT * FROM daily_records WHERE id = ? AND user_id = ?', [parseInt(req.params.id), req.user.id]);
    if (!existing) return res.status(404).json({ message: 'Record not found' });

    const updated = {
      totalSales: totalSales !== undefined ? totalSales : existing.total_sales,
      productPurchase: productPurchase !== undefined ? productPurchase : existing.product_purchase,
      otherExpenses: otherExpenses !== undefined ? otherExpenses : existing.other_expenses,
      notes: notes !== undefined ? notes : existing.notes,
      date: date ? new Date(date).toISOString().split('T')[0] : existing.date
    };
    updated.dailyProfit = calcProfit(updated.totalSales, updated.productPurchase, updated.otherExpenses);

    run(
      'UPDATE daily_records SET total_sales = ?, product_purchase = ?, other_expenses = ?, daily_profit = ?, notes = ?, date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [updated.totalSales, updated.productPurchase, updated.otherExpenses, updated.dailyProfit, updated.notes, updated.date, parseInt(req.params.id)]
    );

    const record = queryOne('SELECT * FROM daily_records WHERE id = ?', [parseInt(req.params.id)]);
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', auth, (req, res) => {
  try {
    const result = run('DELETE FROM daily_records WHERE id = ? AND user_id = ?', [parseInt(req.params.id), req.user.id]);
    if (result.changes === 0) return res.status(404).json({ message: 'Record not found' });
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
