import { create } from 'zustand';
import api from '../services/api';
import { profileService } from '../services/profileService';

export const useProfileStore = create((set, get) => ({
  profile: null,
  interests: [],
  newsSources: [],
  readHistory: [],
  loading: false,
  error: null,
  
  fetchProfile: async () => {
    set({ loading: true, error: null });
    try {
      const profile = await profileService.getProfile();
      set({ profile, loading: false });
      return profile;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch profile', 
        loading: false 
      });
      throw error;
    }
  },
  
  fetchAllInterests: async () => {
    set({ loading: true, error: null });
    try {
      const interests = await profileService.getAllInterests();
      set({ interests, loading: false });
      return interests;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch interests', 
        loading: false 
      });
      throw error;
    }
  },
  
  addInterest: async (interestId) => {
    set({ loading: true, error: null });
    try {
      const profile = await profileService.addUserInterest(interestId);
      set({ profile, loading: false });
      return profile;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Failed to add interest', 
        loading: false 
      });
      throw error;
    }
  },
  
  removeInterest: async (interestId) => {
    set({ loading: true, error: null });
    try {
      const profile = await profileService.removeUserInterest(interestId);
      set({ profile, loading: false });
      return profile;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Failed to remove interest', 
        loading: false 
      });
      throw error;
    }
  },
  
  createInterest: async (interestData) => {
    set({ loading: true, error: null });
    try {
      const interest = await profileService.createInterest(interestData);
      set(state => ({ 
        interests: [...state.interests, interest], 
        loading: false 
      }));
      return interest;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Failed to create interest', 
        loading: false 
      });
      throw error;
    }
  },
  
  fetchAllNewsSources: async () => {
    set({ loading: true, error: null });
    try {
      const newsSources = await profileService.getAllNewsSources();
      set({ newsSources, loading: false });
      return newsSources;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch news sources', 
        loading: false 
      });
      throw error;
    }
  },
  
  addNewsSource: async (sourceId) => {
    set({ loading: true, error: null });
    try {
      const profile = await profileService.addUserNewsSource(sourceId);
      set({ profile, loading: false });
      return profile;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Failed to add news source', 
        loading: false 
      });
      throw error;
    }
  },
  
  removeNewsSource: async (sourceId) => {
    set({ loading: true, error: null });
    try {
      const profile = await profileService.removeUserNewsSource(sourceId);
      set({ profile, loading: false });
      return profile;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Failed to remove news source', 
        loading: false 
      });
      throw error;
    }
  },
  
  createNewsSource: async (sourceData) => {
    set({ loading: true, error: null });
    try {
      const source = await profileService.createNewsSource(sourceData);
      set(state => ({ 
        newsSources: [...state.newsSources, source], 
        loading: false 
      }));
      return source;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Failed to create news source', 
        loading: false 
      });
      throw error;
    }
  },
  
  fetchReadHistory: async (skip = 0, limit = 50) => {
    set({ loading: true, error: null });
    try {
      const readHistory = await profileService.getReadHistory(skip, limit);
      set({ readHistory, loading: false });
      return readHistory;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch read history', 
        loading: false 
      });
      throw error;
    }
  },
  
  clearReadHistory: async () => {
    set({ loading: true, error: null });
    try {
      const response = await profileService.clearReadHistory();
      set({ readHistory: [], loading: false });
      return response;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Failed to clear read history', 
        loading: false 
      });
      throw error;
    }
  },
}));