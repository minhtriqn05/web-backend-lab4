// controllers/weather.controller.js
const { getCurrentWeather } = require('../services/weather.service');

exports.getWeather = async (req, res, next) => {
  const start = Date.now();
  try {
    const { city } = req.query;
    if (!city || !city.trim()) {
      return res.status(400).json({ success: false, message: 'The city query parameter is required' });
    }
    const weather = await getCurrentWeather(city);
    console.log(`[request] GET /weather?city=${city} -> 200 in ${Date.now() - start} ms`);
    res.status(200).json({ success: true, data: weather });
  } catch (error) {
    console.log(`[request] GET /weather?city=${req.query.city} -> error in ${Date.now() - start} ms`);

    if (error.status === 404) {
      return res.status(404).json({ success: false, message: error.message });
    }
    // 2. The external API was too slow -> 504 Gateway Timeout
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        message: 'The weather service is taking too long to respond. Please try again in a moment.'
      });
    }
    next(error); // any other error goes to the error handler in server.js
  }
};
