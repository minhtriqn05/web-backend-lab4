const express = require('express');
const router = express.Router();
const p = require('../controllers/product.controller');
const { protect, adminOnly } = require('../middleware/auth');
const validateId = require('../middleware/validateId');

router.get('/', protect, p.getProducts);                                   // any logged-in user
router.get('/:id', protect, validateId, p.getProduct);                     // any logged-in user
router.post('/', protect, adminOnly, p.createProduct);                     // admin only
router.put('/:id', protect, adminOnly, validateId, p.updateProduct);       // admin only
router.delete('/:id', protect, adminOnly, validateId, p.deleteProduct);    // admin only

module.exports = router;
