const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getCategories, addCategory } = require('../controllers/categoryController');

router.get('/', auth, getCategories);
router.post('/', auth, addCategory);

module.exports = router;
