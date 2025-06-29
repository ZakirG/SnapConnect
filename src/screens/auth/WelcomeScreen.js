import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Card, Button } from '../../components/neumorphic';
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
  /**
   * Handles navigation to the signup screen when user taps "Let's go!"
   */
  const handleGetStarted = () => {
    navigation.navigate('Signup');
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center items-center px-4 py-8">
          {/* App Title */}
          <Text className="text-5xl font-extrabold text-gray-900 mb-4">SnapLyric</Text>
          <Text className="text-lg text-gray-600 mb-12 text-center">
            Share moments, discover music, express yourself
          </Text>

          {/* Features Section */}
          <View className="w-full max-w-sm mb-12">
            <Card style={{ padding: 24 }}>
              <View className="items-center">
                <Text className="text-2xl font-bold text-gray-900 mb-6">Welcome to SnapLyric! How's it work?</Text>
                
                <View className="mb-6">
                  <Text className="text-lg font-semibold text-gray-900 mb-2">Make a SnapLyric 📸</Text>
                  <Text className="text-gray-600 text-left leading-6">
                    Turn any photo into a Tweet that quotes a song lyric from one of your top-played Spotify songs.
                  </Text>
                </View>

                <View>
                  <Text className="text-lg font-semibold text-gray-900 mb-2">Messy Thoughts Feature 💭</Text>
                  <Text className="text-gray-600 text-left leading-6">
                    Do the same with your messy thoughts! Watch AI turn them into a
                    funny tweet that quotes a favorite song of yours.
                  </Text>
                </View>
              </View>
            </Card>
          </View>

          {/* Call to Action */}
          <View className="w-full max-w-sm px-4">
            <Button
              title="Let's go!"
              size="large"
              variant="primary"
              onPress={handleGetStarted}
              style={{ width: '100%', marginBottom: 20 }}
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