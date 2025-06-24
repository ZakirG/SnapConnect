import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { Card, Input, Button } from '../../components/neumorphic';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase/config';

/**
 * A placeholder screen for user signup.
 * It includes basic form elements with neumorphic styling.
 *
 * @param {object} props - The component props.
 * @param {object} props.navigation - The navigation object provided by React Navigation.
 * @returns {React.ReactElement}
 */
const SignupScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Firebase auth and Firestore instances imported from config file

  /**
   * Handles the user signup process.
   * It creates a new user with email and password using Firebase Authentication,
   * then stores additional user information (like username) in Firestore.
   */
  const handleSignup = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Passwords don't match.", 'Please check your passwords.');
      return;
    }
    if (isLoading) return;
    setIsLoading(true);
    try {
      // Remove leading/trailing whitespace from the e-mail address to avoid auth/invalid-email.
      const emailTrimmed = email.trim();

      const userCredential = await createUserWithEmailAndPassword(auth, emailTrimmed, password);
      const user = userCredential.user;

      // Store username in Firestore with the cleaned e-mail value
      await setDoc(doc(db, 'users', user.uid), {
        username: username,
        email: emailTrimmed,
      });

      // Navigation will be handled by the auth state listener
    } catch (error) {
      Alert.alert('Signup Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-background p-4">
      <Card>
        <Text className="text-2xl font-bold mb-8 text-center">Sign Up</Text>
        <Input
          placeholder="Email"
          style={{ marginBottom: 20 }}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          placeholder="Username"
          style={{ marginBottom: 20 }}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <Input
          placeholder="Password"
          secureTextEntry
          style={{ marginBottom: 20 }}
          value={password}
          onChangeText={setPassword}
        />
        <Input
          placeholder="Confirm Password"
          secureTextEntry
          style={{ marginBottom: 20 }}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <Button
          title={isLoading ? 'Creating Account...' : 'Sign Up'}
          size="large"
          variant="primary"
          onPress={handleSignup}
          disabled={isLoading}
          style={{ marginBottom: 20, width: '100%' }}
        />
        <Text className="text-center">
          Already have an account?{' '}
          <Text className="text-accent-primary" onPress={() => navigation.navigate('Login')}>
            Login
          </Text>
        </Text>
      </Card>
    </View>
  );
};

export default SignupScreen; 