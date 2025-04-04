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
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Modal
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSignUp } from '@clerk/clerk-expo';

export default function SignupScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Verification states
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { signUp, setActive, isLoaded } = useSignUp();

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

  const handleSignup = async () => {
    if (!isLoaded) {
      return;
    }

    // Dismiss keyboard when submitting
    Keyboard.dismiss();

    try {
      setIsLoading(true);
      
      // Validate required fields
      if (!firstName || !lastName || !email || !password || !confirmPassword) {
        Alert.alert('Error', 'Please fill in all fields');
        setIsLoading(false);
        return;
      }
      
      // Validate password match
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        setIsLoading(false);
        return;
      }
      
      // Validate password strength
      if (password.length < 8) {
        Alert.alert('Error', 'Password must be at least 8 characters long');
        setIsLoading(false);
        return;
      }
      
      console.log("Starting signup process with Clerk...");
      
      // Create the user - this is step 1 of the signup process
      // Removing firstName and lastName as they're not accepted in the initial creation
      const signUpAttempt = await signUp.create({
        emailAddress: email,
        password,
      });
      
      console.log("Signup creation response:", JSON.stringify(signUpAttempt, null, 2));
      
      // Step 2: Force prepare verification regardless of the status
      console.log("Preparing email verification...");
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      console.log("Verification preparation complete");
      
      // Store first name and last name to set after verification (if needed)
      // We can update the user profile after verification is complete
      
      // Show the verification modal
      setShowVerification(true);
      setIsLoading(false);
      
      // Alert user to check their email
      Alert.alert(
        "Check Your Email",
        `We've sent a verification code to ${email}. Please check your inbox and spam folder.`
      );
      
    } catch (error: any) {
      console.error('Signup error:', JSON.stringify(error, null, 2));
      Alert.alert(
        'Signup Failed', 
        error?.errors?.[0]?.message || 'There was a problem creating your account'
      );
      setIsLoading(false);
    }
  };
  
  // Handle verification code submission
  const handleVerifyCode = async () => {
    if (!isLoaded || !signUp) {
      Alert.alert('Error', 'Authentication not ready');
      return;
    }
    
    if (!verificationCode || verificationCode.length < 6) {
      Alert.alert('Error', 'Please enter a valid verification code');
      return;
    }
    
    try {
      setVerifying(true);
      
      console.log("Attempting to verify email with code:", verificationCode);
      
      // Attempt to verify the email with the code
      const verificationResult = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });
      
      console.log("Verification result:", JSON.stringify(verificationResult, null, 2));
      
      // Check if we have a created session or user at this point
      if (verificationResult.createdSessionId) {
        console.log("Session already created, setting active");
        await setActive({ session: verificationResult.createdSessionId });
        setShowVerification(false);
        
        // Navigate to home page
        Alert.alert(
          "Verification Successful",
          "Your account has been verified successfully! You'll be redirected to the home screen.",
          [
            { 
              text: "OK", 
              onPress: () => router.replace('/home')
            }
          ]
        );
        return;
      }
      
      // Check if additional fields are required
      if (verificationResult.status === 'missing_requirements') {
        console.log("Missing requirements. Completing signup with required fields...");
        
        try {
          // Generate username based on email or name
          const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + 
            Math.floor(Math.random() * 1000).toString();
            
          // First, update with just the username which is required by Clerk
          const updatedSignUp = await signUp.update({
            username: username
          });
          
          console.log("Username update result:", JSON.stringify(updatedSignUp, null, 2));
          
          // After username update, try to create a session
          // Using the createdSessionId if available, otherwise redirect to login
          if (updatedSignUp.createdSessionId) {
            console.log("Session ID available after update:", updatedSignUp.createdSessionId);
            
            // Set the session as active
            await setActive({ session: updatedSignUp.createdSessionId });
            
            setShowVerification(false);
            
            // Show success message before redirecting
            Alert.alert(
              "Account Created Successfully",
              "Your account has been created and verified! You'll be redirected to the home screen.",
              [
                { 
                  text: "OK", 
                  onPress: () => {
                    // Navigate to home page
                    router.replace('/home');
                  }
                }
              ]
            );
          } else {
            console.log("No session ID available after update. Redirecting to login.");
            
            // Let the user know they need to log in
            setShowVerification(false);
            Alert.alert(
              "Verification Successful",
              "Your account was created! Please sign in with your credentials.",
              [
                { 
                  text: "Go to Login", 
                  onPress: () => router.replace('/auth/login')
                }
              ]
            );
          }
        } catch (completeError: any) {
          console.error("Error completing signup:", JSON.stringify(completeError, null, 2));
          
          // Check if error is because session already exists
          if (completeError?.errors?.some((e: any) => e.code === 'session_exists')) {
            console.log("Session already exists, redirecting to home");
            setShowVerification(false);
            router.replace('/home');
            return;
          }
          
          // If we failed to complete signup but verification worked,
          // send user to login page
          setShowVerification(false);
          Alert.alert(
            "Verification Successful",
            "Your email was verified, but we couldn't complete your profile setup. Please try logging in.",
            [
              { 
                text: "Go to Login", 
                onPress: () => router.replace('/auth/login')
              }
            ]
          );
        }
      } else if (verificationResult.status === 'complete') {
        // Everything is already complete, check for session
        if (verificationResult.createdSessionId) {
          await setActive({ session: verificationResult.createdSessionId });
          
          setShowVerification(false);
          
          // Show success message before redirecting
          Alert.alert(
            "Verification Successful",
            "Your account has been verified successfully! You'll be redirected to the home screen.",
            [
              { 
                text: "OK", 
                onPress: () => {
                  // Navigate to home page
                  router.replace('/home');
                }
              }
            ]
          );
        } else {
          // No session created, go to login
          setShowVerification(false);
          Alert.alert(
            "Verification Successful",
            "Please log in with your credentials.",
            [
              { 
                text: "Go to Login", 
                onPress: () => router.replace('/auth/login')
              }
            ]
          );
        }
      } else {
        // Some other status we're not handling
        throw new Error(`Unexpected verification status: ${verificationResult.status}`);
      }
    } catch (error: any) {
      console.error('Verification error:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Failed to verify your email';
      let isAlreadyVerified = false;
      
      // Check if this is an "already verified" error or session exists
      if (error?.errors?.some((e: any) => 
        e.code === 'verification_expired' || 
        e.code === 'verification_already_completed' ||
        e.code === 'session_exists' ||
        (e.message && (
          e.message.toLowerCase().includes('already') || 
          e.message.toLowerCase().includes('session exists')
        ))
      )) {
        isAlreadyVerified = true;
        errorMessage = 'Your email was already verified. Redirecting to home...';
        
        // If session already exists, go directly to home
        if (error?.errors?.some((e: any) => e.code === 'session_exists')) {
          setShowVerification(false);
          router.replace('/home');
          return;
        }
      } else if (error?.errors?.[0]?.message) {
        errorMessage = error.errors[0].message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      if (isAlreadyVerified) {
        // If already verified, redirect to login or home
        try {
          setShowVerification(false);
          Alert.alert(
            "Verification Status",
            errorMessage,
            [
              { 
                text: "OK", 
                onPress: () => router.replace('/home')
              }
            ]
          );
        } catch (recoveryError) {
          console.error('Recovery error:', recoveryError);
          Alert.alert(
            "Verification Issue",
            "There was a problem with verification. Please try logging in directly.",
            [
              {
                text: "Go to Login",
                onPress: () => router.replace('/auth/login')
              }
            ]
          );
        }
      } else {
        // Regular error handling for genuinely failed verifications
        Alert.alert('Verification Failed', errorMessage);
      }
    } finally {
      setVerifying(false);
    }
  };
  
  // Request a new verification code
  const resendVerificationCode = async () => {
    if (!isLoaded || !signUp) {
      Alert.alert('Error', 'Authentication not ready');
      return;
    }
    
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      Alert.alert('Success', 'A new verification code has been sent to your email');
    } catch (error) {
      console.error('Error resending verification code:', error);
      Alert.alert('Error', 'Failed to send a new verification code');
    }
  };

  // Render verification modal
  const renderVerificationModal = () => (
    <Modal
      visible={showVerification}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowVerification(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.verificationModal}>
          <Text style={styles.verificationTitle}>Verify Your Email</Text>
          <Text style={styles.verificationSubtitle}>
            We've sent a verification code to {email}. 
            Please enter the code below to verify your account.
          </Text>
          
          <View style={styles.codeInputContainer}>
            <TextInput
              style={styles.codeInput}
              placeholder="Enter verification code"
              placeholderTextColor="#777"
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
          </View>
          
          <TouchableOpacity 
            style={styles.verifyButton} 
            onPress={handleVerifyCode}
            disabled={verifying}
          >
            <LinearGradient
              colors={['#FF6B9C', '#F24976']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.verifyButtonGradient}
            >
              {verifying ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify Email</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.resendButton} 
            onPress={resendVerificationCode}
            disabled={verifying}
          >
            <Text style={styles.resendButtonText}>Resend Code</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

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
            disabled={isLoading}
          >
            <Ionicons name="arrow-back" size={24} color="#FF6B9C" />
          </TouchableOpacity>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formContainer}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Sign up to get started</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>First Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#FF6B9C" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your first name"
                    placeholderTextColor="#666"
                    value={firstName}
                    onChangeText={setFirstName}
                    selectionColor="#FF6B9C"
                    editable={!isLoading}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Last Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#FF6B9C" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your last name"
                    placeholderTextColor="#666"
                    value={lastName}
                    onChangeText={setLastName}
                    selectionColor="#FF6B9C"
                    editable={!isLoading}
                  />
                </View>
              </View>

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
                    placeholder="Create a password"
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

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#FF6B9C" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor="#666"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    selectionColor="#FF6B9C"
                    editable={!isLoading}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                    disabled={isLoading}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="#999" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                onPress={handleSignup} 
                activeOpacity={0.8} 
                style={styles.buttonContainer}
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
                    <Text style={styles.buttonText}>Sign Up</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <Link href="/auth/login" asChild>
                  <TouchableOpacity disabled={isLoading}>
                    <Text style={styles.loginLink}>Login</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
        
        {/* Verification Modal */}
        {renderVerificationModal()}
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
    paddingBottom: 20,
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
    fontWeight: '500',
    color: '#ddd',
    marginBottom: 8,
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
  buttonContainer: {
    marginTop: 20,
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    fontFamily: 'System',
    color: '#aaa',
    fontSize: 14,
  },
  loginLink: {
    fontFamily: 'System',
    fontWeight: 'bold',
    color: '#FF6B9C',
    fontSize: 14,
  },
  // Verification Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verificationModal: {
    width: '90%',
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  verificationTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  verificationSubtitle: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 25,
    textAlign: 'center',
    lineHeight: 20,
  },
  codeInputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  codeInput: {
    backgroundColor: '#2A2A2A',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 8,
  },
  verifyButton: {
    width: '100%',
    marginBottom: 10,
  },
  verifyButtonGradient: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButton: {
    padding: 10,
  },
  resendButtonText: {
    color: '#FF6B9C',
    fontSize: 14,
  },
}); 