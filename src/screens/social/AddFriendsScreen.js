import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../store/user';
import {
  searchUsersByUsername,
  sendFriendRequest,
  getIncomingFriendRequests,
  acceptFriendRequest,
  denyFriendRequest,
} from '../../services/friends';
import { supabase } from '../../services/supabase/config';

/**
 * Screen for adding friends, displaying friend requests, and finding contacts
 * Inspired by Snapchat's Add Friends interface
 * @param {object} props - The component props
 * @param {object} props.navigation - The navigation object provided by React Navigation
 * @returns {React.ReactElement}
 */
const AddFriendsScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [sentRequests, setSentRequests] = useState([]);

  const { user } = useUserStore();

  // Debounced search term
  const debouncedSearch = useDebouncedValue(searchText);

  // Fetch incoming friend requests
  useEffect(() => {
    if (!user) return;

    const loadRequests = async () => {
      try {
        setLoadingRequests(true);
        const requests = await getIncomingFriendRequests(user.id);
        setFriendRequests(requests);
      } catch (err) {
        console.error('Failed to fetch friend requests', err);
      } finally {
        setLoadingRequests(false);
      }
    };

    loadRequests();
    // Optional: set up polling every 30s
    const intervalId = setInterval(loadRequests, 30_000);
    return () => clearInterval(intervalId);
  }, [user]);

  // Prefetch any pending requests we previously sent
  useEffect(() => {
    if (!user) return;

    const fetchSent = async () => {
      try {
        const { data, error } = await supabase
          .from('friend_requests')
          .select('recipient_id')
          .eq('requester_id', user.id)
          .eq('status', 'pending');
        if (!error && data) {
          setSentRequests(data.map((d) => d.recipient_id));
        }
      } catch (e) {
        console.error('Error fetching sent requests', e);
      }
    };

    fetchSent();
  }, [user]);

  // Search profiles by username
  useEffect(() => {
    const fetchSearch = async () => {
      if (!debouncedSearch.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        setLoadingSearch(true);
        const results = await searchUsersByUsername(debouncedSearch.trim());
        // Exclude current user and already received requests
        const filtered = results.filter(
          (u) =>
            u.id !== user?.id &&
            !friendRequests.some((req) => req.requester_id === u.id) &&
            !friendRequests.some((req) => req.id === u.id)
        );
        setSearchResults(filtered);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setLoadingSearch(false);
      }
    };

    fetchSearch();
  }, [debouncedSearch, user, friendRequests]);

  /**
   * Handles accepting a friend request
   * @param {string} requesterId - The ID of the user to accept
   */
  const handleAcceptRequest = async (requesterId) => {
    try {
      if (!user) throw new Error('Not authenticated');
      await acceptFriendRequest(user, requesterId);
      // remove from list locally
      setFriendRequests((prev) => prev.filter((req) => req.requester_id !== requesterId));
      Alert.alert('Friend Request', 'Friend request accepted!');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  /**
   * Handles adding a new friend
   * @param {string} recipientId - The ID of the user to add
   */
  const handleAddFriend = async (recipientId) => {
    try {
      if (!user) throw new Error('Not authenticated');
      await sendFriendRequest(user, recipientId);
      setSentRequests((prev) => [...prev, recipientId]);
      Alert.alert('Friend Request', 'Friend request sent!');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  /**
   * Handles dismissing a friend request or suggestion
   * @param {string} requesterId - The ID of the user to dismiss
   */
  const handleDismiss = async (requesterId) => {
    try {
      if (!user) throw new Error('Not authenticated');

      // If the requesterId is in friendRequests list, deny it
      const isRequest = friendRequests.some((fr) => fr.requester_id === requesterId);

      if (isRequest) {
        await denyFriendRequest(user, requesterId);
        setFriendRequests((prev) => prev.filter((fr) => fr.requester_id !== requesterId));
      }

      // Also remove from searchResults/sentRequests just in case
      setSearchResults((prev) => prev.filter((u) => u.id !== requesterId));
      setSentRequests((prev) => prev.filter((id) => id !== requesterId));

      Alert.alert('Dismissed', 'Friend request dismissed');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  /**
   * Renders a friend request item
   * @param {object} req - The friend request object
   * @returns {React.ReactElement}
   */
  const renderFriendRequest = (req) => (
    <View key={req.id} className="flex-row items-center justify-between px-4 py-3">
      <View className="flex-row items-center flex-1">
        <View className="relative">
          <View className="w-12 h-12 rounded-full bg-gray-300 items-center justify-center">
            <Ionicons name="person" size={24} color="#9CA3AF" />
          </View>
          {/* Online indicator not implemented */}
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-black font-semibold text-base">{req.username}</Text>
          <Text className="text-gray-600 text-sm">{req.username}</Text>
        </View>
      </View>
      <View className="flex-row items-center space-x-2">
        <TouchableOpacity
          onPress={() => handleAcceptRequest(req.requester_id)}
          className="bg-yellow-400 px-4 py-2 rounded-full flex-row items-center"
        >
          <Ionicons name="person-add" size={16} color="black" />
          <Text className="text-black font-semibold ml-1">Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDismiss(req.requester_id)}
          className="p-2"
        >
          <Ionicons name="close" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  /**
   * Renders a suggested friend item
   * @param {object} user - The user object
   * @returns {React.ReactElement}
   */
  const renderSuggestedFriend = (user) => {
    const alreadySent = sentRequests.includes(user.id);

    return (
    <View key={user.id} className="flex-row items-center justify-between px-4 py-3">
      <View className="flex-row items-center flex-1">
        <View className="relative">
          <View className="w-12 h-12 rounded-full bg-gray-300 items-center justify-center">
            <Ionicons name="person" size={24} color="#9CA3AF" />
          </View>
          {/* Online indicator not implemented */}
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-black font-semibold text-base">{user.username}</Text>
        </View>
      </View>
      <View className="flex-row items-center space-x-2">
        <TouchableOpacity
          disabled={alreadySent}
          onPress={() => !alreadySent && handleAddFriend(user.id)}
          className={`px-4 py-2 rounded-full flex-row items-center ${alreadySent ? 'bg-green-500' : 'bg-yellow-400'}`}
        >
          {alreadySent ? (
            <Ionicons name="checkmark" size={16} color="white" />
          ) : (
            <Ionicons name="person-add" size={16} color="black" />
          )}
          <Text className="font-semibold ml-1" style={{ color: alreadySent ? 'white' : 'black' }}>
            {alreadySent ? 'Request sent' : 'Add'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );};

  // Debounce helper
  function useDebouncedValue(value, delay = 400) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => setDebouncedValue(value), delay);
      return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-down" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-semibold text-black">Add Friends</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="px-4 py-3">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-3 text-base text-black"
            placeholder="Search..."
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Added Me Section */}
        {loadingRequests ? (
          <ActivityIndicator style={{ marginTop: 16 }} />
        ) : friendRequests.length > 0 ? (
          <View className="mb-6">
            <Text className="text-black font-semibold text-lg px-4 mb-3">Added Me</Text>
            {friendRequests.map(renderFriendRequest)}
          </View>
        ) : null}

        {/* Search Results */}
        {debouncedSearch && (
          <View className="mb-6">
            <Text className="text-black font-semibold text-lg px-4 mb-3">Search Results</Text>
            {loadingSearch ? (
              <ActivityIndicator />
            ) : searchResults.length === 0 ? (
              <Text className="px-4 text-gray-500">No users found</Text>
            ) : (
              searchResults.map(renderSuggestedFriend)
            )}
          </View>
        )}

        {/* Empty state message */}
        {!debouncedSearch && friendRequests.length === 0 && searchResults.length === 0 && !loadingRequests && (
          <View className="items-center mt-8">
            <Text style={{ color: '#9CA3AF' }}>You have no pending friend requests</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddFriendsScreen; 