// controllers/category.controller.js
const Category = require('../models/category.model');
const httpError = require('../utils/httpError');

function readName(body) {
  const { name } = body || {};
  if (typeof name !== 'string' || !name.trim()) throw httpError(400, 'Category name is required');
  if (name.trim().length > 100) throw httpError(400, 'Category name must be at most 100 characters');
  return name.trim();
}

// GET /api/v1/categories (any logged-in user)
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll();
    res.json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/categories (admin)
exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(readName(req.body));
    res.status(201).json({ success: true, message: 'Category created', data: category });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return next(httpError(409, 'A category with this name already exists'));
    next(error);
  }
};

// PUT /api/v1/categories/:id (admin)
exports.updateCategory = async (req, res, next) => {
  try {
    const name = readName(req.body);
    const existing = await Category.findById(req.params.id);
    if (!existing) throw httpError(404, `Category ${req.params.id} not found`);

    const category = await Category.update(req.params.id, name);
    res.json({ success: true, message: 'Category updated', data: category });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return next(httpError(409, 'A category with this name already exists'));
    next(error);
  }
};

// DELETE /api/v1/categories/:id (admin)
exports.deleteCategory = async (req, res, next) => {
  try {
    const deleted = await Category.remove(req.params.id);
    if (!deleted) throw httpError(404, `Category ${req.params.id} not found`);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    // The foreign key (ON DELETE RESTRICT) blocks deleting a category that still has products
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
      return next(httpError(409, 'Cannot delete this category because it still has products'));
    }
    next(error);
  }
};
