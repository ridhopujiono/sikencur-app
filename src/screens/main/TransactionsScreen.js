import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  LayoutAnimation,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import MainTabBar from '../../components/main/MainTabBar';
import { MAIN_ROUTES } from '../../navigation/routes';
import { getTransactionTotal, listTransactions } from '../../api/transactions';

const MONTH_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  month: 'long',
  year: 'numeric',
});

const TRANSACTION_TYPE_FILTERS = [
  { label: 'Semua', value: 'all', icon: 'apps-outline' },
  { label: 'Pengeluaran', value: 'expense', icon: 'arrow-down-circle-outline' },
  { label: 'Pemasukan', value: 'income', icon: 'arrow-up-circle-outline' },
];

const CATEGORY_FILTERS = [
  'Makanan & Minuman',
  'Transportasi',
  'Belanja',
  'Tagihan & Utilitas',
  'Tempat Tinggal',
  'Rumah Tangga',
  'Kesehatan',
  'Pendidikan',
  'Hiburan',
  'Komunikasi',
  'Asuransi',
  'Cicilan & Utang',
  'Pajak',
  'Langganan',
  'Donasi/Zakat',
  'Perawatan Diri',
  'Liburan',
  'Biaya Admin Bank',
  'Gaji',
  'Bonus & THR',
  'Penghasilan Freelance',
  'Penghasilan Usaha',
  'Pendapatan Investasi',
  'Penghasilan Lain',
  'Refund/Pengembalian Dana',
  'Transfer Antar Rekening',
  'Top Up E-Wallet',
  'Lainnya',
];

const BADGE_CLASS = {
  'Makanan & Minuman': 'bg-emerald-100 text-emerald-700',
  Makanan: 'bg-emerald-100 text-emerald-700',
  Transport: 'bg-blue-100 text-blue-700',
  Transportasi: 'bg-blue-100 text-blue-700',
  Hiburan: 'bg-amber-100 text-amber-700',
  Kesehatan: 'bg-red-100 text-red-700',
  Belanja: 'bg-violet-100 text-violet-700',
  Gaji: 'bg-cyan-100 text-cyan-700',
  'Bonus & THR': 'bg-cyan-100 text-cyan-700',
  'Penghasilan Freelance': 'bg-cyan-100 text-cyan-700',
  'Pendapatan Investasi': 'bg-cyan-100 text-cyan-700',
  Lainnya: 'bg-neutral-100 text-neutral-700',
};

const CATEGORY_META = {
  'Makanan & Minuman': {
    icon: 'restaurant-outline',
    iconColor: '#047857',
    iconBackground: '#d1fae5',
  },
  Transportasi: {
    icon: 'car-sport-outline',
    iconColor: '#1d4ed8',
    iconBackground: '#dbeafe',
  },
  Belanja: {
    icon: 'bag-handle-outline',
    iconColor: '#7c3aed',
    iconBackground: '#ede9fe',
  },
  'Tagihan & Utilitas': {
    icon: 'flash-outline',
    iconColor: '#b45309',
    iconBackground: '#fef3c7',
  },
  'Tempat Tinggal': {
    icon: 'home-outline',
    iconColor: '#334155',
    iconBackground: '#e2e8f0',
  },
  'Rumah Tangga': {
    icon: 'cube-outline',
    iconColor: '#0f766e',
    iconBackground: '#ccfbf1',
  },
  Kesehatan: {
    icon: 'medkit-outline',
    iconColor: '#dc2626',
    iconBackground: '#fee2e2',
  },
  Pendidikan: {
    icon: 'school-outline',
    iconColor: '#2563eb',
    iconBackground: '#dbeafe',
  },
  Hiburan: {
    icon: 'game-controller-outline',
    iconColor: '#d97706',
    iconBackground: '#fef3c7',
  },
  Komunikasi: {
    icon: 'chatbubble-ellipses-outline',
    iconColor: '#0891b2',
    iconBackground: '#cffafe',
  },
  Asuransi: {
    icon: 'shield-checkmark-outline',
    iconColor: '#0f766e',
    iconBackground: '#ccfbf1',
  },
  'Cicilan & Utang': {
    icon: 'card-outline',
    iconColor: '#92400e',
    iconBackground: '#fef3c7',
  },
  Pajak: {
    icon: 'receipt-outline',
    iconColor: '#475569',
    iconBackground: '#e2e8f0',
  },
  Langganan: {
    icon: 'repeat-outline',
    iconColor: '#7c3aed',
    iconBackground: '#ede9fe',
  },
  'Donasi/Zakat': {
    icon: 'heart-outline',
    iconColor: '#db2777',
    iconBackground: '#fce7f3',
  },
  'Perawatan Diri': {
    icon: 'sparkles-outline',
    iconColor: '#c2410c',
    iconBackground: '#ffedd5',
  },
  Liburan: {
    icon: 'airplane-outline',
    iconColor: '#0ea5e9',
    iconBackground: '#e0f2fe',
  },
  'Biaya Admin Bank': {
    icon: 'wallet-outline',
    iconColor: '#1f2937',
    iconBackground: '#e5e7eb',
  },
  Gaji: {
    icon: 'cash-outline',
    iconColor: '#0284c7',
    iconBackground: '#dbeafe',
  },
  'Bonus & THR': {
    icon: 'trophy-outline',
    iconColor: '#0284c7',
    iconBackground: '#dbeafe',
  },
  'Penghasilan Freelance': {
    icon: 'briefcase-outline',
    iconColor: '#0284c7',
    iconBackground: '#dbeafe',
  },
  'Penghasilan Usaha': {
    icon: 'storefront-outline',
    iconColor: '#0284c7',
    iconBackground: '#dbeafe',
  },
  'Pendapatan Investasi': {
    icon: 'trending-up-outline',
    iconColor: '#0284c7',
    iconBackground: '#dbeafe',
  },
  'Penghasilan Lain': {
    icon: 'wallet-outline',
    iconColor: '#0284c7',
    iconBackground: '#dbeafe',
  },
  'Refund/Pengembalian Dana': {
    icon: 'return-up-back-outline',
    iconColor: '#2563eb',
    iconBackground: '#dbeafe',
  },
  'Transfer Antar Rekening': {
    icon: 'swap-horizontal-outline',
    iconColor: '#1d4ed8',
    iconBackground: '#dbeafe',
  },
  'Top Up E-Wallet': {
    icon: 'phone-portrait-outline',
    iconColor: '#1d4ed8',
    iconBackground: '#dbeafe',
  },
  Lainnya: {
    icon: 'ellipse-outline',
    iconColor: '#525252',
    iconBackground: '#f5f5f5',
  },
};

const CARD_SHADOW_STYLE = {
  shadowColor: '#0f172a',
  shadowOpacity: 0.05,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 10 },
  elevation: 4,
};

function animateNextLayout() {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

function formatCurrency(value) {
  const numericValue = Number(value ?? 0);
  if (Number.isNaN(numericValue)) return 'Rp 0';

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function toNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function extractTotalValue(payload) {
  const candidates = [
    payload?.total,
    payload?.data?.total,
    payload?.data?.amount_total,
    payload?.amount_total,
    payload?.value,
    payload?.data?.value,
  ];

  for (const candidate of candidates) {
    const numericCandidate = Number(candidate);
    if (Number.isFinite(numericCandidate)) {
      return numericCandidate;
    }
  }

  return null;
}

function padToTwo(value) {
  return String(value).padStart(2, '0');
}

function getMonthRange(month, year) {
  const endDay = new Date(year, month, 0).getDate();
  const dateFrom = `${year}-${padToTwo(month)}-01`;
  const dateTo = `${year}-${padToTwo(month)}-${padToTwo(endDay)}`;
  return { dateFrom, dateTo };
}

function formatMonthYearLabel(month, year) {
  return MONTH_FORMATTER.format(new Date(year, month - 1, 1));
}

function parseDate(dateString) {
  if (!dateString) return null;
  const normalized = dateString.includes(' ')
    ? dateString.replace(' ', 'T')
    : dateString;
  const parsedDate = new Date(normalized);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatDateLabel(dateString) {
  const date = parseDate(dateString);
  if (!date) return 'Tanggal tidak diketahui';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatTimeLabel(dateString) {
  const date = parseDate(dateString);
  if (!date) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatDateTimeLabel(dateString) {
  const date = parseDate(dateString);
  if (!date) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getErrorMessage(error) {
  if (typeof error === 'string') return error;
  if (error?.data?.message) return error.data.message;
  if (error?.message) return error.message;
  return 'Gagal mengambil data transaksi.';
}

function buildMetaText(transaction) {
  const items = Array.isArray(transaction?.items) ? transaction.items : [];
  const timeLabel = formatTimeLabel(transaction?.transaction_date);
  const inputMethod = transaction?.input_method || '-';
  return `${timeLabel} · ${items.length} item · ${inputMethod}`;
}

function groupTransactions(transactions) {
  const groups = new Map();

  transactions.forEach(transaction => {
    const dateLabel = formatDateLabel(transaction?.transaction_date);

    if (!groups.has(dateLabel)) {
      groups.set(dateLabel, []);
    }

    groups.get(dateLabel).push(transaction);
  });

  return Array.from(groups.entries()).map(([date, items]) => ({ date, items }));
}

function getCategoryMeta(category) {
  return CATEGORY_META[category] ?? CATEGORY_META.Lainnya;
}

function getAmountToneClass(transactionType) {
  if (transactionType === 'income') {
    return 'text-emerald-700';
  }

  return 'text-neutral-900';
}

function FilterChip({ label, icon, isActive, onPress, delay = 0 }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(260)}>
      <TouchableOpacity
        activeOpacity={0.88}
        className={`flex-row items-center rounded-full border px-3.5 py-2 ${
          isActive
            ? 'border-blue-700 bg-blue-700'
            : 'border-neutral-200 bg-white'
        }`}
        onPress={onPress}
      >
        {icon ? (
          <View className="mr-1.5">
            <Ionicons
              name={icon}
              size={15}
              color={isActive ? '#ffffff' : '#525252'}
            />
          </View>
        ) : null}
        <Text
          className={`text-sm ${
            isActive ? 'font-semibold text-white' : 'text-neutral-600'
          }`}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function TransactionsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const now = useMemo(() => new Date(), []);
  const [selectedTransactionType, setSelectedTransactionType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });
  const [transactions, setTransactions] = useState([]);
  const [paginationTotal, setPaginationTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalAmountFromApi, setTotalAmountFromApi] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [loadMoreError, setLoadMoreError] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const detailProgress = useSharedValue(0);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    if (!selectedTransaction) {
      return;
    }

    setIsDetailModalVisible(true);
    detailProgress.value = 0;
    detailProgress.value = withTiming(1, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
  }, [detailProgress, selectedTransaction]);

  const hasMorePages = currentPage < lastPage;

  const buildListParams = useCallback(
    page => {
      const params = {
        page,
        per_page: 20,
        sort_by: 'transaction_date',
        sort_direction: 'desc',
      };
      const { dateFrom, dateTo } = getMonthRange(
        selectedPeriod.month,
        selectedPeriod.year,
      );

      params.date_from = dateFrom;
      params.date_to = dateTo;

      if (selectedCategory) {
        params.category = selectedCategory;
      }
      if (selectedTransactionType !== 'all') {
        params.transaction_type = selectedTransactionType;
      }

      return params;
    },
    [
      selectedCategory,
      selectedPeriod.month,
      selectedPeriod.year,
      selectedTransactionType,
    ],
  );

  const fetchFirstPage = useCallback(
    async ({ refresh = false } = {}) => {
      try {
        if (refresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        setErrorMessage(null);
        setLoadMoreError(null);
        setTotalAmountFromApi(null);

        const listParams = buildListParams(1);
        const totalParams = { ...listParams };
        delete totalParams.page;
        delete totalParams.per_page;
        delete totalParams.sort_by;
        delete totalParams.sort_direction;

        const [transactionsResult, totalResult] = await Promise.allSettled([
          listTransactions(listParams),
          getTransactionTotal(totalParams),
        ]);

        if (transactionsResult.status === 'rejected') {
          throw transactionsResult.reason;
        }

        const transactionResponse = transactionsResult.value;
        const fetchedItems = Array.isArray(transactionResponse?.data)
          ? transactionResponse.data
          : [];

        animateNextLayout();
        setTransactions(fetchedItems);

        const nextCurrentPage = Number.isFinite(Number(transactionResponse?.current_page))
          ? Number(transactionResponse.current_page)
          : 1;
        const nextLastPage = Number.isFinite(Number(transactionResponse?.last_page))
          ? Number(transactionResponse.last_page)
          : nextCurrentPage;

        setCurrentPage(nextCurrentPage);
        setLastPage(nextLastPage);
        setPaginationTotal(
          Number.isFinite(Number(transactionResponse?.total))
            ? Number(transactionResponse.total)
            : 0,
        );

        if (totalResult.status === 'fulfilled') {
          const nextTotalAmount = extractTotalValue(totalResult.value);
          setTotalAmountFromApi(
            Number.isFinite(nextTotalAmount) ? Number(nextTotalAmount) : null,
          );
        }
      } catch (error) {
        animateNextLayout();
        setErrorMessage(getErrorMessage(error));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [buildListParams],
  );

  const fetchNextPage = useCallback(async () => {
    if (isLoadingMore || isLoading || !hasMorePages) {
      return;
    }

    try {
      setIsLoadingMore(true);
      setLoadMoreError(null);

      const nextPage = currentPage + 1;
      const listParams = buildListParams(nextPage);
      const transactionResponse = await listTransactions(listParams);
      const fetchedItems = Array.isArray(transactionResponse?.data)
        ? transactionResponse.data
        : [];

      animateNextLayout();
      setTransactions(previous => {
        const existingIds = new Set(previous.map(item => String(item?.id)));
        const uniqueNextItems = fetchedItems.filter(
          item => !existingIds.has(String(item?.id)),
        );

        return [...previous, ...uniqueNextItems];
      });

      const nextCurrentPage = Number.isFinite(Number(transactionResponse?.current_page))
        ? Number(transactionResponse.current_page)
        : nextPage;
      const nextLastPage = Number.isFinite(Number(transactionResponse?.last_page))
        ? Number(transactionResponse.last_page)
        : nextCurrentPage;

      setCurrentPage(nextCurrentPage);
      setLastPage(nextLastPage);
      setPaginationTotal(
        Number.isFinite(Number(transactionResponse?.total))
          ? Number(transactionResponse.total)
          : paginationTotal,
      );
    } catch (error) {
      setLoadMoreError(getErrorMessage(error));
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    buildListParams,
    currentPage,
    hasMorePages,
    isLoading,
    isLoadingMore,
    paginationTotal,
  ]);

  useFocusEffect(
    useCallback(() => {
      fetchFirstPage();
    }, [fetchFirstPage]),
  );

  const groupedTransactions = useMemo(
    () => groupTransactions(transactions),
    [transactions],
  );

  const localTotalAmount = useMemo(
    () =>
      transactions.reduce((acc, item) => {
        const amount = Number(item?.price_total ?? 0);
        return Number.isNaN(amount) ? acc : acc + amount;
      }, 0),
    [transactions],
  );

  const apiTotalAmount = toNumber(totalAmountFromApi, localTotalAmount);
  const periodLabel = formatMonthYearLabel(selectedPeriod.month, selectedPeriod.year);
  const isCurrentMonth =
    selectedPeriod.month === now.getMonth() + 1 &&
    selectedPeriod.year === now.getFullYear();
  const useLocalAggregateForHeader =
    selectedCategory !== '' || selectedTransactionType !== 'all';
  const displayTransactionCount = paginationTotal;
  const displayTotalAmount = apiTotalAmount;
  const selectedItems = Array.isArray(selectedTransaction?.items)
    ? selectedTransaction.items
    : [];

  const activeFilters = useMemo(() => {
    const nextFilters = [];

    if (selectedTransactionType !== 'all') {
      const activeType = TRANSACTION_TYPE_FILTERS.find(
        filter => filter.value === selectedTransactionType,
      );
      if (activeType) {
        nextFilters.push(activeType.label);
      }
    }

    if (selectedCategory) {
      nextFilters.push(selectedCategory);
    }

    return nextFilters;
  }, [selectedCategory, selectedTransactionType]);

  const clearSelectedTransaction = useCallback(() => {
    setIsDetailModalVisible(false);
    setSelectedTransaction(null);
  }, []);

  const closeDetailModal = useCallback(() => {
    detailProgress.value = withTiming(
      0,
      {
        duration: 220,
        easing: Easing.inOut(Easing.cubic),
      },
      finished => {
        if (finished) {
          runOnJS(clearSelectedTransaction)();
        }
      },
    );
  }, [clearSelectedTransaction, detailProgress]);

  const openDetailModal = useCallback(transaction => {
    setSelectedTransaction(transaction);
  }, []);

  const openEditTransaction = () => {
    if (!selectedTransaction) return;

    const transactionToEdit = selectedTransaction;
    closeDetailModal();
    setTimeout(() => {
      navigation.navigate(MAIN_ROUTES.TRANSACTION_CREATE, {
        mode: 'edit',
        transaction: transactionToEdit,
      });
    }, 180);
  };

  const changeMonth = delta => {
    animateNextLayout();
    setSelectedPeriod(previous => {
      const shiftedDate = new Date(previous.year, previous.month - 1 + delta, 1);
      return {
        month: shiftedDate.getMonth() + 1,
        year: shiftedDate.getFullYear(),
      };
    });
  };

  const selectTransactionType = value => {
    animateNextLayout();
    setSelectedTransactionType(value);
  };

  const selectCategory = value => {
    animateNextLayout();
    setSelectedCategory(value);
  };

  const detailBackdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: detailProgress.value,
  }));

  const detailSheetAnimatedStyle = useAnimatedStyle(() => ({
    opacity: detailProgress.value,
    transform: [
      { translateY: (1 - detailProgress.value) * 48 },
      { scale: 0.96 + detailProgress.value * 0.04 },
    ],
  }));

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-neutral-50">
      <View className="border-b border-neutral-200 bg-neutral-50 px-5 pb-4 pt-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[24px] font-semibold text-neutral-900">Transaksi</Text>
            <Text className="mt-1 text-sm text-neutral-500">
              Pantau pengeluaran dan pemasukan dengan lebih rapi.
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.88}
            className="flex-row items-center rounded-full bg-white px-3.5 py-2"
            style={CARD_SHADOW_STYLE}
            onPress={() => fetchFirstPage({ refresh: true })}
          >
            {isRefreshing ? (
              <ActivityIndicator color="#1d4ed8" size="small" />
            ) : (
              <Ionicons name="refresh-outline" size={16} color="#1d4ed8" />
            )}
            <Text className="ml-2 text-sm font-semibold text-blue-700">
              {isRefreshing ? 'Memuat' : 'Refresh'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5 py-4"
        contentContainerClassName="gap-3 pb-36"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchFirstPage({ refresh: true })}
            tintColor="#1d4ed8"
            colors={['#1d4ed8']}
          />
        }
      >
        <Animated.View
          entering={FadeInUp.duration(320)}
          layout={LinearTransition.duration(240)}
          className="overflow-hidden rounded-[28px] bg-blue-700 px-5 pb-5 pt-4"
        >
          <View className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10" />
          <View className="absolute -bottom-10 left-6 h-24 w-24 rounded-full bg-blue-400/25" />

          <View className="flex-row items-start justify-between">
            <View>
              <Text className="text-xs font-semibold uppercase tracking-[1px] text-blue-100">
                Periode aktif
              </Text>
              <Text className="mt-1 text-xl font-semibold text-white">{periodLabel}</Text>
            </View>
            <View className="rounded-full bg-white/15 px-3 py-1.5">
              <Text className="text-xs font-semibold text-white">
                {activeFilters.length > 0
                  ? `${activeFilters.length} filter aktif`
                  : 'Semua transaksi'}
              </Text>
            </View>
          </View>

          <Text className="mt-5 text-sm text-blue-100">
            {displayTransactionCount} transaksi tercatat
          </Text>
          <Text className="mt-2 text-[32px] font-semibold text-white">
            {formatCurrency(displayTotalAmount)}
          </Text>
          <Text className="mt-2 text-sm text-blue-100">
            {useLocalAggregateForHeader
              ? 'Total mengikuti filter yang sedang aktif.'
              : 'Ringkasan seluruh transaksi pada periode ini.'}
          </Text>

          <View className="mt-5 flex-row items-center justify-between rounded-[22px] bg-white/12 px-3 py-3">
            <TouchableOpacity
              activeOpacity={0.88}
              className="h-11 w-11 items-center justify-center rounded-full bg-white/14"
              onPress={() => changeMonth(-1)}
            >
              <Ionicons name="chevron-back" size={20} color="#ffffff" />
            </TouchableOpacity>

            <View className="items-center">
              <Text className="text-sm font-semibold text-white">{periodLabel}</Text>
              <Text className="mt-1 text-xs text-blue-100">
                Geser periode untuk cek ritme belanja
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              className={`h-11 w-11 items-center justify-center rounded-full ${
                isCurrentMonth ? 'bg-white/8' : 'bg-white/14'
              }`}
              disabled={isCurrentMonth}
              onPress={() => changeMonth(1)}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isCurrentMonth ? '#bfdbfe' : '#ffffff'}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(80).duration(320)}
          layout={LinearTransition.duration(240)}
          className="rounded-[26px] border border-neutral-200 bg-white p-4"
          style={CARD_SHADOW_STYLE}
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-base font-semibold text-neutral-900">Filter cepat</Text>
              <Text className="mt-1 text-sm text-neutral-500">
                Saring daftar tanpa pindah halaman.
              </Text>
            </View>
            {activeFilters.length > 0 ? (
              <TouchableOpacity
                activeOpacity={0.88}
                className="rounded-full bg-neutral-100 px-3 py-1.5"
                onPress={() => {
                  animateNextLayout();
                  setSelectedTransactionType('all');
                  setSelectedCategory('');
                }}
              >
                <Text className="text-xs font-semibold text-neutral-700">Reset</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <Text className="mt-4 text-xs font-semibold uppercase tracking-[0.8px] text-neutral-400">
            Jenis transaksi
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2 pr-2 pt-3"
          >
            {TRANSACTION_TYPE_FILTERS.map((filter, index) => (
              <FilterChip
                key={filter.value}
                label={filter.label}
                icon={filter.icon}
                isActive={selectedTransactionType === filter.value}
                onPress={() => selectTransactionType(filter.value)}
                delay={index * 40}
              />
            ))}
          </ScrollView>

          <Text className="mt-4 text-xs font-semibold uppercase tracking-[0.8px] text-neutral-400">
            Kategori
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2 pr-2 pt-3"
          >
            <FilterChip
              label="Semua Kategori"
              icon="grid-outline"
              isActive={selectedCategory === ''}
              onPress={() => selectCategory('')}
            />

            {CATEGORY_FILTERS.map((category, index) => (
              <FilterChip
                key={category}
                label={category}
                isActive={selectedCategory === category}
                onPress={() => selectCategory(category)}
                delay={Math.min(index * 24, 220)}
              />
            ))}
          </ScrollView>

          {activeFilters.length > 0 ? (
            <Animated.View
              entering={FadeIn.duration(220)}
              layout={LinearTransition.duration(220)}
              className="mt-4 flex-row flex-wrap gap-2"
            >
              {activeFilters.map(filter => (
                <View
                  key={filter}
                  className="flex-row items-center rounded-full bg-blue-50 px-3 py-1.5"
                >
                  <Text className="text-xs font-semibold text-blue-700">{filter}</Text>
                </View>
              ))}
            </Animated.View>
          ) : null}
        </Animated.View>

        {isLoading ? (
          <Animated.View
            entering={FadeInDown.delay(120).duration(280)}
            className="h-48 items-center justify-center rounded-[26px] border border-neutral-200 bg-white"
            style={CARD_SHADOW_STYLE}
          >
            <ActivityIndicator color="#1d4ed8" size="large" />
            <Text className="mt-3 text-base text-neutral-500">Memuat transaksi...</Text>
          </Animated.View>
        ) : null}

        {!isLoading && errorMessage ? (
          <Animated.View
            entering={FadeInDown.duration(280)}
            className="rounded-[26px] border border-red-200 bg-white p-4"
            style={CARD_SHADOW_STYLE}
          >
            <View className="flex-row items-start">
              <View className="mr-3 mt-0.5 h-10 w-10 items-center justify-center rounded-full bg-red-50">
                <Ionicons name="alert-circle-outline" size={22} color="#dc2626" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-red-700">Gagal memuat data</Text>
                <Text className="mt-1 text-sm text-red-600">{errorMessage}</Text>
                <TouchableOpacity
                  activeOpacity={0.88}
                  className="mt-4 h-11 items-center justify-center rounded-xl bg-red-600"
                  onPress={() => fetchFirstPage({ refresh: true })}
                >
                  <Text className="text-sm font-semibold text-white">Coba lagi</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        ) : null}

        {!isLoading && !errorMessage && groupedTransactions.length === 0 ? (
          <Animated.View
            entering={FadeInDown.duration(280)}
            className="rounded-[26px] border border-neutral-200 bg-white p-5"
            style={CARD_SHADOW_STYLE}
          >
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100">
              <Ionicons name="receipt-outline" size={22} color="#525252" />
            </View>
            <Text className="mt-4 text-lg font-semibold text-neutral-900">
              Belum ada transaksi
            </Text>
            <Text className="mt-1 text-sm leading-5 text-neutral-500">
              Simpan hasil scan atau tambahkan transaksi manual untuk melihat daftar di sini.
            </Text>
          </Animated.View>
        ) : null}

        {!isLoading && !errorMessage && groupedTransactions.length > 0 ? (
          <Animated.View
            entering={FadeInDown.delay(120).duration(320)}
            layout={LinearTransition.duration(240)}
            className="rounded-[26px] border border-neutral-200 bg-white p-4"
            style={CARD_SHADOW_STYLE}
          >
            <View className="mb-4 flex-row items-center justify-between">
              <View>
                <Text className="text-lg font-semibold text-neutral-900">Daftar transaksi</Text>
                <Text className="mt-1 text-sm text-neutral-500">
                  Ketuk kartu transaksi untuk lihat detail lengkap.
                </Text>
              </View>
              <View className="rounded-full bg-neutral-100 px-3 py-1.5">
                <Text className="text-xs font-semibold text-neutral-700">
                  {displayTransactionCount} transaksi
                </Text>
              </View>
            </View>

            {groupedTransactions.map((group, groupIndex) => (
              <Animated.View
                key={group.date}
                entering={FadeInDown.delay(90 + groupIndex * 50).duration(260)}
                layout={LinearTransition.duration(220)}
                className="mb-5 last:mb-0"
              >
                <View className="mb-3 flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-neutral-500">{group.date}</Text>
                  <View className="h-px flex-1 bg-neutral-200 ml-3" />
                </View>

                <View className="gap-2">
                  {group.items.map((transaction, itemIndex) => {
                    const items = Array.isArray(transaction?.items) ? transaction.items : [];
                    const category = items[0]?.category || 'Lainnya';
                    const categoryMeta = getCategoryMeta(category);

                    return (
                      <Animated.View
                        key={String(transaction?.id)}
                        entering={FadeInDown
                          .delay(120 + itemIndex * 30)
                          .duration(240)}
                        layout={LinearTransition.duration(200)}
                      >
                        <TouchableOpacity
                          activeOpacity={0.9}
                          className="rounded-[22px] bg-neutral-50 px-3.5 py-3"
                          onPress={() => openDetailModal(transaction)}
                        >
                          <View className="flex-row items-center">
                            <View
                              className="h-12 w-12 items-center justify-center rounded-2xl"
                              style={{ backgroundColor: categoryMeta.iconBackground }}
                            >
                              <Ionicons
                                name={categoryMeta.icon}
                                size={21}
                                color={categoryMeta.iconColor}
                              />
                            </View>

                            <View className="ml-3 flex-1">
                              <Text className="text-base font-semibold text-neutral-900">
                                {transaction?.merchant_name || 'Tanpa Merchant'}
                              </Text>
                              <Text className="mt-1 text-sm text-neutral-500">
                                {buildMetaText(transaction)}
                              </Text>
                            </View>

                            <View className="items-end pl-3">
                              <Text
                                className={`text-base font-semibold ${getAmountToneClass(
                                  transaction?.transaction_type,
                                )}`}
                              >
                                {formatCurrency(transaction?.price_total)}
                              </Text>
                              <View className="mt-1 flex-row items-center">
                                <Text
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    BADGE_CLASS[category] ?? 'bg-neutral-100 text-neutral-700'
                                  }`}
                                >
                                  {category}
                                </Text>
                              </View>
                            </View>
                          </View>

                          <View className="mt-3 flex-row items-center justify-between">
                            <Text className="text-xs text-neutral-400">
                              {transaction?.description || 'Tap untuk buka detail transaksi'}
                            </Text>
                            <Ionicons
                              name="chevron-forward"
                              size={16}
                              color="#94a3b8"
                            />
                          </View>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                </View>
              </Animated.View>
            ))}

            {loadMoreError ? (
              <View className="mt-2 rounded-2xl border border-red-200 bg-red-50 p-3">
                <Text className="text-sm text-red-700">{loadMoreError}</Text>
              </View>
            ) : null}

            {hasMorePages ? (
              <TouchableOpacity
                activeOpacity={0.88}
                className="mt-4 h-12 flex-row items-center justify-center rounded-2xl bg-neutral-100"
                onPress={fetchNextPage}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <ActivityIndicator color="#1d4ed8" />
                ) : (
                  <>
                    <Text className="text-sm font-semibold text-neutral-700">
                      Muat lebih banyak
                    </Text>
                    <View className="ml-1.5">
                      <Ionicons
                        name="arrow-down-outline"
                        size={16}
                        color="#525252"
                      />
                    </View>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <Text className="mt-4 text-center text-xs text-neutral-500">
                Semua transaksi sudah ditampilkan.
              </Text>
            )}
          </Animated.View>
        ) : null}
      </ScrollView>

      <Modal
        visible={isDetailModalVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeDetailModal}
      >
        <Animated.View
          className="flex-1 justify-end bg-black/45"
          style={detailBackdropAnimatedStyle}
        >
          <TouchableOpacity
            activeOpacity={1}
            className="absolute inset-0"
            onPress={closeDetailModal}
          />

          <Animated.View
            className="max-h-[86%] rounded-t-[32px] bg-white px-5 pb-7 pt-5"
            style={detailSheetAnimatedStyle}
          >
            <View className="mb-4 h-1.5 w-14 self-center rounded-full bg-neutral-300" />

            <View className="mb-2 flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-[24px] font-semibold text-neutral-900">
                  {selectedTransaction?.merchant_name || 'Tanpa Merchant'}
                </Text>
                <Text className="mt-1 text-sm text-neutral-500">
                  {formatDateTimeLabel(selectedTransaction?.transaction_date)}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.88}
                className="rounded-full bg-neutral-100 px-3 py-2"
                onPress={closeDetailModal}
              >
                <Text className="text-sm font-semibold text-neutral-700">Tutup</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              className="mt-2"
              contentContainerClassName="gap-3 pb-2"
              showsVerticalScrollIndicator={false}
            >
              <View className="overflow-hidden rounded-[26px] bg-blue-700 p-4">
                <View className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10" />
                <Text className="text-sm text-blue-100">Total transaksi</Text>
                <Text className="mt-1 text-[30px] font-semibold text-white">
                  {formatCurrency(selectedTransaction?.price_total)}
                </Text>
                <View className="mt-3 flex-row flex-wrap items-center gap-2">
                  <Text className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                    {selectedTransaction?.input_method || '-'}
                  </Text>
                  <Text className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                    {selectedItems.length} item
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.88}
                className="h-12 flex-row items-center justify-center rounded-2xl bg-blue-50"
                onPress={openEditTransaction}
              >
                <Ionicons name="create-outline" size={16} color="#1d4ed8" />
                <Text className="ml-2 text-sm font-semibold text-blue-700">
                  Edit transaksi
                </Text>
              </TouchableOpacity>

              <View className="rounded-[24px] border border-neutral-200 bg-white p-4">
                <Text className="mb-2 text-base font-semibold text-neutral-900">Ringkasan</Text>

                <View className="flex-row items-center justify-between border-b border-neutral-200 py-3">
                  <Text className="text-sm text-neutral-500">PPN</Text>
                  <Text className="text-base font-semibold text-neutral-900">
                    {formatCurrency(selectedTransaction?.tax)}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between border-b border-neutral-200 py-3">
                  <Text className="text-sm text-neutral-500">Service charge</Text>
                  <Text className="text-base font-semibold text-neutral-900">
                    {formatCurrency(selectedTransaction?.service_charge)}
                  </Text>
                </View>

                <View className="flex-row items-start justify-between py-3">
                  <Text className="text-sm text-neutral-500">Deskripsi</Text>
                  <Text className="ml-4 flex-1 text-right text-sm leading-5 text-neutral-700">
                    {selectedTransaction?.description || '-'}
                  </Text>
                </View>
              </View>

              <View className="rounded-[24px] border border-neutral-200 bg-white p-4">
                <Text className="mb-2 text-base font-semibold text-neutral-900">
                  Daftar item
                </Text>

                {selectedItems.length === 0 ? (
                  <Text className="text-sm text-neutral-500">Tidak ada item.</Text>
                ) : (
                  selectedItems.map((item, index) => {
                    const category = item?.category || 'Lainnya';
                    const categoryMeta = getCategoryMeta(category);

                    return (
                      <View
                        key={`${item?.id ?? index}-${item?.item_name ?? 'item'}`}
                        className="flex-row items-center border-b border-neutral-200 py-3 last:border-b-0"
                      >
                        <View
                          className="h-11 w-11 items-center justify-center rounded-2xl"
                          style={{ backgroundColor: categoryMeta.iconBackground }}
                        >
                          <Ionicons
                            name={categoryMeta.icon}
                            size={18}
                            color={categoryMeta.iconColor}
                          />
                        </View>

                        <View className="ml-3 flex-1 pr-3">
                          <Text className="text-base font-medium text-neutral-900">
                            {item?.item_name || `Item ${index + 1}`}
                          </Text>
                          <Text className="mt-1 text-sm text-neutral-500">{category}</Text>
                        </View>

                        <Text className="text-base font-semibold text-neutral-900">
                          {formatCurrency(item?.price)}
                        </Text>
                      </View>
                    );
                  })
                )}
              </View>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>

      <Animated.View
        entering={FadeInUp.delay(180).duration(320)}
        className="absolute right-5"
        style={{ bottom: Math.max(insets.bottom + 88, 104) }}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          className="h-14 w-14 items-center justify-center rounded-full bg-blue-700"
          style={CARD_SHADOW_STYLE}
          onPress={() => navigation.navigate(MAIN_ROUTES.TRANSACTION_CREATE)}
        >
          <Ionicons name="add" size={28} color="#ffffff" />
        </TouchableOpacity>
      </Animated.View>

      <MainTabBar activeRoute={MAIN_ROUTES.TRANSACTIONS} />
    </SafeAreaView>
  );
}
