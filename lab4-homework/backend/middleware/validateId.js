// middleware/validateId.js - :id must be a positive integer, otherwise 400
function validateId(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: `Invalid id "${req.params.id}"` });
  }
  req.params.id = id;
  next();
}

module.exports = validateId;
