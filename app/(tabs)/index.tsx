import { Image, StyleSheet, Platform, Vibration, Alert, Toast } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const handleEmergencyHelp = async () => {
    // Vibrate in an SOS pattern
    Vibration.vibrate([500, 200, 500, 200, 500]);
    
    // Show emergency alert
    Alert.alert(
      "Emergency Mode Activated",
      "If you're in immediate danger, please call emergency services directly. Your emergency contacts will be notified with your current location.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm Emergency", 
          style: "destructive",
          onPress: async () => {
            await sendEmergencyLocationSMS();
          }
        }
      ]
    );
  };

  const sendEmergencyLocationSMS = async () => {
    try {
      // Get saved emergency contact
      const emergencyContact = await AsyncStorage.getItem('emergencyContact');
      if (!emergencyContact) {
        Toast.show({
          type: 'error',
          text1: 'No emergency contact found',
          text2: 'Please set up an emergency contact in settings',
        });
        return;
      }

      // Get current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Location permission denied',
          text2: 'We need location access to send your position',
        });
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      // Create Google Maps link with location
      const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
      
      // Prepare message
      const message = `EMERGENCY ALERT: I need help! My current location is: ${googleMapsLink}`;
      
      // Check if SMS is available
      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        Toast.show({
          type: 'error',
          text1: 'SMS not available',
          text2: 'SMS functionality is not available on this device',
        });
        return;
      }
      
      // Send SMS
      const { result } = await SMS.sendSMSAsync(
        [emergencyContact],
        message
      );
      
      if (result === 'sent' || result === 'unknown') {
        Toast.show({
          type: 'success',
          text1: 'Emergency Alert Sent',
          text2: 'Your location has been shared with your emergency contact',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed to send message',
          text2: 'Please try again or call emergency services directly',
        });
      }
    } catch (error) {
      console.error('Error sending emergency SMS:', error);
      Toast.show({
        type: 'error',
        text1: 'Error sending emergency alert',
        text2: 'Please call emergency services directly',
      });
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
          Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12'
            })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 2: Explore</ThemedText>
        <ThemedText>
          Tap the Explore tab to learn more about what's included in this starter app.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          When you're ready, run{' '}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
