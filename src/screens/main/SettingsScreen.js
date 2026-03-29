import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import Ionicons from '@react-native-vector-icons/ionicons';
import { AuthContext } from '../../context/AuthContext';
import FadeInView from '../../components/common/FadeInView';
import MainTabBar from '../../components/main/MainTabBar';
import { MAIN_ROUTES } from '../../navigation/routes';
import { USER_PROFILE } from '../../utils/dummyData';
import { getTransactionSummary, upsertUserBudget } from '../../api/transactions';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../../services/notificationPreferencesApi';

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

function NotificationToggleRow({
  title,
  subtitle,
  iconName,
  value,
  onValueChange,
}) {
  return (
    <View className="flex-row items-center justify-between border-b border-neutral-200 py-3 last:border-b-0">
      <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-neutral-100">
        <Ionicons name={iconName} size={22} color="#52525b" />
      </View>
      <View className="flex-1 pr-3">
        <Text className="text-base font-medium text-neutral-900">{title}</Text>
        {subtitle ? <Text className="mt-0.5 text-sm text-neutral-500">{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#d4d4d8', true: '#059669' }}
        thumbColor="#ffffff"
      />
    </View>
  );
}

const DEFAULT_TIMEZONE = 'Asia/Jakarta';
const DEFAULT_NOTIFICATION_FORM = {
  pushEnabled: true,
  weeklySummaryEnabled: true,
  budgetAlertEnabled: true,
  dssTipsEnabled: false,
  quietHoursStart: null,
  quietHoursEnd: null,
  timezone: DEFAULT_TIMEZONE,
};

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

function normalizeBackendTime(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  const matched = value.trim().match(/^([01]\d|2[0-3]):([0-5]\d)/);
  if (!matched) return null;

  return `${matched[1]}:${matched[2]}`;
}

function normalizeQuietTimeValue(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  const matched = value.trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!matched) return null;

  return `${matched[1]}:${matched[2]}`;
}

function formatTimeHHmm(date) {
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${hour}:${minute}`;
}

function timeStringToDate(timeString) {
  const now = new Date();
  const normalized = normalizeBackendTime(timeString);

  if (!normalized) {
    return now;
  }

  const [hour, minute] = normalized.split(':').map(Number);
  const nextDate = new Date(now);
  nextDate.setHours(hour, minute, 0, 0);
  return nextDate;
}

function buildNotificationForm(preferences) {
  return {
    pushEnabled: Boolean(preferences?.push_enabled),
    weeklySummaryEnabled: Boolean(preferences?.weekly_summary_enabled),
    budgetAlertEnabled: Boolean(preferences?.budget_alert_enabled),
    dssTipsEnabled: Boolean(preferences?.dss_tips_enabled),
    quietHoursStart: normalizeBackendTime(preferences?.quiet_hours_start),
    quietHoursEnd: normalizeBackendTime(preferences?.quiet_hours_end),
    timezone:
      typeof preferences?.timezone === 'string' && preferences.timezone.trim() !== ''
        ? preferences.timezone.trim()
        : DEFAULT_TIMEZONE,
  };
}

function buildNotificationDiffPayload(initialForm, currentForm) {
  const normalizedInitial = {
    ...initialForm,
    quietHoursStart: normalizeQuietTimeValue(initialForm?.quietHoursStart),
    quietHoursEnd: normalizeQuietTimeValue(initialForm?.quietHoursEnd),
    timezone:
      typeof initialForm?.timezone === 'string' && initialForm.timezone.trim() !== ''
        ? initialForm.timezone.trim()
        : DEFAULT_TIMEZONE,
  };
  const normalizedCurrent = {
    ...currentForm,
    quietHoursStart: normalizeQuietTimeValue(currentForm?.quietHoursStart),
    quietHoursEnd: normalizeQuietTimeValue(currentForm?.quietHoursEnd),
    timezone:
      typeof currentForm?.timezone === 'string' && currentForm.timezone.trim() !== ''
        ? currentForm.timezone.trim()
        : DEFAULT_TIMEZONE,
  };

  const payload = {};

  if (normalizedCurrent.pushEnabled !== normalizedInitial.pushEnabled) {
    payload.push_enabled = normalizedCurrent.pushEnabled;
  }
  if (normalizedCurrent.weeklySummaryEnabled !== normalizedInitial.weeklySummaryEnabled) {
    payload.weekly_summary_enabled = normalizedCurrent.weeklySummaryEnabled;
  }
  if (normalizedCurrent.budgetAlertEnabled !== normalizedInitial.budgetAlertEnabled) {
    payload.budget_alert_enabled = normalizedCurrent.budgetAlertEnabled;
  }
  if (normalizedCurrent.dssTipsEnabled !== normalizedInitial.dssTipsEnabled) {
    payload.dss_tips_enabled = normalizedCurrent.dssTipsEnabled;
  }
  if (normalizedCurrent.quietHoursStart !== normalizedInitial.quietHoursStart) {
    payload.quiet_hours_start = normalizedCurrent.quietHoursStart;
  }
  if (normalizedCurrent.quietHoursEnd !== normalizedInitial.quietHoursEnd) {
    payload.quiet_hours_end = normalizedCurrent.quietHoursEnd;
  }
  if (normalizedCurrent.timezone !== normalizedInitial.timezone) {
    payload.timezone = normalizedCurrent.timezone;
  }

  return payload;
}

export default function SettingsScreen() {
  const { user, logout } = useContext(AuthContext);
  const [notificationInitialForm, setNotificationInitialForm] = useState(
    DEFAULT_NOTIFICATION_FORM,
  );
  const [notificationForm, setNotificationForm] = useState(DEFAULT_NOTIFICATION_FORM);
  const [isNotificationLoading, setIsNotificationLoading] = useState(true);
  const [isNotificationSaving, setIsNotificationSaving] = useState(false);
  const [notificationError, setNotificationError] = useState(null);
  const [showNotificationIOSPicker, setShowNotificationIOSPicker] = useState(false);
  const [notificationPickerField, setNotificationPickerField] = useState(null);
  const [notificationPickerDate, setNotificationPickerDate] = useState(new Date());
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

  const loadNotificationSettings = useCallback(async () => {
    try {
      setIsNotificationLoading(true);
      setNotificationError(null);

      const response = await getNotificationPreferences();
      const nextForm = buildNotificationForm(response);
      setNotificationInitialForm(nextForm);
      setNotificationForm(nextForm);
    } catch (error) {
      setNotificationError(getErrorMessage(error));
    } finally {
      setIsNotificationLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBudget();
      loadNotificationSettings();
    }, [loadBudget, loadNotificationSettings]),
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

  const updateNotificationField = (field, value) => {
    setNotificationForm(previous => ({
      ...previous,
      [field]: value,
    }));
  };

  const openQuietHoursPicker = field => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        mode: 'time',
        display: 'clock',
        is24Hour: true,
        value: timeStringToDate(notificationForm[field]),
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            updateNotificationField(field, formatTimeHHmm(selectedDate));
          }
        },
      });
      return;
    }

    setNotificationPickerField(field);
    setNotificationPickerDate(timeStringToDate(notificationForm[field]));
    setShowNotificationIOSPicker(true);
  };

  const applyIOSQuietHoursPicker = () => {
    if (!notificationPickerField) {
      setShowNotificationIOSPicker(false);
      return;
    }

    updateNotificationField(notificationPickerField, formatTimeHHmm(notificationPickerDate));
    setShowNotificationIOSPicker(false);
    setNotificationPickerField(null);
  };

  const saveNotificationSettings = async () => {
    const diffPayload = buildNotificationDiffPayload(
      notificationInitialForm,
      notificationForm,
    );

    if (Object.keys(diffPayload).length === 0) {
      Alert.alert('Info', 'Tidak ada perubahan preferensi notifikasi.');
      return;
    }

    try {
      setIsNotificationSaving(true);
      setNotificationError(null);

      const updated = await updateNotificationPreferences(diffPayload);
      const nextForm = buildNotificationForm(updated);
      setNotificationInitialForm(nextForm);
      setNotificationForm(nextForm);

      if (Platform.OS === 'android') {
        ToastAndroid.show('Preferensi notifikasi tersimpan', ToastAndroid.SHORT);
      } else {
        Alert.alert('Berhasil', 'Preferensi notifikasi berhasil disimpan.');
      }
    } catch (error) {
      const message = getErrorMessage(error);
      setNotificationError(message);
      Alert.alert('Gagal simpan notifikasi', message);
    } finally {
      setIsNotificationSaving(false);
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
        <FadeInView delay={30}>
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
        </FadeInView>

        <FadeInView delay={80}>
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
        </FadeInView>

        <FadeInView delay={130}>
          <View className="rounded-xl border border-neutral-200 bg-white px-3">
            <View className="mb-2 flex-row items-center justify-between pb-1 pt-2">
              <Text className="text-sm font-semibold text-neutral-500">Notifikasi</Text>
              <TouchableOpacity activeOpacity={0.85} onPress={loadNotificationSettings}>
                <Text className="text-sm font-semibold text-blue-700">
                  {isNotificationLoading ? 'Memuat...' : 'Muat ulang'}
                </Text>
              </TouchableOpacity>
            </View>

            {isNotificationLoading ? (
              <View className="items-center justify-center rounded-xl bg-neutral-100 py-6">
                <ActivityIndicator color="#1d4ed8" />
                <Text className="mt-2 text-sm text-neutral-500">
                  Memuat preferensi notifikasi...
                </Text>
              </View>
            ) : (
              <>
                <NotificationToggleRow
                  title="Push notification"
                  subtitle="Aktifkan semua push notification"
                  iconName="notifications-outline"
                  value={notificationForm.pushEnabled}
                  onValueChange={value => updateNotificationField('pushEnabled', value)}
                />
                <NotificationToggleRow
                  title="Ringkasan mingguan"
                  iconName="calendar-outline"
                  value={notificationForm.weeklySummaryEnabled}
                  onValueChange={value => updateNotificationField('weeklySummaryEnabled', value)}
                />
                <NotificationToggleRow
                  title="Peringatan anggaran"
                  iconName="warning-outline"
                  value={notificationForm.budgetAlertEnabled}
                  onValueChange={value => updateNotificationField('budgetAlertEnabled', value)}
                />
                <NotificationToggleRow
                  title="Tips DSS mingguan"
                  iconName="bulb-outline"
                  value={notificationForm.dssTipsEnabled}
                  onValueChange={value => updateNotificationField('dssTipsEnabled', value)}
                />

                <View className="mt-3 rounded-xl border border-neutral-200 p-3">
                  <Text className="text-sm font-medium text-neutral-700">Jam tenang mulai</Text>
                  <View className="mt-2 flex-row items-center gap-2">
                    <TouchableOpacity
                      activeOpacity={0.85}
                      className="flex-1 rounded-lg border border-neutral-300 px-3 py-2.5"
                      onPress={() => openQuietHoursPicker('quietHoursStart')}
                    >
                      <Text className="text-sm text-neutral-900">
                        {notificationForm.quietHoursStart ?? 'Belum diatur'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      className="rounded-lg border border-neutral-300 px-3 py-2.5"
                      onPress={() => updateNotificationField('quietHoursStart', null)}
                    >
                      <Text className="text-xs font-semibold text-neutral-600">Kosongkan</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="mt-2 rounded-xl border border-neutral-200 p-3">
                  <Text className="text-sm font-medium text-neutral-700">Jam tenang selesai</Text>
                  <View className="mt-2 flex-row items-center gap-2">
                    <TouchableOpacity
                      activeOpacity={0.85}
                      className="flex-1 rounded-lg border border-neutral-300 px-3 py-2.5"
                      onPress={() => openQuietHoursPicker('quietHoursEnd')}
                    >
                      <Text className="text-sm text-neutral-900">
                        {notificationForm.quietHoursEnd ?? 'Belum diatur'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      className="rounded-lg border border-neutral-300 px-3 py-2.5"
                      onPress={() => updateNotificationField('quietHoursEnd', null)}
                    >
                      <Text className="text-xs font-semibold text-neutral-600">Kosongkan</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="mt-2 rounded-xl border border-neutral-200 p-3">
                  <Text className="mb-1 text-sm font-medium text-neutral-700">Timezone</Text>
                  <TextInput
                    value={notificationForm.timezone}
                    onChangeText={value => updateNotificationField('timezone', value)}
                    placeholder="Asia/Jakarta"
                    placeholderTextColor="#a3a3a3"
                    className="rounded-lg border border-neutral-300 px-3 py-2.5 text-sm text-neutral-900"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {notificationError ? (
                  <Text className="mt-2 text-sm text-red-700">{notificationError}</Text>
                ) : null}

                <TouchableOpacity
                  activeOpacity={0.85}
                  className={`mt-3 h-11 items-center justify-center rounded-xl ${
                    isNotificationSaving ? 'bg-blue-500' : 'bg-blue-700'
                  }`}
                  disabled={isNotificationSaving}
                  onPress={saveNotificationSettings}
                >
                  {isNotificationSaving ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text className="text-sm font-semibold text-white">Simpan notifikasi</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </FadeInView>

        <FadeInView delay={180}>
          <View className="rounded-xl border border-neutral-200 bg-white px-3">
            <Text className="pb-1 pt-2 text-sm font-semibold text-neutral-500">
              Privasi & data
            </Text>
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
        </FadeInView>

        <FadeInView delay={230}>
          <TouchableOpacity
            activeOpacity={0.85}
            className="h-14 items-center justify-center rounded-xl border border-red-200 bg-red-50"
            onPress={logout}
          >
            <Text className="text-lg font-semibold text-red-700">Keluar</Text>
          </TouchableOpacity>
        </FadeInView>
      </ScrollView>

      {Platform.OS === 'ios' ? (
        <Modal
          visible={showNotificationIOSPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowNotificationIOSPicker(false)}
        >
          <View className="flex-1 justify-end bg-black/35">
            <FadeInView delay={40} offset={20}>
              <View className="rounded-t-3xl bg-white px-5 pb-7 pt-5">
                <View className="mb-3 h-1.5 w-14 self-center rounded-full bg-neutral-300" />
                <Text className="text-lg font-semibold text-neutral-900">
                  Pilih jam tenang
                </Text>

                <DateTimePicker
                  value={notificationPickerDate}
                  mode="time"
                  display="spinner"
                  is24Hour
                  onChange={(event, selectedDate) => {
                    if (event.type === 'set' && selectedDate) {
                      setNotificationPickerDate(selectedDate);
                    }
                  }}
                />

                <View className="mt-2 flex-row gap-2">
                  <TouchableOpacity
                    activeOpacity={0.85}
                    className="h-12 flex-1 items-center justify-center rounded-xl border border-neutral-300"
                    onPress={() => {
                      setShowNotificationIOSPicker(false);
                      setNotificationPickerField(null);
                    }}
                  >
                    <Text className="text-base font-semibold text-neutral-700">Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    className="h-12 flex-1 items-center justify-center rounded-xl bg-blue-700"
                    onPress={applyIOSQuietHoursPicker}
                  >
                    <Text className="text-base font-semibold text-white">Pakai</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </FadeInView>
          </View>
        </Modal>
      ) : null}

      <MainTabBar activeRoute={MAIN_ROUTES.SETTINGS} />
    </SafeAreaView>
  );
}
