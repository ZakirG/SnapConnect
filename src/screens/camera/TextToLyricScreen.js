/**
 * This screen allows users to input text manually to find matching song lyrics.
 * It shows a text input area where users can write their thoughts or mood,
 * then uses the same RAG flow to find matching lyrics from songs.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableWithoutFeedback, Keyboard, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/neumorphic';
import { captionToLyric } from '../../services/rag';

const TextToLyricScreen = ({ navigation }) => {
  const [inputText, setInputText] = useState('');
  const [foundLyric, setFoundLyric] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  /**
   * Searches for a matching lyric based on the user's input text
   */
  const handleFindLyric = async () => {
    if (!inputText.trim()) {
      Alert.alert('Please enter some text', 'Write something to find a matching lyric!');
      return;
    }

    try {
      setIsLoading(true);
      setHasSearched(false);

      // Use the same RAG service that processes image captions
      const lyricResult = await captionToLyric(inputText.trim());

      if (lyricResult) {
        const { text, artist, track } = lyricResult;
        // Capitalize the first letter in each word of the artist and track
        const capitalizedArtist = artist.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        const capitalizedTrack = track.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        const finalQuote = `"${inputText.trim()}" reminds us of what ${capitalizedArtist} said on ${capitalizedTrack} -- '${text}'.`;
        setFoundLyric(finalQuote);
      } else {
        setFoundLyric(`"${inputText.trim()}"`);
        Alert.alert("Couldn't find a matching lyric", "But your words are still meaningful!");
      }
      
      setHasSearched(true);
    } catch (error) {
      Alert.alert('Error', 'Could not find a matching lyric. Please try again.');
      console.error('TextToLyric error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1 bg-background">
        {/* Header */}
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
        <View className="flex-1 p-6" style={{ gap: 16 }}>
          {/* Title and subtitle */}
          <View className="items-center" style={{ gap: 8 }}>
            <Text className="text-3xl font-bold text-gray-800 text-center">What's on your mind?</Text>
            <Text className="text-lg text-gray-600 text-center px-4">
              We'll find a lyric from your favorite songs matching your mood.
            </Text>
          </View>

          {/* Text input area */}
          <View style={{ gap: 12 }}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Write anything here..."
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
              className="p-4 border border-gray-300 rounded-lg bg-white text-base"
              style={{ height: 120 }}
            />

            {/* Find lyric button */}
            <View className="flex-row justify-end">
              <Button
                title={isLoading ? "Finding..." : "Find lyric"}
                variant="primary"
                size="medium"
                onPress={handleFindLyric}
                disabled={isLoading || !inputText.trim()}
                style={{ minWidth: 120 }}
              />
            </View>
          </View>

          {/* Loading state */}
          {isLoading && (
            <View className="items-center" style={{ gap: 12 }}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text className="text-lg text-gray-600">Finding the perfect lyric...</Text>
            </View>
          )}

          {/* Result area */}
          {hasSearched && !isLoading && foundLyric && (
            <View className="bg-gray-50 p-4 rounded-lg" style={{ gap: 12 }}>
              <Text className="text-lg font-semibold text-gray-800">Your Matching Lyric</Text>
              <Text className="text-base text-gray-700 leading-6">{foundLyric}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default TextToLyricScreen; 