import React from 'react';
import { View, ImageBackground, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video } from 'expo-av';
import { Button } from '../../components/neumorphic';
import { Ionicons } from '@expo/vector-icons';

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
        className="absolute top-0 left-0 right-0 bottom-0 flex-col justify-between p-4"
      >
        {/* Top section with Back button */}
        <View className="flex-row justify-start">
          <Button
            size="large"
            variant="primary"
            onPress={() => navigation.goBack()}
            style={{ minWidth: 120 }}
          >
            <View className="flex-row items-center">
              <Ionicons name="chevron-back" size={20} color="#374151" />
              <Text className="text-lg font-bold text-gray-800 ml-1">Back</Text>
            </View>
          </Button>
        </View>

        {/* Bottom section with Send To button */}
        <View className="flex-row justify-end">
          <Button
            size="large"
            variant="secondary"
            onPress={() => navigation.navigate('SendTo', { mediaUri, mediaType })}
            style={{ minWidth: 140 }}
          >
            <View className="flex-row items-center">
              <Text className="text-lg font-bold text-blue-800 mr-1">Send To</Text>
              <Ionicons name="send" size={20} color="#1e40af" />
            </View>
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default SnapPreviewScreen; 