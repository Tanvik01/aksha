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
  Alert
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

const friends = [
  { id: 1, name: 'Laura Ash', image: require('../assets/images/friend1.png') },
  { id: 2, name: 'Samantha', image: require('../assets/images/friend2.png') },
  { id: 3, name: 'Caroline', image: require('../assets/images/friend3.png') },
  { id: 4, name: 'Sophia', image: require('../assets/images/friend4.png') },
  { id: 5, name: 'Marge', image: require('../assets/images/friend5.png') },
];

export default function HomeScreen() {
  const router = useRouter();
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [activeTab, setActiveTab] = useState('Track Me');
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
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
        accuracy: Location.Accuracy.Highest
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
          
          setSelectedContacts(contactsWithPhones.slice(0, 5));
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
            accuracy: Location.Accuracy.Highest,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          (newLocation) => {
            setLocation(newLocation);
            
            // Animate map to new location
            if (mapRef.current) {
              mapRef.current.animateToRegion({
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
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
            <TouchableOpacity style={styles.addFriendButton}>
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
                  No contacts available. Add friends to share your location.
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
        
        <TouchableOpacity style={styles.sosButton}>
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
  },
  description: {
    color: '#999',
    fontSize: 14,
    marginTop: 15,
    marginBottom: 25,
    fontFamily: 'System',
  },
  friendsSection: {
    marginBottom: 25,
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
    marginBottom: 8,
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
}); 