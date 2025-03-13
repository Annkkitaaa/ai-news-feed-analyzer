/**
 * Handle API errors in a standardized way
 */
export const handleApiError = (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data } = error.response;
      
      if (status === 401) {
        return 'Authentication error. Please log in again.';
      }
      
      // Generic error with server message if available
      return data.detail || data.message || `Error: ${status}`;
    } else if (error.request) {
      // The request was made but no response was received
      return 'No response from server. Please check your internet connection.';
    } else {
      // Something happened in setting up the request that triggered an Error
      return error.message || 'An unexpected error occurred.';
    }
  };