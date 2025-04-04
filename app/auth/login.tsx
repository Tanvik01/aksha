import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  StatusBar,
  Animated,
  Keyboard,
  ActivityIndicator,
  Alert,
  SafeAreaView
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSignIn } from '@clerk/clerk-expo';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { signIn, setActive, isLoaded } = useSignIn();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Add keyboard listeners to adjust UI when keyboard appears/disappears
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        // Keyboard is shown - you can adjust UI here if needed
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        // Keyboard is hidden - you can adjust UI here if needed
      }
    );

    // Clean up listeners
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleLogin = async () => {
    if (!isLoaded) {
      return;
    }

    // Dismiss keyboard when submitting
    Keyboard.dismiss();

    try {
      setIsLoading(true);
      
      // Validate email and password
      if (!email || !password) {
        Alert.alert('Error', 'Please fill in all fields');
        setIsLoading(false);
        return;
      }
      
      // Start the sign-in process with Clerk
      const { createdSessionId, status, firstFactorVerification } = 
        await signIn.create({
          identifier: email,
          password,
        });
      
      if (firstFactorVerification.status === 'failed') {
        Alert.alert('Error', firstFactorVerification.error?.message || 'Invalid credentials');
        setIsLoading(false);
        return;
      }
      
      if (status === 'complete') {
        // Set the new session as active
        await setActive({ session: createdSessionId });
        // Redirect to home page
        router.replace('/home');
      }
      
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Failed', 
        error?.errors?.[0]?.message || 'Please check your credentials and try again'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#121212' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FF6B9C" />
          </TouchableOpacity>

          <View style={styles.formContainer}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#FF6B9C" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  selectionColor="#FF6B9C"
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#FF6B9C" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  selectionColor="#FF6B9C"
                  editable={!isLoading}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  disabled={isLoading}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#999" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotPassword} disabled={isLoading}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleLogin} 
              activeOpacity={0.8} 
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#FF6B9C', '#F24976']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Login</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <Link href="/auth/signup" asChild>
                <TouchableOpacity disabled={isLoading}>
                  <Text style={styles.signupLink}>Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 60,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 30,
  },
  formContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontFamily: 'System',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'System',
    color: '#aaa',
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontFamily: 'System',
    color: '#ddd',
    marginBottom: 8,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    fontFamily: 'System',
    color: '#fff',
  },
  eyeIcon: {
    padding: 10,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 40,
  },
  forgotPasswordText: {
    fontFamily: 'System',
    color: '#FF6B9C',
    fontSize: 14,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#FF6B9C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signupText: {
    fontFamily: 'System',
    color: '#aaa',
    fontSize: 14,
  },
  signupLink: {
    fontFamily: 'System',
    fontWeight: 'bold',
    color: '#FF6B9C',
    fontSize: 14,
  },
}); 