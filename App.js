import './global.css';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen, SignupScreen } from './src/screens/auth';
import { CameraScreen, SnapPreviewScreen } from './src/screens/camera';
import { ChatScreen } from './src/screens/chat';
import { StoriesScreen, ProfileScreen } from './src/screens/social';
import { useUserStore } from './src/store/user';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/services/firebase/config';

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
    <MainStack.Screen name="SnapPreview" component={SnapPreviewScreen} />
    <MainStack.Screen name="Chat" component={ChatScreen} />
    <MainStack.Screen name="Stories" component={StoriesScreen} />
    <MainStack.Screen name="Profile" component={ProfileScreen} />
  </MainStack.Navigator>
);

/**
 * The main application component.
 * It sets up the navigation container and manages the authentication flow.
 *
 * @returns {React.ReactElement}
 */
export default function App() {
  const { isLoggedIn, setUser } = useUserStore();

  // Temporary debug logging
  console.log('Initializing App component');

  useEffect(() => {
    console.log('Auth state listener subscribing');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('onAuthStateChanged user', user);
      setUser(user);
    });

    return () => unsubscribe();
  }, [setUser]);

  console.log('Render App, isLoggedIn =', isLoggedIn);

  return (
    <NavigationContainer>
      {isLoggedIn ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
