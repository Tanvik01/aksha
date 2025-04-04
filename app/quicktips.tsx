import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Platform,
  StatusBar
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import QuickTipsContent from '../components/QuickTipsContent';

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

  // Function to handle SOS button press (copy from home.tsx)
  const handleSOS = async () => {
    // Copy the SOS functionality from home.tsx
    // This ensures the SOS functionality works the same on all screens
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