/**
 * This screen allows users to input text manually to find matching song lyrics.
 * It shows a text input area where users can write their thoughts or mood,
 * then uses the same RAG flow to find matching lyrics from songs.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableWithoutFeedback, Keyboard, ActivityIndicator, Alert, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Button } from '../../components/neumorphic';
import { captionToLyric } from '../../services/rag';
import { generateTweetVariations } from '../../services/openai';

const TextToLyricScreen = ({ navigation }) => {
  const [inputText, setInputText] = useState('');
  const [foundLyrics, setFoundLyrics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  /**
   * Copies the specified text to the clipboard and shows a confirmation alert
   */
  const handleCopyToClipboard = async (text) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied!', 'Tweet + lyric copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  /**
   * Opens Twitter with the specified text pre-filled for posting
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

  /**
   * Searches for multiple matching lyrics based on the user's input text
   */
  const handleFindLyric = async () => {
    if (!inputText.trim()) {
      Alert.alert('Please enter some text', 'Write something to find matching lyrics!');
      return;
    }

    try {
      setIsLoading(true);
      setHasSearched(false);
      setFoundLyrics([]);

      // Step 1: Generate 3 catchy tweet variations
      const tweetVariations = await generateTweetVariations(inputText.trim());
      console.log('[TextToLyric] Generated tweet variations:', tweetVariations);

      // Step 2: Get diverse lyric options using the original input (to get more variety)
      const diverseLyrics = await captionToLyric(inputText.trim(), 3);
      console.log('[TextToLyric] Diverse lyrics:', diverseLyrics);

      const processedLyrics = [];

      // Ensure we have lyrics to work with
      const lyricsArray = Array.isArray(diverseLyrics) ? diverseLyrics : (diverseLyrics ? [diverseLyrics] : []);

      for (let i = 0; i < tweetVariations.length; i++) {
        const tweet = tweetVariations[i];
        
        // Use a different lyric for each tweet if available, otherwise cycle through or fallback
        const lyricData = lyricsArray[i] || lyricsArray[i % lyricsArray.length] || null;

        if (lyricData) {
          const { text, artist, track } = lyricData;
          
          // Capitalize the first letter in each word of the artist and track
          const capitalizedArtist = artist.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          const capitalizedTrack = track.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          
          processedLyrics.push({
            id: i,
            tweetText: tweet,
            lyricText: text,
            artist: capitalizedArtist,
            track: capitalizedTrack,
            fullQuote: `${tweet} It's like ${capitalizedArtist} said on ${capitalizedTrack} -- '${text}'.`
          });
        } else {
          // Fallback if no lyric found
          processedLyrics.push({
            id: i,
            tweetText: tweet,
            lyricText: '',
            artist: '',
            track: '',
            fullQuote: tweet
          });
        }
      }

      if (processedLyrics.length > 0) {
        setFoundLyrics(processedLyrics);
      } else {
        // Ultimate fallback
        setFoundLyrics([{
          id: 0,
          tweetText: inputText.trim(),
          lyricText: '',
          artist: '',
          track: '',
          fullQuote: inputText.trim()
        }]);
        Alert.alert("Couldn't generate tweet variations", "But your original words are meaningful!");
      }
      
      setHasSearched(true);
    } catch (error) {
      Alert.alert('Error', 'Could not find matching lyrics. Please try again.');
      console.error('TextToLyric error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ padding: 24, gap: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          {/* Title and subtitle */}
          <View className="items-center" style={{ gap: 8 }}>
            <Text className="text-3xl font-bold text-gray-800 text-center">What's on your mind?</Text>
            <Text className="text-lg text-gray-600 text-center px-4">
              We'll find a lyric from your top-played and recent songs matching what you're thinking.
              Then we'll write your thoughts into a tweet.
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
              <Text className="text-lg text-gray-600">Finding matching lyrics...</Text>
            </View>
          )}

          {/* Results area */}
          {hasSearched && !isLoading && foundLyrics.length > 0 && (
            <View style={{ gap: 16 }}>
              <Text className="text-lg font-semibold text-gray-800">Your Tweet + Lyric Combinations</Text>
              {foundLyrics.map((item, index) => (
                <View key={item.id} className="bg-gray-50 p-4 rounded-lg" style={{ gap: 8 }}>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-medium text-gray-600">Option {index + 1}</Text>
                    {item.artist && item.track && (
                      <Text className="text-xs text-gray-500">{item.artist} - {item.track}</Text>
                    )}
                  </View>
                  
                  {/* Just the combined quote */}
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
      </View>
    );
  };

export default TextToLyricScreen; 