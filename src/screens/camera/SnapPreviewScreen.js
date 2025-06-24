import React from 'react';
import { View, ImageBackground, TouchableOpacity, Text } from 'react-native';

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
      <View className="flex-1 flex-col justify-between m-8">
        <TouchableOpacity className="self-start items-center bg-transparent" onPress={() => navigation.goBack()}>
          <Text className="text-lg font-bold text-white">Back</Text>
        </TouchableOpacity>
        {/* "Send To" button will be implemented in a future phase */}
      </View>
    </ImageBackground>
  );
};

export default SnapPreviewScreen; 