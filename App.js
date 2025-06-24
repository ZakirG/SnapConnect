import './global.css';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen, SignupScreen } from './src/screens/auth';
import { CameraScreen, SnapPreviewScreen, SendToScreen } from './src/screens/camera';
import { ChatScreen } from './src/screens/chat';
import ConversationScreen from './src/screens/chat/ConversationScreen';
import { StoriesScreen, ProfileScreen, AddFriendsScreen } from './src/screens/social';
import { useUserStore } from './src/store/user';
import { supabase } from './src/services/supabase/config';
import { FaceDetectionScreen } from './src/screens';

const AuthStack = createStackNavigator();
const MainStack = createStackNavigator();

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Signup" component={SignupScreen} />
  </AuthStack.Navigator>
);

const MainNavigator = () => (
  <MainStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Camera">
    <MainStack.Screen name="Camera" component={CameraScreen} />
    <MainStack.Screen name="FaceDetect" component={FaceDetectionScreen} />
    <MainStack.Screen name="SnapPreview" component={SnapPreviewScreen} />
    <MainStack.Screen name="SendTo" component={SendToScreen} />
    <MainStack.Screen name="Chat" component={ChatScreen} />
    <MainStack.Screen name="Stories" component={StoriesScreen} />
    <MainStack.Screen name="Conversation" component={ConversationScreen} />
    <MainStack.Screen name="Profile" component={ProfileScreen} />
    <MainStack.Screen name="AddFriends" component={AddFriendsScreen} />
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
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session', session);
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('onAuthStateChange user', session?.user);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  console.log('Render App, isLoggedIn =', isLoggedIn);

  return (
    <NavigationContainer>
      {isLoggedIn ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
