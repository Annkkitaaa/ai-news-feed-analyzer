import { create } from 'zustand';
import api from '../services/api';
import axios from 'axios';

// Helper function to handle login with form data
const loginApi = async (email, password) => {
  const formData = new URLSearchParams();
  formData.append('username', email); // FastAPI OAuth2 expects 'username', not 'email'
  formData.append('password', password);
  
  const response = await axios.post(`${api.defaults.baseURL}/auth/login`, formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  
  return response;
};

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      // Use the special loginApi function that formats data correctly
      const response = await loginApi(email, password);
      
      // Store the token
      const token = response.data.access_token;
      localStorage.setItem('token', token);
      
      // Fetch the user data
      try {
        const userResponse = await api.get('/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        set({ 
          user: userResponse.data, 
          isAuthenticated: true, 
          loading: false 
        });
      } catch (userError) {
        // If fetching user fails, still authenticate with token
        set({ 
          isAuthenticated: true, 
          loading: false 
        });
      }
      
      return response.data;
    } catch (error) {
      // Better error handling to prevent React rendering objects
      const errorMessage = typeof error.response?.data === 'object' && error.response?.data?.detail 
        ? error.response.data.detail 
        : 'Login failed. Please check your credentials.';
      
      set({ 
        error: errorMessage, 
        loading: false 
      });
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, isAuthenticated: false });
  },
  
  register: async (userData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/register', userData);
      set({ loading: false });
      return response.data;
    } catch (error) {
      // Safe error handling for display
      const errorMessage = typeof error.response?.data === 'object' && error.response?.data?.detail 
        ? error.response.data.detail 
        : 'Registration failed. Please try again.';
      
      set({ 
        error: errorMessage, 
        loading: false 
      });
      throw error;
    }
  },
  
  fetchCurrentUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ user: null, isAuthenticated: false });
      return null;
    }
    
    set({ loading: true, error: null });
    try {
      const response = await api.get('/auth/me');
      set({ 
        user: response.data, 
        isAuthenticated: true, 
        loading: false 
      });
      return response.data;
    } catch (error) {
      // Handle token expiration
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        set({ 
          user: null, 
          isAuthenticated: false, 
          loading: false,
          error: null
        });
      } else {
        // Safe error handling for display
        const errorMessage = typeof error.response?.data === 'object' && error.response?.data?.detail 
          ? error.response.data.detail 
          : 'Failed to fetch user data';
        
        set({ 
          error: errorMessage, 
          loading: false 
        });
      }
      throw error;
    }
  },
  
  updateProfile: async (profileData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put('/auth/me', profileData);
      set({ 
        user: response.data, 
        loading: false 
      });
      return response.data;
    } catch (error) {
      // Safe error handling for display
      const errorMessage = typeof error.response?.data === 'object' && error.response?.data?.detail 
        ? error.response.data.detail 
        : 'Failed to update profile';
      
      set({ 
        error: errorMessage, 
        loading: false 
      });
      throw error;
    }
  },
  
  forgotPassword: async (email) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/reset-password', { email });
      set({ loading: false });
      return response.data;
    } catch (error) {
      // Safe error handling for display
      const errorMessage = typeof error.response?.data === 'object' && error.response?.data?.detail 
        ? error.response.data.detail 
        : 'Failed to process forgot password request';
      
      set({ 
        error: errorMessage, 
        loading: false 
      });
      throw error;
    }
  },
  
  resetPassword: async (token, new_password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/reset-password-confirm', { 
        token, 
        new_password 
      });
      set({ loading: false });
      return response.data;
    } catch (error) {
      // Safe error handling for display
      const errorMessage = typeof error.response?.data === 'object' && error.response?.data?.detail 
        ? error.response.data.detail 
        : 'Failed to reset password';
      
      set({ 
        error: errorMessage, 
        loading: false 
      });
      throw error;
    }
  }
}));