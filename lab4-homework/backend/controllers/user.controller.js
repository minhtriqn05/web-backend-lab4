// controllers/user.controller.js - the logged-in user's own profile
const fs = require('fs');
const path = require('path');
const User = require('../models/user.model');
const { UPLOAD_DIR } = require('../middleware/upload');
const httpError = require('../utils/httpError');

const GENDERS = ['male', 'female', 'other'];

// PUT /api/v1/users/me (protected)
// Only fullName, age and gender can be changed here: email, type and password are ignored.
exports.updateMe = async (req, res, next) => {
  try {
    const current = await User.findById(req.user.id); // always the user from the token
    if (!current) throw httpError(401, 'Unauthorized: this account no longer exists');

    const { fullName, age, gender } = req.body || {};
    const changes = { fullName: current.fullName, age: current.age, gender: current.gender };

    if (fullName !== undefined) {
      if (typeof fullName !== 'string' || !fullName.trim()) throw httpError(400, 'Full name cannot be empty');
      changes.fullName = fullName.trim();
    }
    if (age !== undefined && age !== null && age !== '') {
      const ageNumber = Number(age);
      if (!Number.isInteger(ageNumber) || ageNumber < 1 || ageNumber > 150) {
        throw httpError(400, 'Age must be a whole number between 1 and 150');
      }
      changes.age = ageNumber;
    }
    if (gender !== undefined) {
      if (!GENDERS.includes(gender)) throw httpError(400, 'Gender must be male, female or other');
      changes.gender = gender;
    }

    const user = await User.updateProfile(req.user.id, changes);
    res.json({ success: true, message: 'Profile updated', data: user });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/users/me/avatar (protected, multipart/form-data, field "avatar")
exports.uploadMyAvatar = async (req, res, next) => {
  try {
    if (!req.file) throw httpError(400, 'Please choose an image file!');

    const current = await User.findById(req.user.id);
    if (!current) throw httpError(401, 'Unauthorized: this account no longer exists');

    // Save the new URL (relative to the API server) on the user from the token
    const avatarUrl = `/uploads/${req.file.filename}`;
    const user = await User.updateAvatar(req.user.id, avatarUrl);

    // Remove the old avatar file so uploads/ does not keep growing
    if (current.avatarUrl && current.avatarUrl.startsWith('/uploads/')) {
      const oldPath = path.join(UPLOAD_DIR, path.basename(current.avatarUrl));
      fs.promises.unlink(oldPath).catch(() => {}); // ignore if it is already gone
    }

    res.json({ success: true, message: 'Avatar updated', data: user });
  } catch (error) {
    if (req.file) fs.promises.unlink(req.file.path).catch(() => {}); // don't keep an orphan file
    next(error);
  }
};
