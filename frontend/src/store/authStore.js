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
      set({ isAuthenticated: false, user: null });
      return false;
    }
    
    set({ isAuthenticated: true, loading: true });
    initializeAuthHeaders();
    
    try {
      const response = await api.get('/auth/me');
      set({ 
        user: response.data, 
        loading: false 
      });
      return true;
    } catch (error) {
      // Token is invalid
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
      // Use the special loginApi function
      const response = await loginApi(email, password);
      
      // Store the token and set auth state
      const token = response.data.access_token;
      if (!token) {
        throw new Error("No token received");
      }
      
      // Set authenticated immediately to prevent redirects
      set({ isAuthenticated: true });
      
      // Try to fetch user data
      try {
        const userResponse = await api.get('/auth/me');
        set({ 
          user: userResponse.data, 
          loading: false 
        });
      } catch (userError) {
        console.error("Error fetching user data:", userError);
        // Still keep authenticated since we have a token
        set({ loading: false });
      }
      
      return response.data;
    } catch (error) {
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
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
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
      const response = await api.put('/auth/me', profileData);
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
      const response = await api.post('/auth/reset-password', { email });
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
      const response = await api.post('/auth/reset-password-confirm', { 
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