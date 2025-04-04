import React, { createContext, useState, useContext, useEffect } from 'react';
import { ClerkProvider, SignedIn, SignedOut, useAuth, useUser, useSession } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { View, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import AuthService, { User } from '../services/AuthService';

// Clerk token cache
const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

// Get Clerk configuration from environment
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_cHJpbWUtcG9zc3VtLTY4LmNsZXJrLmFjY291bnRzLmRldiQ';

// Auth context type
interface AuthContextType {
  isSignedIn: boolean;
  isLoaded: boolean;
  userId: string | null | undefined;
  loading: boolean;
  backendUser: User | null;
  signOut: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType>({
  isSignedIn: false,
  isLoaded: false,
  userId: null,
  loading: true,
  backendUser: null,
  signOut: async () => {},
});

// Initial route setup
function InitialLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    // Check if user is authenticated
    const inAuthGroup = segments[0] === 'auth';
    
    // Execute after a short delay to allow navigation animations
    setTimeout(() => {
      setLoading(false);
      
      if (isSignedIn && inAuthGroup) {
        // Redirect to home if user is signed in and on auth page
        router.replace('/home');
      } else if (!isSignedIn && !inAuthGroup) {
        // Redirect to sign in if user is not signed in and not on auth page
        router.replace('/');
      }
    }, 500);
  }, [isSignedIn, isLoaded, segments]);

  // Show loading screen during auth check
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#FF6B9C" />
      </View>
    );
  }

  return null;
}

// Main auth provider
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider 
      publishableKey={CLERK_PUBLISHABLE_KEY} 
      tokenCache={tokenCache}
    >
      <AuthProviderInternal>{children}</AuthProviderInternal>
    </ClerkProvider>
  );
}

// Internal provider to handle auth state
function AuthProviderInternal({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, signOut: clerkSignOut } = useAuth();
  const { user } = useUser();
  const { session } = useSession();
  const [loading, setLoading] = useState(true);
  const [backendUser, setBackendUser] = useState<User | null>(null);

  // Authenticate with the backend when Clerk auth changes
  useEffect(() => {
    const syncWithBackend = async () => {
      if (isLoaded && isSignedIn && user) {
        try {
          // Get active session info
          const sessionId = session?.id || undefined;
          const sessionToken = await session?.getToken() || undefined;
          
          console.log('Syncing with backend using Clerk session', { 
            userId: user.id, 
            hasSession: !!session,
            hasSessionToken: !!sessionToken 
          });
          
          // Call our backend to get a JWT token with session info if available
          const userData = await AuthService.login(
            user.id, 
            sessionId, 
            sessionToken
          );
          
          setBackendUser(userData);
          console.log('Successfully authenticated with backend');
        } catch (error) {
          console.error('Failed to authenticate with backend:', error);
          Alert.alert(
            'Authentication Error',
            'Failed to connect to the backend service. Please try again.'
          );
        }
      } else if (isLoaded && !isSignedIn) {
        // Clear backend authentication when signed out of Clerk
        await AuthService.logout();
        setBackendUser(null);
      }

      // Only hide loading after auth is complete
      if (isLoaded) {
        setLoading(false);
      }
    };

    syncWithBackend();
  }, [isSignedIn, isLoaded, user, session]);

  // Custom sign out function that handles both Clerk and our backend
  const signOut = async () => {
    try {
      // First clear our backend token
      await AuthService.logout();
      setBackendUser(null);
      
      // Then sign out from Clerk
      await clerkSignOut();
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  // Create auth context value
  const value: AuthContextType = {
    isSignedIn: isSignedIn || false, // Provide a default value to avoid undefined
    isLoaded: isLoaded,
    userId: user?.id,
    loading,
    backendUser,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      <InitialLayout />
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export const useAppAuth = () => useContext(AuthContext); 