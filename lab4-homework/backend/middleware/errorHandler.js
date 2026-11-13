// middleware/errorHandler.js - 404 for unknown routes + one JSON error format
const multer = require('multer');

function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Multer errors (file too large, wrong field name, ...)
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, message: 'The file is too large (max 2 MB)!' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }

  // Body is not valid JSON
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Request body is not valid JSON' });
  }

  // MySQL unique constraint (email / category name)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ success: false, message: 'This value already exists' });
  }

  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({
    success: false,
    message: status === 500 ? 'Internal server error' : err.message
  });
}

module.exports = { notFound, errorHandler };
