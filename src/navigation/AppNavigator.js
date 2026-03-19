import React, { useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/main/HomeScreen';
import { AuthContext } from '../context/AuthContext';

const RootStack = createNativeStackNavigator();
const AuthStackNav = createNativeStackNavigator();
const MainStackNav = createNativeStackNavigator();

function AuthStack() {
  return (
    <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
      <AuthStackNav.Screen name="Register" component={RegisterScreen} />
    </AuthStackNav.Navigator>
  );
}

function MainStack() {
  return (
    <MainStackNav.Navigator screenOptions={{ headerShown: false }}>
      <MainStackNav.Screen name="Home" component={HomeScreen} />
    </MainStackNav.Navigator>
  );
}

export default function AppNavigator() {
  const { userToken, isInitializing } = useContext(AuthContext);

  if (isInitializing) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#059669" size="large" />
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {userToken == null ? (
        <RootStack.Screen name="AuthStack" component={AuthStack} />
      ) : (
        <RootStack.Screen name="MainStack" component={MainStack} />
      )}
    </RootStack.Navigator>
  );
}
