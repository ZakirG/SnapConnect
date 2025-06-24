import './global.css';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen, SignupScreen } from './src/screens/auth';
import { CameraScreen } from './src/screens/camera';
import { ChatScreen } from './src/screens/chat';
import { StoriesScreen } from './src/screens/social';

const AuthStack = createStackNavigator();
const MainStack = createStackNavigator();

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Signup" component={SignupScreen} />
  </AuthStack.Navigator>
);

const MainNavigator = () => (
  <MainStack.Navigator screenOptions={{ headerShown: false }}>
    <MainStack.Screen name="Camera" component={CameraScreen} />
    <MainStack.Screen name="Chat" component={ChatScreen} />
    <MainStack.Screen name="Stories" component={StoriesScreen} />
  </MainStack.Navigator>
);

/**
 * The main application component.
 * It sets up the navigation container and manages the authentication flow.
 *
 * @returns {React.ReactElement}
 */
export default function App() {
  const isAuthenticated = false; // Placeholder for authentication state

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
