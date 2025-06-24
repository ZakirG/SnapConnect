import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { Button } from '../../components/neumorphic';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

/**
 * A screen that displays the camera view, allowing users to take photos.
 * @param {object} props - The component props.
 * @param {object} props.navigation - The navigation object provided by React Navigation.
 * @returns {React.ReactElement}
 */
const CameraScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState('back');
  const [isRecording, setIsRecording] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    console.log('CameraScreen mounted, requesting permissions');
    (async () => {
      try {
        const { status: camStatus } = await Camera.requestCameraPermissionsAsync();
        const { status: micStatus } = await Camera.requestMicrophonePermissionsAsync();
        console.log('Permission status — camera:', camStatus, 'microphone:', micStatus);
        setHasPermission(camStatus === 'granted' && micStatus === 'granted');
      } catch (err) {
        console.warn('Permission request error', err);
        setHasPermission(false);
      }
    })();
  }, []);

  const toggleCameraType = () => {
    setType(current => (current === 'back' ? 'front' : 'back'));
  }

  const takePicture = async () => {
    if (cameraRef.current && !isRecording) {
      const photo = await cameraRef.current.takePictureAsync();
      navigation.navigate('SnapPreview', {
        mediaUri: photo.uri,
        mediaType: 'image',
      });
    }
  };

  /**
   * Starts an async video recording session. The promise returned by `recordAsync`
   * resolves only after `stopRecording` is invoked, at which point we navigate
   * to the preview screen.
   */
  const startRecording = async () => {
    if (cameraRef.current && !isRecording) {
      try {
        setIsRecording(true);
        const video = await cameraRef.current.recordAsync();
        // After recording completes, navigate to preview
        navigation.navigate('SnapPreview', {
          mediaUri: video.uri,
          mediaType: 'video',
        });
      } catch (err) {
        console.warn('Video recording error', err);
      } finally {
        setIsRecording(false);
      }
    }
  };

  /**
   * Stops an active recording session if one exists.
   */
  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  };

  if (hasPermission === null) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator />
      </View>
    );
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View className="flex-1">
      <CameraView key={type} style={{ flex: 1 }} facing={type} ref={cameraRef}>
        {/* Flip camera button (top-right) */}
        <SafeAreaView edges={['top']} className="absolute top-0 right-0 z-10 p-4">
          <Button
            variant="circular"
            size="medium"
            onPress={toggleCameraType}
            style={{ width: 48, height: 48 }}
          >
            <Ionicons name="camera-reverse-outline" size={24} color="#374151" />
          </Button>
        </SafeAreaView>

        {/* Capture button – moved up and styled as ring */}
        <View className="absolute bottom-36 w-full items-center">
          <TouchableOpacity
            onPress={takePicture}
            onLongPress={startRecording}
            onPressOut={stopRecording}
            activeOpacity={0.8}
            className="w-[70px] h-[70px] items-center justify-center"
          >
            {/* Ring design with transparent center like Snapchat */}
            <View className="w-[66px] h-[66px] rounded-full border-[6px] border-white bg-transparent" />
          </TouchableOpacity>
        </View>

        {/* Recording indicator */}
        {isRecording && (
          <View className="absolute top-20 left-1/2 -ml-1.5 w-3 h-3 bg-red-500 rounded-full" />
        )}

        {/* Bottom navigation - flush with screen edges */}
        <View className="absolute bottom-0 left-0 right-0">
          <SafeAreaView
            edges={['bottom']}
            className="bg-black/20 backdrop-blur-sm"
          >
            <View className="flex-row items-center justify-around py-4 px-6">
              {/* Messages */}
              <TouchableOpacity onPress={() => navigation.navigate('Chat')} className="p-2">
                <Ionicons name="chatbubble-outline" size={24} color="white" />
              </TouchableOpacity>

              {/* Camera (current) */}
              <TouchableOpacity onPress={() => {}} activeOpacity={1} className="p-2">
                <Ionicons name="camera" size={28} color="white" />
              </TouchableOpacity>

              {/* Friends / Stories */}
              <TouchableOpacity onPress={() => navigation.navigate('Stories')} className="p-2">
                <Ionicons name="people-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </CameraView>
    </View>
  );
};

export default CameraScreen; 