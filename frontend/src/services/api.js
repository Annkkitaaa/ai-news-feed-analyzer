import axios from 'axios';

// Get API base URL from environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Special function for login that uses form data instead of JSON
export const loginApi = async (email, password) => {
  const formData = new URLSearchParams();
  formData.append('username', email); // FastAPI OAuth2 expects 'username', not 'email'
  formData.append('password', password);
  
  const response = await axios.post(`${API_BASE_URL}/auth/login`, formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  
  // Immediately set the token for future requests if login successful
  if (response.data && response.data.access_token) {
    const token = response.data.access_token;
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log("Token stored from login:", token.substring(0, 10) + "...");
  }
  
  return response;
};

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Make sure we're using Bearer token format
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log("Request to:", config.url, "with token:", token.substring(0, 10) + "...");
    } else {
      console.warn("No token for request to:", config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("401 Unauthorized response from:", error.config.url);
      // Don't clear token on auth endpoints to prevent login loops
      if (!error.config.url.includes('/auth/login') && !error.config.url.includes('/auth/register')) {
        console.log("Clearing invalid token");
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        // Optionally redirect to login here or dispatch an event
      }
    }
    return Promise.reject(error);
  }
);

// Function to initialize token from localStorage
export const initializeAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return true;
  }
  return false;
};

// Initialize on import
initializeAuthHeaders();

export default api;