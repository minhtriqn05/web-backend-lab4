// controllers/auth.controller.js - register, login, me
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const httpError = require('../utils/httpError');

const SALT_ROUNDS = 10;
const GENDERS = ['male', 'female', 'other'];
const TYPES = ['normal', 'admin'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Check the sign-up form and return clean values (or throw a 400)
function validateRegister(body) {
  const { fullName, age, gender, email, password, type } = body;

  if (typeof fullName !== 'string' || !fullName.trim()) throw httpError(400, 'Full name is required');
  const ageNumber = Number(age);
  if (!Number.isInteger(ageNumber) || ageNumber < 1 || ageNumber > 150) {
    throw httpError(400, 'Age must be a whole number between 1 and 150');
  }
  if (!GENDERS.includes(gender)) throw httpError(400, 'Gender must be male, female or other');
  if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) throw httpError(400, 'A valid email is required');
  if (typeof password !== 'string' || password.length < 6) {
    throw httpError(400, 'Password must be at least 6 characters');
  }
  const accountType = type === undefined ? 'normal' : type;
  if (!TYPES.includes(accountType)) throw httpError(400, "Type must be 'normal' or 'admin'");

  return {
    fullName: fullName.trim(),
    age: ageNumber,
    gender,
    email: email.trim().toLowerCase(),
    password,
    type: accountType
  };
}

// POST /api/v1/auth/register
exports.register = async (req, res, next) => {
  try {
    const data = validateRegister(req.body || {});

    const existing = await User.findByEmailWithPassword(data.email);
    if (existing) {
      throw httpError(409, `The email ${data.email} is already registered`);
    }

    // Never store the plain-text password
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const user = await User.create({ ...data, passwordHash });

    res.status(201).json({ success: true, message: 'Account created successfully', data: user });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) throw httpError(400, 'Email and password are required');

    const user = await User.findByEmailWithPassword(String(email).trim().toLowerCase());
    // Same message for "no such email" and "wrong password": don't reveal which one
    const isMatch = user ? await bcrypt.compare(String(password), user.passwordHash) : false;
    if (!isMatch) throw httpError(401, 'Invalid email or password');

    const token = jwt.sign(
      { id: user.id, type: user.type },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    const { passwordHash, ...publicUser } = user; // drop the hash from the response
    res.json({ success: true, message: 'Logged in successfully', data: { token, user: publicUser } });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/auth/me (protected)
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) throw httpError(401, 'Unauthorized: this account no longer exists');
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
