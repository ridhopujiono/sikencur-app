import React, { useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/main/HomeScreen';
import ScanScreen from '../screens/main/ScanScreen';
import OCRResultScreen from '../screens/main/OCRResultScreen';
import TransactionsScreen from '../screens/main/TransactionsScreen';
import ManualTransactionScreen from '../screens/main/ManualTransactionScreen';
import DSSProfileScreen from '../screens/main/DSSProfileScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import { AuthContext } from '../context/AuthContext';
import { MAIN_ROUTES } from './routes';

const RootStack = createNativeStackNavigator();
const AuthStackNav = createNativeStackNavigator();
const MainStackNav = createNativeStackNavigator();
const SCREEN_CONTENT_STYLE = { backgroundColor: '#ffffff' };
const ROOT_SCREEN_OPTIONS = {
  headerShown: false,
  animation: 'fade',
  animationDuration: 180,
  contentStyle: SCREEN_CONTENT_STYLE,
  statusBarAnimation: 'fade',
};
const AUTH_SCREEN_OPTIONS = {
  ...ROOT_SCREEN_OPTIONS,
  animation: 'fade_from_bottom',
  animationDuration: 220,
};
const MAIN_SCREEN_OPTIONS = {
  ...ROOT_SCREEN_OPTIONS,
  gestureEnabled: true,
};
const DETAIL_SCREEN_OPTIONS = {
  ...MAIN_SCREEN_OPTIONS,
  animation: 'fade_from_bottom',
  animationDuration: 240,
  fullScreenGestureEnabled: true,
  animationMatchesGesture: true,
};
const MODAL_SCREEN_OPTIONS = {
  ...DETAIL_SCREEN_OPTIONS,
  animation: 'slide_from_bottom',
  gestureDirection: 'vertical',
};

function AuthStack() {
  return (
    <AuthStackNav.Navigator screenOptions={AUTH_SCREEN_OPTIONS}>
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
      <AuthStackNav.Screen name="Register" component={RegisterScreen} />
    </AuthStackNav.Navigator>
  );
}

function MainStack() {
  return (
    <MainStackNav.Navigator screenOptions={MAIN_SCREEN_OPTIONS}>
      <MainStackNav.Screen
        name={MAIN_ROUTES.HOME}
        component={HomeScreen}
        options={MAIN_SCREEN_OPTIONS}
      />
      <MainStackNav.Screen
        name={MAIN_ROUTES.SCAN}
        component={ScanScreen}
        options={MODAL_SCREEN_OPTIONS}
      />
      <MainStackNav.Screen
        name={MAIN_ROUTES.OCR}
        component={OCRResultScreen}
        options={DETAIL_SCREEN_OPTIONS}
      />
      <MainStackNav.Screen
        name={MAIN_ROUTES.TRANSACTIONS}
        component={TransactionsScreen}
        options={MAIN_SCREEN_OPTIONS}
      />
      <MainStackNav.Screen
        name={MAIN_ROUTES.TRANSACTION_CREATE}
        component={ManualTransactionScreen}
        options={DETAIL_SCREEN_OPTIONS}
      />
      <MainStackNav.Screen
        name={MAIN_ROUTES.DSS}
        component={DSSProfileScreen}
        options={MAIN_SCREEN_OPTIONS}
      />
      <MainStackNav.Screen
        name={MAIN_ROUTES.SETTINGS}
        component={SettingsScreen}
        options={MAIN_SCREEN_OPTIONS}
      />
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
    <RootStack.Navigator screenOptions={ROOT_SCREEN_OPTIONS}>
      {userToken == null ? (
        <RootStack.Screen name="AuthStack" component={AuthStack} />
      ) : (
        <RootStack.Screen name="MainStack" component={MainStack} />
      )}
    </RootStack.Navigator>
  );
}
