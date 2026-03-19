import React, { useContext } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../../context/AuthContext';

export default function HomeScreen() {
  const { user, logout } = useContext(AuthContext);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center p-6">
        <Text className="text-4xl font-extrabold text-neutral-900">FinSight</Text>
        <Text className="mt-2 text-base text-neutral-600">
          Welcome{user?.name ? `, ${user.name}` : ''}. You are signed in.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          className="mt-8 h-14 items-center justify-center rounded-2xl bg-emerald-600"
          onPress={logout}
        >
          <Text className="text-base font-semibold text-white">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
