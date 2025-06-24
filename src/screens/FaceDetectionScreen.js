import React, { useRef, useState } from 'react';
import { View, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * FaceDetectionScreen
 * -------------------
 * Loads a local HTML (face.html) that runs face-api.js inside a WebView, then
 * receives face-landmark JSON via postMessage. Displays simple eye markers to
 * verify coordinates.
 */
export default function FaceDetectionScreen() {
  const [landmarks, setLandmarks] = useState(null);
  const webRef = useRef(null);

  const onMessage = ({ nativeEvent }) => {
    console.log('[FaceDetect] raw message:', nativeEvent.data);
    let data;
    try {
      data = JSON.parse(nativeEvent.data);
    } catch (e) {
      console.warn('[FaceDetect] non-JSON payload');
      return;
    }

    if (data.stage) {
      console.log('[FaceDetect] stage:', data.stage, data.error || '');
      return;
    }

    setLandmarks(data);
  };

  const { width, height } = Dimensions.get('window');

  const mapPoint = (pt) => {
    // face-api gives coords in video space (same size as <video> element)
    // Our video stretches to cover full WebView which equals device dims
    return { x: pt.x, y: pt.y };
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={require('../../assets/face.html')}
        javaScriptEnabled
        onMessage={onMessage}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        style={{ flex: 1 }}
      />

      {/* Overlay markers */}
      {landmarks && (
        [landmarks.leftEyeCenter, landmarks.rightEyeCenter].map((pt, idx) => {
          const mapped = mapPoint(pt);
          return (
            <View
              key={idx}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: mapped.x - 10,
                top: mapped.y - 10,
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: 'rgba(255,0,0,0.6)',
              }}
            />
          );
        })
      )}
    </View>
  );
} 