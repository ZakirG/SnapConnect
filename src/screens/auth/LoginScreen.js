import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { Card, Input, Button } from '../../components/neumorphic';
import { supabase } from '../../services/supabase/config';
import { SafeAreaView } from 'react-native-safe-area-context';

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

  /**
   * Handles the user login process.
   * It signs in the user with the provided email and password using Supabase Authentication.
   * It also handles loading states and displays alerts for errors.
   */
  const handleLogin = async () => {
    console.log('🔐 Starting login process...');
    console.log('📧 Email:', email);
    console.log('🔒 Password length:', password.length);

    // Validation checks
    if (!email.trim()) {
      console.log('❌ Email is empty');
      Alert.alert('Validation Error', 'Please enter your email address.');
      return;
    }

    if (!password) {
      console.log('❌ Password is empty');
      Alert.alert('Validation Error', 'Please enter your password.');
      return;
    }

    if (isLoading) {
      console.log('⏳ Already loading, skipping...');
      return;
    }

    setIsLoading(true);
    console.log('⏳ Set loading to true');

    try {
      // Remove leading/trailing whitespace to prevent auth/invalid-email.
      const emailTrimmed = email.trim();
      console.log('📧 Email trimmed:', emailTrimmed);
      
      console.log('🔐 Attempting Supabase auth login...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailTrimmed,
        password: password,
      });

      console.log('🔐 Supabase login response:', { data, error });

      if (error) {
        console.log('❌ Supabase login error:', error);
        console.log('❌ Error message:', error.message);
        console.log('❌ Error status:', error.status);
        console.log('❌ Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('✅ Supabase login successful');
      console.log('👤 User data:', data.user);
      console.log('🔑 Session data:', data.session);
      console.log('🎉 Login process completed successfully!');

      // navigation to the main app will be handled by the navigator based on auth state
    } catch (error) {
      console.log('💥 Login failed with error:', error);
      console.log('💥 Error message:', error.message);
      console.log('💥 Error name:', error.name);
      console.log('💥 Full error object:', JSON.stringify(error, null, 2));
      
      // Show more specific error messages
      let errorMessage = error.message;
      if (error.message.includes('Invalid API key')) {
        errorMessage = 'Configuration error: Invalid API key. Please check your Supabase settings.';
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please try again.';
      }
      
      Alert.alert('Login Failed', errorMessage);
    } finally {
      console.log('🏁 Setting loading to false');
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Central content */}
      <View className="flex-1 justify-center items-center px-4">
        {/* App Title */}
        <Text className="text-4xl font-extrabold text-gray-900 mb-6">SnapConnect</Text>

        {/* Login Card */}
        <Card>
          <Input
            placeholder="Email"
            style={{ marginBottom: 20 }}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            autoCorrect={false}
          />
          <Input
            placeholder="Password"
            secureTextEntry
            style={{ marginBottom: 20 }}
            value={password}
            onChangeText={setPassword}
            autoComplete="current-password"
            textContentType="password"
          />
          <Button
            title={isLoading ? 'Logging in...' : 'Login'}
            size="large"
            variant="primary"
            onPress={handleLogin}
            disabled={isLoading}
            style={{ marginBottom: 20, width: '100%' }}
          />
          <Text className="text-center">
            Don't have an account?{' '}
            <Text className="text-accent-primary" onPress={() => navigation.navigate('Signup')}>
              Sign Up
            </Text>
          </Text>
        </Card>
      </View>
    </View>
  );
};

export default LoginScreen; 