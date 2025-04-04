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
  Keyboard,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ChatService, { ChatMessage } from '../services/ChatService';
import { useAppAuth } from '../context/AuthContext';

const FloatingChatbot = () => {
  // Get auth context to check if user is logged in
  const { isSignedIn, backendUser } = useAppAuth();
  
  // State for the chat interface
  const [isModalVisible, setModalVisible] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I am Aksha AI Assistant. How can I help you with personal safety today?',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  
  // Animation for the bubble
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef<FlatList>(null);
  
  // Test backend AI connectivity on component mount, but only when authenticated
  useEffect(() => {
    const testAIConnection = async () => {
      // Skip if not signed in
      if (!isSignedIn || !backendUser) {
        console.log('Skipping AI connection test - user not authenticated');
        return;
      }
      
      try {
        const models = await ChatService.getModels();
        console.log('AI connection successful, available models:', models);
      } catch (error) {
        console.error('Error testing AI connection:', error);
      }
    };
    
    testAIConnection();
  }, [isSignedIn, backendUser]);
  
  // Handle animations
  useEffect(() => {
    const pulseAnimation = Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);
    
    // Pulse animation every 3 seconds when modal is closed
    const intervalId = setInterval(() => {
      if (!isModalVisible) {
        pulseAnimation.start();
      }
    }, 3000);
    
    return () => clearInterval(intervalId);
  }, [isModalVisible, scaleAnim]);
  
  // Toggle the chat modal
  const toggleModal = () => {
    // If not signed in, show a message
    if (!isSignedIn || !backendUser) {
      Alert.alert(
        "Authentication Required",
        "Please sign in to use the AI assistant.",
        [{ text: "OK" }]
      );
      return;
    }
    
    if (!isModalVisible) {
      // Opening the modal
      setModalVisible(true);
    } else {
      // Closing the modal
      setModalVisible(false);
    }
  };
  
  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);
  
  // Send message handler
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    if (!isSignedIn || !backendUser) {
      Alert.alert("Authentication Required", "Please sign in to use the AI assistant.");
      return;
    }
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    
    try {
      // Prepare chat history for the API
      const chatHistory = [...messages, userMessage];
      
      // Call the backend API through our service
      const response = await ChatService.sendMessage(chatHistory);
      
      if (response && response.response) {
        setMessages(prevMessages => [
          ...prevMessages, 
          {
            role: 'assistant',
            content: response.response,
            timestamp: new Date()
          }
        ]);
      }
    } catch (error) {
      console.error('Error in chat:', error);
      
      // Add error message
      setMessages(prevMessages => [
        ...prevMessages, 
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };
  
  // Render chat message
  const renderMessageItem = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isUser = item.role === 'user';
    const showTimestamp = index === 0 || 
      (index > 0 && new Date(item.timestamp!).getTime() - new Date(messages[index - 1].timestamp!).getTime() > 60000);
    
    return (
      <View style={styles.messageContainer}>
        {showTimestamp && item.timestamp && (
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
        
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble
        ]}>
          <Text style={styles.messageText}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      {/* Floating chat button */}
      <TouchableOpacity onPress={toggleModal} activeOpacity={0.8}>
        <Animated.View 
          style={[
            styles.chatButton,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <LinearGradient
            colors={['#FF6B9C', '#EE69E1']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="chatbubbles" size={28} color="white" />
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
      
      {/* Chat modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={toggleModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            {/* Chat header */}
            <LinearGradient
              colors={['#FF6B9C', '#EE69E1']}
              style={styles.modalHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Aksha AI Assistant</Text>
                <TouchableOpacity onPress={toggleModal} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
            
            {/* Chat messages */}
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessageItem}
              keyExtractor={(_, index) => index.toString()}
              contentContainerStyle={styles.messagesContainer}
            />
            
            {/* Typing indicator */}
            {isTyping && (
              <View style={styles.typingIndicator}>
                <Text style={styles.typingText}>Aksha is typing</Text>
                <ActivityIndicator size="small" color="#FF6B9C" style={styles.typingDots} />
              </View>
            )}
            
            {/* Input area */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Type your message..."
                placeholderTextColor="#999"
                value={inputMessage}
                onChangeText={setInputMessage}
                multiline
              />
              <TouchableOpacity 
                onPress={handleSendMessage} 
                style={styles.sendButton}
                disabled={!inputMessage.trim() || isTyping}
              >
                <Ionicons 
                  name="send" 
                  size={20} 
                  color={!inputMessage.trim() || isTyping ? "#666" : "#FF6B9C"} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    zIndex: 1000,
  },
  chatButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    marginTop: 50,
    backgroundColor: '#121212',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  messagesContainer: {
    flexGrow: 1,
    padding: 15,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 12,
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    marginBottom: 3,
  },
  userBubble: {
    backgroundColor: '#2A2A2A',
    borderBottomRightRadius: 5,
    alignSelf: 'flex-end',
  },
  assistantBubble: {
    backgroundColor: '#FF6B9C',
    borderBottomLeftRadius: 5,
    alignSelf: 'flex-start',
  },
  messageText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 22,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
    marginBottom: 10,
  },
  typingText: {
    color: '#999',
    fontSize: 14,
    marginRight: 5,
  },
  typingDots: {
    marginLeft: 5,
  },
  timestamp: {
    color: '#999',
    fontSize: 12,
    marginVertical: 8,
    alignSelf: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#222',
    backgroundColor: '#1A1A1A',
  },
  input: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    color: 'white',
    fontSize: 16,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
  },
});

export default FloatingChatbot; 