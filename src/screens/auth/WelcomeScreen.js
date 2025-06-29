import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Card, CustomButton } from '../../components/neumorphic';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Welcome screen that introduces new users to SnapLyric's main features.
 * Explains Snap Lyric and What's on your mind functionality before onboarding.
 *
 * @param {object} props - The component props.
 * @param {object} props.navigation - The navigation object provided by React Navigation.
 * @returns {React.ReactElement}
 */
const WelcomeScreen = ({ navigation }) => {
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);

  // Feature data for the carousel
  const features = [
    {
      title: "Make a SnapLyric 📸",
      description: "Turn any photo into a Tweet that quotes a song lyric from one of your top-played Spotify songs."
    },
    {
      title: "Messy Thoughts Feature 💭",
      description: "Do the same with your messy thoughts! Watch AI turn them into a funny tweet that quotes a favorite song of yours."
    }
  ];

  /**
   * Handles navigation to the signup screen when user taps "Let's go!"
   */
  const handleGetStarted = () => {
    navigation.navigate('Signup');
  };

  /**
   * Navigates to the previous feature in the carousel
   */
  const handlePreviousFeature = () => {
    setCurrentFeatureIndex((prev) => (prev === 0 ? features.length - 1 : prev - 1));
  };

  /**
   * Navigates to the next feature in the carousel
   */
  const handleNextFeature = () => {
    setCurrentFeatureIndex((prev) => (prev === features.length - 1 ? 0 : prev + 1));
  };

  /**
   * Handles swipe gestures on the carousel
   * @param {object} event - The gesture event
   */
  const handleSwipeGesture = (event) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      const minSwipeDistance = 50; // Minimum distance to trigger swipe

      if (translationX > minSwipeDistance) {
        // Swiped right - go to previous feature
        handlePreviousFeature();
      } else if (translationX < -minSwipeDistance) {
        // Swiped left - go to next feature
        handleNextFeature();
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center items-center px-4 py-8">
          {/* App Logo */}
          <Image 
            source={require('../../../assets/snaplyric-logo.png')}
            style={{ width: 250, height: 100, marginBottom: 16 }}
            resizeMode="contain"
          />
          

                    {/* Features Section */}
          <View className="w-full mb-12 px-2">
            <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">Welcome to SnapLyric!</Text>
            <Text className="text-2xl font-bold text-gray-900 mb-6 text-center">How it works:</Text>
             
            {/* Feature Card with Internal Navigation */}
            <PanGestureHandler onHandlerStateChange={handleSwipeGesture}>
              <View>
            <Card style={{ paddingTop: 32, paddingBottom: 32, minHeight: 180 }}>
              <View className="flex-row items-center justify-between">
                {/* Left Arrow */}
                <TouchableOpacity 
                  onPress={handlePreviousFeature}
                  className="p-2"
                >
                  <Text className="text-6xl text-gray-300">‹</Text>
                </TouchableOpacity>

                {/* Feature Content */}
                <View className="flex-1 items-center justify-center px-4">
                  <Text className="text-xl font-bold text-gray-900 mb-4 text-center">
                    {features[currentFeatureIndex].title}
                  </Text>
                  <Text className="text-lg text-gray-600 text-center leading-7">
                    {features[currentFeatureIndex].description}
                  </Text>
                </View>

                {/* Right Arrow */}
                <TouchableOpacity 
                  onPress={handleNextFeature}
                  className="p-2"
                >
                  <Text className="text-6xl text-gray-300">›</Text>
                </TouchableOpacity>
                              </View>
                </Card>
              </View>
            </PanGestureHandler>

            {/* Carousel Indicators */}
            <View className="flex-row justify-center mt-4">
              {features.map((_, index) => (
                <View
                  key={index}
                  className={`w-2 h-2 rounded-full mx-1 ${
                    index === currentFeatureIndex ? 'bg-gray-800' : 'bg-gray-400'
                  }`}
                />
              ))}
            </View>
          </View>

          {/* Call to Action */}
          <View className="w-full max-w-sm px-4">
            <CustomButton
              title="LET'S GO!"
              onPress={handleGetStarted}
            />
            
            <Text className="text-center text-gray-500">
              Ready to start sharing moments and discovering music?
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WelcomeScreen; 