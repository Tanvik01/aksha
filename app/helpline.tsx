import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Platform,
  StatusBar,
  ScrollView,
  Linking
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function HelplineScreen() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Set status bar to light content on dark background
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#121212');
    }
  }, []);

  // Function to handle SOS button press (copy from home.tsx)
  const handleSOS = async () => {
    // Copy the SOS functionality from home.tsx
    // This ensures the SOS functionality works the same on all screens
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Emergency Helplines</Text>
        </View>
        
        <ScrollView style={styles.content}>
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
        </ScrollView>
        
        {/* Bottom Navigation */}
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