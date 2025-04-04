import apiClient from '../constants/Api';

// Types for location data
export interface Location {
  coordinates: [number, number]; // [longitude, latitude]
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp?: number;
}

// Types for response objects 
interface UpdateLocationResponse {
  success: boolean;
  message: string;
}

// Location service methods
const LocationService = {
  /**
   * Update the user's current location
   */
  updateLocation: async (location: Location): Promise<UpdateLocationResponse> => {
    try {
      return await apiClient.post<UpdateLocationResponse>('/api/v1/users/location', { location });
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  },

  /**
   * Start SOS mode - alert emergency contacts
   */
  triggerSOS: async (location: Location): Promise<UpdateLocationResponse> => {
    try {
      return await apiClient.post<UpdateLocationResponse>('/api/v1/alerts/sos', { 
        location,
        message: 'I need help! This is my current location.'
      });
    } catch (error) {
      console.error('Error triggering SOS:', error);
      throw error;
    }
  },

  /**
   * End SOS mode
   */
  endSOS: async (): Promise<UpdateLocationResponse> => {
    try {
      return await apiClient.post<UpdateLocationResponse>('/api/v1/alerts/sos/end', {});
    } catch (error) {
      console.error('Error ending SOS:', error);
      throw error;
    }
  },

  /**
   * Report an unsafe location
   */
  reportUnsafeLocation: async (
    location: Location, 
    description: string
  ): Promise<UpdateLocationResponse> => {
    try {
      return await apiClient.post<UpdateLocationResponse>('/api/v1/alerts/unsafe', {
        location,
        description
      });
    } catch (error) {
      console.error('Error reporting unsafe location:', error);
      throw error;
    }
  }
};

export default LocationService; 