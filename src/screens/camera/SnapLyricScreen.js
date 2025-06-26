/**
 * This screen generates and displays an AI-powered caption for a captured image.
 * It shows a loading state while the caption is being generated and then
 * displays the result in a text area.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert, TextInput, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/neumorphic';
import { generateCaption } from '../../services/openai';

const SnapLyricScreen = ({ route, navigation }) => {
  const { mediaUri } = route.params;
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCaption = async () => {
      if (!mediaUri) {
        setError('No image was provided.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const generatedCaption = await generateCaption(mediaUri);
        setCaption(generatedCaption);
      } catch (err) {
        setError(err.message);
        Alert.alert('Error', 'Could not generate a caption. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCaption();
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
              <Text className="text-lg text-gray-600 mt-4">Writing image caption...</Text>
              <Text className="text-sm text-gray-400 mt-2">This might take a moment.</Text>
            </>
          ) : error ? (
            <View className="items-center">
              <Text className="text-lg text-red-500 text-center">{error}</Text>
              <Button
                title="Try Again"
                variant="primary"
                onPress={() => {
                  // This is a placeholder for a retry mechanism
                  navigation.goBack();
                }}
                style={{ marginTop: 20 }}
              />
            </View>
          ) : (
            <View className="w-full items-center" style={{ gap: 16 }}>
              <Text className="text-2xl font-bold">Your SnapLyric</Text>
              <TextInput
                value={caption}
                onChangeText={setCaption}
                multiline
                editable
                className="w-full h-40 p-4 border border-gray-300 rounded-lg bg-white text-base"
                style={{ textAlignVertical: 'top' }}
              />
            </View>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default SnapLyricScreen; 