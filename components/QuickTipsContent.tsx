import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Type for safety situation
interface SafetySituation {
  id: number;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  colorStart: string;
  colorEnd: string;
  tips: string[];
}

// Safety situations with specific tips for each scenario
const SAFETY_SITUATIONS: SafetySituation[] = [
  {
    id: 1,
    title: "Being Followed",
    description: "What to do if you think someone is following you",
    icon: "eye-outline",
    colorStart: '#FF6B9C',
    colorEnd: '#F24976',
    tips: [
      "Stay calm and trust your instincts. If you feel unsafe, you probably are.",
      "Change your route and direction suddenly; see if they follow.",
      "Head to a public place with people around, like a store or restaurant.",
      "Call someone and tell them where you are and what's happening.",
      "Fake a phone call loudly saying someone is expecting you soon at your current location.",
      "Use the SOS feature in Aksha to alert your emergency contacts.",
      "If you're certain someone is following you, don't go home. Go to a police station."
    ]
  },
  {
    id: 2,
    title: "Domestic Abuse",
    description: "Resources and steps for those experiencing abuse",
    icon: "home-outline",
    colorStart: '#5B9EFF',
    colorEnd: '#3178F2',
    tips: [
      "Your safety is the priority - develop a safety plan and escape route.",
      "Memorize important emergency numbers including local shelters.",
      "Keep important documents (ID, bank cards) accessible.",
      "Tell trusted friends or family about your situation if possible.",
      "Create code words with friends to signal when you need help.",
      "Document abuse with dates, times, and descriptions when safe to do so.",
      "Use Aksha's hidden SOS feature to secretly alert trusted contacts.",
      "Contact a domestic violence hotline for professional guidance and support."
    ]
  },
  {
    id: 3,
    title: "Public Transport Safety",
    description: "Stay safe while using buses, trains, and rideshares",
    icon: "car-outline",
    colorStart: '#53C2BC', 
    colorEnd: '#38A098',
    tips: [
      "Sit near the driver or in view of the security camera.",
      "Share your trip details with a trusted contact including expected arrival time.",
      "Keep valuables hidden and bags secured close to your body.",
      "Trust your instincts - change seats or vehicles if someone makes you uncomfortable.",
      "Stay awake and alert during your journey.",
      "Take a photo of taxi/rideshare license plates before entering.",
      "Verify driver identity and car details before entering a rideshare.",
      "Use Aksha's trip monitoring feature for late-night travel."
    ]
  },
  {
    id: 4,
    title: "Street Harassment",
    description: "How to respond to unwanted attention or harassment",
    icon: "people-outline",
    colorStart: '#FFA651',
    colorEnd: '#FF7F00',
    tips: [
      "Project confidence with body language - stand tall with shoulders back.",
      "Avoid engaging with harassers - don't respond to comments or questions.",
      "Change your route or cross the street to avoid continued interaction.",
      "Seek safety in numbers - join a group or enter a populated business.",
      "Be direct and firm if needed: 'Stop talking to me' or 'Leave me alone'.",
      "If in a public place, draw attention: 'This person is harassing me.'",
      "Document with your phone camera if safe to do so.",
      "Report recurring street harassment to local authorities."
    ]
  },
  {
    id: 5,
    title: "Digital Safety",
    description: "Protect your privacy and safety online",
    icon: "phone-portrait-outline",
    colorStart: '#A66AFF',
    colorEnd: '#8347E0',
    tips: [
      "Use strong, unique passwords for all accounts, especially location services.",
      "Enable two-factor authentication on all important accounts.",
      "Regularly check privacy settings on all social media accounts.",
      "Avoid sharing real-time location data publicly on social media.",
      "Be selective about accepting friend/follow requests from people you don't know.",
      "Regularly check for unusual activity on your accounts.",
      "Use a VPN when on public WiFi networks.",
      "Disable location tags on photos before posting them online."
    ]
  },
  {
    id: 6,
    title: "Party Safety",
    description: "Stay safe at parties, clubs, and social gatherings",
    icon: "alert-outline",
    colorStart: '#FF5C8D',
    colorEnd: '#FF2D78',
    tips: [
      "Go with trusted friends and establish a buddy system.",
      "Never leave your drink unattended; get a new one if you do.",
      "Set a drink limit before going out and stick to it.",
      "Watch your drinks being prepared when possible.",
      "Plan your journey home before going out.",
      "Set check-in times with friends not at the event.",
      "Share your location with trusted contacts through Aksha.",
      "Trust your instincts - leave if you feel uncomfortable for any reason."
    ]
  },
  {
    id: 7,
    title: "Travel Safety",
    description: "Stay secure while traveling in unfamiliar places",
    icon: "airplane-outline",
    colorStart: '#5CC8FF',
    colorEnd: '#4A8CFF',
    tips: [
      "Research your destination thoroughly, including unsafe areas to avoid.",
      "Share your itinerary with trusted contacts and update them regularly.",
      "Keep digital and physical copies of important documents.",
      "Secure your accommodation - always use door locks and security chains.",
      "Avoid displaying expensive items that might attract thieves.",
      "Learn basic phrases in the local language including how to ask for help.",
      "Register with your embassy when traveling internationally.",
      "Use Aksha's location tracking to keep loved ones updated on your whereabouts."
    ]
  },
  {
    id: 8,
    title: "Emergency Response",
    description: "What to do in immediate danger or crisis situations",
    icon: "warning-outline",
    colorStart: '#FF5252',
    colorEnd: '#D32F2F',
    tips: [
      "Call emergency services immediately (911 in US, or local equivalent).",
      "If you can't speak, dial emergency services and leave the line open.",
      "Use the emergency SOS feature on your phone (rapid press of power button on many phones).",
      "Activate Aksha's SOS mode to alert all emergency contacts at once.",
      "If possible, move to a safer location while maintaining the emergency call.",
      "Give clear, concise information about your location and the situation.",
      "If driving, pull over in a well-lit, populated area if possible.",
      "Use simple code words with dispatchers if you can't speak freely."
    ]
  }
];

const QuickTipsContent = () => {
  const [expandedSituation, setExpandedSituation] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    if (expandedSituation === id) {
      setExpandedSituation(null);
    } else {
      setExpandedSituation(id);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionDescription}>
        Safety tips for specific situations you might encounter
      </Text>
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.cardsContainer}
      >
        {SAFETY_SITUATIONS.map(situation => (
          <View key={situation.id} style={styles.situationContainer}>
            <TouchableOpacity 
              activeOpacity={0.7}
              style={styles.situationCard}
              onPress={() => toggleExpand(situation.id)}
            >
              <LinearGradient
                colors={[situation.colorStart, situation.colorEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconContainer}
              >
                <Ionicons name={situation.icon} size={24} color="#FFF" />
              </LinearGradient>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{situation.title}</Text>
                <Text style={styles.cardDescription}>{situation.description}</Text>
              </View>
              <Ionicons 
                name={expandedSituation === situation.id ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#999" 
              />
            </TouchableOpacity>
            
            {expandedSituation === situation.id && (
              <View style={styles.tipsContainer}>
                {situation.tips.map((tip, index) => (
                  <View key={index} style={styles.tipItem}>
                    <View style={[styles.tipBullet, { backgroundColor: situation.colorStart }]} />
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
  sectionDescription: {
    color: '#DDD',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
    fontFamily: 'System',
  },
  cardsContainer: {
    paddingBottom: 20,
  },
  situationContainer: {
    marginBottom: 16,
  },
  situationCard: {
    backgroundColor: '#252525',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDescription: {
    color: '#AAA',
    fontSize: 14,
    fontFamily: 'System',
  },
  tipsContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  tipBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 10,
  },
  tipText: {
    flex: 1,
    color: '#CCC',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'System',
  },
});

export default QuickTipsContent; 