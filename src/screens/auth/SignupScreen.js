import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { Card, Input, Button } from '../../components/neumorphic';
import { supabase } from '../../services/supabase/config';

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

  /**
   * Handles the user signup process.
   * It creates a new user with email and password using Supabase Authentication,
   * then stores additional user information (like username) in the database.
   */
  const handleSignup = async () => {
    console.log('🚀 Starting signup process...');
    console.log('📧 Email:', email);
    console.log('👤 Username:', username);
    console.log('🔒 Password length:', password.length);
    console.log('🔒 Confirm password length:', confirmPassword.length);

    // Validation checks
    if (!email.trim()) {
      console.log('❌ Email is empty');
      Alert.alert('Validation Error', 'Please enter your email address.');
      return;
    }

    if (!username.trim()) {
      console.log('❌ Username is empty');
      Alert.alert('Validation Error', 'Please enter a username.');
      return;
    }

    if (!password) {
      console.log('❌ Password is empty');
      Alert.alert('Validation Error', 'Please enter a password.');
      return;
    }

    if (password.length < 6) {
      console.log('❌ Password too short');
      Alert.alert('Validation Error', 'Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      console.log('❌ Passwords do not match');
      Alert.alert("Passwords don't match.", 'Please check your passwords.');
      return;
    }

    if (isLoading) {
      console.log('⏳ Already loading, skipping...');
      return;
    }

    setIsLoading(true);
    console.log('⏳ Set loading to true');

    try {
      // Remove leading/trailing whitespace from the e-mail address to avoid auth/invalid-email.
      const emailTrimmed = email.trim();
      console.log('📧 Email trimmed:', emailTrimmed);

      console.log('🔐 Attempting Supabase auth signup...');
      const { data, error } = await supabase.auth.signUp({
        email: emailTrimmed,
        password: password,
      });

      console.log('🔐 Supabase signup response:', { data, error });

      if (error) {
        console.log('❌ Supabase signup error:', error);
        console.log('❌ Error message:', error.message);
        console.log('❌ Error status:', error.status);
        console.log('❌ Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('✅ Supabase signup successful');
      console.log('👤 User data:', data.user);
      console.log('🔑 Session data:', data.session);

      // Store username in the users table
      if (data.user) {
        console.log('💾 Inserting user profile into database...');
        console.log('💾 User ID:', data.user.id);
        console.log('💾 Username:', username);
        console.log('💾 Email:', emailTrimmed);

        const profileRow = {
          id: data.user.id,
          username: username.trim(),
          display_name: null,
          created_at: new Date().toISOString(),
        };

        console.log('💾 Profile data to insert:', profileRow);

        const { error: profileError } = await supabase
          .from('profiles')
          .insert([profileRow]);

        console.log('💾 Profile insert response:', { profileError });

        if (profileError) {
          console.log('❌ Profile insert error:', profileError);
          console.log('❌ Profile error message:', profileError.message);
          console.log('❌ Profile error details:', JSON.stringify(profileError, null, 2));
          
          // Check for specific error types
          if (profileError.message && profileError.message.includes('profiles')) {
            throw new Error('Database table "profiles" does not exist. Please run the SQL migrations in Supabase.');
          }
          
          throw profileError;
        }

        console.log('✅ User profile inserted successfully');
      } else {
        console.log('⚠️ No user data returned from signup');
      }

      console.log('🎉 Signup process completed successfully!');
      // Navigation will be handled by the auth state listener

    } catch (error) {
      console.log('💥 Signup failed with error:', error);
      console.log('💥 Error message:', error.message);
      console.log('💥 Error name:', error.name);
      console.log('💥 Full error object:', JSON.stringify(error, null, 2));
      
      // Show more specific error messages
      let errorMessage = error.message;
      if (error.message.includes('Invalid API key')) {
        errorMessage = 'Configuration error: Invalid API key. Please check your Supabase settings.';
      } else if (error.message.includes('not found')) {
        errorMessage = 'Database error: User table not found. Please contact support.';
      } else if (error.message.includes('duplicate')) {
        errorMessage = 'This email or username is already taken.';
      }
      
      Alert.alert('Signup Failed', errorMessage);
    } finally {
      console.log('🏁 Setting loading to false');
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
          autoComplete="email"
          textContentType="emailAddress"
          autoCorrect={false}
        />
        <Input
          placeholder="Username"
          style={{ marginBottom: 20 }}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoComplete="username"
          textContentType="username"
          autoCorrect={false}
        />
        <Input
          placeholder="Password"
          secureTextEntry
          style={{ marginBottom: 20 }}
          value={password}
          onChangeText={setPassword}
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <Input
          placeholder="Confirm Password"
          secureTextEntry
          style={{ marginBottom: 20 }}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          autoComplete="new-password"
          textContentType="newPassword"
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
          <Text className="text-blue-600" onPress={() => navigation.navigate('Login')}>
            Login
          </Text>
        </Text>
      </Card>
    </View>
  );
};

export default SignupScreen; 