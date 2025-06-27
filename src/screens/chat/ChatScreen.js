import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Image,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../store/user';
import { getFriends, PublicUser } from '../../services/friends';

/**
 * Chat screen displaying conversations with friends and family
 * Inspired by Snapchat's chat interface design
 * @param {object} props - The component props
 * @param {object} props.navigation - The navigation object provided by React Navigation
 * @returns {React.ReactElement}
 */
const ChatScreen = ({ navigation }) => {
  const [showNotificationBanner, setShowNotificationBanner] = useState(true);
  const [chatData, setChatData] = useState([]);
  const { user } = useUserStore();

  useEffect(() => {
    if (!user) return;

    const fetchChats = async () => {
      try {
        const friends = await getFriends(user.id);

        const chats = friends.map((friend) => ({
          id: friend.id,
          name: friend.username,
          avatar: null,
          status: 'Tap to chat',
          statusType: 'chat',
          hasCamera: true,
        }));

        setChatData(chats);
      } catch (err) {
        console.error('Error building chat list', err);
      }
    };

    fetchChats();
  }, [user]);

  /**
   * Handles opening a chat conversation
   * @param {object} chat - The chat object
   */
  const handleChatPress = (chat) => {
    navigation.navigate('Conversation', { friendId: chat.id, friendUsername: chat.name });
  };

  /**
   * Handles camera button press for a specific chat
   * @param {object} chat - The chat object
   */
  const handleCameraPress = (chat) => {
    Alert.alert('Camera', `Taking photo for ${chat.name}`);
  };

  /**
   * Gets the status icon based on status type
   * @param {object} chat - The chat object
   * @returns {React.ReactElement}
   */
  const getStatusIcon = (chat) => {
    switch (chat.statusType) {
      case 'received':
        return <View className="w-3 h-3 rounded-sm bg-red-500 mr-2" />;
      case 'sent':
        return <View className="w-3 h-3 rounded-sm bg-blue-500 mr-2" />;
      case 'opened':
        return <View className="w-3 h-3 rounded-sm bg-blue-500 mr-2" />;
      case 'received-old':
        return <View className="w-3 h-3 rounded-sm bg-blue-500 mr-2" />;
      case 'chat':
        return (
          <Ionicons name="chatbubble-outline" size={14} color="#9CA3AF" style={{ marginRight: 8 }} />
        );
      case 'reply':
        return <View className="w-3 h-3 rounded-sm bg-red-500 mr-2" />;
      default:
        return null;
    }
  };

  /**
   * Renders a chat item
   * @param {object} chat - The chat object
   * @returns {React.ReactElement}
   */
  const renderChatItem = (chat) => (
    <TouchableOpacity
      key={chat.id}
      onPress={() => handleChatPress(chat)}
      className="flex-row items-center justify-between px-4 py-3 bg-white"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center flex-1">
        <View className="w-12 h-12 rounded-full bg-gray-300 items-center justify-center">
          <Ionicons name="person" size={24} color="#9CA3AF" />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-black font-semibold text-base">{chat.name}</Text>
          <View className="flex-row items-center mt-1">
            {getStatusIcon(chat)}
            <Text className={`text-sm ${
              chat.statusType === 'suggestion' ? 'text-gray-600' :
              chat.statusType === 'chat' ? 'text-gray-500' :
              'text-gray-600'
            }`}>
              {chat.status}
            </Text>
          </View>
        </View>
      </View>
      
      {chat.hasCamera && (
        <TouchableOpacity
          onPress={() => handleCameraPress(chat)}
          className="p-2"
        >
          <Ionicons name="camera" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white">
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-yellow-400 items-center justify-center mr-3">
            <Ionicons name="person" size={16} color="black" />
          </View>
          <TouchableOpacity>
            <Ionicons name="search" size={24} color="black" />
          </TouchableOpacity>
        </View>
      
        <Text className="text-xl font-semibold text-black">Chat</Text>
        
        <View className="flex-row items-center space-x-3">
          <TouchableOpacity 
            onPress={() => navigation.navigate('AddFriends')}
            className="w-8 h-8 bg-yellow-400 rounded-full items-center justify-center"
          >
            <Ionicons name="person-add" size={16} color="black" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Notification Banner */}
      {showNotificationBanner && (
        <View className="bg-yellow-400 px-4 py-3 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <Ionicons name="notifications" size={20} color="black" />
            <Text className="text-black font-medium ml-2 flex-1">
              Turn on Notifications to not miss Snaps!
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => setShowNotificationBanner(false)}
            className="ml-2"
          >
            <Ionicons name="close" size={20} color="black" />
          </TouchableOpacity>
        </View>
      )}

      {/* Chat List */}
      <ScrollView className="flex-1">
        {chatData.map(renderChatItem)}
      </ScrollView>

      {/* Bottom Navigation - consistent with Camera screen */}
      <View className="absolute bottom-0 left-0 right-0">
        <SafeAreaView edges={['bottom']} className="bg-black/20 backdrop-blur-sm">
          <View className="flex-row items-center justify-around py-4 px-6">
            {/* Messages (current) */}
            <TouchableOpacity onPress={() => {}} activeOpacity={1} className="p-2">
              <Ionicons name="chatbubble" size={24} color="white" />
            </TouchableOpacity>

            {/* Camera */}
            <TouchableOpacity onPress={() => navigation.navigate('Camera')} className="p-2">
              <Ionicons name="camera" size={28} color="white" />
            </TouchableOpacity>

            {/* Text to Lyric */}
            <TouchableOpacity onPress={() => navigation.navigate('TextToLyric')} className="p-2">
              <Ionicons name="pencil-outline" size={24} color="white" />
            </TouchableOpacity>

            {/* Friends / Stories */}
            <TouchableOpacity onPress={() => navigation.navigate('Stories')} className="p-2">
              <Ionicons name="people-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </SafeAreaView>
  );
};

export default ChatScreen;
