import React from 'react';
import { View, Text } from 'react-native';
import { Card, Input, Button } from '../../components/neumorphic';

/**
 * A placeholder screen for user signup.
 * It includes basic form elements with neumorphic styling.
 *
 * @param {object} props - The component props.
 * @param {object} props.navigation - The navigation object provided by React Navigation.
 * @returns {React.ReactElement}
 */
const SignupScreen = ({ navigation }) => {
  return (
    <View className="flex-1 justify-center items-center bg-background p-4">
      <Card>
        <Text className="text-2xl font-bold mb-8 text-center">Sign Up</Text>
        <Input placeholder="Username" style={{ marginBottom: 20 }} />
        <Input placeholder="Password" secureTextEntry style={{ marginBottom: 20 }} />
        <Input placeholder="Confirm Password" secureTextEntry style={{ marginBottom: 20 }} />
        <Button title="Sign Up" onPress={() => {}} style={{ marginBottom: 20 }} />
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