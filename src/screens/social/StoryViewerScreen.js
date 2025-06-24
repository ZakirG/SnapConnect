import React from 'react';
import { View, Image, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video } from 'expo-av';
import { Button } from '../../components/neumorphic';
import { Ionicons } from '@expo/vector-icons';

/**
 * StoryViewerScreen
 * -----------------
 * Shows a single story (image or video) in full-screen mode.
 * Props delivered via React Navigation route params:
 *   { storageUrl, mediaType, username }
 */
const StoryViewerScreen = ({ route, navigation }) => {
  console.log('[StoryViewerScreen] route params', route.params);
  const { storageUrl, mediaType = 'image', username = '' } = route.params ?? {};

  const renderMedia = () => {
    if (mediaType === 'video') {
      return (
        <Video
          key={storageUrl}
          source={{ uri: storageUrl }}
          style={{ flex: 1 }}
          resizeMode="cover"
          shouldPlay
          isLooping
          onError={(err) => console.warn('[StoryViewer] video load error', err)}
        />
      );
    }
    return (
      <Image
        source={{ uri: storageUrl }}
        style={{ flex: 1, resizeMode: 'cover' }}
        onLoad={() => console.log('[StoryViewer] image loaded', storageUrl)}
        onError={(e) => console.warn('[StoryViewer] image load error', storageUrl, e.nativeEvent.error)}
      />
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {renderMedia()}
      <SafeAreaView
        edges={['bottom', 'left', 'right']}
        className="absolute bottom-0 left-0 right-0 p-4 bg-black/30"
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-white text-lg font-semibold" numberOfLines={1}>
            {username}
          </Text>
          <Button
            variant="circular"
            size="medium"
            onPress={() => navigation.goBack()}
            style={{ width: 44, height: 44 }}
          >
            <Ionicons name="close" size={24} color="#374151" />
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default StoryViewerScreen; 