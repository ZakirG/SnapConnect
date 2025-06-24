import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getStoriesForUser } from '../../services/stories';
import { useUserStore } from '../../store/user';

/**
 * A placeholder screen for the stories view.
 *
 * @returns {React.ReactElement}
 */
const StoriesScreen = ({ navigation }) => {
  const { user } = useUserStore();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch stories whenever screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let isActive = true;
      const fetchStories = async () => {
        try {
          setLoading(true);
          const data = await getStoriesForUser(user.id);
          console.log('[StoriesScreen] fetched stories', data);
          if (isActive) setStories(data);
          // Debug fetch first story URL status
          if (data.length) {
            try {
              const resp = await fetch(data[0].storageUrl, { method: 'GET' });
              console.log('[StoriesScreen] test fetch status', resp.status, resp.ok);
              const len = resp.headers.get('content-length');
              console.log('[StoriesScreen] content-length', len);
            } catch (netErr) {
              console.warn('[StoriesScreen] test fetch network error', netErr);
            }
          }
        } catch (err) {
          console.warn('Failed to fetch stories', err);
        } finally {
          if (isActive) setLoading(false);
        }
      };
      fetchStories();
      return () => {
        isActive = false;
      };
    }, [user])
  );

  /** -------------------------------------------------------------------
   * Renders a single circular story avatar with a purple ring.
   *
   * @param {object} props
   * @param {{ id: string; name: string; avatar: string }} props.item – story data
   * @returns {React.ReactElement}
   * ------------------------------------------------------------------- */
  const StoryItem = ({ item }) => (
    <TouchableOpacity
      className="items-center mr-4"
      onPress={() => navigation.navigate('StoryViewer', {
        storageUrl: item.storageUrl,
        mediaType: item.mediaType,
        username: item.username,
      })}
    >
      {/* Avatar with purple ring */}
      <View className="relative">
        <Image
          source={{ uri: item.storageUrl }}
          className="w-16 h-16 rounded-full border-2 border-purple-600"
          onError={(e) => console.warn('[StoryItem] image load error', item.storageUrl, e.nativeEvent.error)}
          onLoad={() => console.log('[StoryItem] image loaded', item.storageUrl)}
        />
      </View>
      {/* Name */}
      <Text className="text-xs mt-1 max-w-[64px] text-center text-gray-800" numberOfLines={1}>
        {item.username}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-white">
      {/* -------------------------------------------------------------- */}
      {/* Top Navigation bar                                            */}
      {/* -------------------------------------------------------------- */}
      <SafeAreaView edges={['top']} className="px-4 pt-2">
        <View className="flex-row items-center justify-between">
          {/* Left icons */}
          <View className="flex-row items-center space-x-4">
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <View className="w-9 h-9 rounded-full bg-yellow-400/80 items-center justify-center">
                <Ionicons name="person" size={18} color="#374151" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="search" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Screen title */}
          <Text className="text-lg font-semibold text-gray-900">Stories</Text>

          {/* Right icons */}
          <View className="flex-row items-center space-x-4">
            <TouchableOpacity onPress={() => navigation.navigate('AddFriends')}>
              <Ionicons name="person-add-outline" size={24} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="ellipsis-horizontal" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* -------------------------------------------------------------- */}
      {/* Friends stories                                               */}
      {/* -------------------------------------------------------------- */}
      <View className="mt-6">
        <Text className="text-base font-semibold text-gray-900 px-4 mb-3">Friends</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {loading ? (
            <ActivityIndicator className="mr-4" />
          ) : (
            stories.map((story) => <StoryItem key={story.id} item={story} />)
          )}
        </ScrollView>
      </View>

      {/* -------------------------------------------------------------- */}
      {/* Post a Story button (center)                                   */}
      {/* -------------------------------------------------------------- */}
      <View className="flex-1 items-center justify-center">
        <TouchableOpacity
          onPress={() => navigation.navigate('Camera')}
          activeOpacity={0.8}
          className="items-center"
        >
          <View className="relative">
            <Ionicons name="person" size={60} color="#9ca3af" />
            <View className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-purple-600 items-center justify-center">
              <Ionicons name="add" size={20} color="white" />
            </View>
          </View>
          <Text className="mt-2 text-sm font-medium text-gray-700">Post a Story</Text>
        </TouchableOpacity>
      </View>

      {/* Fallback empty space so list scrolls under nav bar */}
      <View className="flex-1" />

      {/* -------------------------------------------------------------- */}
      {/* Bottom Navigation – consistent with Camera screen             */}
      {/* -------------------------------------------------------------- */}
      <View className="absolute bottom-0 left-0 right-0">
        <SafeAreaView edges={['bottom']} className="bg-black/20 backdrop-blur-sm">
          <View className="flex-row items-center justify-around py-4 px-6">
            {/* Messages */}
            <TouchableOpacity onPress={() => navigation.navigate('Chat')} className="p-2">
              <Ionicons name="chatbubble-outline" size={24} color="white" />
            </TouchableOpacity>

            {/* Camera */}
            <TouchableOpacity onPress={() => navigation.navigate('Camera')} className="p-2">
              <Ionicons name="camera" size={28} color="white" />
            </TouchableOpacity>

            {/* Friends / Stories (current) */}
            <TouchableOpacity activeOpacity={1} className="p-2">
              <Ionicons name="people" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
};

export default StoriesScreen; 