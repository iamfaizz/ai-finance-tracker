const pool = require('../db');

const getTransactions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, c.name as category_name 
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1
       ORDER BY t.date DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addTransaction = async (req, res) => {
  const { category_id, amount, type, note, date } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO transactions (user_id, category_id, amount, type, note, date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.userId, category_id, amount, type, note, date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteTransaction = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getTransactions, addTransaction, deleteTransaction };
