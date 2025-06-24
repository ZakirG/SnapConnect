import React from 'react';
import { View, ImageBackground, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * A screen to display the captured photo full-screen.
 * It provides an option to discard the photo and go back to the camera.
 *
 * @param {object} props - The component props.
 * @param {object} props.route - The route object containing navigation parameters.
 * @param {object} props.navigation - The navigation object provided by React Navigation.
 * @returns {React.ReactElement}
 */
const SnapPreviewScreen = ({ route, navigation }) => {
  const { photoUri } = route.params;

  return (
    <ImageBackground source={{ uri: photoUri }} style={{ flex: 1 }}>
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 flex-col justify-between px-6 py-4">
        <TouchableOpacity className="self-start items-center bg-transparent" onPress={() => navigation.goBack()}>
          <Text className="text-lg font-bold text-white">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="self-end items-center bg-transparent"
          onPress={() => navigation.navigate('SendTo', { photoUri })}
        >
          <Text className="text-lg font-bold text-white">Send To</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </ImageBackground>
  );
};

export default SnapPreviewScreen; 