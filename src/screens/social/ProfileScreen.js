import React from 'react';
import { View, Alert, Text } from 'react-native';
import { Button } from '../../components/neumorphic';
import { supabase } from '../../services/supabase/config';
import { useUserStore } from '../../store/user';

/**
 * A screen that displays user profile information and a logout button.
 *
 * @returns {React.ReactElement}
 */
const ProfileScreen = () => {
  const { user, logout } = useUserStore();

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

  return (
    <View className="flex-1 justify-center items-center bg-background p-6" style={{ gap: 24 }}>
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
    </View>
  );
};

export default ProfileScreen; 