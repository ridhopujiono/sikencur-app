import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MainTabBar from '../../components/main/MainTabBar';
import { MAIN_ROUTES } from '../../navigation/routes';
import { DSS_RECOMMENDATIONS } from '../../utils/dummyData';

const METRICS = [
  { label: 'Kepatuhan anggaran', value: 87, barColor: 'bg-emerald-600', valueColor: 'text-emerald-700' },
  { label: 'Kebutuhan pokok', value: 61, barColor: 'bg-blue-700', valueColor: 'text-blue-700' },
  {
    label: 'Hiburan & non-esensial',
    value: 18,
    barColor: 'bg-amber-600',
    valueColor: 'text-amber-700',
  },
];

const USER_DISTRIBUTION = [
  { label: 'Saver (Anda)', value: 24, color: 'bg-emerald-600', textColor: 'text-emerald-700' },
  { label: 'Spender', value: 38, color: 'bg-red-600', textColor: 'text-neutral-600' },
  { label: 'Balanced', value: 28, color: 'bg-blue-700', textColor: 'text-neutral-600' },
  { label: 'Investor', value: 10, color: 'bg-violet-700', textColor: 'text-neutral-600' },
];

export default function DSSProfileScreen() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View className="flex-row items-center justify-between border-b border-neutral-200 px-5 pb-3 pt-4">
        <Text className="text-[20px] font-semibold text-neutral-900">Profil keuangan</Text>
        <Text className="text-2xl text-neutral-500">ⓘ</Text>
      </View>

      <ScrollView
        className="flex-1 px-5 py-4"
        contentContainerClassName="gap-2.5 pb-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center rounded-xl bg-neutral-100 p-5">
          <View className="h-28 w-28 items-center justify-center rounded-full border-[8px] border-emerald-600">
            <Text className="text-base font-semibold text-neutral-900">The Saver</Text>
          </View>
          <Text className="mt-3 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-700">
            Tipe A — The Saver
          </Text>
          <Text className="mt-2 text-sm text-neutral-500">
            Kepercayaan model 89% · Dianalisis 1 Mar 2025
          </Text>
          <Text className="text-sm text-neutral-500">Berdasarkan 142 transaksi</Text>
        </View>

        <View className="rounded-xl border border-neutral-200 bg-white p-4">
          <Text className="mb-2 text-base font-medium text-neutral-600">Metrik keuangan Maret</Text>
          <View className="gap-2">
            {METRICS.map(metric => (
              <View key={metric.label}>
                <View className="mb-1 flex-row items-center justify-between">
                  <Text className="text-sm text-neutral-600">{metric.label}</Text>
                  <Text className={`text-sm font-semibold ${metric.valueColor}`}>{metric.value}%</Text>
                </View>
                <View className="h-2.5 overflow-hidden rounded-full bg-neutral-200">
                  <View className={`h-full rounded-full ${metric.barColor}`} style={{ width: `${metric.value}%` }} />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className="rounded-xl border border-neutral-200 bg-white p-4">
          <Text className="mb-1 text-base font-medium text-neutral-600">Rekomendasi personal</Text>
          {DSS_RECOMMENDATIONS.map(rec => (
            <View key={rec.id} className="flex-row border-b border-neutral-200 py-2.5 last:border-b-0">
              <View className="mr-3 h-9 w-9 items-center justify-center rounded-md bg-emerald-100">
                <Text className="text-base text-emerald-700">✦</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-neutral-900">{rec.title}</Text>
                <Text className="mt-1 text-sm leading-6 text-neutral-600">{rec.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View className="rounded-xl bg-neutral-100 p-4">
          <Text className="mb-2 text-base font-medium text-neutral-600">
            Distribusi tipe pengguna (anonim)
          </Text>
          {USER_DISTRIBUTION.map(item => (
            <View key={item.label} className="mb-2 last:mb-0">
              <View className="mb-1 flex-row items-center justify-between">
                <Text className={`text-sm ${item.textColor}`}>{item.label}</Text>
                <Text className="text-sm text-neutral-600">{item.value}%</Text>
              </View>
              <View className="h-2.5 overflow-hidden rounded-full bg-neutral-300">
                <View className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <MainTabBar activeRoute={MAIN_ROUTES.DSS} />
    </SafeAreaView>
  );
}
