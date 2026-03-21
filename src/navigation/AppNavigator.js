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
      <MainStackNav.Screen name={MAIN_ROUTES.HOME} component={HomeScreen} />
      <MainStackNav.Screen name={MAIN_ROUTES.SCAN} component={ScanScreen} />
      <MainStackNav.Screen name={MAIN_ROUTES.OCR} component={OCRResultScreen} />
      <MainStackNav.Screen
        name={MAIN_ROUTES.TRANSACTIONS}
        component={TransactionsScreen}
      />
      <MainStackNav.Screen
        name={MAIN_ROUTES.TRANSACTION_CREATE}
        component={ManualTransactionScreen}
      />
      <MainStackNav.Screen name={MAIN_ROUTES.DSS} component={DSSProfileScreen} />
      <MainStackNav.Screen
        name={MAIN_ROUTES.SETTINGS}
        component={SettingsScreen}
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
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {userToken == null ? (
        <RootStack.Screen name="AuthStack" component={AuthStack} />
      ) : (
        <RootStack.Screen name="MainStack" component={MainStack} />
      )}
    </RootStack.Navigator>
  );
}
