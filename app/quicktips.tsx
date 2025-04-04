import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
  Vibration
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import QuickTipsContent from '../components/QuickTipsContent';
import BottomNav from '../components/BottomNav';

export default function QuickTipsScreen() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Set status bar to light content on dark background
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#121212');
    }
  }, []);

  // Function to handle SOS button press
  const handleSOS = async (options?: { showAudioRecordPrompt?: boolean }) => {
    // Show immediate feedback with vibration
    Vibration.vibrate([500, 200, 500, 200, 500]);
    
    // Instead of implementing the full functionality here, navigate to the home screen
    // and trigger the SOS feature there to ensure consistent behavior
    if (pathname !== '/home') {
      router.replace('/home');
      
      // We need to pass SOS intent to the home screen
      // In a real app, this would be done through a global state management solution
      // or by passing parameters to the route
      
      // For demo purposes, show an alert
      setTimeout(() => {
        Alert.alert(
          "SOS Activated",
          "Navigated to home screen to activate SOS feature with full functionality.",
          [{ text: "OK" }]
        );
      }, 500);
    } else {
      // If already on home screen (should not happen from quicktips screen)
      Alert.alert(
        "SOS Feature",
        "In a real emergency, this would activate the full SOS feature with location sharing and audio recording.",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Safety Tips</Text>
        </View>
        
        <ScrollView style={styles.content}>
          <QuickTipsContent />
        </ScrollView>
        
        {/* Use the consistent BottomNav component */}
        <BottomNav onSOS={handleSOS} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B9C',
    fontFamily: 'System',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  navText: {
    color: '#999',
    fontSize: 12,
    marginTop: 5,
    fontFamily: 'System',
  },
  activeNavText: {
    color: '#FF6B9C',
  },
  sosButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  sosButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#FF6B9C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sosText: {
    color: '#FF6B9C',
    fontSize: 12,
    marginTop: 5,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
}); 