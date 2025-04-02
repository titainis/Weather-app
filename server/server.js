const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios'); 

const app = express();

app.use(cors()); 
app.use(bodyParser.json()); 

const PORT = 5000;
const API = 'a2d5b213fa0fd3c8a593b863822719db'; 


app.post('/log-action', (req, res) => {
  const { city, timestamp } = req.body;

  if (!city || !timestamp) {
    return res.status(400).json({ error: 'City and timestamp are required' });
  }

  console.log(`User selected city: ${city} at ${new Date(timestamp).toLocaleString()}`);

  res.status(200).json({ message: 'Action logged successfully' });
});


app.get('/search-cities', async (req, res) => {
  const { query } = req.query;
  
  if (!query || query.length < 3) {
    return res.status(400).json({ error: 'Query must be at least 3 characters long' });
  }
  
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${API}`
    );
    
    const cities = response.data.map(city => ({
      value: city.name,
      label: city.state ? `${city.name}, ${city.state}, ${city.country}` : `${city.name}, ${city.country}`,
      latitude: city.lat,
      longitude: city.lon
    }));
    
    res.json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});


app.get('/weather/:lat/:lon', async (req, res) => {
  const { lat, lon } = req.params;
  
  try {
    const weatherResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API}`
    );
    
    const forecastResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API}`
    );
    
    res.json({
      current: weatherResponse.data,
      forecast: forecastResponse.data
    });
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
