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
      const response = await api.get('/news/personalized');
      set({ personalizedFeed: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch personalized feed', 
        loading: false 
      });
      throw error;
    }
  },
  
  fetchTrendingFeed: async (category = null) => {
    set({ loading: true, error: null });
    try {
      const url = category 
        ? `/news/trending?category=${encodeURIComponent(category)}` 
        : '/news/trending';
      const response = await api.get(url);
      set({ trendingFeed: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch trending feed', 
        loading: false 
      });
      throw error;
    }
  },
  
  fetchCategories: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/news/categories');
      set({ categories: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch categories', 
        loading: false 
      });
      throw error;
    }
  },
  
  fetchNewsById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/news/${id}`);
      set({ currentNews: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch news item', 
        loading: false 
      });
      throw error;
    }
  },
  
  fetchNewsDigest: async (timeframe = 'daily') => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/news/digest/${timeframe}`);
      set({ newsDigest: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch news digest', 
        loading: false 
      });
      throw error;
    }
  },
  
  recordNewsRead: async (newsId) => {
    try {
      await api.post(`/news/${newsId}/read`);
    } catch (error) {
      console.error('Failed to record read status:', error);
    }
  }
}));