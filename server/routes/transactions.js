const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getTransactions, addTransaction, deleteTransaction } = require('../controllers/transactionController');

router.get('/', auth, getTransactions);
router.post('/', auth, addTransaction);
router.delete('/:id', auth, deleteTransaction);

module.exports = router;
