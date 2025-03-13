import { create } from 'zustand';
import api from '../services/api';

export const useNewsStore = create((set, get) => ({
  personalizedFeed: [],
  trendingFeed: [],
  categories: [],
  currentNews: null,
  newsDigest: null,
  loading: false,
  error: null,
  
  fetchPersonalizedFeed: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/news/personalized/feed');
      set({ personalizedFeed: response.data, loading: false });
      return response.data;
    } catch (error) {
      console.error("Error fetching personalized feed:", error);
      const errorMessage = 
        typeof error.response?.data === 'object' && error.response?.data?.detail 
          ? error.response.data.detail 
          : 'Failed to fetch personalized feed';
      
      set({ error: errorMessage, loading: false });
      return [];
    }
  },
  
  fetchTrendingFeed: async (category = null) => {
    set({ loading: true, error: null });
    try {
      // Ensure token is set
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn("No token available for fetchTrendingFeed");
        set({ loading: false, error: "Authentication required" });
        return [];
      }
      
      const url = category 
        ? `/news/trending/feed?category=${encodeURIComponent(category)}`
        : '/news/trending/feed';
      
      const response = await api.get(url);
      set({ trendingFeed: response.data, loading: false });
      return response.data;
    } catch (error) {
      console.error("Error fetching trending feed:", error);
      const errorMessage = 
        typeof error.response?.data === 'object' && error.response?.data?.detail 
          ? error.response.data.detail 
          : 'Failed to fetch trending feed';
      
      set({ error: errorMessage, loading: false });
      return [];
    }
  },
  
  fetchCategories: async () => {
    set({ loading: true, error: null });
    try {
      // Ensure token is set
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn("No token available for fetchCategories");
        set({ loading: false, error: "Authentication required" });
        return [];
      }
      
      const response = await api.get('/news/categories/list');
      set({ categories: response.data, loading: false });
      return response.data;
    } catch (error) {
      console.error("Error fetching categories:", error);
      const errorMessage = 
        typeof error.response?.data === 'object' && error.response?.data?.detail 
          ? error.response.data.detail 
          : 'Failed to fetch categories';
      
      set({ error: errorMessage, loading: false });
      return [];
    }
  },
  
  fetchNewsById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/news/${id}`);
      set({ currentNews: response.data, loading: false });
      return response.data;
    } catch (error) {
      const errorMessage = 
        typeof error.response?.data === 'object' && error.response?.data?.detail 
          ? error.response.data.detail 
          : 'Failed to fetch news item';
      
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
  
  fetchNewsDigest: async (timeframe = 'daily') => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/news/digest?timeframe=${timeframe}`);
      set({ newsDigest: response.data, loading: false });
      return response.data;
    } catch (error) {
      const errorMessage = 
        typeof error.response?.data === 'object' && error.response?.data?.detail 
          ? error.response.data.detail 
          : 'Failed to fetch news digest';
      
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
  
  recordNewsRead: async (newsId, durationSeconds = null) => {
    try {
      const data = durationSeconds ? { duration_seconds: durationSeconds } : {};
      await api.post(`/news/${newsId}/read`, data);
      return true;
    } catch (error) {
      console.error('Failed to record read status:', error);
      return false;
    }
  }
}));