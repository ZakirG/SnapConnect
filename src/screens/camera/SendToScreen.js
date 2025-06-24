/**
 * SendToScreen
 * ------------
 * Allows the user to choose one or more recipients (friends) to send a Snap to
 * and/or add the Snap to their Story. The screen fetches the current user's
 * friends list from Firestore via the Friend Service and provides simple
 * selection UI before invoking the Snap Service to perform the upload + record
 * creation.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../store/user';
import { getFriends } from '../../services/friends';
import { sendSnap } from '../../services/snaps';

const SendToScreen = ({ route, navigation }) => {
  const { mediaUri, mediaType = 'image', photoUri } = route.params;
  const { user } = useUserStore();
  const [friends, setFriends] = useState([]); // {uid, username}
  const [selected, setSelected] = useState(new Set());
  const [isSending, setIsSending] = useState(false);

  // Fallback for legacy param name
  const snapUri = mediaUri ?? photoUri;

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user) return;
      const list = await getFriends(user.uid);
      if (mounted) setFriends(list);
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  const toggleSelect = useCallback((uid) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }, []);

  const handleSend = async () => {
    if (!user || selected.size === 0) return;
    setIsSending(true);
    try {
      await sendSnap(user.uid, Array.from(selected), snapUri, mediaType);
      navigation.navigate('Camera');
    } catch (err) {
      console.warn('Error sending snap', err);
      setIsSending(false);
    }
  };

  const renderItem = ({ item }) => {
    const isSelected = selected.has(item.uid);
    return (
      <TouchableOpacity
        className="flex-row items-center justify-between p-4 border-b border-gray-200"
        onPress={() => toggleSelect(item.uid)}
      >
        <Text className="text-lg text-black dark:text-white">{item.username}</Text>
        {isSelected && <Text className="text-primary font-bold">✓</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <SafeAreaView edges={['top']} className="bg-background px-6 pt-4 pb-2">
        <View className="flex-row items-center justify-between">
          {/* Back button */}
          <TouchableOpacity onPress={() => navigation.goBack()} className="pr-4">
            <Text className="text-lg font-bold text-primary">Back</Text>
          </TouchableOpacity>

          {/* Title */}
          <Text className="text-2xl font-bold flex-1 text-center">Send To</Text>

          {/* Send button */}
          <TouchableOpacity onPress={handleSend} disabled={selected.size === 0 || isSending} className="pl-4">
            <Text className={`text-lg font-bold ${selected.size === 0 ? 'text-gray-400' : 'text-primary'}`}>Send</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <FlatList
        data={friends}
        keyExtractor={(item) => item.uid}
        renderItem={renderItem}
      />
    </View>
  );
};

export default SendToScreen; 