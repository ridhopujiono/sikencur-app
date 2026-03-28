import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import Animated, {
  FadeInDown,
  FadeInUp,
  LinearTransition,
} from 'react-native-reanimated';
import MainTabBar from '../../components/main/MainTabBar';
import { MAIN_ROUTES } from '../../navigation/routes';
import { useDssProfile } from '../../hooks/useDssProfile';
import { useAnalyzeDssProfile } from '../../hooks/useAnalyzeDssProfile';

const PROFILE_BADGE_CLASS = {
  saver: 'bg-emerald-100 text-emerald-700',
  spender: 'bg-red-100 text-red-700',
  investor: 'bg-violet-100 text-violet-700',
  debtor: 'bg-amber-100 text-amber-700',
  balanced: 'bg-blue-100 text-blue-700',
};

const FEATURE_CONFIG = [
  {
    key: 'monthly_burn_rate',
    label: 'Monthly Burn Rate',
    colorClass: 'bg-blue-700',
    textColorClass: 'text-blue-700',
    icon: 'pulse-outline',
  },
  {
    key: 'discretionary_ratio',
    label: 'Discretionary Ratio',
    colorClass: 'bg-amber-600',
    textColorClass: 'text-amber-700',
    icon: 'pie-chart-outline',
  },
  {
    key: 'budget_adherence',
    label: 'Budget Adherence',
    colorClass: 'bg-emerald-600',
    textColorClass: 'text-emerald-700',
    icon: 'shield-checkmark-outline',
  },
];

const CARD_SHADOW_STYLE = {
  shadowColor: '#0f172a',
  shadowOpacity: 0.05,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 10 },
  elevation: 4,
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function parseDate(value) {
  if (!value || typeof value !== 'string') return null;
  const normalized = value.includes(' ') ? value.replace(' ', 'T') : value;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateTime(value) {
  const parsed = parseDate(value);
  if (!parsed) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
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

function formatFeatureValue(featureKey, rawValue) {
  const numericValue = toFeatureNumber(rawValue);
  if (numericValue == null) return null;

  if (featureKey === 'discretionary_ratio' || featureKey === 'budget_adherence') {
    const normalizedPercent = numericValue <= 1 ? numericValue * 100 : numericValue;
    return {
      valueLabel: `${normalizedPercent.toFixed(1)}%`,
      progress: clamp(normalizedPercent, 0, 100),
    };
  }

  return {
    valueLabel: new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 2,
    }).format(numericValue),
    progress: null,
  };
}

function getErrorMessage(error) {
  if (typeof error === 'string') return error;
  if (error?.data?.message) return error.data.message;
  if (error?.message) return error.message;
  return 'Tidak dapat memuat profil DSS. Periksa koneksi Anda.';
}

export default function DSSProfileScreen() {
  const profileQuery = useDssProfile();
  const analyzeMutation = useAnalyzeDssProfile();

  const profileResponse = profileQuery.data;
  const profileData = profileResponse?.data ?? null;
  const isStale = Boolean(profileResponse?.is_stale);
  const analyzeRequired = Boolean(profileResponse?.analyze_required);
  const shouldShowAnalyze = isStale || analyzeRequired || !profileData;

  const featureRows = useMemo(() => {
    if (!profileData?.features || typeof profileData.features !== 'object') {
      return [];
    }

    return FEATURE_CONFIG.map(item => {
      const rawValue = profileData.features[item.key];
      const formatted = formatFeatureValue(item.key, rawValue);

      return {
        ...item,
        ...formatted,
      };
    }).filter(item => item.valueLabel != null);
  }, [profileData]);

  const analyzeNow = async () => {
    try {
      await analyzeMutation.mutateAsync({ window_months: 6 });
      await profileQuery.refetch();
    } catch {
      // Error is displayed in UI through analyzeMutation.error.
    }
  };

  const isScreenLoading = profileQuery.isLoading && !profileData;
  const hasQueryError = profileQuery.isError && !profileData;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-neutral-50">
      <View className="border-b border-neutral-200 bg-neutral-50 px-5 pb-4 pt-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-[24px] font-semibold text-neutral-900">
              Profil keuangan
            </Text>
            <Text className="mt-1 text-sm text-neutral-500">
              Insight DSS untuk kebiasaan belanja dan kedisiplinan budget.
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.88}
            className="flex-row items-center rounded-full bg-white px-3.5 py-2"
            style={CARD_SHADOW_STYLE}
            onPress={() => profileQuery.refetch()}
          >
            {profileQuery.isFetching ? (
              <ActivityIndicator color="#1d4ed8" size="small" />
            ) : (
              <Ionicons name="refresh-outline" size={16} color="#1d4ed8" />
            )}
            <Text className="ml-2 text-sm font-semibold text-blue-700">
              {profileQuery.isFetching ? 'Memuat' : 'Refresh'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5 py-4"
        contentContainerClassName="gap-3 pb-28"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={profileQuery.isFetching && !isScreenLoading}
            onRefresh={() => profileQuery.refetch()}
            tintColor="#1d4ed8"
            colors={['#1d4ed8']}
          />
        }
      >
        {isScreenLoading ? (
          <Animated.View
            entering={FadeInDown.duration(260)}
            className="items-center rounded-[26px] border border-neutral-200 bg-white p-7"
            style={CARD_SHADOW_STYLE}
          >
            <ActivityIndicator color="#1d4ed8" size="large" />
            <Text className="mt-3 text-sm text-neutral-500">Memuat profil DSS...</Text>
          </Animated.View>
        ) : null}

        {hasQueryError ? (
          <Animated.View
            entering={FadeInDown.duration(260)}
            className="rounded-[26px] border border-red-200 bg-white p-4"
            style={CARD_SHADOW_STYLE}
          >
            <View className="flex-row items-start">
              <View className="mr-3 mt-0.5 h-10 w-10 items-center justify-center rounded-full bg-red-50">
                <Ionicons name="alert-circle-outline" size={22} color="#dc2626" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-red-700">
                  Gagal memuat profil
                </Text>
                <Text className="mt-1 text-sm text-red-600">
                  {getErrorMessage(profileQuery.error)}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.88}
                  className="mt-4 self-start rounded-full bg-red-600 px-4 py-2"
                  onPress={() => profileQuery.refetch()}
                >
                  <Text className="text-xs font-semibold text-white">Coba lagi</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        ) : null}

        {!isScreenLoading && !hasQueryError && !profileData ? (
          <Animated.View
            entering={FadeInDown.duration(260)}
            className="rounded-[26px] border border-neutral-200 bg-white p-5"
            style={CARD_SHADOW_STYLE}
          >
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100">
              <Ionicons name="sparkles-outline" size={22} color="#525252" />
            </View>
            <Text className="mt-4 text-lg font-semibold text-neutral-900">
              Profil DSS belum tersedia
            </Text>
            <Text className="mt-1 text-sm leading-5 text-neutral-500">
              Jalankan analisa pertama untuk memunculkan profil dan insight otomatis.
            </Text>
          </Animated.View>
        ) : null}

        {shouldShowAnalyze ? (
          <Animated.View
            entering={FadeInUp.delay(70).duration(280)}
            layout={LinearTransition.duration(220)}
            className="overflow-hidden rounded-[28px] bg-blue-700 p-5"
          >
            <View className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/10" />
            <View className="absolute -bottom-10 left-8 h-24 w-24 rounded-full bg-blue-400/25" />
            <Text className="text-xs font-semibold uppercase tracking-[1px] text-blue-100">
              DSS Update
            </Text>
            <Text className="mt-2 text-xl font-semibold text-white">
              {analyzeRequired
                ? 'Profil perlu dianalisa ulang'
                : isStale
                  ? 'Profil sudah kedaluwarsa'
                  : 'Buat profil pertama Anda'}
            </Text>
            <Text className="mt-2 text-sm leading-6 text-blue-100">
              {analyzeRequired
                ? 'Ada data transaksi baru. Jalankan ulang analisa supaya insight tetap relevan.'
                : isStale
                  ? 'Refresh profil agar pola finansial terbaru ikut terbaca.'
                  : 'DSS akan membaca pola transaksi untuk menampilkan profil keuangan Anda.'}
            </Text>
            <TouchableOpacity
              activeOpacity={0.9}
              className={`mt-5 h-12 items-center justify-center rounded-2xl ${
                analyzeMutation.isPending ? 'bg-white/30' : 'bg-white'
              }`}
              disabled={analyzeMutation.isPending}
              onPress={analyzeNow}
            >
              {analyzeMutation.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-base font-semibold text-blue-700">
                  Analyze Sekarang
                </Text>
              )}
            </TouchableOpacity>
            {analyzeMutation.isError ? (
              <Text className="mt-3 text-sm text-red-100">
                {getErrorMessage(analyzeMutation.error)}
              </Text>
            ) : null}
          </Animated.View>
        ) : null}

        {profileData ? (
          <>
            <Animated.View
              entering={FadeInUp.delay(110).duration(300)}
              layout={LinearTransition.duration(220)}
              className="overflow-hidden rounded-[28px] bg-white px-5 pb-5 pt-4"
              style={CARD_SHADOW_STYLE}
            >
              <View className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-blue-100" />
              <Text className="text-xs font-semibold uppercase tracking-[1px] text-neutral-400">
                DSS Persona
              </Text>

              <View className="mt-4 flex-row items-center">
                <View className="h-24 w-24 items-center justify-center rounded-full border-[10px] border-blue-100 bg-white">
                  <Ionicons name="analytics-outline" size={30} color="#1d4ed8" />
                </View>
                <View className="ml-4 flex-1">
                  <Text
                    className={`self-start rounded-full px-4 py-1.5 text-sm font-semibold ${
                      PROFILE_BADGE_CLASS[profileData.profile_key] ??
                      'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {profileData.profile_label}
                  </Text>
                  <Text className="mt-3 text-sm text-neutral-500">
                    Confidence {formatConfidence(profileData.confidence)}
                  </Text>
                  <Text className="mt-1 text-sm text-neutral-500">
                    Window {profileData.window_months} bulan
                  </Text>
                  <Text className="mt-1 text-sm text-neutral-500">
                    Dianalisis {formatDateTime(profileData.analyzed_at)}
                  </Text>
                </View>
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInUp.delay(150).duration(300)}
              layout={LinearTransition.duration(220)}
              className="rounded-[26px] border border-neutral-200 bg-white p-4"
              style={CARD_SHADOW_STYLE}
            >
              <Text className="mb-3 text-base font-semibold text-neutral-900">
                Fitur utama
              </Text>
              {featureRows.length === 0 ? (
                <Text className="text-sm text-neutral-500">Fitur utama belum tersedia.</Text>
              ) : (
                <View className="gap-3">
                  {featureRows.map(feature => (
                    <View
                      key={feature.key}
                      className="rounded-2xl bg-neutral-50 px-3.5 py-3"
                    >
                      <View className="mb-2 flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <View className="mr-2 h-9 w-9 items-center justify-center rounded-full bg-white">
                            <Ionicons
                              name={feature.icon}
                              size={18}
                              color="#334155"
                            />
                          </View>
                          <Text className="text-sm font-medium text-neutral-700">
                            {feature.label}
                          </Text>
                        </View>
                        <Text
                          className={`text-sm font-semibold ${
                            feature.textColorClass ?? 'text-neutral-700'
                          }`}
                        >
                          {feature.valueLabel}
                        </Text>
                      </View>
                      {feature.progress != null ? (
                        <View className="h-2.5 overflow-hidden rounded-full bg-neutral-200">
                          <View
                            className={`h-full rounded-full ${
                              feature.colorClass ?? 'bg-blue-700'
                            }`}
                            style={{ width: `${feature.progress}%` }}
                          />
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}
            </Animated.View>

            <Animated.View
              entering={FadeInUp.delay(190).duration(300)}
              layout={LinearTransition.duration(220)}
              className="rounded-[26px] border border-neutral-200 bg-white p-4"
              style={CARD_SHADOW_STYLE}
            >
              <Text className="mb-2 text-base font-semibold text-neutral-900">
                Alasan profil
              </Text>
              {Array.isArray(profileData.reasons) && profileData.reasons.length > 0 ? (
                profileData.reasons.map((reason, index) => (
                  <View
                    key={`${reason}-${index}`}
                    className="flex-row rounded-2xl bg-neutral-50 px-3 py-3 mb-2 last:mb-0"
                  >
                    <View className="mr-3 mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                      <Ionicons name="checkmark" size={14} color="#1d4ed8" />
                    </View>
                    <Text className="flex-1 text-sm leading-6 text-neutral-600">{reason}</Text>
                  </View>
                ))
              ) : (
                <Text className="text-sm text-neutral-500">
                  Belum ada alasan yang tersedia.
                </Text>
              )}
            </Animated.View>
          </>
        ) : null}
      </ScrollView>

      <MainTabBar activeRoute={MAIN_ROUTES.DSS} />
    </SafeAreaView>
  );
}
