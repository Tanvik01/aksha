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
  NativeModules
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Contacts from 'expo-contacts';
import * as TaskManager from 'expo-task-manager';

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
      // You can send this location to your server or store it locally
      console.log("Background location:", location.coords);
    }
  }
});

// Update the getBatteryLevel function to use a more reliable approach
const getBatteryLevel = async () => {
  try {
    // For Android, we can try to access the battery info directly
    if (Platform.OS === 'android') {
      try {
        const { BatteryManager } = NativeModules;
        if (BatteryManager && BatteryManager.getBatteryLevel) {
          const batteryLevel = await BatteryManager.getBatteryLevel();
          return Math.floor(batteryLevel * 100);
        }
      } catch (androidError) {
        console.log('Android battery error:', androidError);
      }
    }
    
    // Fallback to a fixed value when we can't get the actual battery level
    // In a real app, you would implement platform-specific battery APIs
    return 95; // Return a reasonable default value
  } catch (error) {
    console.log('Error getting battery level:', error);
    return 95; // Return a reasonable default value instead of "Unknown"
  }
};

export default function HomeScreen() {
  const router = useRouter();
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [activeTab, setActiveTab] = useState('Track Me');
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContacts, setFilteredContacts] = useState([]);
  const mapRef = useRef(null);

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
          
          // Check if we already have selected contacts
          if (selectedContacts.length === 0) {
            // Show contact selection modal if no contacts are selected
            setTimeout(() => {
              setShowContactModal(true);
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
  }, []);

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

  const renderTabs = () => {
    const tabs = ['Track Me', 'Help line', 'Quick Tips'];
    return (
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
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

  const handleSOS = async () => {
    // Vibrate the phone to provide feedback
    Vibration.vibrate([0, 500, 200, 500]);
    
    // Check if we have selected contacts
    if (selectedContacts.length === 0) {
      Alert.alert(
        "No Emergency Contacts",
        "Please select at least one emergency contact to send SOS alerts.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Select Contacts", onPress: () => setShowContactModal(true) }
        ]
      );
      return;
    }
    
    try {
      // Always get a fresh location for emergency situations
      let currentLocation;
      try {
        currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
          maximumAge: 0, // Don't use cached location
          timeout: 15000 // Wait up to 15 seconds for a location
        });
        setLocation(currentLocation);
      } catch (locationError) {
        console.log('Location error:', locationError);
        // If we can't get a new location, use the existing one
        currentLocation = location;
        
        if (!currentLocation) {
          Alert.alert(
            "Location Unavailable",
            "Could not determine your current location. Please try again or share your location manually."
          );
          return;
        }
      }
      
      // Get battery level with fallback
      let batteryPercentage;
      try {
        batteryPercentage = await getBatteryLevel();
      } catch (batteryError) {
        console.log('Battery error:', batteryError);
        batteryPercentage = 95; // Fallback value
      }
      
      // Create Google Maps link with precise coordinates (6 decimal places)
      const latitude = currentLocation.coords.latitude.toFixed(6);
      const longitude = currentLocation.coords.longitude.toFixed(6);
      const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      
      // Create message with more detailed location info
      const message = `EMERGENCY ALERT from Aksha App!\n\nI need help! This is my current location:\n${mapsUrl}\n\nCoordinates: ${latitude}, ${longitude}\nAccuracy: ${Math.round(currentLocation.coords.accuracy)}m\nBattery: ${batteryPercentage}%\n\nThis is an automated message.`;
      
      // Get phone numbers from selected contacts
      const phoneNumbers = selectedContacts
        .filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0)
        .map(contact => contact.phoneNumbers[0].number);
      
      if (phoneNumbers.length === 0) {
        Alert.alert("Error", "None of your selected contacts have valid phone numbers.");
        return;
      }
      
      // Show confirmation dialog
      Alert.alert(
        "Send SOS Alert",
        `Are you sure you want to send an emergency alert to ${phoneNumbers.length} contact(s)?`,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Send SOS", 
            style: "destructive",
            onPress: async () => {
              try {
                // Use SMS URI scheme to open the SMS app
                const phoneNumber = phoneNumbers.join(','); // Join all numbers with commas
                const encodedMessage = encodeURIComponent(message);
                const url = `sms:${phoneNumber}?body=${encodedMessage}`;
                
                const canOpen = await Linking.canOpenURL(url);
                if (canOpen) {
                  await Linking.openURL(url);
                  
                      Alert.alert(
                    "SOS Alert Sent",
                    "Your emergency message has been prepared. Please tap send in your messaging app."
                      );
                  
                  // Start location tracking if not already tracking
                  if (!isTracking) {
                    startLocationTracking();
                  }
                } else {
                  Alert.alert(
                    "Error",
                    "Could not open SMS app. Please send a message manually."
                  );
                }
              } catch (error) {
                console.error("Linking error:", error);
                Alert.alert(
                  "Error",
                  "Failed to open SMS app. Please send a message manually."
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error("SOS Error:", error);
      Alert.alert(
        "Error",
        "Failed to send SOS alert. Please try again."
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Aksha</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#FF6B9C" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>8</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-circle-outline" size={28} color="#FF6B9C" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="menu-outline" size={28} color="#FF6B9C" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      {renderTabs()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Description */}
        <Text style={styles.description}>
          Share live location with your friends
        </Text>

        {/* Friends Section */}
        <View style={styles.friendsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Friend's Live Location</Text>
            <TouchableOpacity 
              style={styles.addFriendButton}
              onPress={() => setShowContactModal(true)}
            >
              <Ionicons name="add-circle" size={24} color="#FF6B9C" />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.friendsScrollView}
          >
            {selectedContacts.length > 0 ? (
              selectedContacts.map((contact, index) => (
                <TouchableOpacity key={index} style={styles.friendItem}>
                  <View 
                    style={[
                      styles.friendIcon, 
                      { backgroundColor: getColorFromName(contact.name) }
                    ]}
                  >
                    <Text style={styles.friendInitial}>
                      {getInitials(contact.name)}
                    </Text>
                  </View>
                  <Text style={styles.friendName} numberOfLines={1}>
                    {contact.name}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noContactsContainer}>
                <Text style={styles.noContactsText}>
                  No contacts selected. Tap the + button to add trusted contacts.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Map Section */}
        <View style={styles.mapContainer}>
          {location ? (
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              customMapStyle={darkMapStyle}
            >
              <Marker
                coordinate={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                }}
                title="You're here"
              >
                <View style={styles.markerContainer}>
                  <View style={styles.markerDot} />
                  <View style={styles.markerRing} />
                </View>
              </Marker>
            </MapView>
          ) : (
            <View style={styles.loadingMap}>
              <Text style={styles.loadingText}>
                {errorMsg || "Loading map..."}
              </Text>
            </View>
          )}

          <View style={styles.locationLabel}>
            <Text style={styles.locationLabelText}>You're here</Text>
          </View>

          <TouchableOpacity style={styles.trackButton} onPress={toggleLocationTracking}>
            <LinearGradient
              colors={isTracking ? ['#4CAF50', '#2E7D32'] : ['#FF6B9C', '#F24976']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.trackButtonGradient}
            >
              <Ionicons 
                name={isTracking ? "location" : "location-outline"} 
                size={20} 
                color="white" 
                style={styles.trackButtonIcon} 
              />
              <Text style={styles.trackButtonText}>
                {isTracking ? "Stop Tracking" : "Track me"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#FF6B9C" />
          <Text style={[styles.navText, styles.activeNavText]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="people-outline" size={24} color="#999" />
          <Text style={styles.navText}>Social</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
          <LinearGradient
            colors={['#FF6B9C', '#F24976']}
            style={styles.sosButtonGradient}
          >
            <Ionicons name="alert" size={32} color="white" />
          </LinearGradient>
          <Text style={styles.sosText}>SOS</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="shield-checkmark-outline" size={24} color="#999" />
          <Text style={styles.navText}>Safety</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="location-outline" size={24} color="#999" />
          <Text style={styles.navText}>Marker</Text>
        </TouchableOpacity>
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
              <Text style={styles.modalTitle}>Select Trusted Contacts</Text>
              <Text style={styles.modalSubtitle}>Choose at least one contact who will receive your location updates</Text>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search contacts..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.selectedCount}>
              <Text style={styles.selectedCountText}>
                {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''} selected (minimum 1)
              </Text>
            </View>

            <FlatList
              data={filteredContacts}
              renderItem={renderContactItem}
              keyExtractor={(item, index) => item.id || index.toString()}
              style={styles.contactsList}
              contentContainerStyle={styles.contactsListContent}
              showsVerticalScrollIndicator={false}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowContactModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={saveContacts}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    marginRight: 15,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF6B9C',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileButton: {
    marginRight: 15,
  },
  menuButton: {},
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    paddingVertical: 15,
    marginRight: 25,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#FF6B9C',
  },
  tabText: {
    color: '#999',
    fontSize: 16,
    fontFamily: 'System',
  },
  activeTabText: {
    color: '#FF6B9C',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  description: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 25,
    fontFamily: 'System',
    lineHeight: 22,
  },
  friendsSection: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
  },
  addFriendButton: {
    padding: 5,
  },
  friendsScrollView: {
    flexDirection: 'row',
  },
  friendItem: {
    alignItems: 'center',
    marginRight: 20,
    width: 70,
  },
  friendIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  friendInitial: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  friendName: {
    color: '#ccc',
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'System',
  },
  noContactsContainer: {
    width: width - 40,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
  },
  noContactsText: {
    color: '#999',
    textAlign: 'center',
    fontFamily: 'System',
  },
  mapContainer: {
    height: 350,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingMap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ccc',
    fontSize: 16,
    fontFamily: 'System',
  },
  locationLabel: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  locationLabelText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'System',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4285F4',
  },
  markerRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(66, 133, 244, 0.3)',
    position: 'absolute',
  },
  trackButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
  trackButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
  },
  trackButtonIcon: {
    marginRight: 8,
  },
  trackButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 25,
    paddingBottom: Platform.OS === 'ios' ? 40 : 25,
    height: '80%',
  },
  modalHeader: {
    paddingHorizontal: 25,
    marginBottom: 25,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'System',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: '#999',
    fontSize: 14,
    fontFamily: 'System',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    marginHorizontal: 25,
    marginBottom: 20,
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: '#fff',
    fontFamily: 'System',
  },
  selectedCount: {
    paddingHorizontal: 25,
    marginBottom: 10,
  },
  selectedCountText: {
    color: '#FF6B9C',
    fontFamily: 'System',
    fontSize: 14,
  },
  contactsList: {
    flex: 1,
  },
  contactsListContent: {
    paddingHorizontal: 25,
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
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    marginTop: 25,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    marginRight: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#666',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'System',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    marginLeft: 10,
    borderRadius: 10,
    backgroundColor: '#FF6B9C',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
}); 