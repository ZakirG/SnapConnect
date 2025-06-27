/**
 * This screen generates and displays an AI-powered caption for a captured image.
 * It shows a loading state while the caption is being generated and then
 * displays the result in a text area.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Button } from '../../components/neumorphic';
import { generateCaption } from '../../services/openai';
import { captionToLyric } from '../../services/rag';

const SnapLyricScreen = ({ route, navigation }) => {
  const { mediaUri } = route.params;
  const [snapLyrics, setSnapLyrics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Writing image caption...');
  const [error, setError] = useState(null);

  /**
   * Copies the specified SnapLyric text to the clipboard and shows a confirmation alert
   */
  const handleCopyToClipboard = async (text) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied!', 'SnapLyric copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  /**
   * Opens Twitter with the specified SnapLyric text pre-filled for posting
   */
  const handlePostToX = async (text) => {
    try {
      const encodedText = encodeURIComponent(text);
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

        // Step 2: Find multiple diverse lyrics using the RAG service
        setLoadingMessage('Finding the perfect lyrics...');
        const lyricResults = await captionToLyric(generatedCaption, 3);

        const processedLyrics = [];
        const lyricsArray = Array.isArray(lyricResults) ? lyricResults : (lyricResults ? [lyricResults] : []);

        if (lyricsArray.length > 0) {
          lyricsArray.forEach((lyric, index) => {
            const { text, artist, track } = lyric;
            // capitalize the first letter in each word of the artist and track
            const capitalizedArtist = artist.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            const capitalizedTrack = track.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            const finalQuote = `${generatedCaption} It's like ${capitalizedArtist} said on ${capitalizedTrack} -- '${text}'.`;
            
            processedLyrics.push({
              id: index,
              caption: generatedCaption,
              lyricText: text,
              artist: capitalizedArtist,
              track: capitalizedTrack,
              fullQuote: finalQuote
            });
          });
          
          setSnapLyrics(processedLyrics);
        } else {
          // Fallback to just the caption if no lyrics are found
          setSnapLyrics([{
            id: 0,
            caption: generatedCaption,
            lyricText: '',
            artist: '',
            track: '',
            fullQuote: `"${generatedCaption}"`
          }]);
          Alert.alert("Couldn't find matching lyrics", "But we still wrote a caption for you!");
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
      {isLoading ? (
        <View className="flex-1 justify-center items-center p-6" style={{ gap: 24 }}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="text-lg text-gray-600 mt-4">{loadingMessage}</Text>
          <Text className="text-sm text-gray-400 mt-2">This might take a moment.</Text>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center p-6">
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
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ padding: 24, gap: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          {/* Title */}
          <View className="items-center" style={{ gap: 8 }}>
            <Text className="text-2xl font-bold text-gray-800 text-center">Your SnapLyrics 🎶🎉</Text>
          </View>

          {/* Results area */}
          {snapLyrics.length > 0 && (
            <View style={{ gap: 16 }}>
              <Text className="text-lg font-semibold text-gray-800">Your Caption + Lyric Combinations</Text>
              {snapLyrics.map((item, index) => (
                <View key={item.id} className="bg-gray-50 p-4 rounded-lg" style={{ gap: 8 }}>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-medium text-gray-600">Option {index + 1}</Text>
                    {item.artist && item.track && (
                      <Text className="text-xs text-gray-500">{item.artist} - {item.track}</Text>
                    )}
                  </View>
                  
                  {/* Combined quote */}
                  <Text className="text-base text-gray-700 leading-6">{item.fullQuote}</Text>
                  
                  {/* Copy and Post to X buttons */}
                  <View className="flex-row justify-end items-center" style={{ gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => handleCopyToClipboard(item.fullQuote)}
                      className="p-3"
                      activeOpacity={0.7}
                    >
                      <Ionicons name="copy-outline" size={24} color="#6366f1" />
                    </TouchableOpacity>
                    <Button
                      title="Post to X"
                      variant="secondary"
                      size="small"
                      onPress={() => handlePostToX(item.fullQuote)}
                      style={{ paddingHorizontal: 16, paddingVertical: 8 }}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default SnapLyricScreen; 