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
  const cameraRef = useRef(null);

  useEffect(() => {
    console.log('CameraScreen mounted, requesting permissions');
    (async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        console.log('Camera permission status', status);
        setHasPermission(status === 'granted');
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
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      navigation.navigate('SnapPreview', { photoUri: photo.uri });
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
        <View className="absolute top-12 right-6 z-10">
          <TouchableOpacity onPress={toggleCameraType}>
            <Ionicons name="camera-reverse-outline" size={28} color="white" />
          </TouchableOpacity>
        </View>

        {/* Capture button – raised above bottom nav */}
        <View className="absolute bottom-32 w-full items-center">
          <Button onPress={takePicture} style={{ width: 80, height: 80, borderRadius: 40 }} />
        </View>

        {/* Bottom navigation */}
        <SafeAreaView
          edges={['bottom']}
          className="absolute bottom-0 w-full px-10 pb-4"
        >
          <View className="flex-row items-center justify-between">
            {/* Messages */}
            <TouchableOpacity onPress={() => navigation.navigate('Chat')}>
              <Ionicons name="chatbubble-outline" size={28} color="white" />
            </TouchableOpacity>

            {/* Camera (current) */}
            <TouchableOpacity onPress={() => {}} activeOpacity={1}>
              <Ionicons name="camera" size={32} color="white" />
            </TouchableOpacity>

            {/* Friends / Stories */}
            <TouchableOpacity onPress={() => navigation.navigate('Stories')}>
              <Ionicons name="people-outline" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
};

export default CameraScreen; 