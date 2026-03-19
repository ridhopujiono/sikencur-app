import React, { useContext } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import MainTabBar from '../../components/main/MainTabBar';
import { MAIN_ROUTES } from '../../navigation/routes';
import { USER_PROFILE } from '../../utils/dummyData';

const WEEKLY_SPENDING = [
  { day: 'S', value: 38 },
  { day: 'M', value: 55 },
  { day: 'S', value: 42 },
  { day: 'R', value: 68 },
  { day: 'K', value: 100, highlighted: true },
  { day: 'J', value: 52 },
  { day: 'S', value: 47 },
];

const CATEGORY_BREAKDOWN = [
  { name: 'Makanan', percentage: 38, color: 'bg-emerald-600' },
  { name: 'Transportasi', percentage: 22, color: 'bg-blue-700' },
  { name: 'Hiburan', percentage: 18, color: 'bg-amber-600' },
  { name: 'Kesehatan', percentage: 12, color: 'bg-red-600' },
];

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);

  const displayName = user?.name ?? USER_PROFILE.name;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View className="border-b border-neutral-200 px-5 pb-3 pt-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[17px] font-semibold text-neutral-900">
              Selamat pagi, {displayName.split(' ')[0]}
            </Text>
            <Text className="mt-1 text-xs text-neutral-500">Maret 2025</Text>
          </View>
          <View className="h-11 w-11 items-center justify-center rounded-full bg-blue-100">
            <Text className="text-sm font-semibold text-blue-800">{USER_PROFILE.initials}</Text>
          </View>
        </View>
      </View>

      <View className="flex-1">
        <ScrollView
          className="flex-1 px-5 py-4"
          contentContainerClassName="gap-2.5 pb-24"
          showsVerticalScrollIndicator={false}
        >
          <View className="rounded-2xl bg-neutral-100 p-4">
            <Text className="text-sm text-neutral-500">Total pengeluaran Maret 2025</Text>
            <Text className="mt-1 text-[30px] font-semibold text-neutral-900">Rp 2.450.000</Text>
            <Text className="mt-1.5 text-sm font-medium text-emerald-700">+12% dari Februari</Text>
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1 rounded-2xl bg-neutral-100 p-4">
              <Text className="text-sm text-neutral-500">Sisa anggaran</Text>
              <Text className="mt-1.5 text-[22px] font-semibold text-neutral-900">Rp 550rb</Text>
              <View className="mt-3 h-2.5 overflow-hidden rounded-full bg-neutral-300">
                <View className="h-full w-[82%] rounded-full bg-red-600" />
              </View>
              <Text className="mt-2 text-xs text-red-700">82% terpakai</Text>
            </View>
            <View className="flex-1 rounded-2xl bg-neutral-100 p-4">
              <Text className="text-sm text-neutral-500">Struk dipindai</Text>
              <Text className="mt-1.5 text-[22px] font-semibold text-neutral-900">24</Text>
              <Text className="mt-2.5 text-xs text-neutral-600">transaksi bulan ini</Text>
            </View>
          </View>

          <View className="rounded-2xl bg-neutral-100 p-4">
            <Text className="mb-3 text-base font-medium text-neutral-600">Pengeluaran 7 hari</Text>
            <View className="h-24 flex-row items-end gap-1">
              {WEEKLY_SPENDING.map(item => (
                <View key={`${item.day}-${item.value}`} className="flex-1 items-center">
                  <View
                    className={`w-full rounded-t-md ${item.highlighted ? 'bg-blue-700' : 'bg-blue-200'}`}
                    style={{ height: `${item.value}%` }}
                  />
                  <Text className={`mt-1 text-sm ${item.highlighted ? 'font-semibold text-blue-700' : 'text-neutral-500'}`}>
                    {item.day}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View className="rounded-2xl bg-neutral-100 p-4">
            <Text className="mb-2 text-base font-medium text-neutral-600">Kategori terbesar</Text>
            {CATEGORY_BREAKDOWN.map(item => (
              <View key={item.name} className="mb-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View className={`h-3 w-3 rounded-full ${item.color}`} />
                    <Text className="text-lg text-neutral-900">{item.name}</Text>
                  </View>
                  <Text className="text-lg font-semibold text-neutral-600">{item.percentage}%</Text>
                </View>
                <View className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-neutral-300">
                  <View className={`h-full rounded-full ${item.color}`} style={{ width: `${item.percentage}%` }} />
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            className="rounded-2xl bg-neutral-100 p-4"
            onPress={() => navigation.navigate(MAIN_ROUTES.DSS)}
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-base font-medium text-neutral-600">Profil DSS keuangan</Text>
                <View className="mt-3 flex-row items-center gap-2">
                  <Text className="rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-700">
                    The Saver
                  </Text>
                  <Text className="text-base text-neutral-500">Tipe A · 89% conf.</Text>
                </View>
              </View>
              <Text className="text-2xl text-neutral-400">›</Text>
            </View>
            <View className="mt-4 h-2.5 overflow-hidden rounded-full bg-neutral-300">
              <View className="h-full w-[87%] rounded-full bg-emerald-600" />
            </View>
            <Text className="mt-1.5 text-sm text-neutral-500">Kepatuhan anggaran 87%</Text>
          </TouchableOpacity>
        </ScrollView>

        <TouchableOpacity
          activeOpacity={0.9}
          className="absolute bottom-20 right-5 h-14 w-14 items-center justify-center rounded-full bg-blue-700"
          onPress={() => navigation.navigate(MAIN_ROUTES.SCAN)}
        >
          <Text className="text-3xl text-white">+</Text>
        </TouchableOpacity>
      </View>

      <MainTabBar activeRoute={MAIN_ROUTES.HOME} />
    </SafeAreaView>
  );
}
