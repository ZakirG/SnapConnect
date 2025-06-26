import './global.css';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen, SignupScreen } from './src/screens/auth';
import { CameraScreen, SnapPreviewScreen, SendToScreen, SnapLyricScreen } from './src/screens/camera';
import { ChatScreen } from './src/screens/chat';
import ConversationScreen from './src/screens/chat/ConversationScreen';
import { StoriesScreen, ProfileScreen, AddFriendsScreen, StoryViewerScreen } from './src/screens/social';
import { useUserStore } from './src/store/user';
import { supabase } from './src/services/supabase/config';
import { FaceDetectionScreen } from './src/screens';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getTopTracks, syncTopTracksLyrics } from './src/services/spotify';
import { useUserStore as useUserStoreForTest } from './src/store/user';
import { hydrateSpotifyTokens } from './src/store/user';

const AuthStack = createStackNavigator();
const MainStack = createStackNavigator();

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Signup" component={SignupScreen} />
  </AuthStack.Navigator>
);

const MainNavigator = () => (
  <MainStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Camera">
    <MainStack.Screen name="Camera" component={CameraScreen} />
    <MainStack.Screen name="FaceDetect" component={FaceDetectionScreen} />
    <MainStack.Screen name="SnapPreview" component={SnapPreviewScreen} />
    <MainStack.Screen name="SnapLyric" component={SnapLyricScreen} />
    <MainStack.Screen name="SendTo" component={SendToScreen} />
    <MainStack.Screen name="Chat" component={ChatScreen} />
    <MainStack.Screen name="Stories" component={StoriesScreen} />
    <MainStack.Screen name="StoryViewer" component={StoryViewerScreen} />
    <MainStack.Screen name="Conversation" component={ConversationScreen} />
    <MainStack.Screen name="Profile" component={ProfileScreen} />
    <MainStack.Screen name="AddFriends" component={AddFriendsScreen} />
  </MainStack.Navigator>
);

/**
 * The main application component.
 * It sets up the navigation container and manages the authentication flow.
 *
 * @returns {React.ReactElement}
 */
export default function App() {
  const { isLoggedIn, setUser } = useUserStore();

  // Temporary debug logging
  console.log('Initializing App component');

  useEffect(() => {
    console.log('Auth state listener subscribing');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session', session);
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('onAuthStateChange user', session?.user);
      setUser(session?.user ?? null);
    });

    // hydrate spotify tokens
    hydrateSpotifyTokens(useUserStore).catch(() => {});

    return () => subscription.unsubscribe();
  }, [setUser]);

  // Test script for lyrics sync (development only)
  useEffect(() => {
    const testLyricsSync = async () => {
      if (!isLoggedIn) return;
      
      const { spotifyAccessToken } = useUserStoreForTest.getState();
      if (!spotifyAccessToken) {
        console.log('[Test] No Spotify token available for lyrics sync test');
        return;
      }
      
      try {
        console.log('🎵 [Test] ===============================================');
        console.log('🎵 [Test] STARTING LYRICS COLLECTION TEST');
        console.log('🎵 [Test] ===============================================');
        
        console.log('🎵 [Test] Running full sync with top tracks + tracks from 2 recent playlists...');
        
        // Use the actual syncTopTracksLyrics function that includes recent playlist tracks
        await syncTopTracksLyrics(spotifyAccessToken, 50, 10, 'medium_term');
        
        console.log(`\n🎵 [Test] ===============================================`);
        console.log('🎉 [Test] LYRICS COLLECTION TEST COMPLETED!');
        console.log(`📊 [Test] Check Supabase Storage for lyrics files`);
        console.log('🎵 [Test] ===============================================');
      } catch (error) {
        console.error('❌ [Test] Lyrics sync test failed:', error);
      }
    };
    
    // Only run test if we have Spotify connection
    if (isLoggedIn) {
      // Check for Spotify token periodically
      const checkForSpotify = () => {
        const { spotifyAccessToken } = useUserStoreForTest.getState();
        if (spotifyAccessToken) {
          console.log('🎵 [Test] Spotify token detected! Starting lyrics collection in 2 seconds...');
          setTimeout(testLyricsSync, 2000);
        } else {
          console.log('🎵 [Test] Waiting for Spotify connection...');
          setTimeout(checkForSpotify, 2000);
        }
      };
      
      setTimeout(checkForSpotify, 1000);
    }
  }, [isLoggedIn]);

  console.log('Render App, isLoggedIn =', isLoggedIn);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {isLoggedIn ? <MainNavigator /> : <AuthNavigator />}
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
