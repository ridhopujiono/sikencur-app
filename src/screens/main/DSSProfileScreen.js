import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FadeInView from '../../components/common/FadeInView';
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
  },
  {
    key: 'discretionary_ratio',
    label: 'Discretionary Ratio',
    colorClass: 'bg-amber-600',
    textColorClass: 'text-amber-700',
  },
  {
    key: 'budget_adherence',
    label: 'Budget Adherence',
    colorClass: 'bg-emerald-600',
    textColorClass: 'text-emerald-700',
  },
];

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
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View className="flex-row items-center justify-between border-b border-neutral-200 px-5 pb-3 pt-4">
        <Text className="text-[20px] font-semibold text-neutral-900">Profil keuangan</Text>
        <TouchableOpacity activeOpacity={0.85} onPress={() => profileQuery.refetch()}>
          <Text className="text-sm font-medium text-blue-700">
            {profileQuery.isFetching ? 'Memuat...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-5 py-4"
        contentContainerClassName="gap-2.5 pb-6"
        showsVerticalScrollIndicator={false}
      >
        {isScreenLoading ? (
          <FadeInView delay={30}>
            <View className="items-center rounded-xl border border-neutral-200 bg-white p-6">
              <ActivityIndicator color="#1d4ed8" size="large" />
              <Text className="mt-3 text-sm text-neutral-500">Memuat profil DSS...</Text>
            </View>
          </FadeInView>
        ) : null}

        {hasQueryError ? (
          <FadeInView delay={50}>
            <View className="rounded-xl border border-red-200 bg-red-50 p-4">
              <Text className="text-base font-semibold text-red-700">Gagal memuat profil</Text>
              <Text className="mt-1 text-sm text-red-600">
                {getErrorMessage(profileQuery.error)}
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                className="mt-3 self-start rounded-full bg-red-600 px-3 py-1.5"
                onPress={() => profileQuery.refetch()}
              >
                <Text className="text-xs font-semibold text-white">Coba lagi</Text>
              </TouchableOpacity>
            </View>
          </FadeInView>
        ) : null}

        {!isScreenLoading && !hasQueryError && !profileData ? (
          <FadeInView delay={70}>
            <View className="rounded-xl border border-neutral-200 bg-white p-4">
              <Text className="text-base font-semibold text-neutral-900">
                Profil DSS belum tersedia
              </Text>
              <Text className="mt-1 text-sm text-neutral-500">
                Jalankan analisa agar profil keuangan dan insight muncul.
              </Text>
            </View>
          </FadeInView>
        ) : null}

        {shouldShowAnalyze ? (
          <FadeInView delay={110}>
            <View className="rounded-xl bg-neutral-100 p-4">
              <Text className="text-sm text-neutral-700">
                {analyzeRequired
                  ? 'Profil perlu dianalisa ulang karena ada data transaksi baru.'
                  : isStale
                    ? 'Profil DSS Anda sudah kedaluwarsa dan perlu diperbarui.'
                    : 'Jalankan analisa untuk membuat profil pertama Anda.'}
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                className={`mt-3 h-12 items-center justify-center rounded-xl ${
                  analyzeMutation.isPending ? 'bg-blue-500' : 'bg-blue-700'
                }`}
                disabled={analyzeMutation.isPending}
                onPress={analyzeNow}
              >
                {analyzeMutation.isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-base font-semibold text-white">Analyze Sekarang</Text>
                )}
              </TouchableOpacity>
              {analyzeMutation.isError ? (
                <Text className="mt-2 text-sm text-red-700">
                  {getErrorMessage(analyzeMutation.error)}
                </Text>
              ) : null}
            </View>
          </FadeInView>
        ) : null}

        {profileData ? (
          <>
            <FadeInView delay={160}>
              <View className="items-center rounded-xl bg-neutral-100 p-5">
                <View className="h-28 w-28 items-center justify-center rounded-full border-[8px] border-blue-700">
                  <Text className="px-2 text-center text-base font-semibold text-neutral-900">
                    {profileData.profile_label}
                  </Text>
                </View>
                <Text
                  className={`mt-3 rounded-full px-4 py-1.5 text-sm font-semibold ${
                    PROFILE_BADGE_CLASS[profileData.profile_key] ?? 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {profileData.profile_label}
                </Text>
                <Text className="mt-2 text-sm text-neutral-500">
                  Confidence {formatConfidence(profileData.confidence)} · Window{' '}
                  {profileData.window_months} bulan
                </Text>
                <Text className="text-sm text-neutral-500">
                  Dianalisis {formatDateTime(profileData.analyzed_at)}
                </Text>
              </View>
            </FadeInView>

            <FadeInView delay={210}>
              <View className="rounded-xl border border-neutral-200 bg-white p-4">
                <Text className="mb-2 text-base font-medium text-neutral-600">Fitur utama</Text>
                {featureRows.length === 0 ? (
                  <Text className="text-sm text-neutral-500">Fitur utama belum tersedia.</Text>
                ) : (
                  <View className="gap-2">
                    {featureRows.map(feature => (
                      <View key={feature.key}>
                        <View className="mb-1 flex-row items-center justify-between">
                          <Text className="text-sm text-neutral-600">{feature.label}</Text>
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
              </View>
            </FadeInView>

            <FadeInView delay={260}>
              <View className="rounded-xl border border-neutral-200 bg-white p-4">
                <Text className="mb-1 text-base font-medium text-neutral-600">Alasan profil</Text>
                {Array.isArray(profileData.reasons) && profileData.reasons.length > 0 ? (
                  profileData.reasons.map((reason, index) => (
                    <View key={`${reason}-${index}`} className="flex-row py-1.5">
                      <Text className="mr-2 text-sm text-blue-700">•</Text>
                      <Text className="flex-1 text-sm leading-6 text-neutral-600">
                        {reason}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text className="text-sm text-neutral-500">
                    Belum ada alasan yang tersedia.
                  </Text>
                )}
              </View>
            </FadeInView>
          </>
        ) : null}
      </ScrollView>

      <MainTabBar activeRoute={MAIN_ROUTES.DSS} />
    </SafeAreaView>
  );
}
