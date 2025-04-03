import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, StatusBar, Animated, Dimensions, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const circleSize = Math.max(width, height) * 2;

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const circleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Circle reveal animation
    Animated.timing(circleAnim, {
      toValue: 1,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Content animations
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        })
      ]).start();
    }, 600);
  }, []);

  const circleTransform = {
    scale: circleAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
  };

  const handleGetStarted = () => {
    router.push('/auth/login');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      {/* Circle reveal animation */}
      <View style={styles.circleContainer}>
        <Animated.View 
          style={[
            styles.circle, 
            { transform: [circleTransform] }
          ]} 
        />
      </View>
      
      <View style={styles.imageContainer}>
        <Image 
          source={require('../assets/images/login.png')} 
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <Animated.View 
        style={[
          styles.contentContainer, 
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }] 
          }
        ]}
      >
        <Text style={styles.title}>Aksha</Text>
        <Text style={styles.tagline}>Safety at Your Fingertips</Text>

        <TouchableOpacity onPress={handleGetStarted} activeOpacity={0.8}>
          <LinearGradient
            colors={['#FF6B9C', '#F24976']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  circleContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: circleSize,
    height: circleSize,
    borderRadius: circleSize / 2,
    backgroundColor: '#121212',
    position: 'absolute',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  image: {
    width: '90%',
    height: '90%',
  },
  contentContainer: {
    paddingBottom: 80,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    fontFamily: 'System',
    color: '#FF6B9C',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 20,
    fontFamily: 'System',
    fontWeight: '500',
    color: '#F24976',
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 0.5,
    opacity: 0.9,
  },
  button: {
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 60,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#FF6B9C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'System',
    letterSpacing: 0.5,
  },
}); 