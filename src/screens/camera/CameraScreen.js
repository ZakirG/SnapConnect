import React from 'react';
import { View, Text } from 'react-native';

/**
 * A placeholder screen for the camera view.
 *
 * @returns {React.ReactElement}
 */
const CameraScreen = () => {
  return (
    <View className="flex-1 justify-center items-center bg-background">
      <Text className="text-2xl font-bold">Camera Screen</Text>
    </View>
  );
};

export default CameraScreen; 