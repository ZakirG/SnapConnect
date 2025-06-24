/**
 * ChatBubble Component
 * --------------------
 * Lightweight presentation component for a single chat message. It decides
 * whether the bubble appears on the left or right depending on `isMe` and
 * applies the correct colours. It intentionally contains **no** business
 * logic so it can be reused across different chat UIs.
 *
 * @param {object}  props
 * @param {string}  props.text        – The plain-text body of the message.
 * @param {boolean} props.isMe        – True when the message belongs to the
 *                                      current signed-in user.
 * @param {string} [props.createdAt]  – ISO timestamp used for future
 *                                      timestamp rendering (kept optional).
 */
import React from 'react';
import { View, Text } from 'react-native';

const ChatBubble = ({ text, isMe, createdAt }) => {
  // Basic guard – don't render empty messages
  if (!text) return null;

  return (
    <View className={`w-full px-4 mb-2 flex-row ${isMe ? 'justify-end' : 'justify-start'}`}>
      <View
        className={`rounded-xl px-3 py-2 max-w-[75%] ${
          isMe ? 'bg-blue-500' : 'bg-gray-200'
        }`}
      >
        <Text className={`${isMe ? 'text-white' : 'text-black'}`}>{text}</Text>
      </View>
      {/* For future: timestamp, status indicators, etc. */}
    </View>
  );
};

export default ChatBubble; 