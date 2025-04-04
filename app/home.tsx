import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  Platform,
  StatusBar,
  Alert,
  Modal,
  FlatList,
  TextInput,
  Vibration,
  Linking,
  NativeModules,
  SafeAreaView
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Contacts from 'expo-contacts';
import * as TaskManager from 'expo-task-manager';
import { useAppAuth } from '../context/AuthContext';
import LocationService, { Location as LocationType } from '../services/LocationService';
import apiClient from '../constants/Api';
import QuickTipsContent from '../components/QuickTipsContent';
import * as Battery from 'expo-battery';
import FloatingChatbot from '../components/FloatingChatbot';
import { useAuth } from '@clerk/clerk-expo';

const { width } = Dimensions.get('window');

// Define the background location task
const LOCATION_TRACKING = 'location-tracking';

TaskManager.defineTask(LOCATION_TRACKING, async ({ data, error }) => {
  if (error) {
    console.error(error);
    return;
  }
  if (data) {
    const { locations } = data;
    const location = locations[0];
    if (location) {
      // Send location to backend
      try {
        const token = await apiClient.getAuthToken();
        if (token) {
          const locationData: LocationType = {
            coordinates: [location.coords.longitude, location.coords.latitude],
            accuracy: location.coords.accuracy,
            altitude: location.coords.altitude,
            heading: location.coords.heading,
            speed: location.coords.speed,
            timestamp: location.timestamp
          };
          
          await LocationService.updateLocation(locationData);
          console.log("Location updated in background:", location.coords);
        }
      } catch (error) {
        console.error("Failed to update location in background:", error);
      }
    }
  }
});

// Create an interface for a custom SMS module
interface SMSInterface {
  sendSMSAsync: (phoneNumbers: string[], message: string) => Promise<{ result: string }>;
}

// Create a mock SMS module
const SMS: SMSInterface = {
  sendSMSAsync: async (phoneNumbers: string[], message: string) => {
    console.log('SMS sending not available. Would send to:', phoneNumbers);
    console.log('Message:', message);
    
    // Try to open the default messaging app if available
    try {
      if (Platform.OS === 'android') {
        const separator = ';';
        const url = `sms:${phoneNumbers.join(separator)}?body=${message}`;
        await Linking.openURL(url);
      } else if (Platform.OS === 'ios') {
        const separator = '&';
        const url = `sms:${phoneNumbers.join(separator)}&body=${message}`;
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening messaging app:', error);
    }
    
    return { result: 'sent' };
  }
};

export default function HomeScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContacts, setFilteredContacts] = useState([]);
  const mapRef = useRef(null);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isCharging, setIsCharging] = useState(false);
  const [batteryAlertShown, setBatteryAlertShown] = useState(false);
  const [lastKnownLocation, setLastKnownLocation] = useState(null);
  const [hasShownContactsPrompt, setHasShownContactsPrompt] = useState(false);

  // Get initial location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation, // Highest possible accuracy
        maximumAge: 10000, // Accept locations no older than 10 seconds
        timeout: 15000 // Wait up to 15 seconds for a location
      });
      setLocation(location);
    })();
  }, []);

  // Get contacts
  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        });

        if (data.length > 0) {
          const contactsWithPhones = data.filter(
            contact => contact.phoneNumbers && contact.phoneNumbers.length > 0
          );
          setContacts(contactsWithPhones);
          setFilteredContacts(contactsWithPhones);
          
          // Check if we already have selected contacts AND haven't shown the prompt yet
          if (selectedContacts.length === 0 && !hasShownContactsPrompt) {
            // Show contact selection modal if no contacts are selected
            setTimeout(() => {
              setShowContactModal(true);
              setHasShownContactsPrompt(true); // Mark that we've shown it
            }, 1000);
          }
        }
      } else {
        Alert.alert(
          "Permission Required",
          "Please allow access to your contacts to use this feature.",
          [{ text: "OK" }]
        );
      }
    })();
  }, [hasShownContactsPrompt]);

  // Filter contacts based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = contacts.filter(contact => 
        contact.name && contact.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(contacts);
    }
  }, [searchQuery, contacts]);

  // Start location tracking
  const startLocationTracking = async () => {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status === 'granted') {
      // Start the foreground service on Android
      if (Platform.OS === 'android') {
        await Location.startLocationUpdatesAsync(LOCATION_TRACKING, {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 5, // Update if moved by 5 meters
          foregroundService: {
            notificationTitle: "Aksha is tracking your location",
            notificationBody: "Your location is being shared with your trusted contacts",
            notificationColor: "#FF6B9C",
          },
        });
      } else {
        // On iOS, we'll use regular updates
        await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 5000,
            distanceInterval: 5
          },
          async (location) => {
            try {
              // Format location for our API
              const locationData: LocationType = {
                coordinates: [location.coords.longitude, location.coords.latitude],
                accuracy: location.coords.accuracy,
                altitude: location.coords.altitude,
                heading: location.coords.heading,
                speed: location.coords.speed,
                timestamp: location.timestamp
              };
              
              // Send to our backend
              await LocationService.updateLocation(locationData);
            } catch (error) {
              console.error("Failed to update location:", error);
            }
          }
        );
      }
      
      setIsTracking(true);
      Alert.alert(
        "Location Tracking Started",
        "Your location is now being shared with your trusted contacts."
      );
    } else {
      Alert.alert(
        "Permission Required",
        "Background location permission is needed to track your location."
      );
    }
  };

  // Stop location tracking
  const stopLocationTracking = async () => {
    await Location.stopLocationUpdatesAsync(LOCATION_TRACKING);
    setIsTracking(false);
    Alert.alert(
      "Location Tracking Stopped",
      "Your location is no longer being shared."
    );
  };

  // Toggle location tracking
  const toggleLocationTracking = () => {
    if (selectedContacts.length === 0) {
      Alert.alert(
        "No Contacts Selected",
        "Please select at least one trusted contact before tracking your location.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Select Contacts", onPress: () => setShowContactModal(true) }
        ]
      );
      return;
    }

    if (isTracking) {
      stopLocationTracking();
    } else {
      startLocationTracking();
    }
  };

  // Watch for location updates in foreground
  useEffect(() => {
    let locationSubscription;
    
    const startWatchingLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000, // Update every second
            distanceInterval: 1, // Update if moved by 1 meter
            mayShowUserSettingsDialog: true // Prompt user to improve location settings if needed
          },
          (newLocation) => {
            setLocation(newLocation);
            // Also store as last known location for emergency use
            setLastKnownLocation(newLocation);
            
            // Animate map to new location
            if (mapRef.current) {
              mapRef.current.animateToRegion({
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
                latitudeDelta: 0.002, // More zoomed in for better accuracy
                longitudeDelta: 0.002,
              }, 1000);
            }
          }
        );
      }
    };
    
    startWatchingLocation();
    
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // Get battery level and set up listeners
  useEffect(() => {
    let batterySubscription = null;

    (async () => {
      // Get initial battery level
      const level = await Battery.getBatteryLevelAsync();
      setBatteryLevel(Math.floor(level * 100));
      
      // Get initial charging status
      const status = await Battery.getBatteryStateAsync();
      setIsCharging(status === Battery.BatteryState.CHARGING || 
                    status === Battery.BatteryState.FULL);
      
      // Set up battery level change listener
      batterySubscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
        const level = Math.floor(batteryLevel * 100);
        setBatteryLevel(level);
        
        // Show alert if battery is below 30% and alert hasn't been shown yet
        if (level <= 30 && !batteryAlertShown && !isCharging) {
          Alert.alert(
            "Low Battery",
            "Your battery is running low. This may affect the app's ability to send emergency alerts. Please charge your device.",
            [{ text: "OK", onPress: () => setBatteryAlertShown(true) }]
          );
        }
        
        // Reset alert shown state if battery goes above 30%
        if (level > 30) {
          setBatteryAlertShown(false);
        }
      });
      
      // Set up charging status change listener
      Battery.addBatteryStateListener(({ batteryState }) => {
        const charging = batteryState === Battery.BatteryState.CHARGING || 
                         batteryState === Battery.BatteryState.FULL;
        setIsCharging(charging);
      });
    })();
    
    // Clean up listeners when component unmounts
    return () => {
      if (batterySubscription) {
        batterySubscription.remove();
      }
    };
  }, [batteryAlertShown, isCharging]);

  // Battery indicator component
  const BatteryIndicator = () => {
    // Determine color based on battery level
    const getBatteryColor = () => {
      if (isCharging) return '#4CAF50'; // Always green when charging
      if (batteryLevel > 50) return '#4CAF50'; // Green
      if (batteryLevel > 30) return '#FFA500'; // Orange
      return '#E63946'; // Red
    };
    
    return (
      <View style={styles.batteryContainer}>
        <View style={styles.battery}>
          <View 
            style={[
              styles.batteryLevel, 
              { width: `${batteryLevel}%`, backgroundColor: getBatteryColor() }
            ]} 
          />
        </View>
        <Text style={styles.batteryText}>
          {batteryLevel}% {isCharging ? '⚡' : ''}
        </Text>
      </View>
    );
  };

  const renderTabs = () => {
    // Return empty view - no more tabs at top
    return null;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getColorFromName = (name) => {
    if (!name) return '#FF6B9C';
    
    const colors = [
      '#FF6B9C',
      '#4285F4',
      '#34A853',
      '#FBBC05',
      '#EA4335',
      '#9C27B0',
      '#00BCD4',
      '#FF9800',
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const toggleContactSelection = (contact) => {
    const isSelected = selectedContacts.some(c => c.id === contact.id);
    
    if (isSelected) {
      // Remove contact
      setSelectedContacts(selectedContacts.filter(c => c.id !== contact.id));
    } else {
      // Add contact (limit to 5)
      if (selectedContacts.length < 5) {
        setSelectedContacts([...selectedContacts, contact]);
      } else {
        Alert.alert(
          "Maximum Contacts Reached",
          "You can select up to 5 trusted contacts. Please remove one before adding another."
        );
      }
    }
  };

  const saveContacts = () => {
    if (selectedContacts.length === 0) {
      Alert.alert(
        "No Contacts Selected",
        "Please select at least one contact to continue.",
        [{ text: "OK" }]
      );
      return;
    }
    
    setShowContactModal(false);
    setHasShownContactsPrompt(true); // Mark that the user has interacted with the prompt
  };

  const renderContactItem = ({ item }) => {
    const isSelected = selectedContacts.some(c => c.id === item.id);
    
    return (
      <TouchableOpacity 
        style={[
          styles.contactItem,
          isSelected && styles.selectedContactItem
        ]}
        onPress={() => toggleContactSelection(item)}
      >
        <View 
          style={[
            styles.contactIcon, 
            { backgroundColor: getColorFromName(item.name) }
          ]}
        >
          <Text style={styles.contactInitial}>
            {getInitials(item.name)}
          </Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactPhone}>
            {item.phoneNumbers && item.phoneNumbers[0] ? item.phoneNumbers[0].number : 'No number'}
          </Text>
        </View>
        <View style={styles.checkboxContainer}>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={24} color="#FF6B9C" />
          )}
          {!isSelected && (
            <View style={styles.emptyCheckbox} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Improved SOS handler with location fix and battery info
  const handleSOS = async () => {
    try {
      // Immediately vibrate phone for user feedback
      Vibration.vibrate([500, 200, 500, 200, 500]);
      
      // Show immediate feedback to the user WITH a cancel button
      Alert.alert(
        "SOS Alert",
        "Sending emergency messages...",
        [
          {
            text: "Cancel",
            onPress: () => console.log("SOS cancelled by user"),
            style: "cancel"
          }
        ],
        { cancelable: true } // Make alert cancellable
      );
      
      // Use last known location if available, otherwise try to get current location
      let currentLocation = lastKnownLocation;
      
      // If no cached location, try to get current location with a timeout
      if (!currentLocation) {
        try {
          console.log("No cached location, getting current location");
          // Set a short timeout for getting location to avoid long delays
          const locationPromise = Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced // Use balanced accuracy for speed
          });
          
          // Set a timeout to ensure we don't wait too long
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Location timeout')), 3000)
          );
          
          // Race between getting location and timeout
          currentLocation = await Promise.race([locationPromise, timeoutPromise]);
        } catch (error) {
          console.warn("Location acquisition failed:", error);
          
          // Last resort - try to get last known location from device
          try {
            console.log("Trying to get last known location from device");
            currentLocation = await Location.getLastKnownPositionAsync();
          } catch (lastLocationError) {
            console.error("Failed to get last known location:", lastLocationError);
          }
        }
      }
      
      // Prepare the message with battery info and location if available
      let message = `EMERGENCY: I need help! Battery: ${batteryLevel}%${isCharging ? ' (Charging)' : ''}`;
      
      if (currentLocation && currentLocation.coords) {
        // Format the coordinates to 6 decimal places for accuracy
        const lat = currentLocation.coords.latitude.toFixed(6);
        const lng = currentLocation.coords.longitude.toFixed(6);
        message += `\n\nMy current location is: https://maps.google.com/?q=${lat},${lng}`;
        
        // Add additional information that might be helpful
        if (currentLocation.coords.accuracy) {
          message += `\nLocation accuracy: ~${Math.round(currentLocation.coords.accuracy)}m`;
        }
        
        // Add timestamp of when location was acquired
        const timestamp = currentLocation.timestamp
          ? new Date(currentLocation.timestamp).toLocaleTimeString()
          : new Date().toLocaleTimeString();
        message += `\nTime: ${timestamp}`;
      } else {
        message += "\n\nLocation unavailable. Please call me for more information.";
      }
      
      console.log("SOS message:", message);
      
      // Send SMS to emergency contacts directly from device
      if (selectedContacts.length > 0) {
        // Extract phone numbers from contacts
        const phoneNumbers = [];
        selectedContacts.forEach(contact => {
          if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
            phoneNumbers.push(contact.phoneNumbers[0].number);
          }
        });
        
        if (phoneNumbers.length > 0) {
          try {
            // Use our custom SMS module with a shorter timeout
            console.log("Sending SMS to:", phoneNumbers);
            SMS.sendSMSAsync(phoneNumbers, message)
              .then(({ result }) => {
                console.log("SMS result:", result);
                
                // Show success message after SMS is sent
                Alert.alert(
                  "SOS Alert Sent",
                  "Your emergency contacts have been notified." +
                  (currentLocation && currentLocation.coords ? "" : " However, your location couldn't be included."),
                  [{ text: "OK" }]
                );
              })
              .catch(error => {
                console.error("SMS sending error:", error);
                Alert.alert(
                  "SMS Sending Issue",
                  "There was a problem sending SMS. Please try calling emergency services directly.",
                  [{ text: "OK" }]
                );
              });
          } catch (smsError) {
            console.error("SMS error:", smsError);
            Alert.alert(
              "SMS Error",
              "Could not send SMS. Please call emergency services directly.",
              [{ text: "OK" }]
            );
          }
        }
      } else {
        Alert.alert(
          "No Emergency Contacts",
          "You haven't selected any emergency contacts. Please add trusted contacts to use the SOS feature.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Add Contacts", onPress: () => setShowContactModal(true) }
          ]
        );
      }
    } catch (error) {
      console.error("SOS error:", error);
      Alert.alert(
        "SOS Error",
        "There was an error sending your SOS alert. Please try calling emergency services directly.",
        [{ text: "OK" }]
      );
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      // Use Clerk's signOut function to properly log out
      await signOut();
      
      // Navigate back to the login/welcome screen
      router.replace('/');
    } catch (error) {
      console.error('Error signing out:', error);
      // Show an error message if logout fails
      Alert.alert(
        'Logout Failed',
        'There was a problem logging out. Please try again.'
      );
    }
  };

  const renderHelpLine = () => {
    return (
      <View style={styles.helpLineContent}>
        <Text style={styles.helpLineHeader}>Emergency Helplines</Text>
        <Text style={styles.helpLineSubheader}>Tap any card to call directly</Text>
        
        {/* Main Emergency Services */}
        <TouchableOpacity
          style={styles.emergencyCard}
          onPress={() => Linking.openURL('tel:112')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#E63946', '#F87171']}
            style={styles.emergencyCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.emergencyCardContent}>
              <View style={styles.emergencyCardIconContainer}>
                <Ionicons name="call" size={28} color="#FFF" />
              </View>
              <View style={styles.emergencyCardText}>
                <Text style={styles.emergencyCardTitle}>Emergency Services</Text>
                <Text style={styles.emergencyCardNumber}>112</Text>
                <Text style={styles.emergencyCardDescription}>
                  National Emergency Number
                </Text>
              </View>
              <View style={styles.callNowButton}>
                <Text style={styles.callNowText}>CALL NOW</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
        
        {/* Women's Helpline */}
        <TouchableOpacity
          style={styles.helplineCard}
          onPress={() => Linking.openURL('tel:1091')}
          activeOpacity={0.8}
        >
          <View style={styles.helplineCardContent}>
            <View style={[styles.helplineCardIcon, { backgroundColor: '#FF6B9C' }]}>
              <MaterialCommunityIcons name="shield-account" size={24} color="#FFF" />
            </View>
            <View style={styles.helplineCardText}>
              <Text style={styles.helplineCardTitle}>Women's Helpline</Text>
              <Text style={styles.helplineCardNumber}>1091</Text>
              <Text style={styles.helplineCardDescription}>National Women Commission Helpline</Text>
            </View>
            <Ionicons name="call-outline" size={24} color="#FF6B9C" />
          </View>
        </TouchableOpacity>
        
        {/* Domestic Violence */}
        <TouchableOpacity
          style={styles.helplineCard}
          onPress={() => Linking.openURL('tel:181')}
          activeOpacity={0.8}
        >
          <View style={styles.helplineCardContent}>
            <View style={[styles.helplineCardIcon, { backgroundColor: '#7209B7' }]}>
              <MaterialIcons name="home" size={24} color="#FFF" />
            </View>
            <View style={styles.helplineCardText}>
              <Text style={styles.helplineCardTitle}>Domestic Violence</Text>
              <Text style={styles.helplineCardNumber}>181</Text>
              <Text style={styles.helplineCardDescription}>Women's Helpline Against Violence</Text>
            </View>
            <Ionicons name="call-outline" size={24} color="#7209B7" />
          </View>
        </TouchableOpacity>
        
        {/* Child Helpline */}
        <TouchableOpacity
          style={styles.helplineCard}
          onPress={() => Linking.openURL('tel:1098')}
          activeOpacity={0.8}
        >
          <View style={styles.helplineCardContent}>
            <View style={[styles.helplineCardIcon, { backgroundColor: '#4361EE' }]}>
              <MaterialCommunityIcons name="human-child" size={24} color="#FFF" />
            </View>
            <View style={styles.helplineCardText}>
              <Text style={styles.helplineCardTitle}>Child Helpline</Text>
              <Text style={styles.helplineCardNumber}>1098</Text>
              <Text style={styles.helplineCardDescription}>Emergency services for children in distress</Text>
            </View>
            <Ionicons name="call-outline" size={24} color="#4361EE" />
          </View>
        </TouchableOpacity>
        
        {/* Medical Emergency */}
        <TouchableOpacity
          style={styles.helplineCard}
          onPress={() => Linking.openURL('tel:108')}
          activeOpacity={0.8}
        >
          <View style={styles.helplineCardContent}>
            <View style={[styles.helplineCardIcon, { backgroundColor: '#057A55' }]}>
              <MaterialCommunityIcons name="ambulance" size={24} color="#FFF" />
            </View>
            <View style={styles.helplineCardText}>
              <Text style={styles.helplineCardTitle}>Medical Emergency</Text>
              <Text style={styles.helplineCardNumber}>108</Text>
              <Text style={styles.helplineCardDescription}>Ambulance & Disaster Management</Text>
            </View>
            <Ionicons name="call-outline" size={24} color="#057A55" />
          </View>
        </TouchableOpacity>
        
        {/* Police */}
        <TouchableOpacity
          style={styles.helplineCard}
          onPress={() => Linking.openURL('tel:100')}
          activeOpacity={0.8}
        >
          <View style={styles.helplineCardContent}>
            <View style={[styles.helplineCardIcon, { backgroundColor: '#1E40AF' }]}>
              <MaterialCommunityIcons name="police-badge" size={24} color="#FFF" />
            </View>
            <View style={styles.helplineCardText}>
              <Text style={styles.helplineCardTitle}>Police</Text>
              <Text style={styles.helplineCardNumber}>100</Text>
              <Text style={styles.helplineCardDescription}>Emergency police services</Text>
            </View>
            <Ionicons name="call-outline" size={24} color="#1E40AF" />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // Add a function to focus on the user's location
  const focusUserLocation = () => {
    if (mapRef.current && location) {
      // Use the map reference to animate to the user's current position
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005, // Zoom level - smaller means more zoomed in
        longitudeDelta: 0.005,
      }, 1000); // Animation duration in ms
    } else {
      console.log("Map reference or location not available");
      // If location isn't available yet, try to get it
      if (!location) {
        (async () => {
          try {
            let currentLocation = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.BestForNavigation
            });
            setLocation(currentLocation);
            
            // Try again after setting location
            if (mapRef.current && currentLocation) {
              mapRef.current.animateToRegion({
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }, 1000);
            }
          } catch (error) {
            console.error("Failed to get location:", error);
            Alert.alert(
              "Location Error",
              "Could not get your current location. Please make sure location services are enabled."
            );
          }
        })();
      }
    }
  };

  // Render tab content based on active tab
  const renderTabContent = () => {
    return (
      <View style={styles.trackMeContent}>
        <BatteryIndicator />
        
        {/* Map View */}
        <View style={styles.mapContainer}>
          {location ? (
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              provider={PROVIDER_GOOGLE}
              showsUserLocation={true}
              showsMyLocationButton={false}
              customMapStyle={darkMapStyle}
            >
              <Marker
                coordinate={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                }}
                title="Your Location"
              />
            </MapView>
          ) : (
            <View style={styles.loadingMap}>
              <Text style={styles.loadingText}>Loading map...</Text>
            </View>
          )}
          
          {/* Custom Track Me button */}
          <TouchableOpacity 
            style={styles.trackMeButton}
            onPress={focusUserLocation}
          >
            <View style={styles.trackMeButtonInner}>
              <Ionicons name="locate" size={24} color="#FF6B9C" />
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Additional content */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Location Tracking</Text>
          <Text style={styles.infoDescription}>
            Your location is being tracked and can be shared in case of emergency.
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <StatusBar 
          barStyle="light-content" 
          backgroundColor="transparent" 
          translucent={true} 
        />
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Aksha</Text>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#999" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          {/* Remove the tab container/renderTabs call */}
          
          {/* Directly render the map content without tabs */}
          <View style={styles.trackMeContent}>
            <BatteryIndicator />
            
            {/* Map View */}
            <View style={styles.mapContainer}>
              {location ? (
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  initialRegion={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  provider={PROVIDER_GOOGLE}
                  showsUserLocation={true}
                  showsMyLocationButton={false}
                  customMapStyle={darkMapStyle}
                >
                  <Marker
                    coordinate={{
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                    }}
                    title="Your Location"
                  />
                </MapView>
              ) : (
                <View style={styles.loadingMap}>
                  <Text style={styles.loadingText}>Loading map...</Text>
                </View>
              )}
              
              {/* Custom Track Me button */}
              <TouchableOpacity 
                style={styles.trackMeButton}
                onPress={focusUserLocation}
              >
                <View style={styles.trackMeButtonInner}>
                  <Ionicons name="locate" size={24} color="#FF6B9C" />
                </View>
              </TouchableOpacity>
            </View>
            
            {/* Additional content */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>Location Tracking</Text>
              <Text style={styles.infoDescription}>
                Your location is being tracked and can be shared in case of emergency.
              </Text>
            </View>
          </View>
          
          {/* Add Emergency Contacts Button */}
          <TouchableOpacity
            style={styles.emergencyContactsButton}
            onPress={() => setShowContactModal(true)}
          >
            <LinearGradient
              colors={['#FF6B9C', '#F24976']}
              style={styles.emergencyContactsGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.emergencyContactsContent}>
                <View style={styles.emergencyContactsIcon}>
                  <Ionicons name="person-add" size={24} color="#fff" />
                </View>
                <View style={styles.emergencyContactsText}>
                  <Text style={styles.emergencyContactsTitle}>
                    {selectedContacts.length > 0 
                      ? `${selectedContacts.length} Emergency Contact${selectedContacts.length > 1 ? 's' : ''}` 
                      : 'Add Emergency Contacts'}
                  </Text>
                  <Text style={styles.emergencyContactsDescription}>
                    {selectedContacts.length > 0 
                      ? 'Tap to manage your contacts' 
                      : 'Add trusted contacts for emergencies'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
          
          {/* Add any additional content here */}
        </ScrollView>
        
        {/* Bottom navigation stays the same */}
        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => router.replace('/home')}
          >
            <Ionicons 
              name="home-outline" 
              size={24} 
              color={pathname === '/home' ? '#FF6B9C' : '#999'} 
            />
            <Text style={[styles.navText, pathname === '/home' && styles.activeNavText]}>Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => router.push('/social')}
          >
            <Ionicons 
              name="people-outline" 
              size={24} 
              color={pathname === '/social' ? '#FF6B9C' : '#999'} 
            />
            <Text style={[styles.navText, pathname === '/social' && styles.activeNavText]}>Social</Text>
          </TouchableOpacity>
          
          <View style={styles.sosButton}>
            <TouchableOpacity 
              onPress={handleSOS}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FF6B9C', '#F24976']}
                style={styles.sosButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="alert" size={32} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.sosText}>SOS</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => router.push('/helpline')}
          >
            <Ionicons 
              name="call-outline" 
              size={24} 
              color={pathname === '/helpline' ? '#FF6B9C' : '#999'} 
            />
            <Text style={[styles.navText, pathname === '/helpline' && styles.activeNavText]}>Helpline</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => router.push('/quicktips')}
          >
            <Ionicons 
              name="information-circle-outline" 
              size={24} 
              color={pathname === '/quicktips' ? '#FF6B9C' : '#999'} 
            />
            <Text style={[styles.navText, pathname === '/quicktips' && styles.activeNavText]}>Tips</Text>
          </TouchableOpacity>
        </View>
        
        {/* Add the floating chatbot */}
        <FloatingChatbot />
      </View>
      
      {/* Contact Selection Modal */}
      <Modal
        visible={showContactModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowContactModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Emergency Contacts</Text>
              <TouchableOpacity onPress={() => setShowContactModal(false)}>
                <Ionicons name="close" size={24} color="#FF6B9C" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.selectedContactsContainer}>
              <Text style={styles.selectedContactsTitle}>
                {selectedContacts.length > 0 
                  ? `Selected Contacts (${selectedContacts.length}/5)` 
                  : 'No contacts selected'}
              </Text>
              <View style={styles.selectedContactsRow}>
                {selectedContacts.length > 0 ? (
                  selectedContacts.map((contact) => (
                    <View key={contact.id} style={styles.selectedContactChip}>
                      <Text style={styles.selectedContactName}>
                        {contact.name.length > 10 
                          ? contact.name.substring(0, 10) + '...' 
                          : contact.name}
                      </Text>
                      <TouchableOpacity 
                        style={styles.removeContactButton}
                        onPress={() => toggleContactSelection(contact)}
                      >
                        <Ionicons name="close-circle" size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noContactsText}>
                    Select up to 5 trusted contacts to alert in emergencies
                  </Text>
                )}
              </View>
            </View>
            
            <View style={styles.searchBarContainer}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search contacts..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              ) : null}
            </View>
            
            <FlatList
              data={filteredContacts}
              renderItem={renderContactItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.contactsList}
            />
            
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={saveContacts}
            >
              <LinearGradient
                colors={['#FF6B9C', '#F24976']}
                style={styles.saveButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.saveButtonText}>Save Contacts</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const darkMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#bdbdbd"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#181818"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1b1b1b"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#2c2c2c"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#8a8a8a"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#373737"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#3c3c3c"
      }
    ]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#4e4e4e"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#000000"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#3d3d3d"
      }
    ]
  }
];

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#121212',
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
    backgroundColor: '#1A1A1A',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B9C',
    fontFamily: 'System',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: '#121212',
  },
  trackMeContent: {
    flex: 1,
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
    position: 'relative', // Ensure this is set for absolute positioning of the locate button
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
  },
  loadingText: {
    color: '#E0E0E0',
  },
  trackMeButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#333',
  },
  trackMeButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: '#CCC',
    lineHeight: 20,
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
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  battery: {
    width: 40,
    height: 20,
    borderWidth: 2,
    borderColor: '#555',
    borderRadius: 4,
    marginRight: 10,
    overflow: 'hidden',
  },
  batteryLevel: {
    height: '100%',
  },
  batteryText: {
    color: '#E0E0E0',
    fontSize: 14,
  },
  helpLineContent: {
    paddingBottom: 20,
  },
  helpLineHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 20,
    marginBottom: 8,
  },
  helpLineSubheader: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },
  emergencyCard: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  emergencyCardGradient: {
    padding: 20,
  },
  emergencyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emergencyCardIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  emergencyCardText: {
    flex: 1,
  },
  emergencyCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  emergencyCardNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  emergencyCardDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  callNowButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  callNowText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  helplineCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#333',
  },
  helplineCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helplineCardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  helplineCardText: {
    flex: 1,
  },
  helplineCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  helplineCardNumber: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  helplineCardDescription: {
    fontSize: 12,
    color: '#999',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  selectedContactItem: {
    backgroundColor: 'rgba(255, 107, 156, 0.1)',
  },
  contactIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactInitial: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'System',
    marginBottom: 4,
  },
  contactPhone: {
    color: '#999',
    fontSize: 14,
    fontFamily: 'System',
  },
  checkboxContainer: {
    width: 30,
    alignItems: 'center',
  },
  emptyCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#666',
  },
  emergencyContactsButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#FF6B9C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  emergencyContactsGradient: {
    padding: 16,
  },
  emergencyContactsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emergencyContactsIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  emergencyContactsText: {
    flex: 1,
  },
  emergencyContactsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  emergencyContactsDescription: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B9C',
  },
  selectedContactsContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  selectedContactsTitle: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 12,
  },
  selectedContactsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  selectedContactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B9C',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedContactName: {
    color: '#FFF',
    marginRight: 4,
    fontSize: 14,
  },
  removeContactButton: {
    padding: 2,
  },
  noContactsText: {
    color: '#888',
    fontStyle: 'italic',
    fontSize: 14,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    margin: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    paddingHorizontal: 10,
    fontSize: 16,
  },
  contactsList: {
    paddingHorizontal: 20,
  },
  saveButton: {
    margin: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 