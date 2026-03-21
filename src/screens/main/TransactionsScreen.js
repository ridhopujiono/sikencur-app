import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MainTabBar from '../../components/main/MainTabBar';
import { MAIN_ROUTES } from '../../navigation/routes';
import { getTransactionTotal, listTransactions } from '../../api/transactions';
const MONTH_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  month: 'long',
  year: 'numeric',
});
const TRANSACTION_TYPE_FILTERS = [
  { label: 'Semua', value: 'all' },
  { label: 'Pengeluaran', value: 'expense' },
  { label: 'Pemasukan', value: 'income' },
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
  Lainnya: 'bg-neutral-100 text-neutral-700',
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

  const closeDetailModal = () => {
    setSelectedTransaction(null);
  };
  const openEditTransaction = () => {
    if (!selectedTransaction) return;

    const transactionToEdit = selectedTransaction;
    closeDetailModal();
    setTimeout(() => {
      navigation.navigate(MAIN_ROUTES.TRANSACTION_CREATE, {
        mode: 'edit',
        transaction: transactionToEdit,
      });
    }, 0);
  };

  const changeMonth = delta => {
    setSelectedPeriod(previous => {
      const shiftedDate = new Date(previous.year, previous.month - 1 + delta, 1);
      return {
        month: shiftedDate.getMonth() + 1,
        year: shiftedDate.getFullYear(),
      };
    });
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View className="flex-row items-center justify-between border-b border-neutral-200 px-5 pb-3 pt-4">
        <Text className="text-[20px] font-semibold text-neutral-900">Transaksi</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => fetchFirstPage({ refresh: true })}
        >
          <Text className="text-base font-medium text-blue-700">
            {isRefreshing ? 'Memuat...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-5 py-4"
        contentContainerClassName="gap-2.5 pb-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            activeOpacity={0.85}
            className="h-8 w-8 items-center justify-center rounded-full bg-neutral-200"
            onPress={() => changeMonth(-1)}
          >
            <Text className="text-sm font-semibold text-neutral-700">‹</Text>
          </TouchableOpacity>
          <Text className="text-sm font-semibold text-neutral-700">{periodLabel}</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            className={`h-8 w-8 items-center justify-center rounded-full ${
              isCurrentMonth ? 'bg-neutral-100' : 'bg-neutral-200'
            }`}
            disabled={isCurrentMonth}
            onPress={() => changeMonth(1)}
          >
            <Text
              className={`text-sm font-semibold ${
                isCurrentMonth ? 'text-neutral-300' : 'text-neutral-700'
              }`}
            >
              ›
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-1.5 pr-2"
        >
          {TRANSACTION_TYPE_FILTERS.map(filter => {
            const isActive = selectedTransactionType === filter.value;

            return (
              <TouchableOpacity
                key={filter.value}
                activeOpacity={0.85}
                className={`rounded-full border px-3.5 py-1.5 ${
                  isActive
                    ? 'border-blue-700 bg-blue-100'
                    : 'border-neutral-300 bg-transparent'
                }`}
                onPress={() => setSelectedTransactionType(filter.value)}
              >
                <Text
                  className={`text-sm ${
                    isActive ? 'font-semibold text-blue-700' : 'text-neutral-600'
                  }`}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-1.5 pr-2"
        >
          <TouchableOpacity
            activeOpacity={0.85}
            className={`rounded-full border px-3.5 py-1.5 ${
              selectedCategory === ''
                ? 'border-blue-700 bg-blue-100'
                : 'border-neutral-300 bg-transparent'
            }`}
            onPress={() => setSelectedCategory('')}
          >
            <Text
              className={`text-sm ${
                selectedCategory === ''
                  ? 'font-semibold text-blue-700'
                  : 'text-neutral-600'
              }`}
            >
              Semua Kategori
            </Text>
          </TouchableOpacity>

          {CATEGORY_FILTERS.map(category => {
            const isActive = selectedCategory === category;

            return (
              <TouchableOpacity
                key={category}
                activeOpacity={0.85}
                className={`rounded-full border px-3.5 py-1.5 ${
                  isActive
                    ? 'border-blue-700 bg-blue-100'
                    : 'border-neutral-300 bg-transparent'
                }`}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  className={`text-sm ${
                    isActive ? 'font-semibold text-blue-700' : 'text-neutral-600'
                  }`}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-neutral-600">
            {displayTransactionCount} transaksi
          </Text>
          <Text className="text-base font-semibold text-neutral-900">
            {formatCurrency(displayTotalAmount)}
          </Text>
        </View>
        {useLocalAggregateForHeader ? (
          <Text className="text-xs text-neutral-500">
            Total dihitung dari hasil filter aktif.
          </Text>
        ) : null}

        {isLoading ? (
          <View className="h-44 items-center justify-center rounded-xl border border-neutral-200 bg-white">
            <ActivityIndicator color="#1d4ed8" size="large" />
            <Text className="mt-3 text-base text-neutral-500">Memuat transaksi...</Text>
          </View>
        ) : null}

        {!isLoading && errorMessage ? (
          <View className="rounded-xl border border-red-200 bg-red-50 p-4">
            <Text className="text-base font-semibold text-red-700">Gagal memuat data</Text>
            <Text className="mt-1 text-sm text-red-600">{errorMessage}</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              className="mt-3 h-10 items-center justify-center rounded-lg bg-red-600"
              onPress={() => fetchFirstPage({ refresh: true })}
            >
              <Text className="text-sm font-semibold text-white">Coba lagi</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!isLoading && !errorMessage && groupedTransactions.length === 0 ? (
          <View className="rounded-xl border border-neutral-200 bg-white p-4">
            <Text className="text-base font-semibold text-neutral-900">
              Belum ada transaksi
            </Text>
            <Text className="mt-1 text-sm text-neutral-500">
              Simpan hasil scan untuk melihat daftar transaksi di sini.
            </Text>
          </View>
        ) : null}

        {!isLoading && !errorMessage && groupedTransactions.length > 0 ? (
          <View className="rounded-xl border border-neutral-200 bg-white p-4">
            {groupedTransactions.map(group => (
              <View key={group.date} className="mb-2 last:mb-0">
                <Text className="pb-1 text-sm font-semibold text-neutral-500">{group.date}</Text>
                {group.items.map(transaction => {
                  const items = Array.isArray(transaction?.items) ? transaction.items : [];
                  const category = items[0]?.category || 'Lainnya';

                  return (
                    <TouchableOpacity
                      key={String(transaction?.id)}
                      activeOpacity={0.85}
                      className="flex-row items-center border-b border-neutral-200 py-2.5 last:border-b-0"
                      onPress={() => {
                        setSelectedTransaction(transaction);
                      }}
                    >
                      <View className="h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
                        <Text className="text-lg text-neutral-600">●</Text>
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-base font-medium text-neutral-900">
                          {transaction?.merchant_name || 'Tanpa Merchant'}
                        </Text>
                        <Text className="text-sm text-neutral-500">
                          {buildMetaText(transaction)}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-base font-semibold text-neutral-900">
                          {formatCurrency(transaction?.price_total)}
                        </Text>
                        <Text
                          className={`mt-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            BADGE_CLASS[category] ?? 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {category}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            {loadMoreError ? (
              <View className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                <Text className="text-sm text-red-700">{loadMoreError}</Text>
              </View>
            ) : null}

            {hasMorePages ? (
              <TouchableOpacity
                activeOpacity={0.85}
                className="mt-3 h-11 items-center justify-center rounded-lg border border-neutral-300 bg-white"
                onPress={fetchNextPage}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <ActivityIndicator color="#1d4ed8" />
                ) : (
                  <Text className="text-sm font-semibold text-neutral-700">
                    Muat lebih banyak
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <Text className="mt-3 text-center text-xs text-neutral-500">
                Semua transaksi sudah ditampilkan.
              </Text>
            )}
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={selectedTransaction != null}
        transparent
        animationType="slide"
        onRequestClose={closeDetailModal}
      >
        <View className="flex-1 justify-end bg-black/35">
          <View className="max-h-[85%] rounded-t-3xl bg-white px-5 pb-7 pt-5">
            <View className="mb-3 h-1.5 w-14 self-center rounded-full bg-neutral-300" />

            <View className="mb-2 flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-[22px] font-semibold text-neutral-900">
                  {selectedTransaction?.merchant_name || 'Tanpa Merchant'}
                </Text>
                <Text className="mt-1 text-sm text-neutral-500">
                  {formatDateTimeLabel(selectedTransaction?.transaction_date)}
                </Text>
              </View>
              <TouchableOpacity activeOpacity={0.85} onPress={closeDetailModal}>
                <Text className="text-base font-medium text-neutral-500">Tutup</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              className="mt-2"
              contentContainerClassName="gap-3 pb-2"
              showsVerticalScrollIndicator={false}
            >
              <View className="rounded-2xl bg-neutral-100 p-4">
                <Text className="text-sm text-neutral-500">Total transaksi</Text>
                <Text className="mt-1 text-[30px] font-semibold text-neutral-900">
                  {formatCurrency(selectedTransaction?.price_total)}
                </Text>
                <View className="mt-2 flex-row flex-wrap items-center gap-2">
                  <Text className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                    {selectedTransaction?.input_method || '-'}
                  </Text>
                  <Text className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-700">
                    {selectedItems.length} item
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                className="h-11 items-center justify-center rounded-xl border border-blue-200 bg-blue-50"
                onPress={openEditTransaction}
              >
                <Text className="text-sm font-semibold text-blue-700">Edit transaksi</Text>
              </TouchableOpacity>

              <View className="rounded-2xl border border-neutral-200 bg-white p-4">
                <Text className="mb-2 text-base font-semibold text-neutral-900">Ringkasan</Text>
                <View className="flex-row items-center justify-between border-b border-neutral-200 py-2">
                  <Text className="text-sm text-neutral-500">PPN</Text>
                  <Text className="text-base font-semibold text-neutral-900">
                    {formatCurrency(selectedTransaction?.tax)}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between border-b border-neutral-200 py-2">
                  <Text className="text-sm text-neutral-500">Service charge</Text>
                  <Text className="text-base font-semibold text-neutral-900">
                    {formatCurrency(selectedTransaction?.service_charge)}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between py-2">
                  <Text className="text-sm text-neutral-500">Deskripsi</Text>
                  <Text className="ml-4 flex-1 text-right text-sm text-neutral-700">
                    {selectedTransaction?.description || '-'}
                  </Text>
                </View>
              </View>

              <View className="rounded-2xl border border-neutral-200 bg-white p-4">
                <Text className="mb-2 text-base font-semibold text-neutral-900">
                  Daftar item
                </Text>
                {selectedItems.length === 0 ? (
                  <Text className="text-sm text-neutral-500">Tidak ada item.</Text>
                ) : (
                  selectedItems.map((item, index) => {
                    const category = item?.category || 'Lainnya';

                    return (
                      <View
                        key={`${item?.id ?? index}-${item?.item_name ?? 'item'}`}
                        className="flex-row items-center border-b border-neutral-200 py-2.5 last:border-b-0"
                      >
                        <View className="flex-1 pr-3">
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
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        activeOpacity={0.9}
        className="absolute right-5 h-14 w-14 items-center justify-center rounded-full bg-blue-700"
        style={{ bottom: Math.max(insets.bottom + 88, 104) }}
        onPress={() => navigation.navigate(MAIN_ROUTES.TRANSACTION_CREATE)}
      >
        <Text className="text-3xl text-white">+</Text>
      </TouchableOpacity>

      <MainTabBar activeRoute={MAIN_ROUTES.TRANSACTIONS} />
    </SafeAreaView>
  );
}
