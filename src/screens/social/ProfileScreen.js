import React, { useEffect, useState } from 'react';
import { View, Alert, Text, FlatList } from 'react-native';
import { Button } from '../../components/neumorphic';
import { supabase } from '../../services/supabase/config';
import { useUserStore } from '../../store/user';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { linkAccount, getPlaylists } from '../../services/spotify';

/**
 * A screen that displays user profile information and a logout button.
 *
 * @returns {React.ReactElement}
 */
const ProfileScreen = ({ navigation }) => {
  const { user, logout, spotifyAccessToken, setSpotifyTokens } = useUserStore();
  const [playlists, setPlaylists] = useState([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);

  /**
   * Handles the user logout process.
   * It signs the user out of Supabase and clears the user state.
   */
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      logout(); // This will trigger the navigation change
    } catch (error) {
      Alert.alert('Logout Failed', error.message);
    }
  };

  const handleConnectSpotify = async () => {
    try {
      const tokens = await linkAccount();
      if (!tokens) return; // User cancelled or error.
      setSpotifyTokens(tokens.accessToken, tokens.refreshToken, tokens.expiresIn);
      console.log('[ProfileScreen] Spotify tokens stored');
      // Immediately fetch playlists
      await fetchAndSetPlaylists(tokens.accessToken);
    } catch (err) {
      console.error('[ProfileScreen] connectSpotify error', err);
      Alert.alert('Spotify Linking Failed', err.message);
    }
  };

  const fetchAndSetPlaylists = async (accessToken) => {
    setIsLoadingPlaylists(true);
    try {
      const data = await getPlaylists(accessToken);
      setPlaylists(data);
    } catch (err) {
      console.error('[ProfileScreen] getPlaylists error', err);
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  useEffect(() => {
    if (spotifyAccessToken) {
      fetchAndSetPlaylists(spotifyAccessToken);
    }
  }, [spotifyAccessToken]);

  return (
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
        <View className="items-center">
          <Text className="text-2xl font-bold mb-1">{user?.user_metadata?.username || user?.email?.split('@')[0]}</Text>
          <Text className="text-gray-500">{user?.email}</Text>
        </View>
        <Button
          title="Logout"
          size="large"
          variant="primary"
          onPress={handleLogout}
          style={{ width: '100%' }}
        />
        {spotifyAccessToken ? (
          <Button
            title="Spotify Connected"
            size="large"
            variant="secondary"
            disabled
            style={{ width: '100%' }}
          />
        ) : (
          <Button
            title="Connect Spotify"
            size="large"
            variant="primary"
            onPress={handleConnectSpotify}
            style={{ width: '100%' }}
          />
        )}

        {/* Playlist List – scrollable panel */}
        {isLoadingPlaylists ? (
          <Text className="text-gray-400 mt-4">Loading playlists…</Text>
        ) : playlists.length > 0 ? (
          <>
            <Text className="text-lg font-semibold">your playlists 🎶</Text>
            <View className="w-full max-h-52 border-2 border-gray-300 rounded-lg" style={{ paddingVertical: 2 }}>
              <FlatList
                data={playlists}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Text className="text-gray-600 text-center py-1" numberOfLines={1}>
                    {item.name}
                  </Text>
                )}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled
              />
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
};

export default ProfileScreen; 