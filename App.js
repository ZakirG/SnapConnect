import './global.css';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen, SignupScreen } from './src/screens/auth';
import { CameraScreen, SnapPreviewScreen, SendToScreen } from './src/screens/camera';
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
        
        console.log('🎵 [Test] Step 1: Fetching your top 20 Spotify tracks...');
        const { data: { user } } = await supabase.auth.getUser();
        const existing = await supabase.storage.from('lyrics-bucket').list(user.id, { limit: 1000 });
        const existingSet = new Set(existing.data?.map(f=>f.name.replace('.txt','')));
        const tracks = await getTopTracks(spotifyAccessToken, 50, 'medium_term');
        
        console.log(`🎵 [Test] Found ${tracks.length} top tracks; ${existingSet.size} have lyrics already`);
        console.log(`🎵 [Test] Processing ${tracks.length} top tracks`);
        
        console.log('🎵 [Test] Top tracks to process:');
        tracks.slice(0, 5).forEach((track, i) => {
          console.log(`🎵 [Test]   ${i + 1}. "${track.name}" by ${track.artists[0].name}`);
        });
        if (tracks.length > 5) {
          console.log(`🎵 [Test]   ... and ${tracks.length - 5} more`);
        }
        
        console.log(`\n🎵 [Test] ===============================================`);
        console.log(`🎵 [Test] PROCESSING TOP TRACKS LYRICS`);
        console.log(`🎵 [Test] ===============================================`);
        
        try {
          const result = await syncTopTracksLyricsWithProgress(spotifyAccessToken, 50, 'medium_term');
          
          console.log(`✅ [Test] Completed top tracks processing`);
          console.log(`📊 [Test] Final stats: ${result.tracksProcessed} tracks, ${result.lyricsFound} lyrics found, ${result.lyricsUploaded} uploaded`);
        } catch (error) {
          console.error(`❌ [Test] Failed to sync top tracks lyrics:`, error.message);
        }
        
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

  // Enhanced sync function with progress reporting for top tracks
  const syncTopTracksLyricsWithProgress = async (accessToken, limit, timeRange) => {
    const { getTopTracks } = await import('./src/services/spotify');
    const { fetchLyrics } = await import('./src/services/genius');
    
    let tracksProcessed = 0;
    let lyricsFound = 0;
    let lyricsUploaded = 0;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const existing = await supabase.storage.from('lyrics-bucket').list(user.id, { limit: 1000 });
      const existingSet = new Set(existing.data?.map(f=>f.name.replace('.txt','')));
      const tracks = await getTopTracks(accessToken, limit, timeRange);
      console.log(`🎵 [Test] Found ${tracks.length} top tracks; ${existingSet.size} have lyrics already`);
      console.log(`🎵 [Test] Processing ${tracks.length} top tracks`);
      
      // Debug: show what we're checking
      console.log('[Test] Existing file slugs (first 10):', Array.from(existingSet).slice(0, 10).join(', '));
      
      // Process all tracks (limit already applied)
      const tracksToProcess = tracks;
      
      for (const track of tracksToProcess) {
        if (!track?.name || !track?.artists?.[0]?.name) continue;
        
        tracksProcessed++;
        const trackName = track.name;
        const artistName = track.artists[0].name;
        
        const safe = (str)=>str.toLowerCase().replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'_');
        const fileSafe = `${safe(artistName)}-${safe(trackName)}`;
        const fileName = `${user.id}/${fileSafe}.txt`;

        // Debug: show what we're checking
        console.log(`[Test] Checking "${fileSafe}" against existing slugs…`);
        existingSet.forEach(slug => {
          const longest = slug.split(/[_-]/).sort((a,b) => b.length - a.length)[0];
          // console.log(`   ↪ ${slug} (longest="${longest}") → ${fileSafe.includes(longest) ? 'MATCH' : 'no match'}`);
        });

        if (existingSet.has(fileSafe)) {
          console.log(`[Test] Skip – direct filename match`);
          continue;
        }

        console.log(`🎵 [Test] Processing track ${tracksProcessed}: "${trackName}" by ${artistName}`);

        try {
          const lyrics = await fetchLyrics(trackName, artistName);
          // console.log("Got lyrics", lyrics);

          const content = lyrics ? lyrics : new Blob([''], { type: 'text/plain' });

          if (lyrics) {
            lyricsFound++;
          } else {
            console.log(`❌ [Test] No lyrics found – uploading placeholder`);
          }

          const { error } = await supabase.storage
            .from('lyrics-bucket')
            .upload(fileName, content, { upsert: true, contentType: 'text/plain' });

          if (error) {
            console.error(`❌ [Test] Upload failed:`, error.message);
          } else {
            lyricsUploaded++;
            console.log(`📁 [Test] Uploaded: ${fileName}`);
          }
        } catch (err) {
          console.error(`❌ [Test] Error processing "${trackName}":`, err.message);
        }

        // Small delay between tracks
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error(`❌ [Test] Top tracks sync error:`, error.message);
    }

    return { tracksProcessed, lyricsFound, lyricsUploaded };
  };

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
