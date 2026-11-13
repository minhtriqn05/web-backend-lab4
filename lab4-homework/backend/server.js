// server.js - ShopAdmin REST API (Lab 4 Homework)
require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');

const { initDatabase } = require('./config/db');
const { UPLOAD_DIR } = require('./middleware/upload');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const categoryRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// The Web UI runs on another origin (Live Server), and sends the JWT in the Authorization header
app.use(cors({
  origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Avatars are served as static files: http://localhost:4000/uploads/<file>
app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/', (req, res) => res.json({ success: true, message: 'ShopAdmin API is running' }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/products', productRoutes);

app.use(notFound);
app.use(errorHandler);

initDatabase()
  .then(() => {
    app.listen(PORT, (error) => {
      // Express 5 passes the error here, e.g. when the port is already in use
      if (error) {
        console.error(`Cannot start the server: ${error.message}`);
        process.exit(1);
      }
      console.log(`ShopAdmin API running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Could not connect to MySQL:', error.message);
    process.exit(1);
  });
