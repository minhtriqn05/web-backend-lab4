// models/product.model.js - SQL queries for the products table
const { pool } = require('../config/db');

// JOIN categories so every product also carries its category name
const SELECT_PRODUCT = `
  SELECT p.id, p.category_id AS categoryId, c.name AS categoryName,
         p.name, p.quantity, p.price
  FROM products p
  JOIN categories c ON c.id = p.category_id`;

async function findAll(categoryId) {
  if (categoryId) {
    const [rows] = await pool.query(`${SELECT_PRODUCT} WHERE p.category_id = ? ORDER BY p.id`, [categoryId]);
    return rows;
  }
  const [rows] = await pool.query(`${SELECT_PRODUCT} ORDER BY p.id`);
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query(`${SELECT_PRODUCT} WHERE p.id = ?`, [id]);
  return rows[0] || null;
}

async function create({ categoryId, name, quantity, price }) {
  const [result] = await pool.query(
    'INSERT INTO products (category_id, name, quantity, price) VALUES (?, ?, ?, ?)',
    [categoryId, name, quantity, price]
  );
  return findById(result.insertId);
}

async function update(id, { categoryId, name, quantity, price }) {
  await pool.query(
    'UPDATE products SET category_id = ?, name = ?, quantity = ?, price = ? WHERE id = ?',
    [categoryId, name, quantity, price, id]
  );
  return findById(id);
}

async function remove(id) {
  const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = { findAll, findById, create, update, remove };
