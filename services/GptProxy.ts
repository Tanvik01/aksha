/**
 * GPT API Proxy Service
 * This service provides an interface to access GPT-like models through various APIs.
 */

// Free public GPT API endpoint - no API key needed
const PUBLIC_GPT_API = 'https://api.tringpt.com/v1/chat/completions';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GPTResponse {
  content: string;
  success: boolean;
}

/**
 * Send a request to a GPT API and get a response
 */
export async function getGptResponse(prompt: string, systemPrompt?: string): Promise<GPTResponse> {
  // Default system prompt if none provided
  const sysPrompt = systemPrompt || 
    "You are Aksha AI Assistant, an AI helper integrated with the Aksha safety app. Your purpose is to provide helpful information about personal safety, using the app features, and offering guidance during emergencies. Be concise, clear, and compassionate in your responses. Always prioritize user safety and well-being in your advice.";
  
  // Try calling the public API first
  try {
    console.log("Trying primary GPT API...");
    
    const response = await fetch(PUBLIC_GPT_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: sysPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return {
          content: data.choices[0].message.content,
          success: true
        };
      }
    }
  } catch (error) {
    console.error("Error calling primary GPT API:", error);
  }
  
  // Try a fallback API if the first one fails
  try {
    console.log("Trying fallback GPT API...");
    
    const response = await fetch('https://free.churchless.tech/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: sysPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return {
          content: data.choices[0].message.content,
          success: true
        };
      }
    }
  } catch (error) {
    console.error("Error calling fallback GPT API:", error);
  }
  
  // Try a third API endpoint that doesn't require API keys
  try {
    console.log("Trying free GPT API...");
    
    const response = await fetch('https://api.deepinfra.com/v1/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-2-70b-chat-hf',
        messages: [
          {
            role: 'system',
            content: sysPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return {
          content: data.choices[0].message.content,
          success: true
        };
      }
    }
  } catch (error) {
    console.error("Error calling free GPT API:", error);
  }
  
  // Return failure if all APIs fail
  return {
    content: "",
    success: false
  };
}

/**
 * Get an emergency response from GPT
 */
export async function getEmergencyResponse(situation: string): Promise<GPTResponse> {
  const emergencyPrompt = `You are an emergency response AI assistant for a personal safety app called Aksha. 
  Provide clear, step-by-step guidance for the following emergency situation. 
  Format your response as a numbered list of actions to take.
  Keep it brief and prioritize the user's immediate safety.`;
  
  return await getGptResponse(`I'm in this emergency situation: ${situation}. What should I do?`, emergencyPrompt);
} 