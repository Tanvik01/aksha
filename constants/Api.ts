import * as SecureStore from 'expo-secure-store';

// API URL configuration
// Use environment variable if available, or fallback to default
// Update to the correct IP address that matches your backend server
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.52.118:5001';

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'aksha_auth_token',
  USER_DATA: 'aksha_user_data',
};

// HTTP request client with authentication
const apiClient = {
  /**
   * Get saved authentication token
   */
  getAuthToken: async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  },

  /**
   * Set authentication token
   */
  setAuthToken: async (token: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
    } catch (error) {
      console.error('Error saving auth token:', error);
    }
  },

  /**
   * Clear authentication token
   */
  clearAuthToken: async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error clearing auth token:', error);
    }
  },

  /**
   * Make authenticated API request
   */
  request: async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    try {
      const token = await apiClient.getAuthToken();
      
      // Prepare headers with authentication token
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      };

      // Debug log
      console.log(`Making request to ${API_URL}${endpoint}`);
      console.log('Headers:', headers);
      console.log('Body:', options.body);

      // Make the fetch request
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      // Debug log the response
      console.log(`Response status: ${response.status}`);
      
      // Parse response
      const data = await response.json();
      
      // Debug log the data
      console.log('Response data:', data);

      // Handle non-success status codes
      if (!response.ok) {
        // Special handling for 401 Unauthorized (invalid/expired token)
        if (response.status === 401) {
          await apiClient.clearAuthToken();
        }
        
        throw new Error(data.message || 'API request failed');
      }

      return data as T;
    } catch (error) {
      console.error(`API request to ${endpoint} failed:`, error);
      throw error;
    }
  },

  // Convenience methods for different HTTP methods
  get: <T>(endpoint: string, options?: RequestInit) => 
    apiClient.request<T>(endpoint, { ...options, method: 'GET' }),
    
  post: <T>(endpoint: string, body: any, options?: RequestInit) => 
    apiClient.request<T>(endpoint, { 
      ...options, 
      method: 'POST', 
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      }
    }),
    
  put: <T>(endpoint: string, body: any, options?: RequestInit) => 
    apiClient.request<T>(endpoint, { 
      ...options, 
      method: 'PUT', 
      body: JSON.stringify(body),
    }),
    
  delete: <T>(endpoint: string, options?: RequestInit) => 
    apiClient.request<T>(endpoint, { ...options, method: 'DELETE' }),
};

export default apiClient; 