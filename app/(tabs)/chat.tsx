import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
  SafeAreaView,
  StatusBar as RNStatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppAuth } from '../../context/AuthContext';
import ChatService, { ChatMessage } from '../../services/ChatService';
import { ThemedText } from '../../components/ThemedText';
import { StatusBar } from 'expo-status-bar';

export default function ChatScreen() {
  const { backendUser } = useAppAuth();
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const flatListRef = useRef<FlatList>(null);

  // Initialize with a welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: `Hi${backendUser?.firstName ? ' ' + backendUser.firstName : ''}! I'm Aksha AI, your personal safety assistant. How can I help you today?`,
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    setIsInitializing(false);
  }, [backendUser]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && !isInitializing) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isInitializing]);

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
      // Prepare chat history
      const chatHistory = [...messages, userMessage];
      
      // Call AI service
      const response = await ChatService.sendMessage(chatHistory);
      
      // Add AI response to chat
      if (response && response.messages) {
        // Find the last assistant message
        const lastAssistantMessage = response.messages.find(msg => msg.role === 'assistant');
        
        if (lastAssistantMessage) {
          const aiMessage: ChatMessage = {
            role: 'assistant',
            content: lastAssistantMessage.content,
            timestamp: new Date()
          };
          setMessages(prevMessages => [...prevMessages, aiMessage]);
        }
      }
    } catch (error) {
      console.error('Failed to get AI response:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmergencyHelp = async () => {
    // Add user message about emergency
    const userMessage: ChatMessage = {
      role: 'user',
      content: 'I need emergency help!',
      timestamp: new Date()
    };

    // Update UI immediately
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setIsLoading(true);

    try {
      // Call emergency help API
      const response = await ChatService.getEmergencyHelp(
        'User requested emergency help through the app'
      );
      
      // Add AI response
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Failed to get emergency help:', error);
      
      // Fallback emergency message
      const emergencyMessage: ChatMessage = {
        role: 'assistant',
        content: 'If you are in immediate danger, call local emergency services (911 in US/Canada, 112 in EU, or your local emergency number). Stay in a safe location if possible and try to reach out to your emergency contacts.',
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, emergencyMessage]);
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
              <Ionicons name="shield" size={18} color="#FFF" />
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      
      <RNStatusBar 
        barStyle="light-content" 
        backgroundColor="transparent" 
        translucent={true} 
      />
      
      <LinearGradient
        colors={['#FF6B9C', '#FF3F80']}
        style={styles.header}
      >
        <ThemedText type="title" style={styles.headerTitle}>
          Aksha AI Assistant
        </ThemedText>
      </LinearGradient>
      
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item, index) => `message-${index}`}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            isInitializing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B9C" />
                <Text style={styles.loadingText}>Initializing Aksha AI...</Text>
              </View>
            ) : null
          }
        />
        
        {isLoading && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>Aksha AI is thinking</Text>
            <ActivityIndicator size="small" color="#FF6B9C" />
          </View>
        )}
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsContainer}
        >
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={handleEmergencyHelp}
          >
            <Ionicons name="alert-circle" size={16} color="#FF3F80" />
            <Text style={styles.quickActionText}>Emergency Help</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              const message = "What safety features does the app have?";
              setInputMessage(message);
            }}
          >
            <Ionicons name="shield" size={16} color="#FF3F80" />
            <Text style={styles.quickActionText}>Safety Features</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              const message = "How do I add emergency contacts?";
              setInputMessage(message);
            }}
          >
            <Ionicons name="people" size={16} color="#FF3F80" />
            <Text style={styles.quickActionText}>Emergency Contacts</Text>
          </TouchableOpacity>
        </ScrollView>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask Aksha AI..."
            placeholderTextColor="#666"
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 400,
  },
  loadingText: {
    color: '#FFF',
    marginTop: 12,
  },
  messageContainer: {
    marginVertical: 8,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#252525',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    borderRadius: 20,
    padding: 12,
    paddingVertical: 10,
    maxWidth: '100%',
  },
  userBubble: {
    backgroundColor: '#FF6B9C',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#252525',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFF',
  },
  aiMessageText: {
    color: '#FFF',
  },
  timestamp: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginLeft: 16,
    marginBottom: 8,
  },
  typingText: {
    color: '#FFF',
    fontSize: 12,
    marginRight: 8,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
  },
  quickActionButton: {
    backgroundColor: '#252525',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  quickActionText: {
    color: '#FFF',
    marginLeft: 6,
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  input: {
    flex: 1,
    backgroundColor: '#252525',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 40,
    color: '#FFF',
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#FF6B9C',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#333',
  },
}); 