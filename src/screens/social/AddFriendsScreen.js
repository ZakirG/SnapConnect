import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  Image,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

/**
 * Screen for adding friends, displaying friend requests, and finding contacts
 * Inspired by Snapchat's Add Friends interface
 * @param {object} props - The component props
 * @param {object} props.navigation - The navigation object provided by React Navigation
 * @returns {React.ReactElement}
 */
const AddFriendsScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  
  // Mock data for demonstration - in real app this would come from API/Firebase
  const friendRequests = [
    {
      id: '1',
      displayName: 'John Smith',
      username: 'johnsmith2024',
      avatar: null,
      isOnline: true
    },
    {
      id: '2', 
      displayName: 'Mary Smith',
      username: 'marysmith01',
      avatar: null,
      isOnline: true
    },
    {
      id: '3',
      displayName: 'David Smith',
      username: 'davidsmith99', 
      avatar: null,
      isOnline: true
    }
  ];

  const suggestedFriends = [
    {
      id: '4',
      displayName: 'Sarah Smith',
      username: 'sarahsmith22',
      avatar: null,
      isOnline: true,
      source: 'In my contacts'
    },
    {
      id: '5',
      displayName: 'Michael Smith',
      username: 'mikesmith88',
      avatar: null,
      isOnline: true,
      source: null
    },
    {
      id: '6',
      displayName: 'Emily Smith',
      username: 'emilysmith05',
      avatar: null,
      isOnline: true,
      source: 'In my contacts'
    },
    {
      id: '7',
      displayName: 'Robert Smith',
      username: 'bobsmith77',
      avatar: null,
      isOnline: true,
      source: 'In my contacts'
    },
    {
      id: '8',
      displayName: 'Jennifer Smith',
      username: 'jensmith33',
      avatar: null,
      isOnline: true,
      source: 'In my contacts'
    }
  ];

  /**
   * Handles accepting a friend request
   * @param {string} userId - The ID of the user to accept
   */
  const handleAcceptRequest = (userId) => {
    Alert.alert('Friend Request', 'Friend request accepted!');
  };

  /**
   * Handles adding a new friend
   * @param {string} userId - The ID of the user to add
   */
  const handleAddFriend = (userId) => {
    Alert.alert('Add Friend', 'Friend request sent!');
  };

  /**
   * Handles dismissing a friend request or suggestion
   * @param {string} userId - The ID of the user to dismiss
   */
  const handleDismiss = (userId) => {
    Alert.alert('Dismissed', 'User dismissed from suggestions');
  };

  /**
   * Renders a friend request item
   * @param {object} user - The user object
   * @returns {React.ReactElement}
   */
  const renderFriendRequest = (user) => (
    <View key={user.id} className="flex-row items-center justify-between px-4 py-3">
      <View className="flex-row items-center flex-1">
        <View className="relative">
          <View className="w-12 h-12 rounded-full bg-gray-300 items-center justify-center">
            <Ionicons name="person" size={24} color="#9CA3AF" />
          </View>
          {user.isOnline && (
            <View className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
          )}
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-black font-semibold text-base">{user.displayName}</Text>
          <Text className="text-gray-600 text-sm">{user.username}</Text>
        </View>
      </View>
      <View className="flex-row items-center space-x-2">
        <TouchableOpacity
          onPress={() => handleAcceptRequest(user.id)}
          className="bg-yellow-400 px-4 py-2 rounded-full flex-row items-center"
        >
          <Ionicons name="person-add" size={16} color="black" />
          <Text className="text-black font-semibold ml-1">Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDismiss(user.id)}
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
  const renderSuggestedFriend = (user) => (
    <View key={user.id} className="flex-row items-center justify-between px-4 py-3">
      <View className="flex-row items-center flex-1">
        <View className="relative">
          <View className="w-12 h-12 rounded-full bg-gray-300 items-center justify-center">
            <Ionicons name="person" size={24} color="#9CA3AF" />
          </View>
          {user.isOnline && (
            <View className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
          )}
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-black font-semibold text-base">{user.displayName}</Text>
          <View className="flex-row items-center">
            <Text className="text-gray-600 text-sm">{user.username}</Text>
            {user.source && (
              <Text className="text-gray-500 text-sm ml-1">• {user.source}</Text>
            )}
          </View>
        </View>
      </View>
      <View className="flex-row items-center space-x-2">
        <TouchableOpacity
          onPress={() => handleAddFriend(user.id)}
          className="bg-yellow-400 px-4 py-2 rounded-full flex-row items-center"
        >
          <Ionicons name="person-add" size={16} color="black" />
          <Text className="text-black font-semibold ml-1">Add</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDismiss(user.id)}
          className="p-2"
        >
          <Ionicons name="close" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </View>
  );

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

      {/* Activity Indicator */}
      <View className="px-4 py-2 bg-gray-50">
        <View className="flex-row items-center">
          <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
          <Text className="text-sm text-gray-700">88+ suggestions were active in the last day!</Text>
          <TouchableOpacity className="ml-1">
            <Ionicons name="information-circle-outline" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
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
          <TouchableOpacity className="bg-black rounded-lg p-2">
            <Ionicons name="qr-code" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Sync Contacts Banner */}
        <TouchableOpacity className="mx-4 mb-4 bg-yellow-100 rounded-xl p-4 flex-row items-center">
          <View className="w-12 h-12 bg-yellow-400 rounded-xl items-center justify-center mr-3">
            <Ionicons name="people" size={24} color="black" />
          </View>
          <View className="flex-1">
            <Text className="text-black font-semibold text-base">Sync Contacts to Find Friends</Text>
            <Text className="text-gray-600 text-sm">or share your profile to invite friends!</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Added Me Section */}
        {friendRequests.length > 0 && (
          <View className="mb-6">
            <Text className="text-black font-semibold text-lg px-4 mb-3">Added Me</Text>
            {friendRequests.map(renderFriendRequest)}
            <TouchableOpacity className="items-center py-3">
              <Text className="text-gray-600 font-medium">View 7 More</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Find Friends Section */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between px-4 mb-3">
            <Text className="text-black font-semibold text-lg">Find Friends</Text>
            <TouchableOpacity>
              <Text className="text-gray-600 font-medium">All Contacts</Text>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          {suggestedFriends.map(renderSuggestedFriend)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddFriendsScreen; 