import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image, Dimensions } from 'react-native';
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
  const [selectedFilter, setSelectedFilter] = useState('none'); // 'none' | 'sunglasses' | 'horns' | 'sunglasses2'
  const { user } = useUserStore();

  // Verbose logging helper
  const log = (...args) => console.log('[CameraScreen]', ...args);

  const FILTERS = [
    { key: 'none', label: '🚫', src: null },
    { key: 'sunglasses', label: '👓', src: require('../../../assets/ar_filters/sunglasses.png') },
    { key: 'sunglasses2', label: '🕶️', src: require('../../../assets/ar_filters/sunglasses-2.png') },
    { key: 'horns', label: '😈', src: require('../../../assets/ar_filters/horns.png') },
  ];

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
    log('handleFacesDetected fired. faces.length =', faces.length, 'filter:', selectedFilter);
    if (faces.length > 0) {
      log('First face bounds', faces[0].bounds);
    }
    setFaces(faces);
  };

  const handleCameraReady = () => {
    log('Camera is ready');
  };

  const handleMountError = (e) => {
    log('Camera mount error', e?.nativeEvent?.message || e);
  };

  const selectFilter = (key) => {
    // Immediately hide any existing overlay before re-render with new filter
    setFaces([]);
    log('filter pressed →', key);
    setSelectedFilter(key);
  };

  // Heartbeat – logs every second so we know detector flag status
  useEffect(() => {
    const id = setInterval(() => {
      log('heartbeat',
        'enableFaceDetection =', selectedFilter !== 'none',
        '| selectedFilter =', selectedFilter,
        '| faces.length =', faces.length);
    }, 1000);
    return () => clearInterval(id);
  }, [selectedFilter, faces]);

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
        enableFaceDetection={selectedFilter !== 'none'}
        onFacesDetected={handleFacesDetected}
        onCameraReady={handleCameraReady}
        onMountError={handleMountError}
        faceDetectorSettings={{
          mode: 'fast',
          detectLandmarks: 'all',
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
            {/* Filter selector buttons */}
            <View className="flex-row space-x-3">
              {FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => selectFilter(f.key)}
                  activeOpacity={0.8}
                  className={`w-[46px] h-[46px] rounded-full border-2 ${
                    selectedFilter === f.key ? 'border-yellow-400' : 'border-white/70'
                  } bg-black/30 items-center justify-center`}
                >
                  {f.key === 'none' ? (
                    <Ionicons name="close" size={20} color="white" />
                  ) : (
                    <Image source={f.src} style={{ width: 28, height: 14, resizeMode: 'contain' }} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

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

        {/* AR Filter Overlays – dynamic positioning when faces detected */}
        {selectedFilter !== 'none' && faces.map((face, index) => {
          // expo-camera provides bounds and basic face info
          const { bounds } = face;
          if (!bounds) return null;

          // Calculate sunglasses position based on face bounds
          const faceWidth = bounds.size.width;
          const faceHeight = bounds.size.height;
          const centerX = bounds.origin.x + faceWidth / 2;
          const eyeY = bounds.origin.y + faceHeight * 0.35; // Eyes are roughly 35% down from top

          // Determine placement per filter
          let src;
          let width;
          let height;
          let left;
          let top;

          switch (selectedFilter) {
            case 'sunglasses':
            case 'sunglasses2': {
              src = selectedFilter === 'sunglasses'
                ? require('../../../assets/ar_filters/sunglasses.png')
                : require('../../../assets/ar_filters/sunglasses-2.png');
              width = faceWidth * 0.8;
              height = width * 0.4;
              left = centerX - width / 2;
              top = eyeY - height / 2;
              break;
            }
            case 'horns':
              src = require('../../../assets/ar_filters/horns.png');
              width = faceWidth * 1.0;
              height = width * 0.6;
              left = centerX - width / 2;
              top = bounds.origin.y - height * 0.3 - 180; // move further up by 180px
              break;
            default:
              return null;
          }

          return (
            <Image
              key={`${selectedFilter}-${face.faceID ?? `face-${index}`}`}
              source={src}
              style={{
                position: 'absolute',
                left,
                top,
                width,
                height,
                resizeMode: 'contain',
              }}
            />
          );
        })}

        {/* AR Filter fallback for non-face scenario */}
        {selectedFilter !== 'none' && faces.length === 0 && (() => {
          let src;
          switch (selectedFilter) {
            case 'sunglasses':
              src = require('../../../assets/ar_filters/sunglasses.png');
              break;
            case 'sunglasses2':
              src = require('../../../assets/ar_filters/sunglasses-2.png');
              break;
            case 'horns':
              src = require('../../../assets/ar_filters/horns.png');
              break;
            default:
              return null;
          }
          return (
            <Image
              key={`fallback-${selectedFilter}`}
              source={src}
              style={{
                position: 'absolute',
                width: Dimensions.get('window').width * 1.5,
                height: Dimensions.get('window').width * 0.6,
                left: -Dimensions.get('window').width * 0.25,
                top: Dimensions.get('window').height * 0.35 - (src === require('../../../assets/ar_filters/horns.png') ? 180 : 0),
                resizeMode: 'contain',
                opacity: 0.9,
              }}
            />
          );
        })()}

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