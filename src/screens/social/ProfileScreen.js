import React from 'react';
import { View, Alert } from 'react-native';
import { Button } from '../../components/neumorphic';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase/config';
import { useUserStore } from '../../store/user';

/**
 * A screen that displays user profile information and a logout button.
 *
 * @returns {React.ReactElement}
 */
const ProfileScreen = () => {
  const { logout } = useUserStore();

  /**
   * Handles the user logout process.
   * It signs the user out of Firebase and clears the user state.
   */
  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout(); // This will trigger the navigation change
    } catch (error) {
      Alert.alert('Logout Failed', error.message);
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-background p-4">
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