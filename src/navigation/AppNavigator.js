import React, { useContext, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import { AuthContext } from '../context/AuthContext';

const RootStack = createNativeStackNavigator();
const AuthStackNav = createNativeStackNavigator();
const MainStackNav = createNativeStackNavigator();

function HomeScreen() {
  return (
    <View style={styles.center}>
      <Text>Home Screen</Text>
    </View>
  );
}

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
    <MainStackNav.Navigator>
      <MainStackNav.Screen name="Home" component={HomeScreen} />
    </MainStackNav.Navigator>
  );
}

function RootNavigator() {
  const { userToken } = useContext(AuthContext);

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

export default function AppNavigator() {
  const [userToken, setUserToken] = useState(null);

  const authContextValue = useMemo(
    () => ({
      userToken,
      login: async () => {
        setUserToken('mock-token');
      },
      register: async () => {
        setUserToken('mock-token');
      },
      logout: () => {
        setUserToken(null);
      },
    }),
    [userToken],
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      <RootNavigator />
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
