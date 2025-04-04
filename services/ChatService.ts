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
      // Find the last user message to use as prompt if needed
      const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
      
      if (!lastUserMessage) {
        throw new Error('No user message found in chat history');
      }
      
      // Call the AI chat endpoint with the prompt approach (more reliable)
      const result = await apiClient.post<ChatResponse>('/api/ai/chat', {
        prompt: lastUserMessage.content,
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
      const result = await apiClient.post<EmergencyResponse>('/api/ai/emergency', {
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
      const result = await apiClient.get<ModelsResponse>('/api/ai/models');
      return result.models || [];
    } catch (error) {
      console.error('Error getting AI models:', error);
      return [];
    }
  }
};

export default ChatService; 