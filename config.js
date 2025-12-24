// API Configuration
// Replace 'YOUR-RENDER-URL' with your actual Render backend URL
// Example: https://your-app-name.onrender.com

const API_CONFIG = {
  // Change this to your Render URL
  BASE_URL: window.location.hostname === 'localhost' 
    ? 'http://localhost:3000'
    : 'https://myresearchproj-1.onrender.com', // <- PUT YOUR RENDER URL HERE
  
  // API Endpoints
  ENDPOINTS: {
    PRODUCTS: '/api/products',
    STATS: '/api/stats',
    RECENT_ACTIVITY: '/api/recent-activity',
    HEALTH: '/api/health'
  }
};

// Helper function to build full API URLs
function getApiUrl(endpoint) {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}

// Example usage:
// fetch(getApiUrl(API_CONFIG.ENDPOINTS.PRODUCTS))
//   .then(response => response.json())
//   .then(data => console.log(data));