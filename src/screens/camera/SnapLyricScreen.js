/**
 * This screen generates and displays an AI-powered caption for a captured image.
 * It shows a loading state while the caption is being generated and then
 * displays the result in a text area.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert, TextInput, TouchableWithoutFeedback, Keyboard, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Button } from '../../components/neumorphic';
import { generateCaption } from '../../services/openai';
import { captionToLyric } from '../../services/rag';

const SnapLyricScreen = ({ route, navigation }) => {
  const { mediaUri } = route.params;
  const [snapLyric, setSnapLyric] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Writing image caption...');
  const [error, setError] = useState(null);

  /**
   * Copies the SnapLyric text to the clipboard and shows a confirmation alert
   */
  const handleCopyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(snapLyric);
      Alert.alert('Copied!', 'SnapLyric copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  /**
   * Opens Twitter with the SnapLyric text pre-filled for posting
   */
  const handlePostToX = async () => {
    try {
      const encodedText = encodeURIComponent(snapLyric);
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
      const canOpen = await Linking.canOpenURL(twitterUrl);
      
      if (canOpen) {
        await Linking.openURL(twitterUrl);
      } else {
        Alert.alert('Error', 'Unable to open Twitter');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open Twitter');
    }
  };

  useEffect(() => {
    const fetchAndProcessMedia = async () => {
      if (!mediaUri) {
        setError('No image was provided.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Step 1: Generate initial caption
        setLoadingMessage('Writing image caption...');
        const generatedCaption = await generateCaption(mediaUri);
        if (!generatedCaption) {
          throw new Error('Failed to generate a caption.');
        }

        // Step 2: Find the lyric using the RAG service
        setLoadingMessage('Finding the perfect lyric...');
        const lyricResult = await captionToLyric(generatedCaption);

        if (lyricResult) {
          const { text, artist, track } = lyricResult;
          // capitalize the first letter in each word of the artist and track
          const capitalizedArtist = artist.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          const capitalizedTrack = track.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          const finalQuote = `${generatedCaption} It's like ${capitalizedArtist} said on ${capitalizedTrack} -- '${text}'.`;
          setSnapLyric(finalQuote);
        } else {
          // Fallback to just the caption if no lyric is found
          setSnapLyric(`"${generatedCaption}"`);
          Alert.alert("Couldn't find a matching lyric", "But we still wrote a caption for you!");
        }

      } catch (err) {
        setError(err.message);
        Alert.alert('Error', 'Could not generate a SnapLyric. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndProcessMedia();
  }, [mediaUri]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1 bg-background">
        {/* Top back button */}
        <SafeAreaView edges={['top']} className="p-4">
          <Button
            variant="circular"
            size="medium"
            onPress={() => navigation.goBack()}
            style={{ width: 48, height: 48 }}
          >
            <Ionicons name="chevron-back" size={24} color="#374151" />
          </Button>
        </SafeAreaView>

        {/* Main content */}
        <View className="flex-1 justify-center items-center p-6" style={{ gap: 24 }}>
          {isLoading ? (
            <>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text className="text-lg text-gray-600 mt-4">{loadingMessage}</Text>
              <Text className="text-sm text-gray-400 mt-2">This might take a moment.</Text>
            </>
          ) : error ? (
            <View className="items-center">
              <Text className="text-lg text-red-500 text-center">{error}</Text>
              <Button
                title="Try Again"
                variant="primary"
                onPress={() => {
                  navigation.goBack();
                }}
                style={{ marginTop: 20 }}
              />
            </View>
          ) : (
            <View className="w-full items-center" style={{ gap: 16 }}>
              <Text className="text-2xl font-bold">Your SnapLyric 🎶🎉</Text>
              <TextInput
                value={snapLyric}
                onChangeText={setSnapLyric}
                multiline
                editable
                className="w-full h-40 p-4 border border-gray-300 rounded-lg bg-white text-base"
                style={{ textAlignVertical: 'top' }}
              />
              <View className="w-full flex-row justify-end items-center" style={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={handleCopyToClipboard}
                  className="p-3"
                  activeOpacity={0.7}
                >
                  <Ionicons name="copy-outline" size={24} color="#6366f1" />
                </TouchableOpacity>
                <Button
                  title="Post to X"
                  variant="secondary"
                  size="small"
                  onPress={handlePostToX}
                  style={{ paddingHorizontal: 16, paddingVertical: 8 }}
                />
              </View>
            </View>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default SnapLyricScreen; 