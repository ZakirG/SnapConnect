import React from 'react';
import { View, Text } from 'react-native';
import { Card, Input, Button } from '../../components/neumorphic';

/**
 * A placeholder screen for user login.
 * It includes basic form elements with neumorphic styling.
 *
 * @param {object} props - The component props.
 * @param {object} props.navigation - The navigation object provided by React Navigation.
 * @returns {React.ReactElement}
 */
const LoginScreen = ({ navigation }) => {
  return (
    <View className="flex-1 justify-center items-center bg-background p-4">
      <Card>
        <Text className="text-2xl font-bold mb-8 text-center">Login</Text>
        <Input placeholder="Username" style={{ marginBottom: 20 }} />
        <Input placeholder="Password" secureTextEntry style={{ marginBottom: 20 }} />
        <Button title="Login" onPress={() => {}} style={{ marginBottom: 20 }} />
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