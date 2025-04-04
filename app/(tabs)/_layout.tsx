import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { HapticTab } from '../../components/HapticTab';
import { StyleSheet, View } from 'react-native';

// Simple tab bar background component
function TabBackground() {
  return (
    <View style={styles.tabBackground} />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          height: 70,
          backgroundColor: 'transparent',
          position: 'absolute',
          borderTopWidth: 0,
        },
        tabBarBackground: () => <TabBackground />,
        tabBarActiveTintColor: '#FF6B9C',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color }) => <Ionicons name="compass" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarLabel: 'AI Chat',
          tabBarIcon: ({ color }) => <Ionicons name="chatbubbles" size={24} color={color} />,
          tabBarButton: (props) => (
            <HapticTab {...props} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#121212',
    borderTopColor: '#333',
    borderTopWidth: 1,
  }
});
