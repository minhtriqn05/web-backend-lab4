// upload_server.js - File upload & download with Multer (Lab 4 - Exercise 2)
const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = 5001;
app.use(cors());

// Absolute path to the uploads folder; create it if it is missing
const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Serve /uploads as static files so the client can view them by URL
app.use('/uploads', express.static(UPLOAD_DIR));

// Where and under which name Multer saves each file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Only accept JPG / PNG / WEBP images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Only image files are accepted (JPG, PNG, WEBP)!');
    error.status = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB max
  fileFilter: fileFilter
});

// Base URL of this server, e.g. http://localhost:5001
const baseUrl = (req) => `${req.protocol}://${req.get('host')}`;

// Turn the :filename param into a safe absolute path inside uploads/.
// path.basename() drops any folder part, so "../server.js" becomes "server.js"
// and can never point outside the uploads folder.
function safeUploadPath(filename) {
  const safeName = path.basename(filename);
  return { safeName, filePath: path.join(UPLOAD_DIR, safeName) };
}

// Accept a single file sent in the form field named 'avatar'
app.post('/api/v1/upload-avatar', upload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please choose an image file!' });
  }
  // Build the public URL from the current host, e.g. http://localhost:5001
  const fileUrl = `${baseUrl(req)}/uploads/${req.file.filename}`;
  res.json({
    success: true,
    message: 'Image uploaded successfully',
    fileInfo: {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: fileUrl
    }
  });
});

// ---------- Extended requirements ----------

// 1. GET /api/v1/download/:filename - force a "Save As" download
app.get('/api/v1/download/:filename', (req, res, next) => {
  const { safeName, filePath } = safeUploadPath(req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: `File "${safeName}" not found` });
  }
  // res.download() sets Content-Disposition: attachment; filename="..."
  res.download(filePath, safeName, (err) => {
    if (err && !res.headersSent) next(err);
  });
});

// 2. GET /api/v1/files - list every file in uploads/ with its size and URLs
app.get('/api/v1/files', async (req, res, next) => {
  try {
    const names = await fs.promises.readdir(UPLOAD_DIR);
    const files = [];

    for (const name of names) {
      if (name.startsWith('.')) continue; // skip hidden files such as .gitkeep
      const stats = await fs.promises.stat(path.join(UPLOAD_DIR, name));
      if (!stats.isFile()) continue; // skip sub-folders

      files.push({
        name,
        size: stats.size,
        uploadedAt: stats.mtime,
        viewUrl: `${baseUrl(req)}/uploads/${encodeURIComponent(name)}`,
        downloadUrl: `${baseUrl(req)}/api/v1/download/${encodeURIComponent(name)}`
      });
    }

    // newest files first
    files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    res.json({ success: true, count: files.length, data: files });
  } catch (error) {
    next(error);
  }
});

// 3. DELETE /api/v1/files/:filename - remove a file with fs.unlink
app.delete('/api/v1/files/:filename', async (req, res, next) => {
  const { safeName, filePath } = safeUploadPath(req.params.filename);
  try {
    await fs.promises.unlink(filePath);
    res.json({ success: true, message: `Deleted file "${safeName}"` });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ success: false, message: `File "${safeName}" not found` });
    }
    next(error);
  }
});

// Error handler: send Multer errors (file too large, wrong type) as JSON
// instead of Express's default HTML error page
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'The file is too large (max 2 MB)!' : err.message;
    return res.status(400).json({ success: false, message });
  }
  res.status(err.status || 500).json({ success: false, message: err.message });
});

app.listen(PORT, (error) => {
  // Express 5 passes the error here, e.g. when the port is already in use
  if (error) {
    console.error(`Cannot start the server: ${error.message}`);
    process.exit(1);
  }
  console.log(`Upload server running on port ${PORT}`);
});
