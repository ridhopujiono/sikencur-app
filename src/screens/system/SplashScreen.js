import React from 'react';
import { ActivityIndicator, StatusBar, Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SplashScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View className="flex-1 items-center justify-center px-8">
        <View className="items-center">
          <View className="h-28 w-28 items-center justify-center rounded-[32px] bg-blue-700 shadow-lg shadow-blue-200">
            <Ionicons name="leaf" size={54} color="#ffffff" />
          </View>

          <Text className="mt-6 text-4xl font-extrabold tracking-tight text-neutral-900">
            SiKencur
          </Text>
          <Text className="mt-2 text-center text-base leading-6 text-neutral-500">
            Kelola transaksi, scan struk, dan pantau profil keuangan Anda.
          </Text>
        </View>

        <View className="mt-12 items-center">
          <ActivityIndicator color="#1d4ed8" size="large" />
          <Text className="mt-3 text-sm font-medium text-neutral-500">
            Memuat aplikasi...
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
