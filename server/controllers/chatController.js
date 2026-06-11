const pool = require('../db');
const Groq = require('groq-sdk');

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const chat = async (req, res) => {
  const { message } = req.body;
  try {
    const result = await pool.query(
      `SELECT t.amount, t.type, t.note, t.date, c.name as category
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1
       ORDER BY t.date DESC
       LIMIT 90`,
      [req.userId]
    );

    const transactions = result.rows;
    const transactionSummary = transactions.map(t =>
      `${t.date?.toISOString?.()?.split('T')[0] || t.date}: ${t.type} ₹${t.amount} - ${t.category || 'Uncategorized'} ${t.note ? '(' + t.note + ')' : ''}`
    ).join('\n');

    const response = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `You are a helpful personal finance assistant. The user's recent transactions are listed below. Answer questions accurately based only on this data. Be concise and friendly. Format numbers with ₹ symbol.

User's transactions:
${transactionSummary}`
        },
        { role: 'user', content: message }
      ]
    });

    res.json({ reply: response.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { chat };