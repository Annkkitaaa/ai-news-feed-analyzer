// Add these methods to your existing profileService object
export const profileService = {
    getProfile: async () => {
      const response = await api.get('/profiles/me');
      return response.data;
    },
    
    getAllInterests: async () => {
      const response = await api.get('/profiles/interests');
      return response.data;
    },
    
    createInterest: async (interestData) => {
      const response = await api.post('/profiles/interests', interestData);
      return response.data;
    },
    
    addUserInterest: async (interestId) => {
      const response = await api.post(`/profiles/interests/${interestId}/add`);
      return response.data;
    },
    
    removeUserInterest: async (interestId) => {
      const response = await api.post(`/profiles/interests/${interestId}/remove`);
      return response.data;
    },
    
    getAllNewsSources: async () => {
      const response = await api.get('/profiles/news-sources');
      return response.data;
    },
    
    createNewsSource: async (sourceData) => {
      const response = await api.post('/profiles/news-sources', sourceData);
      return response.data;
    },
    
    addUserNewsSource: async (sourceId) => {
      const response = await api.post(`/profiles/news-sources/${sourceId}/add`);
      return response.data;
    },
    
    removeUserNewsSource: async (sourceId) => {
      const response = await api.post(`/profiles/news-sources/${sourceId}/remove`);
      return response.data;
    },
    
    getReadHistory: async (skip = 0, limit = 50) => {
      const response = await api.get('/profiles/read-history', {
        params: { skip, limit },
      });
      return response.data;
    },
    
    clearReadHistory: async () => {
      const response = await api.delete('/profiles/read-history');
      return response.data;
    },
  };