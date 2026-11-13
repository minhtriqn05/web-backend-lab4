const express = require('express');
const cors = require('cors');
const weatherRoutes = require('./routes/weather.routes');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());
app.use('/api/v1/weather', weatherRoutes);

// Error handler for errors passed with next(error)
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ success: false, message: 'Could not get the weather right now' });
});

app.listen(PORT, (error) => {
  // Express 5 passes the error here, e.g. when the port is already in use
  if (error) {
    console.error(`Cannot start the server: ${error.message}`);
    process.exit(1);
  }
  console.log(`Backend API running at: http://localhost:${PORT}`);
});
