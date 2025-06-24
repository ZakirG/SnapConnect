import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { Card, Input, Button } from '../../components/neumorphic';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase/config';

/**
 * A placeholder screen for user login.
 * It includes basic form elements with neumorphic styling.
 *
 * @param {object} props - The component props.
 * @param {object} props.navigation - The navigation object provided by React Navigation.
 * @returns {React.ReactElement}
 */
const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Firebase auth instance is imported from the config file

  /**
   * Handles the user login process.
   * It signs in the user with the provided email and password using Firebase Authentication.
   * It also handles loading states and displays alerts for errors.
   */
  const handleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      // Remove leading/trailing whitespace to prevent auth/invalid-email.
      const emailTrimmed = email.trim();
      await signInWithEmailAndPassword(auth, emailTrimmed, password);
      // navigation to the main app will be handled by the navigator based on auth state
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-background p-4">
      <Card>
        <Text className="text-2xl font-bold mb-8 text-center">Login</Text>
        <Input
          placeholder="Email"
          style={{ marginBottom: 20 }}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          placeholder="Password"
          secureTextEntry
          style={{ marginBottom: 20 }}
          value={password}
          onChangeText={setPassword}
        />
        <Button title={isLoading ? 'Logging in...' : 'Login'} onPress={handleLogin} style={{ marginBottom: 20 }} disabled={isLoading} />
        <Text className="text-center">
          Don't have an account?{' '}
          <Text className="text-accent-primary" onPress={() => navigation.navigate('Signup')}>
            Sign Up
          </Text>
        </Text>
      </Card>
    </View>
  );
};

export default LoginScreen; 