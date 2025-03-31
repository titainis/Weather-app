import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import AsyncCreatable from 'react-select/async-creatable';

function App() {
  const [selectedCity, setSelectedCity] = useState(null);
  const [weatherData, setWeatherData] = useState([])
  const [forecastData, setForecastData] = useState([])
  const [mostViewedCities, setMostViewedCities] = useState([])


  const defaultOptions = [
    { value: "Vilnius", label: "Vilnius", latitude: 54.6872, longitude: 25.2797 },
    { value: "Kaunas", label: "Kaunas", latitude: 54.8985, longitude: 23.9036 },
    { value: "Klaipeda", label: "Klaipeda", latitude: 55.7038, longitude: 21.1443 },
    { value: "Šiauliai", label: "Šiauliai", latitude: 55.9333, longitude: 23.3167 },
    { value: "Panevėžys", label: "Panevėžys", latitude: 55.7333, longitude: 24.3667 },
    { value: "Alytus", label: "Alytus", latitude: 54.4000, longitude: 24.0333 },
    { value: "Marijampolė", label: "Marijampolė", latitude: 54.5500, longitude: 23.3500 },
    { value: "Telšiai", label: "Telšiai", latitude: 55.9000, longitude: 22.2500 },
    { value: "Utena", label: "Utena", latitude: 55.5000, longitude: 25.6000 },
  ];
  
  const customStyle = {
    control : (provided) => ({
      ...provided,
      width: "500px",
      borderRadius: "8px",
      color: "black",
     fontWeight: "16px"
  }),
    option: (provided, state) => ({
      ...provided,
      color: state.isFocused ? "black": "rgba(0, 0, 0, 0.7)",
      fontWeight: state.isFocused ? "600" : "500",
      fontSize: "15px",
      fontFamily: "Arial, sans-serif",
      padding: "15px",
      backgroundColor: state.isFocused ? "lightblue" : "white",
      cursor: "pointer",
    })
  }

  useEffect(() => {
    const storedCities = localStorage.getItem('mostViewedCities');
    if (storedCities) {
      setMostViewedCities(JSON.parse(storedCities));
    }
  }, []);

  const API = 'a2d5b213fa0fd3c8a593b863822719db';

  const loadCityOptions = async (inputValue) => {
    if (!inputValue || inputValue.length < 3) {
      return defaultOptions; 
    }
    
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${inputValue}&limit=5&appid=${API}`
      );
      const cities = await response.json();
      
      if (!cities || cities.length === 0) {
        console.log("No cities found for:", inputValue);
        return [];
      }
      
      const options = cities.map(city => ({
        value: city.name,
        label: city.state ? `${city.name}, ${city.state}, ${city.country}` : `${city.name}, ${city.country}`,
        latitude: city.lat,
        longitude: city.lon
      }));
      
      console.log("Loaded city options:", options);
      return options;
    } catch (error) {
      console.error("Error fetching cities:", error);
      return [];
    }
  };

  const handleCitySelect = async (option) => {
    if (!option) return;
    
    console.log("Selected city:", option);
    setSelectedCity(option);

    const timestamp = new Date().toISOString();
    try {
      await axios.post('http://localhost:5000/log-action', {
        city: option.label,
        timestamp,
      });
      console.log('Action logged successfully');
    } catch (error) {
      console.error('Error logging action:', error);
    }
    
    updateMostViewedCities(option.value);
    
    try {
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${option.latitude}&lon=${option.longitude}&units=metric&appid=${API}`
      );
      const weatherData = await weatherResponse.json();
      
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${option.latitude}&lon=${option.longitude}&units=metric&appid=${API}`
      );
      const forecastData = await forecastResponse.json();
   
      setWeatherData({
        temperature: Math.round(weatherData.main.temp),
        humidity: weatherData.main.humidity,
        wind: Math.round(weatherData.wind.speed)
      });
      
      
      const dailyData = forecastData.list.filter((reading, index) => 
        index % 8 === 0
      ).slice(0, 5);
      
      setForecastData(dailyData);
    } catch (error) {
      console.error("Error fetching weather data:", error);
    }
  };

  const updateMostViewedCities = (cityName) => {
    setMostViewedCities(prevCities => {
      const existingCityIndex = prevCities.findIndex(city => city.name === cityName);
      let updatedCities;
      
      if (existingCityIndex !== -1) {
        updatedCities = [...prevCities];
        updatedCities[existingCityIndex] = {
          ...updatedCities[existingCityIndex],
          views: updatedCities[existingCityIndex].views + 1
        };
      } else {
        updatedCities = [...prevCities, { name: cityName, views: 1 }];
      }
    
      updatedCities.sort((a, b) => b.views - a.views);
      
      localStorage.setItem('mostViewedCities', JSON.stringify(updatedCities));
      
      return updatedCities;
    });
  };

  const handleMostViewedCityClick = (cityName) => {
    const city = defaultOptions.find(option => option.value === cityName);
    if (city) {
      handleCitySelect(city);
      return;
    }
    
    loadCityOptions(cityName).then(options => {
      if (options.length > 0) {
        const bestMatch = options.find(option => option.value.toLowerCase() === cityName.toLowerCase()) || options[0];
        handleCitySelect(bestMatch);
      }
    });
  };

  const getTopThreeCities = () => {
    return mostViewedCities.slice(0, 3);
  };

  const clearMostViewedCities = () => {
    localStorage.removeItem('mostViewedCities');
    setMostViewedCities([]);
  };

  const handleCreateOption = (inputValue) => {
    loadCityOptions(inputValue).then(options => {
      if (options.length > 0) {
        const newOption = options[0];
        setSelectedCity(newOption);
        handleCitySelect(newOption);
      } else {
        console.error("No cities found for:", inputValue);
      }
    });
  };

  return (
    <>
    <div className="container">
      <div className="weather-app">
        <div className="left-section">
          <div className="box">
            <h2>Select location</h2>
            <AsyncCreatable
              className="dropdown-search"
              placeholder="Enter City name"
              styles={customStyle}
              onChange={handleCitySelect}
              value={selectedCity}
              loadOptions={loadCityOptions}
              defaultOptions={defaultOptions}
              onCreateOption={handleCreateOption}
              cacheOptions
              isClearable
            />
          </div>

          {selectedCity && (
            <>
              
              <h2 className="weather-heading">
                {selectedCity.label} Weather
              </h2>

              <div className="conditions">
                <div className="condition-item">
                  <h3>Temperature</h3>
                  <p className="condition-value">{weatherData?.temperature}°C</p>
                </div>
                <div className="condition-item">
                  <h3>Humidity</h3>
                  <p className="condition-value">{weatherData?.humidity}%</p>
                </div>
                <div className="condition-item">
                  <h3>Wind</h3>
                  <p className="condition-value">{weatherData?.wind} m/s</p>
                </div>
              </div>

              {/*5day forecast section*/}
              <div className="forecast">
                <h3 className="forecast-title">5-Day Forecast</h3>
                <div className="forecast-container">
                  {forecastData.map((day, index) => (
                    <div key={index} className="forecast-day">
                      <p className="day-name">
                        {new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                      <div className="forecast-icon">
                        <img
                          src={`http://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`}
                          alt={day.weather[0].description}
                          className="weather-icon"
                        />
                      </div>
                      <p className="forecast-temp">{Math.round(day.main.temp)}°C</p>
                      <p className="forecast-desc">{day.weather[0].description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {!selectedCity && (
            <div className="conditions">
              <p className="select-prompt">Select a city to view weather data</p>
            </div>
          )}
        </div>

        <div className="most-viewed-cities">
          <div className="header-with-button">
            <h2 className="box2">Most Viewed Cities</h2>
            <button
              className="clear-button"
              onClick={clearMostViewedCities}
              title="Clear most viewed cities"
            >
              Reset
            </button>
          </div>
          <div className="most-viewed-list">
            {getTopThreeCities().length > 0 ? (
              <ul className="city-list">
                {getTopThreeCities().map((city, index) => (
                  <li
                    key={index}
                    className={`city-item rank-${index + 1}`}
                    onClick={() => handleMostViewedCityClick(city.name)}
                  >
                    {city.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-cities">No cities viewed yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

export default App