import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MainTabBar from '../../components/main/MainTabBar';
import { MAIN_ROUTES } from '../../navigation/routes';
import { getTransactionSummary, listTransactions } from '../../api/transactions';
const MONTH_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  month: 'long',
  year: 'numeric',
});

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
  const now = useMemo(() => new Date(), []);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });
  const [transactions, setTransactions] = useState([]);
  const [paginationTotal, setPaginationTotal] = useState(0);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const fetchTransactions = useCallback(
    async ({ refresh = false } = {}) => {
      try {
        if (refresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        setErrorMessage(null);

        const params = {
          per_page: 50,
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

        const [transactionsResult, summaryResult] = await Promise.allSettled([
          listTransactions(params),
          getTransactionSummary({
            month: selectedPeriod.month,
            year: selectedPeriod.year,
            top_categories: 1,
            scan_status: 'completed',
          }),
        ]);

        if (transactionsResult.status === 'rejected') {
          throw transactionsResult.reason;
        }

        const transactionResponse = transactionsResult.value;
        setTransactions(Array.isArray(transactionResponse?.data) ? transactionResponse.data : []);
        setPaginationTotal(
          Number.isFinite(Number(transactionResponse?.total))
            ? Number(transactionResponse.total)
            : 0,
        );

        if (summaryResult.status === 'fulfilled') {
          setMonthlySummary(summaryResult.value);
        }
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedCategory, selectedPeriod.month, selectedPeriod.year],
  );

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [fetchTransactions]),
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
  const summaryTransactionCount = toNumber(monthlySummary?.summary?.transaction_count, 0);
  const summaryTotalExpense = toNumber(monthlySummary?.summary?.total_expense, 0);
  const periodLabel = formatMonthYearLabel(selectedPeriod.month, selectedPeriod.year);
  const isCurrentMonth =
    selectedPeriod.month === now.getMonth() + 1 &&
    selectedPeriod.year === now.getFullYear();
  const displayTransactionCount = selectedCategory
    ? paginationTotal
    : summaryTransactionCount || paginationTotal;
  const displayTotalAmount = selectedCategory
    ? localTotalAmount
    : summaryTotalExpense || localTotalAmount;

  const selectedItems = Array.isArray(selectedTransaction?.items)
    ? selectedTransaction.items
    : [];

  const closeDetailModal = () => {
    setSelectedTransaction(null);
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
          onPress={() => fetchTransactions({ refresh: true })}
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
              onPress={() => fetchTransactions({ refresh: true })}
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
                <Text className="text-base font-medium text-blue-700">Tutup</Text>
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

      <MainTabBar activeRoute={MAIN_ROUTES.TRANSACTIONS} />
    </SafeAreaView>
  );
}
