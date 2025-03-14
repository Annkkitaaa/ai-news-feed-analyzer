import { create } from 'zustand';
import api, { loginApi, initializeAuthHeaders } from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  
  // Initialize auth state on store creation
  init: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found in localStorage, not authenticated');
      set({ isAuthenticated: false, user: null });
      return false;
    }
    
    console.log('Token found in localStorage, attempting to validate');
    set({ isAuthenticated: true, loading: true });
    initializeAuthHeaders();
    
    try {
      const response = await api.get('/me');
      console.log('Successfully fetched user data');
      set({ 
        user: response.data, 
        loading: false 
      });
      return true;
    } catch (error) {
      // Token is invalid
      console.error('Error validating token:', error.response?.status, error.message);
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      set({ 
        isAuthenticated: false, 
        user: null, 
        loading: false 
      });
      return false;
    }
  },
  
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      console.log('Attempting login for:', email);
      // Use the special loginApi function
      const response = await loginApi(email, password);
      
      // Store the token and set auth state
      const token = response.data.access_token;
      if (!token) {
        throw new Error("No token received");
      }
      
      console.log('Login successful, token received');
      // Set authenticated immediately to prevent redirects
      set({ isAuthenticated: true });
      
      // Try to fetch user data
      try {
        console.log('Fetching user data after login');
        const userResponse = await api.get('/me');
        set({ 
          user: userResponse.data, 
          loading: false 
        });
        console.log('User data fetched successfully');
      } catch (userError) {
        console.error("Error fetching user data:", userError.response?.status, userError.message);
        // Still keep authenticated since we have a token
        set({ loading: false });
      }
      
      return response.data;
    } catch (error) {
      console.error('Login failed:', error.response?.status, error.message);
      const errorMessage = 
        typeof error.response?.data === 'object' && error.response?.data?.detail 
          ? error.response.data.detail 
          : 'Login failed. Please check your credentials.';
      
      set({ 
        error: errorMessage, 
        loading: false,
        isAuthenticated: false
      });
      throw error;
    }
  },
  
  logout: () => {
    console.log('Logging out, removing token');
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    set({ user: null, isAuthenticated: false });
  },
  
  register: async (userData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/register', userData);
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
      console.log('fetchCurrentUser: No token found');
      set({ user: null, isAuthenticated: false });
      return null;
    }
    
    set({ loading: true, error: null });
    try {
      console.log('fetchCurrentUser: Getting user data');
      const response = await api.get('/me');
      console.log('fetchCurrentUser: Successfully got user data');
      set({ 
        user: response.data, 
        isAuthenticated: true, 
        loading: false 
      });
      return response.data;
    } catch (error) {
      console.error('fetchCurrentUser error:', error.response?.status, error.message);
      // Handle token expiration
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
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
      const response = await api.put('/me', profileData);
      set({ 
        user: response.data, 
        loading: false 
      });
      return response.data;
    } catch (error) {
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
      const response = await api.post('/reset-password', { email });
      set({ loading: false });
      return response.data;
    } catch (error) {
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
      const response = await api.post('/reset-password-confirm', { 
        token, 
        new_password 
      });
      set({ loading: false });
      return response.data;
    } catch (error) {
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