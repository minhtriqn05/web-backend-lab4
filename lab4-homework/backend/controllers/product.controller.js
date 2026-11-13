// controllers/product.controller.js
const Product = require('../models/product.model');
const Category = require('../models/category.model');
const httpError = require('../utils/httpError');

// Check a full product and return clean values (or throw a 400)
async function validateProduct({ name, categoryId, quantity, price }) {
  if (typeof name !== 'string' || !name.trim()) throw httpError(400, 'Product name is required');
  if (name.trim().length > 150) throw httpError(400, 'Product name must be at most 150 characters');

  const catId = Number(categoryId);
  if (!Number.isInteger(catId) || catId <= 0) throw httpError(400, 'A valid categoryId is required');
  const category = await Category.findById(catId);
  if (!category) throw httpError(400, `Category ${categoryId} does not exist`);

  const qty = Number(quantity);
  if (quantity === '' || quantity === null || !Number.isInteger(qty) || qty < 0) {
    throw httpError(400, 'Quantity must be a whole number >= 0');
  }
  const priceNumber = Number(price);
  if (price === '' || price === null || !Number.isFinite(priceNumber) || priceNumber < 0) {
    throw httpError(400, 'Price must be a number >= 0');
  }

  return { name: name.trim(), categoryId: catId, quantity: qty, price: priceNumber };
}

// GET /api/v1/products?categoryId= (any logged-in user)
exports.getProducts = async (req, res, next) => {
  try {
    let { categoryId } = req.query;
    if (categoryId !== undefined && categoryId !== '') {
      categoryId = Number(categoryId);
      if (!Number.isInteger(categoryId) || categoryId <= 0) throw httpError(400, 'categoryId must be a positive integer');
    } else {
      categoryId = null;
    }
    const products = await Product.findAll(categoryId);
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/products/:id (any logged-in user)
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) throw httpError(404, `Product ${req.params.id} not found`);
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/products (admin)
exports.createProduct = async (req, res, next) => {
  try {
    const data = await validateProduct(req.body || {});
    const product = await Product.create(data);
    res.status(201).json({ success: true, message: 'Product created', data: product });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/products/:id (admin) - missing fields keep their current value
exports.updateProduct = async (req, res, next) => {
  try {
    const existing = await Product.findById(req.params.id);
    if (!existing) throw httpError(404, `Product ${req.params.id} not found`);

    const data = await validateProduct({ ...existing, ...(req.body || {}) });
    const product = await Product.update(req.params.id, data);
    res.json({ success: true, message: 'Product updated', data: product });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/products/:id (admin)
exports.deleteProduct = async (req, res, next) => {
  try {
    const deleted = await Product.remove(req.params.id);
    if (!deleted) throw httpError(404, `Product ${req.params.id} not found`);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};
