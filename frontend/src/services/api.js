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
  formData.append('username', email); // NOTE: FastAPI OAuth2 expects 'username', not 'email'
  formData.append('password', password);
  
  return axios.post(`${API_BASE_URL}/auth/login`, formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
};

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Handle 401 Unauthorized errors (expired or invalid token)
      if (error.response.status === 401) {
        // Clear token and redirect to login if not already there
        if (window.location.pathname !== '/login') {
          localStorage.removeItem('token');
          // Use a custom event to notify the app about auth error
          window.dispatchEvent(new CustomEvent('auth-error', { detail: 'Session expired' }));
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;