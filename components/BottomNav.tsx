import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface BottomNavProps {
  onSOS?: (options?: { showAudioRecordPrompt?: boolean }) => void;
}

export default function BottomNav({ onSOS }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Default SOS handler if none provided
  const handleSOS = () => {
    if (onSOS) {
      onSOS({ showAudioRecordPrompt: true });
    } else {
      console.log("SOS function not provided");
    }
  };

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => router.replace('/home')}
      >
        <Ionicons 
          name={pathname === '/home' ? 'home' : 'home-outline'} 
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
          name={pathname === '/social' ? 'people' : 'people-outline'} 
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
          name={pathname === '/helpline' ? 'call' : 'call-outline'} 
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
          name={pathname === '/quicktips' ? 'information-circle' : 'information-circle-outline'} 
          size={24} 
          color={pathname === '/quicktips' ? '#FF6B9C' : '#999'} 
        />
        <Text style={[styles.navText, pathname === '/quicktips' && styles.activeNavText]}>Tips</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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