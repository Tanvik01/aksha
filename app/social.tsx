import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Platform,
  StatusBar,
  Image,
  TextInput,
  Linking
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

export default function SocialScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');

  // Function to handle SOS button press (copy from home.tsx)
  const handleSOS = async () => {
    // Copy the SOS functionality from home.tsx
  };

  // Set status bar style
  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#121212');
    }
  }, []);

  const renderNewsContent = () => {
    const newsItems = [
      {
        id: 1,
        title: "New Safety App for Women Launched Nationwide",
        source: "Women's Safety Network",
        date: "2 hours ago",
        image: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=1480&auto=format&fit=crop",
        content: "A new mobile application designed to enhance women's safety has been launched nationwide, offering features like emergency alerts, location sharing, and community support."
      },
      {
        id: 2,
        title: "Government Announces New Measures for Women's Safety",
        source: "Safety First",
        date: "Yesterday",
        image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=1374&auto=format&fit=crop",
        content: "The government has announced a comprehensive set of measures aimed at improving women's safety in public spaces and workplaces across the country."
      },
      {
        id: 3,
        title: "Study Shows Increase in Women's Safety Awareness",
        source: "Safety Research Institute",
        date: "3 days ago",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1376&auto=format&fit=crop",
        content: "A recent study indicates a significant increase in women's awareness about personal safety measures and the use of safety technologies."
      }
    ];

    return (
      <View style={styles.contentContainer}>
        {newsItems.map(item => (
          <TouchableOpacity 
            key={item.id}
            style={styles.newsCard}
            onPress={() => {}} // Could link to full article
          >
            <Image 
              source={{ uri: item.image }} 
              style={styles.newsImage}
              resizeMode="cover"
            />
            <View style={styles.newsContent}>
              <Text style={styles.newsTitle}>{item.title}</Text>
              <Text style={styles.newsText}>{item.content}</Text>
              <View style={styles.newsFooter}>
                <Text style={styles.newsSource}>{item.source}</Text>
                <Text style={styles.newsDate}>{item.date}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderCommunitiesContent = () => {
    const communities = [
      {
        id: 1,
        name: "Women's Safety Network",
        members: 12500,
        description: "A community dedicated to sharing safety tips, resources, and support for women.",
        color: "#FF6B9C"
      },
      {
        id: 2,
        name: "Safe Commute Group",
        members: 8300,
        description: "Connect with others for safe travel and commuting. Share routes, updates, and travel together.",
        color: "#7209B7"
      },
      {
        id: 3,
        name: "Self-Defense Community",
        members: 5600,
        description: "Learn self-defense techniques, share training resources, and join local classes.",
        color: "#4361EE"
      }
    ];

    return (
      <View style={styles.contentContainer}>
        {communities.map(community => (
          <TouchableOpacity 
            key={community.id}
            style={styles.communityCard}
            onPress={() => {}} // Could open community page
          >
            <View style={[styles.communityIcon, { backgroundColor: community.color }]}>
              <FontAwesome5 name="users" size={24} color="#FFF" />
            </View>
            <View style={styles.communityContent}>
              <Text style={styles.communityName}>{community.name}</Text>
              <Text style={styles.communityDescription}>{community.description}</Text>
              <View style={styles.communityFooter}>
                <Ionicons name="people-outline" size={16} color="#999" />
                <Text style={styles.communityMembers}>{community.members.toLocaleString()} members</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.createCommunityButton}>
          <Ionicons name="add-circle-outline" size={20} color="#FF6B9C" />
          <Text style={styles.createCommunityText}>Create New Community</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderNGOsContent = () => {
    const ngos = [
      {
        id: 1,
        name: "Women Safety Foundation",
        mission: "Dedicated to creating safer environments for women through education, advocacy, and support services.",
        contact: "+91 98765 43210",
        website: "https://example.com",
        color: "#F24976"
      },
      {
        id: 2,
        name: "Shakti - Empowering Women",
        mission: "Providing resources and support for women facing domestic violence and harassment.",
        contact: "+91 87654 32109",
        website: "https://example.com",
        color: "#057A55"
      },
      {
        id: 3,
        name: "Safe City Initiative",
        mission: "Working with local governments to improve safety in public spaces and transportation.",
        contact: "+91 76543 21098",
        website: "https://example.com",
        color: "#1E40AF"
      }
    ];

    return (
      <View style={styles.contentContainer}>
        {ngos.map(ngo => (
          <View key={ngo.id} style={styles.ngoCard}>
            <View style={[styles.ngoHeader, { backgroundColor: ngo.color }]}>
              <Text style={styles.ngoName}>{ngo.name}</Text>
            </View>
            <View style={styles.ngoContent}>
              <Text style={styles.ngoMission}>{ngo.mission}</Text>
              <View style={styles.ngoActions}>
                <TouchableOpacity 
                  style={styles.ngoButton}
                  onPress={() => Linking.openURL(`tel:${ngo.contact}`)}
                >
                  <Ionicons name="call-outline" size={18} color="#FF6B9C" />
                  <Text style={styles.ngoButtonText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.ngoButton}
                  onPress={() => Linking.openURL(ngo.website)}
                >
                  <Ionicons name="globe-outline" size={18} color="#FF6B9C" />
                  <Text style={styles.ngoButtonText}>Website</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.ngoButton}>
                  <Ionicons name="share-social-outline" size={18} color="#FF6B9C" />
                  <Text style={styles.ngoButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderEventsContent = () => {
    const events = [
      {
        id: 1,
        title: "Women's Safety Workshop",
        date: "Dec 15, 2023",
        time: "10:00 AM - 1:00 PM",
        location: "Community Center, Bangalore",
        description: "Learn essential safety skills and strategies in this interactive workshop.",
        color: "#F24976"
      },
      {
        id: 2,
        title: "Self-Defense Training",
        date: "Dec 20, 2023",
        time: "5:00 PM - 7:00 PM",
        location: "City Park, Delhi",
        description: "Free self-defense training session for beginners. No prior experience needed.",
        color: "#4361EE"
      },
      {
        id: 3,
        title: "Safety Tech Expo",
        date: "Jan 5, 2024",
        time: "11:00 AM - 6:00 PM",
        location: "Convention Center, Mumbai",
        description: "Explore the latest safety gadgets, apps, and technologies designed for women's safety.",
        color: "#057A55"
      }
    ];

    return (
      <View style={styles.contentContainer}>
        {events.map(event => (
          <TouchableOpacity 
            key={event.id}
            style={styles.eventCard}
            onPress={() => {}} // Could open event details
          >
            <View style={[styles.eventDateContainer, { backgroundColor: event.color }]}>
              <Text style={styles.eventDate}>{event.date.split(',')[0]}</Text>
            </View>
            <View style={styles.eventContent}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <View style={styles.eventDetail}>
                <Ionicons name="time-outline" size={16} color="#999" style={styles.eventIcon} />
                <Text style={styles.eventDetailText}>{event.time}</Text>
              </View>
              <View style={styles.eventDetail}>
                <Ionicons name="location-outline" size={16} color="#999" style={styles.eventIcon} />
                <Text style={styles.eventDetailText}>{event.location}</Text>
              </View>
              <Text style={styles.eventDescription}>{event.description}</Text>
              <TouchableOpacity style={styles.eventRegisterButton}>
                <Text style={styles.eventRegisterText}>Register</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Social</Text>
          <TouchableOpacity style={styles.refreshButton}>
            <Ionicons name="refresh-outline" size={22} color="#999" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <ScrollView style={styles.content}>
          {/* News Section with header */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest News</Text>
          </View>
          {renderNewsContent()}
          
          {/* Communities Section with header */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Communities</Text>
          </View>
          {renderCommunitiesContent()}
          
          {/* NGOs Section with header */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>NGOs & Organizations</Text>
          </View>
          {renderNGOsContent()}
          
          {/* Events Section with header */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
          </View>
          {renderEventsContent()}
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
    backgroundColor: '#1A1A1A',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B9C',
    fontFamily: 'System',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    margin: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#FFF',
    fontFamily: 'System',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 15,
  },
  newsCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  newsImage: {
    width: '100%',
    height: 180,
  },
  newsContent: {
    padding: 15,
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  newsText: {
    fontSize: 14,
    color: '#CCC',
    lineHeight: 20,
    marginBottom: 10,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsSource: {
    fontSize: 12,
    color: '#FF6B9C',
    fontWeight: '500',
  },
  newsDate: {
    fontSize: 12,
    color: '#999',
  },
  communityCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  communityIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  communityContent: {
    flex: 1,
  },
  communityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  communityDescription: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 8,
    lineHeight: 20,
  },
  communityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  communityMembers: {
    fontSize: 12,
    color: '#999',
    marginLeft: 5,
  },
  createCommunityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 156, 0.1)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 156, 0.3)',
    marginTop: 10,
  },
  createCommunityText: {
    color: '#FF6B9C',
    fontWeight: '500',
    marginLeft: 10,
  },
  ngoCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  ngoHeader: {
    padding: 15,
  },
  ngoName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  ngoContent: {
    padding: 15,
  },
  ngoMission: {
    fontSize: 14,
    color: '#CCC',
    lineHeight: 20,
    marginBottom: 15,
  },
  ngoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ngoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 156, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  ngoButtonText: {
    color: '#FF6B9C',
    fontWeight: '500',
    marginLeft: 5,
    fontSize: 13,
  },
  eventCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#333',
  },
  eventDateContainer: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  eventDate: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  eventContent: {
    flex: 1,
    padding: 15,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  eventIcon: {
    marginRight: 5,
  },
  eventDetailText: {
    fontSize: 13,
    color: '#CCC',
  },
  eventDescription: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 8,
    marginBottom: 15,
    lineHeight: 20,
  },
  eventRegisterButton: {
    backgroundColor: 'rgba(255, 107, 156, 0.2)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    alignSelf: 'flex-start',
  },
  eventRegisterText: {
    color: '#FF6B9C',
    fontWeight: '500',
    fontSize: 13,
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
  sectionHeader: {
    marginTop: 20,
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
}); 