import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { AuthContext } from '../../context/AuthContext';
import MainTabBar from '../../components/main/MainTabBar';
import { MAIN_ROUTES } from '../../navigation/routes';
import { USER_PROFILE } from '../../utils/dummyData';
import { getTransactionSummary, upsertUserBudget } from '../../api/transactions';

function SettingsRow({
  title,
  subtitle,
  iconName,
  rightNode,
  danger = false,
  onPress,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      className="flex-row items-center justify-between border-b border-neutral-200 py-3 last:border-b-0"
      onPress={onPress}
    >
      <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-neutral-100">
        <Ionicons name={iconName} size={22} color="#52525b" />
      </View>
      <View className="flex-1">
        <Text
          className={`text-base font-medium ${danger ? 'text-red-700' : 'text-neutral-900'}`}
        >
          {title}
        </Text>
        {subtitle ? <Text className="mt-0.5 text-sm text-neutral-500">{subtitle}</Text> : null}
      </View>
      {rightNode ?? <Text className="text-2xl text-neutral-300">›</Text>}
    </TouchableOpacity>
  );
}

function parseNumericInput(rawValue) {
  const value = String(rawValue ?? '').trim();
  if (!value) return null;

  const cleanValue = value.replace(/\s/g, '').replace(/[^0-9.,]/g, '');
  if (!cleanValue) return null;

  let normalized = cleanValue;
  const commaCount = (cleanValue.match(/,/g) || []).length;
  const dotCount = (cleanValue.match(/\./g) || []).length;

  if (commaCount > 0 && dotCount > 0) {
    const lastComma = cleanValue.lastIndexOf(',');
    const lastDot = cleanValue.lastIndexOf('.');

    normalized =
      lastComma > lastDot
        ? cleanValue.replace(/\./g, '').replace(',', '.')
        : cleanValue.replace(/,/g, '');
  } else if (commaCount > 0) {
    normalized = commaCount > 1 ? cleanValue.replace(/,/g, '') : cleanValue.replace(',', '.');
  } else if (dotCount > 1) {
    normalized = cleanValue.replace(/\./g, '');
  }

  const numericValue = Number(normalized);

  return Number.isFinite(numericValue) ? numericValue : null;
}

function formatInputNumber(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return '';
  if (Number.isInteger(numericValue)) return String(numericValue);
  return String(numericValue);
}

function getErrorMessage(error) {
  if (typeof error === 'string') return error;
  if (error?.data?.message) return error.data.message;
  if (error?.message) return error.message;
  return 'Terjadi kesalahan pada server.';
}

export default function SettingsScreen() {
  const { user, logout } = useContext(AuthContext);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [budgetAlert, setBudgetAlert] = useState(true);
  const [dssTips, setDssTips] = useState(false);
  const [dssConsent, setDssConsent] = useState(true);
  const [budgetLimitInput, setBudgetLimitInput] = useState('');
  const [targetRemainingInput, setTargetRemainingInput] = useState('');
  const [budgetError, setBudgetError] = useState(null);
  const [isBudgetLoading, setIsBudgetLoading] = useState(true);
  const [isBudgetSaving, setIsBudgetSaving] = useState(false);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const periodLabel = new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(now);

  const name = user?.name ?? USER_PROFILE.name;
  const email = user?.email ?? USER_PROFILE.email;
  const initials = useMemo(
    () =>
      name
        .split(' ')
        .slice(0, 2)
        .map(word => word[0])
        .join('')
        .toUpperCase(),
    [name],
  );

  const loadBudget = useCallback(async () => {
    try {
      setIsBudgetLoading(true);
      setBudgetError(null);

      const response = await getTransactionSummary({
        month,
        year,
        top_categories: 1,
        scan_status: 'completed',
      });

      const budget = response?.budget;

      if (!budget) {
        setBudgetLimitInput('');
        setTargetRemainingInput('');
        return;
      }

      setBudgetLimitInput(formatInputNumber(budget.limit));
      setTargetRemainingInput(formatInputNumber(budget.target_remaining));
    } catch (error) {
      setBudgetError(getErrorMessage(error));
    } finally {
      setIsBudgetLoading(false);
    }
  }, [month, year]);

  useFocusEffect(
    useCallback(() => {
      loadBudget();
    }, [loadBudget]),
  );

  const saveBudget = async () => {
    const limit = parseNumericInput(budgetLimitInput);
    const targetRemaining = parseNumericInput(targetRemainingInput);

    if (limit == null) {
      Alert.alert('Validasi', 'Limit budget wajib diisi dengan angka yang valid.');
      return;
    }

    if (targetRemaining != null && targetRemaining > limit) {
      Alert.alert('Validasi', 'Target sisa tidak boleh melebihi limit budget.');
      return;
    }

    try {
      setIsBudgetSaving(true);
      setBudgetError(null);

      const payload = {
        month,
        year,
        limit,
        target_remaining: targetRemaining,
      };

      const savedBudget = await upsertUserBudget(payload);
      setBudgetLimitInput(formatInputNumber(savedBudget?.limit));
      setTargetRemainingInput(formatInputNumber(savedBudget?.target_remaining));

      Alert.alert('Berhasil', 'Budget bulanan berhasil disimpan.');
    } catch (error) {
      setBudgetError(getErrorMessage(error));
      Alert.alert('Gagal simpan budget', getErrorMessage(error));
    } finally {
      setIsBudgetSaving(false);
    }
  };

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

        <View className="rounded-xl border border-neutral-200 bg-white p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <View>
              <Text className="text-base font-semibold text-neutral-900">Budget Bulanan</Text>
              <Text className="mt-0.5 text-sm text-neutral-500">{periodLabel}</Text>
            </View>
            <TouchableOpacity activeOpacity={0.85} onPress={loadBudget}>
              <Text className="text-sm font-semibold text-blue-700">Muat ulang</Text>
            </TouchableOpacity>
          </View>

          {isBudgetLoading ? (
            <View className="items-center justify-center rounded-xl bg-neutral-100 py-6">
              <ActivityIndicator color="#1d4ed8" />
              <Text className="mt-2 text-sm text-neutral-500">Memuat budget...</Text>
            </View>
          ) : (
            <>
              <Text className="mb-1 text-sm font-medium text-neutral-700">Limit budget</Text>
              <TextInput
                value={budgetLimitInput}
                onChangeText={setBudgetLimitInput}
                keyboardType="numeric"
                placeholder="Contoh: 3000000"
                placeholderTextColor="#a3a3a3"
                className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900"
              />

              <Text className="mb-1 mt-3 text-sm font-medium text-neutral-700">
                Target sisa (opsional)
              </Text>
              <TextInput
                value={targetRemainingInput}
                onChangeText={setTargetRemainingInput}
                keyboardType="numeric"
                placeholder="Contoh: 1000000"
                placeholderTextColor="#a3a3a3"
                className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900"
              />

              {budgetError ? (
                <Text className="mt-2 text-sm text-red-700">{budgetError}</Text>
              ) : null}

              <TouchableOpacity
                activeOpacity={0.85}
                className={`mt-4 h-12 items-center justify-center rounded-xl ${
                  isBudgetSaving ? 'bg-blue-500' : 'bg-blue-700'
                }`}
                disabled={isBudgetSaving}
                onPress={saveBudget}
              >
                {isBudgetSaving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-base font-semibold text-white">Simpan budget</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        <View className="rounded-xl border border-neutral-200 bg-white px-3">
          <Text className="pb-1 pt-2 text-sm font-semibold text-neutral-500">Notifikasi</Text>
          <SettingsRow
            title="Ringkasan mingguan"
            iconName="calendar-outline"
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
            iconName="warning-outline"
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
            iconName="bulb-outline"
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
            iconName="shield-checkmark-outline"
            rightNode={
              <Switch
                value={dssConsent}
                onValueChange={setDssConsent}
                trackColor={{ false: '#d4d4d8', true: '#059669' }}
                thumbColor="#ffffff"
              />
            }
          />
          <SettingsRow title="Unduh data saya" iconName="download-outline" />
          <SettingsRow title="Hapus akun" iconName="trash-outline" danger />
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
