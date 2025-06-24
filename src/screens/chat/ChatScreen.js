import React from 'react';
import { View, Text } from 'react-native';

/**
 * A placeholder screen for the chat view.
 *
 * @returns {React.ReactElement}
 */
const ChatScreen = () => {
  return (
    <View className="flex-1 justify-center items-center bg-background">
      <Text className="text-2xl font-bold">Chat Screen</Text>
    </View>
  );
};

export default ChatScreen;
