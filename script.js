// Import Auth Service
import { AuthService, ItemService, UserSettingsService } from './appwrite.js';

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

document.addEventListener('DOMContentLoaded', async () => {
    // Check login status first
    if (!await checkLoginStatus()) {
        return; // Don't initialize the app if not logged in
    }

    // DOM Elements
    const addItemForm = document.getElementById('add-item-form');
    const itemNameInput = document.getElementById('item-name');
    const conditionSelect = document.getElementById('condition');
    const remindersList = document.getElementById('reminders-list');
    const currentWeatherDiv = document.getElementById('current-weather');
    const weatherRecommendationsDiv = document.getElementById('weather-recommendations');
    const locationStatusDiv = document.getElementById('location-status');
    const currentLocationDisplayDiv = document.getElementById('current-location-display');
    const distanceFromHomeDiv = document.getElementById('distance-from-home');
    const homeLocationForm = document.getElementById('home-location-form');
    const locationInput = document.getElementById('location-input');
    const useCurrentLocationBtn = document.getElementById('use-current-location');
    const homeLocationDisplay = document.getElementById('home-location-display');

    // App State
    let items = [];
    let currentLocation = null;
    let currentLocationAddress = null;
    let homeLocation = null;
    let currentWeather = null;
    let weatherCondition = '';
    let temperature = 0;
    let isWatchingLocation = false;
    let distanceFromHome = 0;
    // Add tracking variables to prevent notification flickering
    let leavingHomeStatus = false;
    let lastNotificationTime = {
        'leaving-home': 0,
        'rain': 0,
        'hot': 0,
        'cold': 0,
        'always': 0
    };
    let notificationCooldown = 30000; // Reduced to 30 seconds between notifications

    // Initialize
    initialize();

    // Login check function
    async function checkLoginStatus() {
        try {
            const isLoggedIn = await AuthService.isLoggedIn();
            
            if (!isLoggedIn) {
                // Redirect to login page if not logged in
                window.location.href = 'login.html';
                return false;
            }
            
            // User is logged in, display user info in the header
            await displayUserInfo();
            return true;
        } catch (error) {
            console.error('Error checking login status:', error);
            window.location.href = 'login.html';
            return false;
        }
    }

    async function displayUserInfo() {
        try {
            // Get user info from Appwrite
            const user = await AuthService.getCurrentUser();
            
            // Create user info display and logout button if they don't exist
            if (!document.querySelector('.user-info')) {
                const header = document.querySelector('header');
                
                const userInfoDiv = document.createElement('div');
                userInfoDiv.className = 'user-info';
                
                // Show user's name or email
                const userName = user.name || user.email || 'User';
                
                userInfoDiv.innerHTML = `
                    <p>Welcome, ${userName} <button id="logout-btn" class="logout-btn">Logout</button></p>
                `;
                
                header.appendChild(userInfoDiv);
                
                // Add logout button event listener
                document.getElementById('logout-btn').addEventListener('click', handleLogout);
            }
        } catch (error) {
            console.error('Error displaying user info:', error);
        }
    }

    async function handleLogout() {
        try {
            // Logout from Appwrite
            await AuthService.logout();
            
            // Redirect to login page
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Error logging out:', error);
            alert('There was an error logging out. Please try again.');
        }
    }

    async function initialize() {
        try {
            // Load saved items from Appwrite
            const savedItems = await ItemService.getItems();
            if (savedItems && savedItems.length > 0) {
                items = savedItems;
            }
            
            // Load home location from Appwrite
            homeLocation = await UserSettingsService.getHomeLocation();
            
            // Render items and display home location
            renderItems();
            
            // Display saved home location if exists
            if (homeLocation) {
                homeLocationDisplay.innerHTML = `<p>Home location: ${homeLocation.displayName}</p>`;
            }
            
            // Request permissions and initialize services
            requestNotificationPermission();
            initializeGeolocation();
            
            // Set up event listeners
            addItemForm.addEventListener('submit', handleAddItem);
            homeLocationForm.addEventListener('submit', handleSetHomeLocation);
            useCurrentLocationBtn.addEventListener('click', handleUseCurrentLocation);
        } catch (error) {
            console.error('Error initializing app:', error);
        }
    }

    // Notification Permission
    function requestNotificationPermission() {
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Notification permission granted');
                }
            });
        }
    }

    // Geolocation
    function initializeGeolocation() {
        if ('geolocation' in navigator) {
            locationStatusDiv.innerHTML = '<p>Location: Requesting access...</p>';
            
            const options = {
                timeout: 10000,
                maximumAge: 60000,
                enableHighAccuracy: true
            };
            
            navigator.geolocation.getCurrentPosition(
                position => {
                    currentLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    locationStatusDiv.innerHTML = `<p>Location: Access granted</p>`;
                    
                    // Display current location
                    updateCurrentLocationDisplay();
                    
                    // Fetch weather data for current location
                    fetchWeather(currentLocation.latitude, currentLocation.longitude);
                    
                    // Watch for location changes (when user leaves home)
                    if (homeLocation) {
                        watchLocation();
                    }
                },
                error => {
                    handleGeolocationError(error);
                },
                options
            );
        } else {
            locationStatusDiv.innerHTML = '<p>Location: Geolocation not supported by your browser</p>';
            currentLocationDisplayDiv.innerHTML = '<p>Current location: Geolocation not supported by your browser</p>';
        }
    }
    
    function handleGeolocationError(error) {
        let errorMessage = '';
        
        switch(error.code) {
            case error.PERMISSION_DENIED:
                errorMessage = 'User denied the request for geolocation';
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information is unavailable';
                break;
            case error.TIMEOUT:
                errorMessage = 'The request to get user location timed out';
                break;
            case error.UNKNOWN_ERROR:
                errorMessage = 'An unknown error occurred';
                break;
        }
        
        locationStatusDiv.innerHTML = `<p>Location: ${errorMessage}</p>`;
        currentLocationDisplayDiv.innerHTML = `<p>Current location: Unable to access (${errorMessage})</p>`;
        console.error('Geolocation error:', error);
    }

    function updateCurrentLocationDisplay() {
        // Display coordinates initially
        currentLocationDisplayDiv.innerHTML = `
            <p>Current location: ${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)}</p>
        `;
        
        // Try to get an address for the current location
        reverseGeocode(currentLocation.latitude, currentLocation.longitude)
            .then(result => {
                if (result) {
                    currentLocationAddress = result.display_name;
                    currentLocationDisplayDiv.innerHTML = `
                        <p>Current location: ${currentLocationAddress}</p>
                    `;
                }
            })
            .catch(error => {
                console.error('Reverse geocoding error:', error);
            })
            .finally(() => {
                // If we have a home location set, display distance
                if (homeLocation) {
                    updateDistanceFromHome();
                }
            });
    }

    function updateDistanceFromHome() {
        if (!homeLocation || !currentLocation) return;
        
        distanceFromHome = calculateDistance(
            homeLocation.latitude,
            homeLocation.longitude,
            currentLocation.latitude,
            currentLocation.longitude
        );
        
        // Display distance from home
        distanceFromHomeDiv.style.display = 'block';
        
        if (distanceFromHome < 0.062) {
            distanceFromHomeDiv.innerHTML = `<p>Distance from home: You are at home (${(distanceFromHome * 5280).toFixed(0)} feet)</p>`;
        } else {
            distanceFromHomeDiv.innerHTML = `<p>Distance from home: ${distanceFromHome.toFixed(2)} miles</p>`;
        }
    }

    function watchLocation() {
        if (isWatchingLocation) {
            return; // Already watching
        }
        
        isWatchingLocation = true;
        
        // Create debounced handlers
        const debouncedLocationUpdate = debounce((position) => {
            // Update current location
            currentLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            
            // Update the display with new location
            updateCurrentLocationDisplay();
            
            // Calculate distance from home
            if (homeLocation) {
                distanceFromHome = calculateDistance(
                    homeLocation.latitude, 
                    homeLocation.longitude,
                    currentLocation.latitude,
                    currentLocation.longitude
                );
                
                // If user moves out of home area (100 meters or more)
                if (distanceFromHome >= 0.1) {
                    checkAndNotify('leaving-home');
                }
            }
        }, 3000); // Debounce for 3 seconds
        
        // Set up watch with error handling
        const watchId = navigator.geolocation.watchPosition(
            debouncedLocationUpdate,
            (error) => {
                console.error('Location watch error:', error);
                isWatchingLocation = false;
            },
            {
                enableHighAccuracy: true,
                maximumAge: 30000,
                timeout: 27000
            }
        );
        
        // Store watchId for later cleanup
        window.addEventListener('beforeunload', () => {
            navigator.geolocation.clearWatch(watchId);
        });
    }

    // Home Location Handling
    async function handleSetHomeLocation(e) {
        e.preventDefault();
        
        const locationName = locationInput.value.trim();
        
        if (!locationName) {
            alert('Please enter a location name');
            return;
        }
        
        try {
            const locationData = await geocodeLocation(locationName);
            
            if (!locationData) {
                alert('Could not find this location. Please try a different search.');
                return;
            }
            
            const location = {
                latitude: locationData.lat,
                longitude: locationData.lon,
                displayName: locationData.display_name
            };
            
            // Save to Appwrite
            await UserSettingsService.saveHomeLocation(location);
            
            // Update local state
            homeLocation = location;
            
            // Display home location
            homeLocationDisplay.innerHTML = `<p>Home location: ${location.displayName}</p>`;
            
            // Clear input
            locationInput.value = '';
            
            // If we have current location, update distance
            if (currentLocation) {
                updateDistanceFromHome();
            }
            
            // Start watching location if not already
            if (!isWatchingLocation) {
                watchLocation();
            }
        } catch (error) {
            console.error('Error setting home location:', error);
            alert('There was an error setting your home location. Please try again.');
        }
    }

    function handleUseCurrentLocation() {
        if (!currentLocation) {
            homeLocationDisplay.innerHTML = '<p>Home location: Current location not available. Please grant location permission.</p>';
            return;
        }
        
        // Fetch address from coordinates (reverse geocoding)
        reverseGeocode(currentLocation.latitude, currentLocation.longitude)
            .then(result => {
                if (result) {
                    homeLocation = {
                        latitude: currentLocation.latitude,
                        longitude: currentLocation.longitude,
                        displayName: result.display_name
                    };
                    
                    // Save to Appwrite
                    UserSettingsService.saveHomeLocation(homeLocation);
                    
                    // Update display
                    homeLocationDisplay.innerHTML = `<p>Home location: ${homeLocation.displayName}</p>`;
                    
                    // Update distance
                    updateDistanceFromHome();
                    
                    // Start watching location
                    watchLocation();
                }
            })
            .catch(error => {
                console.error('Reverse geocoding error:', error);
                
                // Fallback to coordinates only
                homeLocation = {
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                    displayName: `Latitude: ${currentLocation.latitude.toFixed(4)}, Longitude: ${currentLocation.longitude.toFixed(4)}`
                };
                
                // Save to Appwrite
                UserSettingsService.saveHomeLocation(homeLocation);
                homeLocationDisplay.innerHTML = `<p>Home location: ${homeLocation.displayName}</p>`;
                
                // Update distance
                updateDistanceFromHome();
                
                watchLocation();
            });
    }

    // Geocoding (Location name to coordinates)
    async function geocodeLocation(locationName) {
        // Ensure the location is in the US by appending "USA" if not already specified
        if (!locationName.toLowerCase().includes('usa') && !locationName.toLowerCase().includes('united states')) {
            locationName += ', USA';
        }
        
        // Using OpenStreetMap Nominatim API for geocoding (free and doesn't require API key)
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1&countrycodes=us`);
        
        if (!response.ok) {
            throw new Error('Geocoding service unavailable');
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon),
                display_name: data[0].display_name
            };
        }
        
        return null;
    }
    
    // Reverse Geocoding (Coordinates to address)
    async function reverseGeocode(latitude, longitude) {
        try {
            // Add cache to reduce API calls
            const cacheKey = `geocode_${latitude.toFixed(5)}_${longitude.toFixed(5)}`;
            const cachedResult = sessionStorage.getItem(cacheKey);
            
            if (cachedResult) {
                return JSON.parse(cachedResult);
            }
            
            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
            
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                {
                    headers: { 'User-Agent': 'Unforgettable App' },
                    signal: controller.signal
                }
            );
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Geocoding API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Cache the result
            sessionStorage.setItem(cacheKey, JSON.stringify(data));
            
            return data;
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            return null;
        }
    }

    // Calculate distance between two coordinates in miles
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 3959; // Earth's radius in miles
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // Weather API
    async function fetchWeather(latitude, longitude) {
        try {
            const weatherApiKey = 'bf8a7ecd35def02b02f94cedb999a898'; // Free API key
            const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=imperial&appid=${weatherApiKey}`;
            
            // Add a timeout to the fetch request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch(weatherUrl, { signal: controller.signal });
            clearTimeout(timeoutId); // Clear the timeout if successful
            
            if (!response.ok) {
                throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Update the app state with weather data
            weatherCondition = data.weather[0].main.toLowerCase();
            temperature = data.main.temp;
            
            // Display current weather information
            currentWeatherDiv.innerHTML = `
                <h3>Current Weather</h3>
                <p><strong>Condition:</strong> ${data.weather[0].description}</p>
                <p><strong>Temperature:</strong> ${Math.round(temperature)}°F</p>
                <p><strong>Humidity:</strong> ${data.main.humidity}%</p>
                <p><strong>Wind:</strong> ${Math.round(data.wind.speed)} mph</p>
            `;
            
            // Generate and display weather-specific recommendations
            generateWeatherRecommendations();
            
            // Check if current conditions match any item conditions
            checkWeatherConditions();
            
            return data;
        } catch (error) {
            console.error('Weather API error:', error);
            
            // Display error message
            currentWeatherDiv.innerHTML = `
                <h3>Weather Information</h3>
                <p>Unable to fetch current weather data (${error.message})</p>
                <p>Using default weather values</p>
            `;
            
            // Use default values
            weatherCondition = 'clear';
            temperature = 70;
            
            // Still generate basic recommendations
            generateWeatherRecommendations();
            
            return null;
        }
    }

    function generateWeatherRecommendations() {
        // Clear previous recommendations
        weatherRecommendationsDiv.innerHTML = '<h3>Recommended Items</h3>';
        
        const recommendations = [];
        
        // Recommendations based on weather conditions
        if (weatherCondition.includes('rain') || weatherCondition.includes('drizzle')) {
            recommendations.push('Umbrella', 'Raincoat');
        }
        
        if (weatherCondition.includes('snow')) {
            recommendations.push('Warm jacket', 'Gloves', 'Scarf');
        }
        
        if (temperature > 77) {
            recommendations.push('Sunglasses', 'Sunscreen', 'Hat');
        }
        
        if (temperature < 50) {
            recommendations.push('Warm jacket', 'Gloves');
        }
        
        // Display recommendations
        if (recommendations.length > 0) {
            recommendations.forEach(item => {
                weatherRecommendationsDiv.innerHTML += `
                    <div class="recommendation-item">
                        <p>${item}</p>
                    </div>
                `;
            });
        } else {
            weatherRecommendationsDiv.innerHTML += `<p>No special items needed for current weather</p>`;
        }
    }

    // Items Management
    async function handleAddItem(e) {
        e.preventDefault();
        
        const name = itemNameInput.value.trim();
        const condition = conditionSelect.value;
        
        if (!name) {
            alert('Please enter an item name');
            return;
        }
        
        try {
            // Create the item
            const newItem = {
                name,
                condition
            };
            
            // Save to Appwrite
            const createdItem = await ItemService.createItem(newItem);
            
            // Add to local state (use the returned document from Appwrite)
            items.push(createdItem);
            
            // Clear inputs
            itemNameInput.value = '';
            conditionSelect.value = 'rain';
            
            // Update UI
            renderItems();
        } catch (error) {
            console.error('Error adding item:', error);
            alert('There was an error adding your item. Please try again.');
        }
    }

    async function deleteItem(id) {
        try {
            // Delete from Appwrite
            await ItemService.deleteItem(id);
            
            // Remove from local state
            items = items.filter(item => item.$id !== id);
            
            // Update UI
            renderItems();
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('There was an error deleting the item. Please try again.');
        }
    }

    function renderItems() {
        if (!items.length) {
            remindersList.innerHTML = '<li class="no-items">No items added yet</li>';
            return;
        }
        
        remindersList.innerHTML = items.map(item => `
            <li>
                <span>${item.name}</span>
                <span class="condition">${getConditionText(item.condition)}</span>
                <button class="delete-btn" data-id="${item.$id}">×</button>
            </li>
        `).join('');
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                deleteItem(e.target.dataset.id);
            });
        });
    }

    function getConditionText(condition) {
        const conditions = {
            'leaving-home': 'When leaving home',
            'rain': 'When raining',
            'hot': 'When hot',
            'cold': 'When cold',
            'always': 'Always'
        };
        
        return conditions[condition] || condition;
    }

    // Notification Handling
    function checkWeatherConditions() {
        if (weatherCondition.includes('rain') || weatherCondition.includes('drizzle')) {
            checkAndNotify('rain');
        }
        
        if (temperature > 77) {
            checkAndNotify('hot');
        }
        
        if (temperature < 50) {
            checkAndNotify('cold');
        }
        
        // Always check the "always" condition
        checkAndNotify('always');
    }

    function checkAndNotify(condition) {
        const matchingItems = items.filter(item => item.condition === condition);
        
        if (matchingItems.length > 0) {
            const currentTime = Date.now();
            console.log(`Checking ${condition} notification: Last notified ${(currentTime - lastNotificationTime[condition])/1000}s ago`);
            
            // Check if enough time has passed since the last notification of this type
            if (currentTime - lastNotificationTime[condition] > notificationCooldown) {
                const itemNames = matchingItems.map(item => item.name).join(', ');
                console.log(`Sending notification for: ${condition} - Items: ${itemNames}`);
                
                // Send notification
                sendNotification('Don\'t Forget!', `Remember to take: ${itemNames}`);
                
                // Also show in-app alert for browsers without notification support
                displayInAppReminder(condition, matchingItems);
                
                // Update the last notification time for this condition
                lastNotificationTime[condition] = currentTime;
            }
        }
    }

    function sendNotification(title, body) {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                console.log(`Browser notification sent: ${title} - ${body}`);
                new Notification(title, { body });
            } else if (Notification.permission !== 'denied') {
                // Request permission again if not explicitly denied
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        console.log(`Browser notification sent (after permission): ${title} - ${body}`);
                        new Notification(title, { body });
                    }
                });
            }
        }
    }

    function displayInAppReminder(condition, items) {
        let conditionText = getConditionText(condition);
        
        // Remove any existing reminder with the same condition
        const existingReminders = document.querySelectorAll('.recommendation-item[data-condition]');
        existingReminders.forEach(reminder => {
            if (reminder.getAttribute('data-condition') === condition) {
                reminder.remove();
            }
        });
        
        const reminderDiv = document.createElement('div');
        reminderDiv.classList.add('recommendation-item');
        reminderDiv.setAttribute('data-condition', condition); // Add attribute for identification
        reminderDiv.style.backgroundColor = '#ffe6e6';
        reminderDiv.style.borderLeft = '4px solid #e74c3c';
        
        reminderDiv.innerHTML = `
            <h4>Reminder: ${conditionText}</h4>
            <p>Don't forget: ${items.map(item => item.name).join(', ')}</p>
        `;
        
        // Insert at the top of the recommendations
        if (weatherRecommendationsDiv.firstChild) {
            weatherRecommendationsDiv.insertBefore(reminderDiv, weatherRecommendationsDiv.firstChild);
        } else {
            weatherRecommendationsDiv.appendChild(reminderDiv);
        }
        
        // Remove after a longer time period for better visibility
        setTimeout(() => {
            if (reminderDiv.parentNode) {
                reminderDiv.remove();
            }
        }, 30000); // Increased to 30 seconds for better visibility
    }
}); 