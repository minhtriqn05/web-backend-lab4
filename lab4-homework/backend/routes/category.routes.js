const express = require('express');
const router = express.Router();
const c = require('../controllers/category.controller');
const { protect, adminOnly } = require('../middleware/auth');
const validateId = require('../middleware/validateId');

router.get('/', protect, c.getCategories);                                 // any logged-in user
router.post('/', protect, adminOnly, c.createCategory);                    // admin only
router.put('/:id', protect, adminOnly, validateId, c.updateCategory);      // admin only
router.delete('/:id', protect, adminOnly, validateId, c.deleteCategory);   // admin only

module.exports = router;
