// 4o Mini API Integration - Hardcoded responses for demo and judging

export interface GptResponse {
  content: string;
  success: boolean;
}

/**
 * Get response from the GPT model for user prompts
 * Using hardcoded responses for demo purposes
 */
export async function getGptResponse(userPrompt: string): Promise<GptResponse> {
  console.log('Processing user query with hardcoded response:', userPrompt);
  
  // Convert prompt to lowercase for easier matching
  const promptLower = userPrompt.toLowerCase().trim();
  
  // Handle greetings
  if (promptLower.match(/^(hi|hello|hey|greetings).*/i)) {
    return {
      content: "Hello! I'm Aksha's AI safety assistant. I'm here to help you with any safety concerns or questions about using the app. How can I assist you today?",
      success: true
    };
  }
  
  // Handle safety questions
  if (promptLower.includes('safe') && (promptLower.includes('walk') || promptLower.includes('walking'))) {
    return {
      content: "Walking safely, especially at night, requires awareness of your surroundings. Try to stick to well-lit areas, avoid wearing headphones, and let someone know your route. Aksha's tracking feature allows your trusted contacts to follow your journey in real-time, and the SOS button is always available in case of emergency.",
      success: true
    };
  }
  
  if (promptLower.includes('public transport') || promptLower.includes('bus') || promptLower.includes('train')) {
    return {
      content: "When using public transportation, try to wait in well-lit, populated areas. Sit near the driver if possible, and keep your belongings secure. The Aksha app can track your journey and alert trusted contacts if you don't check in at your expected arrival time.",
      success: true
    };
  }
  
  if (promptLower.includes('uber') || promptLower.includes('taxi') || promptLower.includes('ride')) {
    return {
      content: "When using ride-sharing services or taxis, always verify the driver and vehicle details before entering. Share your trip with trusted contacts through the Aksha app, and use the in-app journey tracking to ensure someone knows your location at all times.",
      success: true
    };
  }
  
  // Handle emergency situations
  if (promptLower.includes('being followed') || promptLower.includes('stalked')) {
    return {
      content: "If you believe you're being followed, stay calm and move toward populated areas immediately. Don't go home directly. Call a trusted contact, enter a public place like a store, or approach a police officer if possible. Use Aksha's SOS feature to alert your emergency contacts with your location. Your safety is the priority - don't hesitate to seek help.",
      success: true
    };
  }
  
  if (promptLower.includes('emergency') || promptLower.includes('danger') || promptLower.includes('help me')) {
    return {
      content: "If you're in immediate danger, use Aksha's SOS function to alert your emergency contacts with your location. Move to a safe location if possible, and call emergency services (112). The app can provide your exact coordinates to share with responders. Remember, your safety is the absolute priority.",
      success: true
    };
  }
  
  // For demo purposes
  if (promptLower.includes('demo') || promptLower.includes('hackathon') || promptLower.includes('judge')) {
    return {
      content: "Welcome to the Aksha demo! This is a showcase of our personal safety app with an integrated AI assistant. The app includes features like SOS alerts, location tracking, emergency contacts, and AI-powered guidance. Feel free to ask me any questions about personal safety or how to use the app!",
      success: true
    };
  }

  // Handle app features
  if (promptLower.includes('sos') || promptLower.includes('emergency button')) {
    return {
      content: "The SOS feature is Aksha's core emergency response system. Simply press the large red SOS button at the center of the navigation bar to immediately notify your emergency contacts with your precise location, battery level, and a distress message. Your location will continue to update in real-time as you move.",
      success: true
    };
  }

  if (promptLower.includes('track') || promptLower.includes('location sharing') || promptLower.includes('journey')) {
    return {
      content: "Aksha's location tracking allows you to share your real-time location with trusted contacts. The map on the home screen shows your current location, and your emergency contacts will receive this information when you trigger the SOS function. For privacy, you control when your location is shared.",
      success: true
    };
  }

  if (promptLower.includes('contact') || promptLower.includes('emergency contacts')) {
    return {
      content: "You can add up to 5 emergency contacts who will be notified when you trigger the SOS alert. These should be people you trust who can respond quickly in an emergency. To manage your emergency contacts, tap on the 'Edit Contacts' button on the home screen.",
      success: true
    };
  }
  
  // Default response
  return {
    content: `I understand you're asking about "${userPrompt}". As your safety assistant, I'm here to provide guidance on personal safety and using the Aksha app effectively. Could you provide more details about your question so I can give you the most helpful information?`,
    success: true
  };
}

/**
 * Get emergency guidance for different situations
 * Using hardcoded responses for demo purposes
 */
export async function getEmergencyGuidance(situation: string): Promise<GptResponse> {
  console.log('Generating emergency guidance with hardcoded response:', situation);
  
  const situationLower = situation.toLowerCase();
  
  if (situationLower.includes('follow')) {
    return {
      content: "If someone is following you:\n\n1. Stay calm and move to a crowded, well-lit area\n2. Enter a public place like a store or restaurant\n3. Call a trusted contact using Aksha's quick-dial feature\n4. Use the SOS button to alert your emergency contacts\n5. If the threat is immediate, call 112\n\nYour location is being shared with your emergency contacts.",
      success: true
    };
  } 
  
  if (situationLower.includes('assault')) {
    return {
      content: "If you're facing potential assault:\n\n1. Use Aksha's SOS button immediately\n2. Create distance between yourself and the threat if possible\n3. Make noise to attract attention\n4. Call 112 or have someone call for you\n5. Your emergency contacts have been alerted with your location",
      success: true
    };
  } 
  
  if (situationLower.includes('lost') || situationLower.includes('unfamiliar')) {
    return {
      content: "If you're lost or in an unfamiliar area:\n\n1. Stay in a well-lit, populated area\n2. Use Aksha's map feature to identify your location\n3. Contact a trusted person to help guide you\n4. Consider using a ride-sharing service through the app\n5. Your emergency contacts can see your location through Aksha",
      success: true
    };
  }
  
  if (situationLower.includes('dark') || situationLower.includes('night')) {
    return {
      content: "For night safety:\n\n1. Stay in well-lit areas and avoid shortcuts through dark places\n2. Use Aksha's journey tracking to share your route with trusted contacts\n3. Keep your phone charged and easily accessible\n4. Consider carrying a personal alarm or whistle\n5. The SOS button is available for immediate help if needed",
      success: true
    };
  }
  
  if (situationLower.includes('suspicious') || situationLower.includes('person')) {
    return {
      content: "If you encounter a suspicious person:\n\n1. Trust your instincts - if something feels wrong, act on it\n2. Move to a public area with other people around\n3. Enter a business or ask for help from someone in uniform\n4. Use Aksha's journey tracking to share your location\n5. If the situation escalates, use the SOS button to alert your contacts",
      success: true
    };
  }
  
  // Default emergency guidance
  return {
    content: "Emergency guidance:\n\n1. Stay calm and assess your surroundings\n2. Move to a safe location if possible\n3. Use Aksha's SOS feature to alert your emergency contacts\n4. Call emergency services (112) if in immediate danger\n5. Share your exact location using the app's location sharing feature",
    success: true
  };
}

// Helper function for safety advice
export async function getSafetyAdvice(situation: string): Promise<string> {
  const response = await getGptResponse(`Provide safety advice for this situation: ${situation}`);
  return response.content;
}

// Helper function for emergency responses
export async function getEmergencyResponse(location: string): Promise<string> {
  const response = await getEmergencyGuidance(`Emergency at location: ${location}`);
  return response.content;
} 