import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MainTabBar from '../../components/main/MainTabBar';
import { MAIN_ROUTES } from '../../navigation/routes';
import { RECENT_SCANS } from '../../utils/dummyData';

const TIPS = [
  'Struk di permukaan datar, pencahayaan cukup',
  'Seluruh struk masuk dalam frame kamera',
  'Foto dari atas tegak lurus, tidak miring',
];

const CATEGORY_BADGE_CLASS = {
  Makanan: 'bg-emerald-100 text-emerald-700',
  Belanja: 'bg-violet-100 text-violet-700',
};

export default function ScanScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View className="flex-row items-center justify-between border-b border-neutral-200 px-5 pb-3 pt-4">
        <Text className="text-[20px] font-semibold text-neutral-900">Pindai struk</Text>
        <Text className="text-2xl text-neutral-500">ⓘ</Text>
      </View>

      <ScrollView
        className="flex-1 px-5 py-4"
        contentContainerClassName="gap-2.5 pb-6"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          className="h-44 items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-100"
          onPress={() => navigation.navigate(MAIN_ROUTES.OCR)}
        >
          <View className="h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
            <Text className="text-2xl text-blue-700">◉</Text>
          </View>
          <Text className="mt-3 text-lg font-semibold text-neutral-700">Foto atau unggah struk</Text>
          <Text className="mt-1 text-sm text-neutral-500">Ketuk untuk buka kamera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          className="h-14 items-center justify-center rounded-xl bg-blue-700"
          onPress={() => navigation.navigate(MAIN_ROUTES.OCR)}
        >
          <Text className="text-lg font-semibold text-white">Buka kamera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          className="h-14 items-center justify-center rounded-xl border border-neutral-300"
        >
          <Text className="text-lg font-medium text-neutral-600">Pilih dari galeri / PDF</Text>
        </TouchableOpacity>

        <View className="rounded-xl bg-neutral-100 p-4">
          <Text className="mb-2 text-lg font-medium text-neutral-600">Tips scan optimal</Text>
          <View className="gap-2">
            {TIPS.map(item => (
              <View key={item} className="flex-row items-start gap-2">
                <View className="mt-0.5 h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
                  <Text className="text-xs text-emerald-700">✓</Text>
                </View>
                <Text className="flex-1 text-base leading-6 text-neutral-600">{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="rounded-xl border border-neutral-200 bg-white p-4">
          <Text className="mb-1 text-lg font-medium text-neutral-600">Scan terbaru</Text>
          {RECENT_SCANS.map(item => (
            <View key={item.id} className="flex-row items-center border-b border-neutral-200 py-2.5 last:border-b-0">
              <View className="h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <Text className="text-lg text-emerald-700">🧾</Text>
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-base font-medium text-neutral-900">{item.merchant}</Text>
                <Text className="text-sm text-neutral-500">{item.dateText}</Text>
              </View>
              <View className="items-end">
                <Text className="text-base font-semibold text-neutral-900">{item.amount}</Text>
                <Text
                  className={`mt-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    CATEGORY_BADGE_CLASS[item.category] ?? 'bg-neutral-100 text-neutral-700'
                  }`}
                >
                  {item.category}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <MainTabBar activeRoute={MAIN_ROUTES.SCAN} />
    </SafeAreaView>
  );
}
