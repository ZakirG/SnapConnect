import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../store/user';
import { subscribeToMessages, sendMessageBetweenUsers, ensureConversation } from '../../services/chat';
import { supabase } from '../../services/supabase/config';
import { ChatBubble } from '../../components/chat';

/**
 * ConversationScreen
 * ------------------
 * Displays a 1-to-1 chat thread between the current user and a friend.
 * Messages disappear for the *recipient* immediately after they are viewed.
 */
const ConversationScreen = ({ route, navigation }) => {
  const { friendId, friendUsername } = route.params;
  const { user } = useUserStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const flatListRef = useRef(null);

  // Ensure conversation and subscribe to messages
  useEffect(() => {
    if (!user) return;

    let channelRef = null;

    (async () => {
      try {
        const convId = await ensureConversation(user.id, friendId);
        channelRef = subscribeToMessages(convId, (msgs) => {
          setMessages(msgs);

          // Ensure newest message is visible (FlatList is inverted → offset 0 == bottom)
          setTimeout(() => {
            try {
              flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
            } catch (_) {
              /* no-op */
            }
          }, 0);

          // Mark messages from friend as opened
          const unseen = msgs.filter((m) => m.sender_id === friendId && !m.expires_at);
          unseen.forEach((m) => {
            supabase
              .from('messages')
              .update({ expires_at: new Date().toISOString() })
              .eq('id', m.id)
              .catch(console.error);
          });
        });
      } catch (err) {
        console.error('Conversation setup error', err);
      }
    })();

    return () => {
      if (channelRef) channelRef.unsubscribe();
    };
  }, [user, friendId]);

  const handleSend = async () => {
    if (!input.trim()) return;
    try {
      await sendMessageBetweenUsers(user.id, friendId, user.id, input.trim());
      setInput('');
      // Optimistically refresh messages list (subscription may take ~100-200 ms)
      // but this guarantees we see our own message instantly.
      (async () => {
        try {
          const convId = await ensureConversation(user.id, friendId);
          const { getMessages } = await import('../../services/chat');
          const latest = await getMessages(convId);
          setMessages(latest);
        } catch (_) {
          /* ignore */
        }
      })();
    } catch (err) {
      console.error('Send message error', err);
    }
  };

  const renderItem = ({ item }) => {
    const isMe = item.sender_id === user.id;
    return <ChatBubble text={item.text} isMe={isMe} createdAt={item.created_at} />;
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <SafeAreaView edges={['top']} className="flex-row items-center p-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 mr-2">
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold">{friendUsername}</Text>
      </SafeAreaView>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 80 }}
        inverted
      />

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <SafeAreaView edges={['bottom']} className="flex-row items-center px-4 py-2 border-t border-gray-200 bg-white">
          <TouchableOpacity className="p-2 mr-2">
            <Ionicons name="camera" size={24} color="#9CA3AF" />
          </TouchableOpacity>
          <TextInput
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-base"
            placeholder="Send a chat"
            value={input}
            onChangeText={setInput}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity onPress={handleSend} className="ml-2 p-2">
            <Ionicons name="send" size={24} color="#2563EB" />
          </TouchableOpacity>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ConversationScreen; 