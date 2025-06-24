import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { Button } from '../../components/neumorphic';

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
      <CameraView style={{ flex: 1 }} facing={type} ref={cameraRef}>
        <View className="flex-1 bg-transparent flex-col justify-between m-8">
          <TouchableOpacity className="self-end items-center bg-transparent" onPress={toggleCameraType}>
            <Text className="text-lg font-bold text-white">Flip</Text>
          </TouchableOpacity>
          <View className="items-center">
            <Button onPress={takePicture} style={{width: 70, height: 70, borderRadius: 35}} />
          </View>
        </View>
      </CameraView>
    </View>
  );
};

export default CameraScreen; 