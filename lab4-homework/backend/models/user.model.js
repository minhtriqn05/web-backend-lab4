// models/user.model.js - SQL queries for the users table
const { pool } = require('../config/db');

// Public columns only: password_hash is NEVER selected here
const PUBLIC_COLUMNS = `
  id, full_name AS fullName, age, gender, email,
  avatar_url AS avatarUrl, type, created_at AS createdAt`;

async function findById(id) {
  const [rows] = await pool.query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ?`, [id]);
  return rows[0] || null;
}

// Only used by login: the one place that needs the hash
async function findByEmailWithPassword(email) {
  const [rows] = await pool.query(
    `SELECT ${PUBLIC_COLUMNS}, password_hash AS passwordHash FROM users WHERE email = ?`,
    [email]
  );
  return rows[0] || null;
}

async function create({ fullName, age, gender, email, passwordHash, type }) {
  const [result] = await pool.query(
    `INSERT INTO users (full_name, age, gender, email, password_hash, type)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [fullName, age, gender, email, passwordHash, type]
  );
  return findById(result.insertId);
}

async function updateProfile(id, { fullName, age, gender }) {
  await pool.query(
    'UPDATE users SET full_name = ?, age = ?, gender = ? WHERE id = ?',
    [fullName, age, gender, id]
  );
  return findById(id);
}

async function updateAvatar(id, avatarUrl) {
  await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, id]);
  return findById(id);
}

module.exports = { findById, findByEmailWithPassword, create, updateProfile, updateAvatar };
