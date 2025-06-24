import React from 'react';
import { View, ImageBackground, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video } from 'expo-av';

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
  const {
    mediaUri: paramMediaUri,
    mediaType: paramMediaType,
    photoUri, // legacy param fallback
  } = route.params;

  const mediaUri = paramMediaUri ?? photoUri;
  const mediaType = paramMediaType ?? 'image';

  const renderMedia = () => {
    if (mediaType === 'video') {
      return (
        <Video
          key={mediaUri}
          source={{ uri: mediaUri }}
          style={{ flex: 1 }}
          resizeMode="cover"
          shouldPlay
          isLooping
        />
      );
    }
    return <ImageBackground source={{ uri: mediaUri }} style={{ flex: 1 }} />;
  };

  return (
    <View style={{ flex: 1 }}>
      {renderMedia()}
      <SafeAreaView
        edges={['top', 'bottom']}
        className="absolute top-0 left-0 right-0 bottom-0 flex-col justify-between px-6 py-4"
      >
        <TouchableOpacity
          className="self-start items-center bg-transparent"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-lg font-bold text-white">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="self-end items-center bg-transparent"
          onPress={() => navigation.navigate('SendTo', { mediaUri, mediaType })}
        >
          <Text className="text-lg font-bold text-white">Send To</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

export default SnapPreviewScreen; 