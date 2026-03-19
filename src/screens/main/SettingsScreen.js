import React, { useContext, useState } from 'react';
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import MainTabBar from '../../components/main/MainTabBar';
import { MAIN_ROUTES } from '../../navigation/routes';
import { USER_PROFILE } from '../../utils/dummyData';

function SettingsRow({ title, subtitle, icon, rightNode, danger = false }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      className="flex-row items-center justify-between border-b border-neutral-200 py-3 last:border-b-0"
    >
      <View className="mr-3 h-9 w-9 items-center justify-center rounded-md bg-neutral-100">
        <Text className="text-sm text-neutral-600">{icon}</Text>
      </View>
      <View className="flex-1">
        <Text className={`text-base font-medium ${danger ? 'text-red-700' : 'text-neutral-900'}`}>{title}</Text>
        {subtitle ? <Text className="mt-0.5 text-sm text-neutral-500">{subtitle}</Text> : null}
      </View>
      {rightNode ?? <Text className="text-2xl text-neutral-300">›</Text>}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { user, logout } = useContext(AuthContext);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [budgetAlert, setBudgetAlert] = useState(true);
  const [dssTips, setDssTips] = useState(false);
  const [dssConsent, setDssConsent] = useState(true);

  const name = user?.name ?? USER_PROFILE.name;
  const email = user?.email ?? USER_PROFILE.email;
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View className="border-b border-neutral-200 px-5 pb-3 pt-4">
        <Text className="text-[20px] font-semibold text-neutral-900">Akun & pengaturan</Text>
      </View>

      <ScrollView
        className="flex-1 px-5 py-4"
        contentContainerClassName="gap-2.5 pb-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center rounded-xl border border-neutral-200 bg-white p-4">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Text className="text-lg font-semibold text-blue-800">{initials}</Text>
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-lg font-semibold text-neutral-900">{name}</Text>
            <Text className="text-sm text-neutral-500">{email}</Text>
          </View>
          <Text className="text-2xl text-neutral-300">›</Text>
        </View>

        <View className="rounded-xl border border-neutral-200 bg-white px-3">
          <Text className="pb-1 pt-2 text-sm font-semibold text-neutral-500">Keuangan</Text>
          <SettingsRow title="Anggaran" subtitle="Kelola anggaran per kategori" icon="₿" />
          <SettingsRow title="Kategori" subtitle="Tambah kategori kustom" icon="◈" />
        </View>

        <View className="rounded-xl border border-neutral-200 bg-white px-3">
          <Text className="pb-1 pt-2 text-sm font-semibold text-neutral-500">Notifikasi</Text>
          <SettingsRow
            title="Ringkasan mingguan"
            icon="◷"
            rightNode={
              <Switch
                value={weeklySummary}
                onValueChange={setWeeklySummary}
                trackColor={{ false: '#d4d4d8', true: '#059669' }}
                thumbColor="#ffffff"
              />
            }
          />
          <SettingsRow
            title="Peringatan anggaran"
            icon="!"
            rightNode={
              <Switch
                value={budgetAlert}
                onValueChange={setBudgetAlert}
                trackColor={{ false: '#d4d4d8', true: '#059669' }}
                thumbColor="#ffffff"
              />
            }
          />
          <SettingsRow
            title="Tips DSS mingguan"
            icon="✦"
            rightNode={
              <Switch
                value={dssTips}
                onValueChange={setDssTips}
                trackColor={{ false: '#d4d4d8', true: '#059669' }}
                thumbColor="#ffffff"
              />
            }
          />
        </View>

        <View className="rounded-xl border border-neutral-200 bg-white px-3">
          <Text className="pb-1 pt-2 text-sm font-semibold text-neutral-500">Privasi & data</Text>
          <SettingsRow
            title="Persetujuan analisis DSS"
            subtitle="Izin analisis perilaku keuangan"
            icon="⌁"
            rightNode={
              <Switch
                value={dssConsent}
                onValueChange={setDssConsent}
                trackColor={{ false: '#d4d4d8', true: '#059669' }}
                thumbColor="#ffffff"
              />
            }
          />
          <SettingsRow title="Unduh data saya" icon="↓" />
          <SettingsRow title="Hapus akun" icon="⌫" danger />
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          className="h-14 items-center justify-center rounded-xl border border-red-200 bg-red-50"
          onPress={logout}
        >
          <Text className="text-lg font-semibold text-red-700">Keluar</Text>
        </TouchableOpacity>
      </ScrollView>

      <MainTabBar activeRoute={MAIN_ROUTES.SETTINGS} />
    </SafeAreaView>
  );
}
