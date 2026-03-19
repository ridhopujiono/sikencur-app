import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MainTabBar from '../../components/main/MainTabBar';
import { MAIN_ROUTES } from '../../navigation/routes';
import { TRANSACTION_GROUPS } from '../../utils/dummyData';

const FILTERS = ['Semua', 'Makanan', 'Transport', 'Hiburan', '+'];

const BADGE_CLASS = {
  Makanan: 'bg-emerald-100 text-emerald-700',
  Transport: 'bg-blue-100 text-blue-700',
  Hiburan: 'bg-amber-100 text-amber-700',
  Kesehatan: 'bg-red-100 text-red-700',
  Belanja: 'bg-violet-100 text-violet-700',
};

export default function TransactionsScreen() {
  const [activeFilter, setActiveFilter] = useState('Semua');

  const filteredGroups = useMemo(() => {
    if (activeFilter === 'Semua' || activeFilter === '+') {
      return TRANSACTION_GROUPS;
    }

    return TRANSACTION_GROUPS.map(group => ({
      ...group,
      items: group.items.filter(item => item.category === activeFilter),
    })).filter(group => group.items.length > 0);
  }, [activeFilter]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View className="flex-row items-center justify-between border-b border-neutral-200 px-5 pb-3 pt-4">
        <Text className="text-[20px] font-semibold text-neutral-900">Transaksi</Text>
        <View className="flex-row items-center gap-4">
          <Text className="text-2xl text-neutral-500">⌕</Text>
          <Text className="text-2xl text-neutral-500">☰</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5 py-4"
        contentContainerClassName="gap-2.5 pb-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row flex-wrap gap-1.5">
          {FILTERS.map(filter => {
            const isActive = filter === activeFilter;
            return (
              <TouchableOpacity
                key={filter}
                activeOpacity={0.85}
                className={`rounded-full border px-3.5 py-1.5 ${
                  isActive ? 'border-blue-700 bg-blue-100' : 'border-neutral-300 bg-transparent'
                }`}
                onPress={() => setActiveFilter(filter)}
              >
                <Text
                  className={`text-sm ${isActive ? 'font-semibold text-blue-700' : 'text-neutral-600'}`}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-neutral-600">Maret 2025</Text>
          <Text className="text-base font-semibold text-neutral-900">Rp 2.450.000</Text>
        </View>

        <View className="rounded-xl border border-neutral-200 bg-white p-4">
          {filteredGroups.map(group => (
            <View key={group.id} className="mb-2 last:mb-0">
              <Text className="pb-1 text-sm font-semibold text-neutral-500">{group.date}</Text>
              {group.items.map(item => (
                <View key={item.id} className="flex-row items-center border-b border-neutral-200 py-2.5 last:border-b-0">
                  <View className="h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
                    <Text className="text-lg text-neutral-600">●</Text>
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-medium text-neutral-900">{item.merchant}</Text>
                    <Text className="text-sm text-neutral-500">{item.meta}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-base font-semibold text-neutral-900">{item.amount}</Text>
                    <Text
                      className={`mt-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        BADGE_CLASS[item.category] ?? 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {item.category}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      <MainTabBar activeRoute={MAIN_ROUTES.TRANSACTIONS} />
    </SafeAreaView>
  );
}
