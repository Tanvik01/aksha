import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ChatService, { ChatMessage } from '../services/ChatService';

// Fallback direct connection to Ollama API
const OLLAMA_API_URL = 'http://localhost:11434';
const DEFAULT_MODEL = 'gemma3';

// Direct Ollama API fallback when backend fails
const chatWithOllamaDirect = async (messages: ChatMessage[]): Promise<ChatMessage | null> => {
  try {
    // Format messages for Ollama API
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Add system message if not present
    if (!formattedMessages.find(m => m.role === 'system')) {
      formattedMessages.unshift({
        role: 'system',
        content: 'You are Aksha AI Assistant, an AI helper integrated with the Aksha safety app. Your purpose is to provide detailed, practical information about personal safety, using the app features, and offering step-by-step guidance during emergencies. Be concise but thorough in your responses. Always prioritize user safety and well-being in your advice.'
      });
    }
    
    // Make direct request to Ollama
    const response = await fetch(`${OLLAMA_API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: formattedMessages,
        stream: false,
        options: { temperature: 0.5 }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      role: 'assistant',
      content: data.message?.content || 'Sorry, I couldn\'t generate a response.',
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error directly connecting to Ollama:', error);
    return null;
  }
};

const FloatingChatbot = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useDirectOllama, setUseDirectOllama] = useState(false);
  
  const modalScale = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef<FlatList>(null);

  // Initialize with a welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: 'Hi! I\'m Aksha AI, your personal safety assistant. How can I help you today?',
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
  }, []);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 1) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const toggleModal = () => {
    if (!isModalVisible) {
      setIsModalVisible(true);
      Animated.parallel([
        Animated.timing(modalScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(modalScale, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsModalVisible(false);
      });
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    // Update UI immediately
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputMessage('');
    Keyboard.dismiss();
    setIsLoading(true);

    try {
      let aiMessage: ChatMessage | null = null;
      
      if (useDirectOllama) {
        // Try direct connection to Ollama
        aiMessage = await chatWithOllamaDirect([...messages, userMessage]);
      } else {
        try {
          // Try using the backend service first
          const chatHistory = [...messages, userMessage];
          const response = await ChatService.sendMessage(chatHistory);
          
          if (response && response.messages) {
            const lastAssistantMessage = response.messages.find(msg => msg.role === 'assistant');
            
            if (lastAssistantMessage) {
              aiMessage = {
                role: 'assistant',
                content: lastAssistantMessage.content,
                timestamp: new Date()
              };
            }
          }
        } catch (error) {
          console.error('Backend service failed, trying direct Ollama:', error);
          // If backend service fails, switch to direct Ollama for future messages
          setUseDirectOllama(true);
          // Try direct connection as fallback
          aiMessage = await chatWithOllamaDirect([...messages, userMessage]);
        }
      }
      
      // If we have a response, add it
      if (aiMessage) {
        setMessages(prevMessages => [...prevMessages, aiMessage!]);
      } else {
        // Fallback error message
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again or check if Ollama is running properly on your system.',
          timestamp: new Date()
        };
        setMessages(prevMessages => [...prevMessages, errorMessage]);
      }
    } catch (error) {
      console.error('Failed to get AI response:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please make sure Ollama is running with the gemma3 model using "ollama run gemma3".',
        timestamp: new Date()
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageItem = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isUser = item.role === 'user';
    
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.aiMessageContainer
      ]}>
        {!isUser && (
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#FF6B9C', '#FF3F80']}
              style={styles.avatarGradient}
            >
              <Ionicons name="shield" size={16} color="#FFF" />
            </LinearGradient>
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.aiBubble
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.aiMessageText
          ]}>
            {item.content}
          </Text>
          
          {item.timestamp && (
            <Text style={styles.timestamp}>
              {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <>
      {/* Floating Chat Button */}
      <Animated.View 
        style={[
          styles.floatingButton,
          { transform: [{ scale: buttonScale }] }
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={toggleModal}
        >
          <LinearGradient
            colors={['#FF6B9C', '#FF3F80']}
            style={styles.buttonGradient}
          >
            <Ionicons name="chatbubbles" size={26} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Chat Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={toggleModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContainer}
        >
          <Animated.View 
            style={[
              styles.modalContent,
              { 
                transform: [
                  { scale: modalScale },
                ],
                opacity: modalScale
              }
            ]}
          >
            {/* Chat Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Chat with Aksha AI {useDirectOllama ? '(Direct)' : ''}
              </Text>
              <TouchableOpacity onPress={toggleModal}>
                <Ionicons name="close-circle" size={24} color="#AAA" />
              </TouchableOpacity>
            </View>

            {/* Chat Messages */}
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessageItem}
              keyExtractor={(item, index) => `message-${index}`}
              contentContainerStyle={styles.messagesContainer}
              showsVerticalScrollIndicator={false}
            />
            
            {/* Loading Indicator */}
            {isLoading && (
              <View style={styles.typingIndicator}>
                <Text style={styles.typingText}>Aksha AI is thinking</Text>
                <ActivityIndicator size="small" color="#FF6B9C" />
              </View>
            )}

            {/* Input Area */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Type your message..."
                placeholderTextColor="#999"
                value={inputMessage}
                onChangeText={setInputMessage}
                multiline
                maxLength={500}
              />
              
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !inputMessage.trim() && styles.sendButtonDisabled
                ]}
                onPress={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
              >
                <Ionicons 
                  name="send" 
                  size={20} 
                  color={inputMessage.trim() ? "#FFF" : "#AAA"} 
                />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    width: '90%',
    maxWidth: 360,
    height: 500,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#252525',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  messagesContainer: {
    padding: 15,
    paddingBottom: 10,
    paddingTop: 10,
  },
  messageContainer: {
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
    marginLeft: 50,
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
    marginRight: 50,
  },
  avatarContainer: {
    marginRight: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#252525',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGradient: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    borderRadius: 18,
    padding: 10,
    paddingVertical: 8,
    maxWidth: '100%',
  },
  userBubble: {
    backgroundColor: '#FF6B9C',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#2A2A2A',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFF',
  },
  aiMessageText: {
    color: '#FFF',
  },
  timestamp: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    alignSelf: 'flex-end',
    marginTop: 3,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginLeft: 15,
    marginBottom: 10,
  },
  typingText: {
    color: '#FFF',
    fontSize: 11,
    marginRight: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#252525',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  input: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 40,
    color: '#FFF',
    fontSize: 15,
    maxHeight: 80,
  },
  sendButton: {
    backgroundColor: '#FF6B9C',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#444',
  },
});

export default FloatingChatbot; 