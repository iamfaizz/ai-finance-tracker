const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getBudgets, setBudget } = require('../controllers/budgetController');

router.get('/', auth, getBudgets);
router.post('/', auth, setBudget);

module.exports = router;
