import apiClient from '../constants/Api';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../constants/Api';

// Define user interface
export interface User {
  _id: string;
  clerkId: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
}

// Response types
interface LoginResponse {
  _id: string;
  clerkId: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  token: string;
}

// Auth service methods
const AuthService = {
  /**
   * Login with Clerk ID and get JWT token from backend
   * @param clerkId The user's Clerk ID
   * @param sessionId Optional Clerk session ID
   * @param sessionToken Optional Clerk session token
   */
  login: async (clerkId: string, sessionId?: string, sessionToken?: string): Promise<User> => {
    try {
      console.log(`Attempting login with clerkId: ${clerkId}`);
      
      // Create login payload with session info if available
      const loginPayload: any = { clerkId };
      if (sessionId) loginPayload.sessionId = sessionId;
      if (sessionToken) loginPayload.sessionToken = sessionToken;
      
      // Send enhanced login request with session info
      const response = await apiClient.post<LoginResponse>('/api/v1/auth/login', loginPayload);
      
      console.log('Login response received from backend');
      
      // Save the JWT token
      await apiClient.setAuthToken(response.token);
      
      // Save user data
      const userData: User = {
        _id: response._id,
        clerkId: response.clerkId,
        firstName: response.firstName,
        lastName: response.lastName,
        email: response.email,
        profilePicture: response.profilePicture,
      };
      
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  /**
   * Get current user data from storage
   */
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const userData = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
      if (!userData) return null;
      
      return JSON.parse(userData) as User;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },
  
  /**
   * Logout from the application
   */
  logout: async (): Promise<void> => {
    try {
      // Clear auth token
      await apiClient.clearAuthToken();
      
      // Clear user data
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error('Logout error:', error);
    }
  },
  
  /**
   * Check if the user is authenticated with a valid token
   */
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = await apiClient.getAuthToken();
      return !!token;
    } catch (error) {
      return false;
    }
  },
  
  /**
   * Get profile data from the backend to verify token
   */
  getProfile: async (): Promise<User> => {
    try {
      const response = await apiClient.get<User>('/api/v1/users/profile');
      return response;
    } catch (error) {
      console.error('Error getting profile:', error);
      throw error;
    }
  }
};

export default AuthService; 