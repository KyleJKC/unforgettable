document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const destinationForm = document.getElementById('destination-form');
    const destinationInput = document.getElementById('destination-input');
    const tripDuration = document.getElementById('trip-duration');
    const loadingSection = document.getElementById('loading-recommendations');
    const recommendationsContainer = document.getElementById('recommendations-container');
    const destinationName = document.getElementById('destination-name');
    const weatherInfo = document.getElementById('weather-info');
    const recommendationsList = document.getElementById('recommendations-list');
    
    // Form submission handler
    destinationForm.addEventListener('submit', handleDestinationSubmit);
    
    // Function to handle destination form submission
    function handleDestinationSubmit(e) {
        e.preventDefault();
        
        const destination = destinationInput.value.trim();
        const duration = tripDuration.value;
        
        if (!destination) {
            alert('Please enter a destination');
            return;
        }
        
        // Show loading section
        loadingSection.style.display = 'block';
        recommendationsContainer.style.display = 'none';
        
        // First get the coordinates for the destination
        getCoordinatesForCity(destination)
            .then(coords => {
                if (!coords) {
                    throw new Error('Could not find coordinates for this destination');
                }
                
                // Update destination name
                destinationName.textContent = coords.displayName;
                
                // Get real weather data for the destination
                return getWeatherData(coords.latitude, coords.longitude);
            })
            .then(weatherData => {
                // Update weather info
                updateWeatherInfo(weatherData);
                
                // Generate recommendations based on weather and duration
                const recommendations = getRecommendations(weatherData, duration);
                
                // Display recommendations
                displayRecommendations(recommendations);
                
                // Hide loading and show recommendations
                loadingSection.style.display = 'none';
                recommendationsContainer.style.display = 'block';
            })
            .catch(error => {
                console.error('Error:', error);
                loadingSection.innerHTML = `<p>Error: ${error.message}. Please try again.</p>`;
                
                // If there's an error, get mock weather data as fallback
                const mockWeatherData = getMockWeatherData(destination);
                updateWeatherInfo(mockWeatherData);
                
                // Generate recommendations based on mock weather and duration
                const recommendations = getRecommendations(mockWeatherData, duration);
                
                // Display recommendations
                displayRecommendations(recommendations);
                
                // Show recommendations
                recommendationsContainer.style.display = 'block';
            });
    }
    
    // Function to get coordinates for a city name
    function getCoordinatesForCity(cityName) {
        // Use OpenStreetMap Nominatim API for geocoding
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&limit=1`;
        
        // Add a timeout to the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        return fetch(geocodeUrl, {
            headers: { 'User-Agent': 'Unforgettable Travel App' },
            signal: controller.signal
        })
            .then(response => {
                // Clear the timeout if the request is successful
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`Geocoding error: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                if (data && data.length > 0) {
                    return {
                        latitude: parseFloat(data[0].lat),
                        longitude: parseFloat(data[0].lon),
                        displayName: data[0].display_name
                    };
                }
                throw new Error('Location not found. Please try a different city name.');
            })
            .catch(error => {
                console.error('Geocoding error:', error);
                throw error; // Rethrow to be handled by the caller
            });
    }
    
    // Function to get real weather data
    function getWeatherData(latitude, longitude) {
        // Use OpenWeatherMap API for real weather data
        const weatherApiKey = 'bf8a7ecd35def02b02f94cedb999a898'; // OpenWeatherMap free API key
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=imperial&appid=${weatherApiKey}`;
        
        // Add a timeout to the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        return fetch(weatherUrl, { signal: controller.signal })
            .then(response => {
                // Clear the timeout if the request is successful
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                // Convert API response to our format
                return {
                    condition: data.weather[0].main.toLowerCase(),
                    temperature: Math.round(data.main.temp),
                    description: data.weather[0].description,
                    high: Math.round(data.main.temp_max),
                    low: Math.round(data.main.temp_min),
                    humidity: `${data.main.humidity}%`,
                    wind: `${Math.round(data.wind.speed)} mph`
                };
            })
            .catch(error => {
                console.error('Weather API error:', error);
                throw error; // Rethrow to be handled by the caller
            });
    }
    
    // Function to update weather info display
    function updateWeatherInfo(weatherData) {
        weatherInfo.innerHTML = `
            <p><strong>Current Weather:</strong> ${weatherData.description}</p>
            <p><strong>Temperature:</strong> ${weatherData.temperature}°F (High: ${weatherData.high}°F / Low: ${weatherData.low}°F)</p>
            <p><strong>Humidity:</strong> ${weatherData.humidity} / <strong>Wind:</strong> ${weatherData.wind}</p>
        `;
    }
    
    // Function to get recommendations based on weather and duration
    function getRecommendations(weatherData, duration) {
        const recommendations = [];
        
        // Basic essentials for all trips
        recommendations.push({
            name: 'Phone charger',
            reason: 'Essential for staying connected',
            icon: '📱'
        });
        
        recommendations.push({
            name: 'Wallet with ID and cards',
            reason: 'For identification and payments',
            icon: '💳'
        });
        
        // Weather-based recommendations
        switch (weatherData.condition) {
            case 'clear':

            case 'sunny':
                recommendations.push({
                    name: 'Sunscreen',
                    reason: 'Protect your skin from UV rays',
                    icon: '☀️'
                });
                recommendations.push({
                    name: 'Sunglasses',
                    reason: 'Protect your eyes on bright days',
                    icon: '😎'
                });
                recommendations.push({
                    name: 'Hat',
                    reason: 'Additional sun protection',
                    icon: '👒'
                });
                break;
                
            case 'rain':
                recommendations.push({
                    name: 'Stay at home',
                    reason: 'Don\'t get yourself wet',
                    icon: '🏠'
                });
                recommendations.push({
                    name: 'Umbrella',
                    reason: 'Stay dry in the rain',
                    icon: '☔'
                });
                recommendations.push({
                    name: 'Waterproof jacket',
                    reason: 'Essential for rainy weather',
                    icon: '🧥'
                });
                recommendations.push({
                    name: 'Waterproof shoes',
                    reason: 'Keep your feet dry',
                    icon: '👟'
                });
                break;
            case 'drizzle':
            case 'thunderstorm':
                recommendations.push({
                    name: 'Stay at home',
                    reason: 'Don\'t get yourself in danger',
                    icon: '🏠'
                });
                recommendations.push({
                    name: 'Umbrella',
                    reason: 'Stay dry in the rain',
                    icon: '☔'
                });
                recommendations.push({
                    name: 'Waterproof jacket',
                    reason: 'Essential for rainy weather',
                    icon: '🧥'
                });
                recommendations.push({
                    name: 'Waterproof shoes',
                    reason: 'Keep your feet dry',
                    icon: '👟'
                });
                break;
                
            case 'clouds':
            case 'cloudy':
                recommendations.push({
                    name: 'Light jacket',
                    reason: 'For variable weather conditions',
                    icon: '🧥'
                });
                recommendations.push({
                    name: 'Umbrella',
                    reason: 'Just in case it rains',
                    icon: '☔'
                });
                break;
                
            case 'snow':
                recommendations.push({
                    name: 'Jacket',
                    reason: 'Stay warm',
                    icon: '🧥'
                });
                recommendations.push({
                    name: 'Gloves',
                    reason: 'Stay warm',
                    icon: '🧤'
                });
                recommendations.push({
                    name: 'Hat and scarf',
                    reason: 'Essential for cold weather',
                    icon: '🧣'
                });
                break;
            case 'snowy':
                recommendations.push({
                    name: 'Winter coat',
                    reason: 'Stay warm in cold temperatures',
                    icon: '🧥'
                });
                recommendations.push({
                    name: 'Gloves',
                    reason: 'Keep your hands warm',
                    icon: '🧤'
                });
                recommendations.push({
                    name: 'Hat and scarf',
                    reason: 'Essential for cold weather',
                    icon: '🧣'
                });
                recommendations.push({
                    name: 'Boots',
                    reason: 'Navigate snow and ice safely',
                    icon: '👢'
                });
                break;
        }
        
        // Temperature-based recommendations
        if (weatherData.temperature > 85) {
            recommendations.push({
                name: 'Water bottle',
                reason: 'Stay hydrated in hot weather',
                icon: '💧'
            });
            recommendations.push({
                name: 'Light clothing',
                reason: 'Stay cool in high temperatures',
                icon: '👕'
            });
        } else if (weatherData.temperature < 50) {
            recommendations.push({
                name: 'Warm layers',
                reason: 'Stay comfortable in cold weather',
                icon: '🧶'
            });
        }
        
        // Duration-based recommendations
        if (duration === 'weekend' || duration === 'week' || duration === 'long') {
            recommendations.push({
                name: 'Toothbrush and toothpaste',
                reason: 'Essential for overnight stays',
                icon: '🪥'
            });
            
            recommendations.push({
                name: 'Change of clothes',
                reason: `For a ${duration === 'weekend' ? '2-3 day' : duration === 'week' ? 'week-long' : 'extended'} trip`,
                icon: '👕'
            });
        }
        
        if (duration === 'week' || duration === 'long') {
            recommendations.push({
                name: 'Laundry supplies',
                reason: 'For longer trips',
                icon: '🧺'
            });
            
            recommendations.push({
                name: 'First aid kit',
                reason: 'For emergencies',
                icon: '🩹'
            });
        }
        
        return recommendations;
    }
    
    // Function to display recommendations
    function displayRecommendations(recommendations) {
        // Clear previous recommendations
        recommendationsList.innerHTML = '';
        
        // Add each recommendation
        recommendations.forEach(recommendation => {
            const recommendationItem = document.createElement('div');
            recommendationItem.className = 'recommendation-item';
            
            recommendationItem.innerHTML = `
                <span class="item-icon">${recommendation.icon}</span>
                <span class="item-name">${recommendation.name}</span>
                <span class="item-reason">${recommendation.reason}</span>
            `;
            
            recommendationsList.appendChild(recommendationItem);
        });
    }
    
    // Fallback function to get mock weather data
    function getMockWeatherData(destination) {
        // This would be used as a fallback if the API call fails
        const weatherOptions = [
            { 
                condition: 'clear', 
                temperature: 75, 
                description: 'Clear skies',
                high: 80,
                low: 65,
                humidity: '45%',
                wind: '5 mph'
            },
            { 
                condition: 'rain', 
                temperature: 55, 
                description: 'Light rain throughout the day',
                high: 60,
                low: 50,
                humidity: '85%',
                wind: '10 mph'
            },
            { 
                condition: 'clouds', 
                temperature: 65, 
                description: 'Partly cloudy with occasional sun',
                high: 70,
                low: 60,
                humidity: '60%',
                wind: '8 mph'
            },
            { 
                condition: 'snow', 
                temperature: 30, 
                description: 'Light snow throughout the day',
                high: 35,
                low: 25,
                humidity: '80%',
                wind: '12 mph'
            }
        ];
        
        // Use destination string to deterministically select weather
        const destinationHash = destination.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const weatherIndex = destinationHash % weatherOptions.length;
        
        return weatherOptions[weatherIndex];
    }
}); 