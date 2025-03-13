import { create } from 'zustand';
import api from '../services/api';

export const useSubscriptionStore = create((set, get) => ({
  subscription: null,
  loading: false,
  error: null,
  
  fetchSubscriptionStatus: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/subscriptions/status');
      set({ subscription: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch subscription status', 
        loading: false 
      });
      throw error;
    }
  },
  
  updateSubscription: async (subscriptionData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put('/subscriptions/update', subscriptionData);
      set({ subscription: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Failed to update subscription', 
        loading: false 
      });
      throw error;
    }
  },
  
  sendManualDigest: async (timeframe) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/subscriptions/send-digest/${timeframe}`);
      set({ loading: false });
      return response.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Failed to send digest', 
        loading: false 
      });
      throw error;
    }
  }
}));