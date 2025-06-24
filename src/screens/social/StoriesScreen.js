import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

/**
 * A placeholder screen for the stories view.
 *
 * @returns {React.ReactElement}
 */
const StoriesScreen = ({ navigation }) => {
  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 justify-center items-center">
        <Text className="text-2xl font-bold">Stories Screen</Text>
      </View>

      {/* Bottom Navigation - consistent with Camera screen */}
      <View className="absolute bottom-0 left-0 right-0">
        <SafeAreaView edges={['bottom']} className="bg-black/20 backdrop-blur-sm">
          <View className="flex-row items-center justify-around py-4 px-6">
            {/* Messages */}
            <TouchableOpacity onPress={() => navigation.navigate('Chat')} className="p-2">
              <Ionicons name="chatbubble-outline" size={24} color="white" />
            </TouchableOpacity>

            {/* Camera */}
            <TouchableOpacity onPress={() => navigation.navigate('Camera')} className="p-2">
              <Ionicons name="camera" size={28} color="white" />
            </TouchableOpacity>

            {/* Friends / Stories (current) */}
            <TouchableOpacity activeOpacity={1} className="p-2">
              <Ionicons name="people" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
};

export default StoriesScreen; 