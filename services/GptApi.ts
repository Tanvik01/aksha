/**
 * Mock GPT API Service
 * Provides offline responses without requiring internet connectivity
 */

// Interface for response
interface GptResponse {
  content: string;
  success: boolean;
}

/**
 * Provide a mock response that simulates an AI model
 */
export async function getGptResponse(userPrompt: string): Promise<GptResponse> {
  console.log('Processing user query locally:', userPrompt);
  
  // Convert prompt to lowercase for easier matching
  const promptLower = userPrompt.toLowerCase().trim();
  
  // Generate response based on content
  let response = generateContextualResponse(promptLower);
  
  return {
    content: response,
    success: true
  };
}

/**
 * Generate emergency guidance locally
 */
export async function getEmergencyGuidance(situation: string): Promise<GptResponse> {
  console.log('Generating emergency guidance locally:', situation);
  
  // Generate specialized emergency response
  const response = generateEmergencyResponse(situation);
  
        return {
    content: response,
          success: true
        };
      }

/**
 * Generate contextual response based on the user's prompt
 */
function generateContextualResponse(prompt: string): string {
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
  
  // Handle other common questions
  if (prompt.includes('what can you do') || prompt.includes('how can you help')) {
    return "I'm designed to provide personal safety guidance, answer questions about the Aksha app features, and offer emergency assistance information. I can help with safety tips for various situations, explain how to use the app's features like SOS alerts and journey tracking, and provide guidance during emergencies.";
  }
  
  if (prompt.includes('thank')) {
    return "You're very welcome! Your safety matters, and I'm here to help anytime you need assistance or information. Is there anything else I can help you with regarding the Aksha app or personal safety?";
  }
  
  // For presentation demo
  if (prompt.includes('demo') || prompt.includes('presentation')) {
    return "This is a demonstration of the Aksha AI assistant. For this presentation, I'm running in offline mode without connecting to external APIs. I can answer questions about personal safety, emergency situations, and using the app's features. Feel free to ask me anything about personal safety!";
  }
  
  // Default response that feels personalized
  return `I understand you're asking about "${prompt}". As your safety assistant, I'm here to provide guidance on personal safety and using the Aksha app effectively. Could you provide more details about your question so I can give you the most helpful information?`;
}

/**
 * Generate emergency response based on the situation
 */
function generateEmergencyResponse(situation: string): string {
  const situationLower = situation.toLowerCase();
  
  if (situationLower.includes('follow')) {
    return "If someone is following you:\n\n1. Stay calm and move to a crowded, well-lit area\n2. Enter a public place like a store or restaurant\n3. Call a trusted contact using Aksha's quick-dial feature\n4. Use the SOS button to alert your emergency contacts\n5. If the threat is immediate, call 911\n\nYour location is being shared with your emergency contacts.";
  } 
  
  if (situationLower.includes('assault')) {
    return "If you're facing potential assault:\n\n1. Use Aksha's SOS button immediately\n2. Create distance between yourself and the threat if possible\n3. Make noise to attract attention\n4. Call 911 or have someone call for you\n5. Your emergency contacts have been alerted with your location";
  } 
  
  if (situationLower.includes('lost') || situationLower.includes('unfamiliar')) {
    return "If you're lost or in an unfamiliar area:\n\n1. Stay in a well-lit, populated area\n2. Use Aksha's map feature to identify your location\n3. Contact a trusted person to help guide you\n4. Consider using a ride-sharing service through the app\n5. Your emergency contacts can see your location through Aksha";
  }
  
  if (situationLower.includes('dark') || situationLower.includes('night')) {
    return "For night safety:\n\n1. Stay in well-lit areas and avoid shortcuts through dark places\n2. Use Aksha's journey tracking to share your route with trusted contacts\n3. Keep your phone charged and easily accessible\n4. Consider carrying a personal alarm or whistle\n5. The SOS button is available for immediate help if needed";
  }
  
  if (situationLower.includes('suspicious') || situationLower.includes('person')) {
    return "If you encounter a suspicious person:\n\n1. Trust your instincts - if something feels wrong, act on it\n2. Move to a public area with other people around\n3. Enter a business or ask for help from someone in uniform\n4. Use Aksha's journey tracking to share your location\n5. If the situation escalates, use the SOS button to alert your contacts";
  }
  
  // Default emergency guidance
  return "Emergency guidance:\n\n1. Stay calm and assess your surroundings\n2. Move to a safe location if possible\n3. Use Aksha's SOS feature to alert your emergency contacts\n4. Call emergency services (911) if in immediate danger\n5. Share your exact location using the app's location sharing feature";
}
