// services/weather.service.js - calls the Open-Meteo API with axios
const axios = require('axios');

// Timeout for every external call. Set WEATHER_TIMEOUT_MS=1 to test the 504 response.
const TIMEOUT_MS = Number(process.env.WEATHER_TIMEOUT_MS) || 5000;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 2;             // first try + 1 retry

// ---------- 1. In-memory cache: city -> { data, expiresAt } ----------
const cache = new Map();

function getFromCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { // expired -> forget it
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function saveToCache(key, data) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ---------- 3 + 4. Timed external call with one retry ----------
// Logs how long every attempt took. Retries once on failure,
// but never on a 4xx answer (e.g. 404): asking again would fail again.
async function callExternalApi(label, url, params) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const start = Date.now();
    try {
      const response = await axios.get(url, { params, timeout: TIMEOUT_MS });
      console.log(`[external] ${label} attempt ${attempt} -> ${response.status} in ${Date.now() - start} ms`);
      return response;
    } catch (error) {
      const ms = Date.now() - start;
      const status = error.response ? error.response.status : null;
      console.log(`[external] ${label} attempt ${attempt} FAILED (${error.code || status}) after ${ms} ms`);

      const isClientError = status !== null && status >= 400 && status < 500;
      if (isClientError || attempt === MAX_ATTEMPTS) {
        throw error; // give up: let the controller decide the status code
      }
      console.log(`[external] ${label} retrying...`);
    }
  }
}

async function getCoordinatesForCity(city) {
  const response = await callExternalApi(
    `geocoding "${city}"`,
    'https://geocoding-api.open-meteo.com/v1/search',
    { name: city, count: 1 }
  );
  const result = response.data.results && response.data.results[0];
  if (!result) {
    // This is our own 404, thrown after a successful call, so it is never retried
    const err = new Error(`City "${city}" was not found`);
    err.status = 404;
    throw err;
  }
  return { latitude: result.latitude, longitude: result.longitude, resolvedName: result.name };
}

async function getCurrentWeather(city) {
  const key = city.trim().toLowerCase();

  const cached = getFromCache(key);
  if (cached) {
    console.log(`[cache] HIT  "${key}" (no external call)`);
    return { ...cached, cached: true };
  }
  console.log(`[cache] MISS "${key}"`);

  const { latitude, longitude, resolvedName } = await getCoordinatesForCity(city);
  const response = await callExternalApi(
    `forecast "${resolvedName}"`,
    'https://api.open-meteo.com/v1/forecast',
    { latitude, longitude, current_weather: true }
  );
  const current = response.data.current_weather;
  const weather = {
    city: resolvedName,
    temperatureC: current.temperature,
    windSpeedKmh: current.windspeed,
    observedAt: current.time
  };

  saveToCache(key, weather);
  return { ...weather, cached: false };
}

module.exports = { getCurrentWeather };
