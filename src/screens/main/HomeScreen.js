import React, { useCallback, useContext, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import FadeInView from '../../components/common/FadeInView';
import MainTabBar from '../../components/main/MainTabBar';
import { MAIN_ROUTES } from '../../navigation/routes';
import { USER_PROFILE } from '../../utils/dummyData';
import { getTransactionSummary } from '../../api/transactions';
import { getDssProfile } from '../../services/dssApi';

const CATEGORY_COLOR_POOL = ['bg-emerald-600', 'bg-blue-700', 'bg-amber-600', 'bg-red-600'];
const MONTH_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  month: 'long',
  year: 'numeric',
});
const DSS_PROFILE_BADGE_CLASS = {
  saver: 'bg-emerald-100 text-emerald-700',
  spender: 'bg-red-100 text-red-700',
  investor: 'bg-violet-100 text-violet-700',
  debtor: 'bg-amber-100 text-amber-700',
  balanced: 'bg-blue-100 text-blue-700',
};

function formatCurrency(value) {
  const numericValue = Number(value ?? 0);
  if (Number.isNaN(numericValue)) return 'Rp 0';

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function toNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function getErrorMessage(error) {
  if (typeof error === 'string') return error;
  if (error?.data?.message) return error.data.message;
  if (error?.message) return error.message;
  return 'Gagal memuat ringkasan beranda.';
}

function getDssErrorMessage(error) {
  if (typeof error === 'string') return error;
  if (error?.data?.message) return error.data.message;
  if (error?.message) return error.message;
  return 'Gagal memuat profil DSS.';
}

function getMonthYearLabel(month, year) {
  return MONTH_FORMATTER.format(new Date(year, month - 1, 1));
}

function getPreviousMonthName(month, year) {
  const date = new Date(year, month - 2, 1);
  return new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(date);
}

function buildComparisonLabel(comparison, period) {
  const rawLabel = comparison?.label;
  if (!rawLabel) return '0% dari bulan lalu';

  if (rawLabel === 'baru') {
    return 'Baru dibanding bulan lalu';
  }

  const previousMonthName = getPreviousMonthName(period?.month ?? 1, period?.year ?? 1970);
  return `${rawLabel} dari ${previousMonthName}`;
}

function formatConfidence(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return '-';
  const normalized = numericValue <= 1 ? numericValue * 100 : numericValue;
  return `${normalized.toFixed(1)}%`;
}

function toFeatureNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toPercent(value) {
  const numeric = toFeatureNumber(value);
  if (numeric == null) return null;
  const normalized = numeric <= 1 ? numeric * 100 : numeric;
  return clamp(Math.round(normalized), 0, 100);
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const now = useMemo(() => new Date(), []);
  const [selectedPeriod, setSelectedPeriod] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });

  const [summaryData, setSummaryData] = useState(null);
  const [dssProfileResponse, setDssProfileResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [dssErrorMessage, setDssErrorMessage] = useState(null);

  const fetchSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      setDssErrorMessage(null);

      const [summaryResult, dssResult] = await Promise.allSettled([
        getTransactionSummary({
          month: selectedPeriod.month,
          year: selectedPeriod.year,
          top_categories: 4,
          scan_status: 'completed',
        }),
        getDssProfile(),
      ]);

      if (summaryResult.status === 'rejected') {
        throw summaryResult.reason;
      }

      setSummaryData(summaryResult.value);

      if (dssResult.status === 'fulfilled') {
        setDssProfileResponse(dssResult.value);
      } else {
        setDssErrorMessage(getDssErrorMessage(dssResult.reason));
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod.month, selectedPeriod.year]);

  useFocusEffect(
    useCallback(() => {
      fetchSummary();
    }, [fetchSummary]),
  );

  const displayName = user?.name ?? USER_PROFILE.name;
  const firstName = displayName.split(' ')[0];
  const initials = useMemo(() => {
    if (!displayName) return USER_PROFILE.initials;

    const parts = displayName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return USER_PROFILE.initials;
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }, [displayName]);

  const isCurrentMonth =
    selectedPeriod.month === now.getMonth() + 1 &&
    selectedPeriod.year === now.getFullYear();
  const selectedPeriodLabel = getMonthYearLabel(selectedPeriod.month, selectedPeriod.year);
  const changeMonth = delta => {
    setSelectedPeriod(previous => {
      const shiftedDate = new Date(previous.year, previous.month - 1 + delta, 1);
      return {
        month: shiftedDate.getMonth() + 1,
        year: shiftedDate.getFullYear(),
      };
    });
  };

  const period = summaryData?.period ?? null;
  const summary = summaryData?.summary ?? null;
  const budget = summaryData?.budget ?? null;
  const receiptScans = summaryData?.receipt_scans ?? null;
  const sevenDayExpense = useMemo(
    () =>
      Array.isArray(summaryData?.seven_day_expense)
        ? summaryData.seven_day_expense
        : [],
    [summaryData?.seven_day_expense],
  );
  const topCategories = useMemo(
    () =>
      Array.isArray(summaryData?.top_categories)
        ? summaryData.top_categories
        : [],
    [summaryData?.top_categories],
  );

  const totalExpense = toNumber(summary?.total_expense, 0);
  const hasBudget = budget != null && typeof budget === 'object';
  const budgetRemaining = hasBudget ? toNumber(budget?.remaining, 0) : 0;
  const budgetUsedPercent = hasBudget ? toNumber(budget?.used_percent, 0) : 0;
  const targetRemaining = hasBudget ? budget?.target_remaining : null;
  const isTargetOnTrack = hasBudget ? budget?.target_on_track : null;
  const normalizedBudgetBar = clamp(budgetUsedPercent, 0, 100);
  const comparisonText = buildComparisonLabel(summary?.comparison, period);
  const comparisonDirection = summary?.comparison?.direction;
  const comparisonClass =
    comparisonDirection === 'down'
      ? 'text-emerald-700'
      : comparisonDirection === 'up'
        ? 'text-red-700'
        : 'text-neutral-600';

  const sevenDayMaxTotal = useMemo(() => {
    const totals = sevenDayExpense.map(item => toNumber(item?.total, 0));
    const max = Math.max(...totals, 0);
    return max;
  }, [sevenDayExpense]);

  const dssProfile = dssProfileResponse?.data ?? null;
  const dssAnalyzeRequired = Boolean(dssProfileResponse?.analyze_required);
  const dssIsStale = Boolean(dssProfileResponse?.is_stale);
  const dssBadgeClass =
    DSS_PROFILE_BADGE_CLASS[dssProfile?.profile_key] ?? 'bg-neutral-200 text-neutral-700';
  const dssBudgetAdherencePercent = toPercent(dssProfile?.features?.budget_adherence);
  const dssConfidenceLabel = formatConfidence(dssProfile?.confidence);
  const dssSubtitle = dssProfile
    ? `Window ${dssProfile.window_months} bulan · ${dssConfidenceLabel} conf.`
    : dssAnalyzeRequired || dssIsStale
      ? 'Profil perlu dianalisa ulang'
      : dssErrorMessage
        ? dssErrorMessage
        : 'Belum ada profil, lakukan analisa DSS';

  const weeklyBars = sevenDayExpense.map((item, index) => {
    const total = toNumber(item?.total, 0);
    const ratio = sevenDayMaxTotal > 0 ? total / sevenDayMaxTotal : 0;
    const minHeight = total > 0 ? 16 : 8;
    const heightPercent = Math.max(minHeight, Math.round(ratio * 100));

    return {
      day: item?.day_label ?? '-',
      value: clamp(heightPercent, 8, 100),
      highlighted: index === sevenDayExpense.length - 1,
    };
  });

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View className="border-b border-neutral-200 px-5 pb-3 pt-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[17px] font-semibold text-neutral-900">
              Selamat pagi, {firstName}
            </Text>
            <View className="mt-1 flex-row items-center gap-2">
              <TouchableOpacity
                activeOpacity={0.85}
                className="h-6 w-6 items-center justify-center rounded-full bg-neutral-200"
                onPress={() => changeMonth(-1)}
              >
                <Text className="text-xs font-semibold text-neutral-700">‹</Text>
              </TouchableOpacity>
              <Text className="text-xs text-neutral-500">
                {period?.label ?? selectedPeriodLabel}
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                className={`h-6 w-6 items-center justify-center rounded-full ${
                  isCurrentMonth ? 'bg-neutral-100' : 'bg-neutral-200'
                }`}
                disabled={isCurrentMonth}
                onPress={() => changeMonth(1)}
              >
                <Text
                  className={`text-xs font-semibold ${
                    isCurrentMonth ? 'text-neutral-300' : 'text-neutral-700'
                  }`}
                >
                  ›
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            className="h-11 w-11 items-center justify-center rounded-full bg-blue-100"
            onPress={() => fetchSummary()}
          >
            {isLoading ? (
              <ActivityIndicator color="#1d4ed8" size="small" />
            ) : (
              <Text className="text-sm font-semibold text-blue-800">{initials}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1">
        <ScrollView
          className="flex-1 px-5 py-4"
          contentContainerClassName="gap-2.5 pb-24"
          showsVerticalScrollIndicator={false}
        >
          {errorMessage ? (
            <FadeInView delay={30}>
              <View className="rounded-xl border border-red-200 bg-red-50 p-4">
                <Text className="text-sm font-semibold text-red-700">Ringkasan gagal dimuat</Text>
                <Text className="mt-1 text-xs text-red-600">{errorMessage}</Text>
              </View>
            </FadeInView>
          ) : null}

          <FadeInView delay={70}>
            <View className="rounded-2xl bg-neutral-100 p-4">
              <Text className="text-sm text-neutral-500">
                Total pengeluaran {period?.label ?? selectedPeriodLabel}
              </Text>
              <Text className="mt-1 text-[30px] font-semibold text-neutral-900">
                {formatCurrency(totalExpense)}
              </Text>
              <Text className={`mt-1.5 text-sm font-medium ${comparisonClass}`}>
                {comparisonText}
              </Text>
            </View>
          </FadeInView>

          <View className="flex-row gap-2">
            <FadeInView delay={120} className="flex-1">
              <View className="flex-1 rounded-2xl bg-neutral-100 p-4">
                <Text className="text-sm text-neutral-500">
                  {hasBudget ? 'Sisa anggaran' : 'Anggaran bulan ini'}
                </Text>
                {hasBudget ? (
                  <>
                    <Text className="mt-1.5 text-[22px] font-semibold text-neutral-900">
                      {formatCurrency(budgetRemaining)}
                    </Text>
                    <View className="mt-3 h-2.5 overflow-hidden rounded-full bg-neutral-300">
                      <View
                        className={`h-full rounded-full ${
                          budgetUsedPercent >= 100 ? 'bg-red-600' : 'bg-blue-700'
                        }`}
                        style={{ width: `${normalizedBudgetBar}%` }}
                      />
                    </View>
                    <Text
                      className={`mt-2 text-xs ${
                        budgetUsedPercent >= 100 ? 'text-red-700' : 'text-neutral-600'
                      }`}
                    >
                      {Math.round(budgetUsedPercent)}% terpakai
                    </Text>
                    {targetRemaining != null ? (
                      <Text
                        className={`mt-1 text-xs ${
                          isTargetOnTrack ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        Target sisa {formatCurrency(targetRemaining)} ·{' '}
                        {isTargetOnTrack ? 'on track' : 'belum on track'}
                      </Text>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Text className="mt-1.5 text-base font-semibold text-neutral-700">
                      Belum diatur
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      className="mt-3 self-start rounded-full bg-blue-700 px-3 py-1.5"
                      onPress={() => navigation.navigate(MAIN_ROUTES.SETTINGS)}
                    >
                      <Text className="text-xs font-semibold text-white">Atur budget</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </FadeInView>

            <FadeInView delay={170} className="flex-1">
              <View className="flex-1 rounded-2xl bg-neutral-100 p-4">
                <Text className="text-sm text-neutral-500">Struk dipindai</Text>
                <Text className="mt-1.5 text-[22px] font-semibold text-neutral-900">
                  {toNumber(receiptScans?.count, 0)}
                </Text>
                <Text className="mt-2.5 text-xs text-neutral-600">scan bulan ini</Text>
              </View>
            </FadeInView>
          </View>

          <FadeInView delay={220}>
            <View className="rounded-2xl bg-neutral-100 p-4">
              <Text className="mb-3 text-base font-medium text-neutral-600">
                Pengeluaran 7 hari
              </Text>
              <View className="h-24 flex-row items-end gap-1">
                {weeklyBars.map(item => (
                  <View key={`${item.day}-${item.value}`} className="flex-1 items-center">
                    <View
                      className={`w-full rounded-t-md ${item.highlighted ? 'bg-blue-700' : 'bg-blue-200'}`}
                      style={{ height: `${item.value}%` }}
                    />
                    <Text
                      className={`mt-1 text-sm ${
                        item.highlighted ? 'font-semibold text-blue-700' : 'text-neutral-500'
                      }`}
                    >
                      {item.day}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </FadeInView>

          <FadeInView delay={270}>
            <View className="rounded-2xl bg-neutral-100 p-4">
              <Text className="mb-2 text-base font-medium text-neutral-600">
                Kategori terbesar
              </Text>
              {topCategories.length === 0 ? (
                <Text className="text-sm text-neutral-500">
                  Belum ada data kategori bulan ini.
                </Text>
              ) : (
                topCategories.map((item, index) => {
                  const colorClass = CATEGORY_COLOR_POOL[index] ?? 'bg-neutral-600';
                  const percentage = clamp(Math.round(toNumber(item?.percentage, 0)), 0, 100);

                  return (
                    <View key={`${item?.category}-${index}`} className="mb-3">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2">
                          <View className={`h-3 w-3 rounded-full ${colorClass}`} />
                          <Text className="text-lg text-neutral-900">
                            {item?.category || 'Tanpa Kategori'}
                          </Text>
                        </View>
                        <Text className="text-lg font-semibold text-neutral-600">
                          {percentage}%
                        </Text>
                      </View>
                      <View className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-neutral-300">
                        <View
                          className={`h-full rounded-full ${colorClass}`}
                          style={{ width: `${Math.max(percentage, 4)}%` }}
                        />
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </FadeInView>

          <FadeInView delay={320}>
            <TouchableOpacity
              activeOpacity={0.85}
              className="rounded-2xl bg-neutral-100 p-4"
              onPress={() => navigation.navigate(MAIN_ROUTES.DSS)}
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-base font-medium text-neutral-600">
                    Profil DSS keuangan
                  </Text>
                  <View className="mt-3 flex-row items-center gap-2">
                    <Text
                      className={`rounded-full px-4 py-1.5 text-sm font-semibold ${dssBadgeClass}`}
                    >
                      {dssProfile?.profile_label || 'Belum dianalisa'}
                    </Text>
                    <Text className="text-base text-neutral-500">{dssSubtitle}</Text>
                  </View>
                </View>
                <Text className="text-2xl text-neutral-400">›</Text>
              </View>
              <View className="mt-4 h-2.5 overflow-hidden rounded-full bg-neutral-300">
                <View
                  className={`h-full rounded-full ${
                    dssBudgetAdherencePercent != null ? 'bg-emerald-600' : 'bg-neutral-400'
                  }`}
                  style={{ width: `${Math.max(dssBudgetAdherencePercent ?? 8, 8)}%` }}
                />
              </View>
              <Text className="mt-1.5 text-sm text-neutral-500">
                {dssBudgetAdherencePercent != null
                  ? `Kepatuhan anggaran ${dssBudgetAdherencePercent}%`
                  : 'Kepatuhan anggaran belum tersedia'}
              </Text>
              {dssAnalyzeRequired || dssIsStale ? (
                <Text className="mt-1 text-xs text-amber-700">
                  Profil DSS perlu diperbarui, tap kartu ini untuk analyze.
                </Text>
              ) : null}
            </TouchableOpacity>
          </FadeInView>
        </ScrollView>

      </View>

      <MainTabBar activeRoute={MAIN_ROUTES.HOME} />
    </SafeAreaView>
  );
}
