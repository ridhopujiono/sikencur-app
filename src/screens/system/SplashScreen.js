import React from 'react';
import { ActivityIndicator, Image, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const APP_LOGO = require('../../../assets/logo/app_logo.png');

export default function SplashScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View className="flex-1 items-center justify-center px-8">
        <View className="items-center">
          <Image
            source={APP_LOGO}
            className="h-32 w-32"
            resizeMode="contain"
            accessibilityLabel="Logo SiKencur"
          />

          <Text className="mt-5 text-4xl font-extrabold tracking-tight text-neutral-900">
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
