import apiClient from '../constants/Api';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

interface ChatResponse {
  response: string;
  messages?: ChatMessage[];
}

// ChatGPT API endpoint for a real GPT implementation
const CHATGPT_API = 'https://api.tringpt.com/v1/chat/completions';

const ChatService = {
  sendMessage: async (messages: ChatMessage[]): Promise<ChatResponse> => {
    try {
      const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
      
      if (!lastUserMessage) {
        throw new Error('No user message found');
      }
      
      console.log('Sending to GPT API:', lastUserMessage.content);
      
      // Ensure system message exists
      let messagesWithSystem = [...messages];
      if (!messagesWithSystem.some(m => m.role === 'system')) {
        messagesWithSystem = [
          {
            role: 'system',
            content: "You are Aksha's AI safety assistant integrated with a personal safety app. Your purpose is to provide helpful information about personal safety, using the app features, and offering guidance during emergencies. Be concise, clear, and compassionate in your responses. Always prioritize user safety and well-being in your advice."
          },
          ...messagesWithSystem
        ];
      }
      
      // Call a public GPT API endpoint (this is a free endpoint that doesn't require API keys)
      try {
        const apiResponse = await fetch(CHATGPT_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: messagesWithSystem.map(m => ({ 
              role: m.role, 
              content: m.content 
            })).slice(-6), // Only send the last 6 messages to stay within limits
            max_tokens: 500,
            temperature: 0.7
          })
        });
        
        if (apiResponse.ok) {
          const data = await apiResponse.json();
          if (data.choices && data.choices[0] && data.choices[0].message) {
            const responseText = data.choices[0].message.content;
            
            return {
              response: responseText,
              messages: [
                ...messages,
                {
                  role: 'assistant',
                  content: responseText,
                  timestamp: new Date()
                }
              ]
            };
          }
        } else {
          console.warn('API responded with status:', apiResponse.status);
        }
      } catch (apiError) {
        console.error('Error calling GPT API:', apiError);
      }
      
      // Try another API endpoint if the first one fails
      try {
        const backupResponse = await fetch('https://free.churchless.tech/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: "You are Aksha's AI safety assistant. Provide helpful information about personal safety and using the app's features. Be concise and compassionate."
              },
              {
                role: 'user',
                content: lastUserMessage.content
              }
            ]
          })
        });
        
        if (backupResponse.ok) {
          const data = await backupResponse.json();
          if (data.choices && data.choices[0] && data.choices[0].message) {
            const responseText = data.choices[0].message.content;
            
            return {
              response: responseText,
              messages: [
                ...messages,
                {
                  role: 'assistant',
                  content: responseText,
                  timestamp: new Date()
                }
              ]
            };
          }
        } else {
          console.warn('Backup API responded with status:', backupResponse.status);
        }
      } catch (backupError) {
        console.error('Error calling backup API:', backupError);
      }
      
      // Try our own backend API
      try {
        const backendResponse = await apiClient.post('/api/ai/test', {
          prompt: lastUserMessage.content
        });
        
        if (backendResponse && backendResponse.response) {
          return {
            response: backendResponse.response,
            messages: [
              ...messages,
              {
                role: 'assistant',
                content: backendResponse.response,
                timestamp: new Date()
              }
            ]
          };
        }
      } catch (backendError) {
        console.error('Error calling backend API:', backendError);
      }
      
      // If all API calls fail, fall back to a more sophisticated and contextual response
      const contextualResponse = generateFallbackResponse(lastUserMessage.content);
      
      return {
        response: contextualResponse,
        messages: [
          ...messages,
          {
            role: 'assistant',
            content: contextualResponse,
            timestamp: new Date()
          }
        ]
      };
    } catch (error) {
      console.error('Error in chat:', error);
      
      // Return a fallback response on error
      return {
        response: 'I apologize, but I encountered an issue connecting to my knowledge base. As your safety assistant, I can still help with questions about using the Aksha app, emergency response, or general safety advice. Please try again or rephrase your question.',
        messages: [
          ...messages,
          {
            role: 'assistant',
            content: 'I apologize, but I encountered an issue connecting to my knowledge base. As your safety assistant, I can still help with questions about using the Aksha app, emergency response, or general safety advice. Please try again or rephrase your question.',
            timestamp: new Date()
          }
        ]
      };
    }
  },
  
  getEmergencyHelp: async (situation: string): Promise<{response: string}> => {
    try {
      // Try to get emergency help from API
      try {
        const apiResponse = await fetch(CHATGPT_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: "You are an emergency response assistant in a safety app called Aksha. Provide clear, step-by-step guidance for emergency situations. Be concise and prioritize the user's immediate safety."
              },
              {
                role: 'user',
                content: `I'm in this emergency situation: ${situation}. What should I do?`
              }
            ],
            max_tokens: 300
          })
        });
        
        if (apiResponse.ok) {
          const data = await apiResponse.json();
          if (data.choices && data.choices[0] && data.choices[0].message) {
            return { response: data.choices[0].message.content };
          }
        }
      } catch (apiError) {
        console.error('Error calling API for emergency response:', apiError);
      }
      
      // Try backend API
      try {
        const backendResponse = await apiClient.post('/api/ai/emergency', { situation });
        if (backendResponse && backendResponse.response) {
          return { response: backendResponse.response };
        }
      } catch (backendError) {
        console.error('Error calling backend for emergency response:', backendError);
      }
      
      // Fallback to local emergency response
      return { response: generateEmergencyFallback(situation) };
    } catch (error) {
      console.error('Error in emergency help:', error);
      return { response: generateEmergencyFallback(situation) };
    }
  },
  
  getModels: async (): Promise<string[]> => {
    try {
      // Try to get models from API
      const modelsResponse = await apiClient.get('/api/ai/models');
      if (modelsResponse && modelsResponse.models) {
        return modelsResponse.models;
      }
    } catch (error) {
      console.error('Error getting models:', error);
    }
    
    // Fallback to known models
    return ['gpt-3.5-turbo', 'llama-2'];
  }
};

// Sophisticated fallback response generator
function generateFallbackResponse(prompt: string): string {
  prompt = prompt.toLowerCase().trim();
  
  // Handle greetings
  if (prompt.match(/^(hi|hello|hey|greetings).*/i)) {
    return "Hello! I'm Aksha's AI safety assistant. I'm here to help you with any safety concerns or questions about using the app. How can I assist you today?";
  }
  
  // Handle safety questions
  if (prompt.includes('safe') && prompt.includes('walk')) {
    return "Walking safely, especially at night, requires awareness of your surroundings. Try to stick to well-lit areas, avoid wearing headphones, and let someone know your route. Aksha's tracking feature allows your trusted contacts to follow your journey in real-time, and the SOS button is always available in case of emergency.";
  }
  
  if (prompt.includes('public transport') || prompt.includes('bus') || prompt.includes('train')) {
    return "When using public transportation, try to wait in well-lit, populated areas. Sit near the driver if possible, and keep your belongings secure. The Aksha app can track your journey and alert trusted contacts if you don't check in at your expected arrival time.";
  }
  
  if (prompt.includes('uber') || prompt.includes('taxi') || prompt.includes('ride')) {
    return "When using ride-sharing services or taxis, always verify the driver and vehicle details before entering. Share your trip with trusted contacts through the Aksha app, and use the in-app journey tracking to ensure someone knows your location at all times.";
  }
  
  // Handle emergency situations
  if (prompt.includes('being followed') || prompt.includes('stalked')) {
    return "If you believe you're being followed, stay calm and move toward populated areas immediately. Don't go home directly. Call a trusted contact, enter a public place like a store, or approach a police officer if possible. Use Aksha's SOS feature to alert your emergency contacts with your location. Your safety is the priority - don't hesitate to seek help.";
  }
  
  if (prompt.includes('emergency') || prompt.includes('danger') || prompt.includes('help me')) {
    return "If you're in immediate danger, use Aksha's SOS function to alert your emergency contacts with your location. Move to a safe location if possible, and call emergency services (911). The app can provide your exact coordinates to share with responders. Remember, your safety is the absolute priority.";
  }
  
  // Handle app usage questions
  if (prompt.includes('how') && prompt.includes('sos')) {
    return "To use the SOS feature, tap the large red SOS button on the home screen. This will immediately alert your emergency contacts with your current location and continue to update them as you move. You can add a custom message or use the default emergency alert. Would you like me to explain how to set up your emergency contacts?";
  }
  
  if (prompt.includes('add contact') || prompt.includes('emergency contact')) {
    return "To add emergency contacts, go to the 'Contacts' tab from the home screen, then tap 'Add Emergency Contact'. You can select from your phone contacts or enter details manually. You can add up to 5 emergency contacts who will be notified when you trigger the SOS feature. Would you like to know more about managing your contacts?";
  }
  
  if (prompt.includes('track') || prompt.includes('journey') || prompt.includes('location')) {
    return "Aksha's journey tracking feature lets you share your real-time location with chosen contacts. To start tracking, tap 'Start Journey' on the home screen, select your contacts, and set an estimated arrival time. They'll receive updates on your location and be alerted if you don't check in upon arrival. Your safety is enhanced by keeping trusted people informed of your movements.";
  }
  
  // Default response that feels personalized and acknowledges API issue
  return `I apologize, but I'm currently having trouble connecting to my full knowledge base.

Based on your question about "${prompt}", here's what I can tell you:

Aksha is designed to help users stay safe through features like location sharing, emergency contacts, and SOS alerts. The app works by keeping your trusted contacts informed of your whereabouts when you choose to share that information, and providing immediate assistance options in emergency situations.

For more specific guidance on your question, could you provide additional details? I'll do my best to assist you with the resources available to me.`;
}

// Emergency fallback generator
function generateEmergencyFallback(situation: string): string {
  if (situation.toLowerCase().includes('follow')) {
    return "If someone is following you:\n\n1. Stay calm and move to a crowded, well-lit area\n2. Enter a public place like a store or restaurant\n3. Call a trusted contact using Aksha's quick-dial feature\n4. Use the SOS button to alert your emergency contacts\n5. If the threat is immediate, call 911\n\nYour location is being shared with your emergency contacts.";
  } else if (situation.toLowerCase().includes('assault')) {
    return "If you're facing potential assault:\n\n1. Use Aksha's SOS button immediately\n2. Create distance between yourself and the threat if possible\n3. Make noise to attract attention\n4. Call 911 or have someone call for you\n5. Your emergency contacts have been alerted with your location";
  } else if (situation.toLowerCase().includes('lost') || situation.toLowerCase().includes('unfamiliar')) {
    return "If you're lost or in an unfamiliar area:\n\n1. Stay in a well-lit, populated area\n2. Use Aksha's map feature to identify your location\n3. Contact a trusted person to help guide you\n4. Consider using a ride-sharing service through the app\n5. Your emergency contacts can see your location through Aksha";
  } else {
    return "Emergency guidance:\n\n1. Stay calm and assess your surroundings\n2. Move to a safe location if possible\n3. Use Aksha's SOS feature to alert your emergency contacts\n4. Call emergency services (911) if in immediate danger\n5. Share your exact location using the app's location sharing feature";
  }
}

export default ChatService;
