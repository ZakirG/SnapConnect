import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { Button } from '../../components/neumorphic';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../store/user';

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
  const [faces, setFaces] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('sunglasses'); // 'none', 'sunglasses'
  const { user } = useUserStore();

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

  const handleFacesDetected = ({ faces }) => {
    console.log('Face detection callback triggered. Faces detected:', faces.length);
    if (faces.length > 0) {
      console.log('First face data:', JSON.stringify(faces[0], null, 2));
    }
    setFaces(faces);
  };

  const toggleFilter = () => {
    setSelectedFilter(current => current === 'none' ? 'sunglasses' : 'none');
  };

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
      <CameraView
        key={type}
        style={{ flex: 1 }}
        facing={type}
        ref={cameraRef}
        onFacesDetected={handleFacesDetected}
        faceDetectorSettings={{
          mode: 'fast',
          detectLandmarks: 'none',
          runClassifications: 'none',
          minDetectionInterval: 100,
          tracking: true,
        }}
      >
        {/* Top-right buttons */}
        <SafeAreaView edges={['top']} className="absolute top-0 right-0 z-10 p-4">
          <View className="flex-row" style={{ gap: 12 }}>
            {/* Add Friends button */}
            <Button
              variant="circular"
              size="medium"
              onPress={() => navigation.navigate('AddFriends')}
              style={{ width: 48, height: 48 }}
            >
              <Ionicons name="person-add-outline" size={24} color="#374151" />
            </Button>
            
            {/* Flip camera button */}
            <Button
              variant="circular"
              size="medium"
              onPress={toggleCameraType}
              style={{ width: 48, height: 48 }}
            >
              <Ionicons name="camera-reverse-outline" size={24} color="#374151" />
            </Button>
          </View>
        </SafeAreaView>

        {/* Top-left profile button */}
        <SafeAreaView edges={['top']} className="absolute top-0 left-0 z-10 p-4">
          <Button
            variant="circular"
            size="medium"
            onPress={() => navigation.navigate('Profile')}
            style={{ width: 48, height: 48 }}
          >
            <Ionicons name="person-outline" size={24} color="#374151" />
          </Button>
        </SafeAreaView>

        {/* Capture button and filter selector */}
        <View className="absolute bottom-36 w-full items-center">
          <View className="flex-row items-center space-x-6">
            {/* Filter selector button */}
            <TouchableOpacity
              onPress={toggleFilter}
              activeOpacity={0.8}
              className="w-[50px] h-[50px] items-center justify-center"
            >
              <View className="w-[46px] h-[46px] rounded-full border-4 border-white/70 bg-black/20 items-center justify-center">
                {selectedFilter === 'sunglasses' ? (
                  <Text className="text-white text-xs font-bold">👓</Text>
                ) : (
                  <Ionicons name="close" size={20} color="white" />
                )}
              </View>
            </TouchableOpacity>

            {/* Capture button */}
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

        {/* AR Filter Overlays */}
        {selectedFilter === 'sunglasses' && faces.map((face, index) => {
          // expo-camera provides bounds and basic face info
          const { bounds } = face;
          if (!bounds) return null;

          // Calculate sunglasses position based on face bounds
          const faceWidth = bounds.size.width;
          const faceHeight = bounds.size.height;
          const centerX = bounds.origin.x + faceWidth / 2;
          const eyeY = bounds.origin.y + faceHeight * 0.35; // Eyes are roughly 35% down from top

          const sunglassesWidth = faceWidth * 0.8;
          const sunglassesHeight = sunglassesWidth * 0.4;

          return (
            <Image
              key={face.faceID ?? `face-${index}`}
              source={require('../../../assets/ar_filters/sunglasses.png')}
              style={{
                position: 'absolute',
                left: centerX - sunglassesWidth / 2,
                top: eyeY - sunglassesHeight / 2,
                width: sunglassesWidth,
                height: sunglassesHeight,
                resizeMode: 'contain',
              }}
            />
          );
        })}

        {/* Debug info moved further down to avoid profile icon */}
        <View className="absolute top-40 left-4 bg-black/70 p-3 rounded-lg">
          <Text className="text-white text-xs">
            Camera: {type} | Faces: {faces.length}
          </Text>
          <Text className="text-white text-xs">
            Filter: {selectedFilter}
          </Text>
          <Text className="text-white text-xs">
            Detection: {faces.length > 0 ? '✅ Working' : '❌ No faces'}
          </Text>
        </View>
      </CameraView>
    </View>
  );
};

export default CameraScreen; 