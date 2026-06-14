const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const categoryRoutes = require('./routes/categories');
const budgetRoutes = require('./routes/budgets');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = 5000;

app.use(cors({
  origin: ['https://ai-finance-tracker-orpin.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/budgets', budgetRoutes);

app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const server = app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});
