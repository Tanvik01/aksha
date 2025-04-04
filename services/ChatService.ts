import apiClient from '../constants/Api';

// Message type definition
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

interface ChatResponse {
  response: string;
  messages: ChatMessage[];
}

interface EmergencyResponse {
  response: string;
}

interface ModelsResponse {
  models: string[];
}

// Chat service to interact with AI endpoints
const ChatService = {
  /**
   * Send a message to the AI chat backend
   * @param messages Chat history including the new message
   * @param model Optional model name
   */
  sendMessage: async (messages: ChatMessage[], model?: string): Promise<ChatResponse> => {
    try {
      // Call the AI chat endpoint
      const result = await apiClient.post<ChatResponse>('/ai/chat', {
        messages,
        model: model || 'gemma3'  // Use Gemma3 as default model
      });
      
      return result;
    } catch (error) {
      console.error('Error sending message to AI:', error);
      throw error;
    }
  },
  
  /**
   * Get emergency help from the AI
   * @param situation Description of the emergency situation
   * @param location Optional location information
   */
  getEmergencyHelp: async (situation: string, location?: string): Promise<EmergencyResponse> => {
    try {
      const result = await apiClient.post<EmergencyResponse>('/ai/emergency', {
        situation,
        location
      });
      
      return result;
    } catch (error) {
      console.error('Error getting emergency help:', error);
      throw error;
    }
  },
  
  /**
   * Get available AI models
   */
  getModels: async (): Promise<string[]> => {
    try {
      const result = await apiClient.get<ModelsResponse>('/ai/models');
      return result.models || [];
    } catch (error) {
      console.error('Error getting AI models:', error);
      return [];
    }
  }
};

export default ChatService; 