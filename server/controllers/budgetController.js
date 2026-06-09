const pool = require('../db');

const getBudgets = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, c.name as category_name,
        COALESCE(SUM(t.amount), 0) as spent
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       LEFT JOIN transactions t ON t.category_id = b.category_id 
         AND t.user_id = b.user_id
         AND t.type = 'expense'
         AND EXTRACT(MONTH FROM t.date) = b.month
         AND EXTRACT(YEAR FROM t.date) = b.year
       WHERE b.user_id = $1
       GROUP BY b.id, c.name`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const setBudget = async (req, res) => {
  const { category_id, monthly_limit, month, year } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO budgets (user_id, category_id, monthly_limit, month, year)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [req.userId, category_id, monthly_limit, month, year]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getBudgets, setBudget };
