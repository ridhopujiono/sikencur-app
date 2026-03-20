import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MAIN_ROUTES } from '../../navigation/routes';
import { getReceiptScanStatus } from '../../api/scan';
import { storeTransaction } from '../../api/transactions';

function formatCurrency(value) {
  const numericValue = Number(value ?? 0);
  if (Number.isNaN(numericValue)) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function getErrorMessage(error) {
  if (typeof error === 'string') return error;
  if (error?.data?.message) return error.data.message;
  if (error?.message) return error.message;
  return 'Terjadi kesalahan pada server.';
}

function toNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function padToTwo(value) {
  return String(value).padStart(2, '0');
}

function formatDateTimeForApi(date) {
  const year = date.getFullYear();
  const month = padToTwo(date.getMonth() + 1);
  const day = padToTwo(date.getDate());
  const hours = padToTwo(date.getHours());
  const minutes = padToTwo(date.getMinutes());
  const seconds = padToTwo(date.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function normalizeTransactionDate(dateString) {
  if (typeof dateString !== 'string' || dateString.trim() === '') {
    return formatDateTimeForApi(new Date());
  }

  const trimmed = dateString.trim();
  const alreadyFormatted = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

  if (alreadyFormatted.test(trimmed)) {
    return trimmed;
  }

  const normalizedString = trimmed.includes(' ') ? trimmed.replace(' ', 'T') : trimmed;
  const parsedDate = new Date(normalizedString);

  if (Number.isNaN(parsedDate.getTime())) {
    return formatDateTimeForApi(new Date());
  }

  return formatDateTimeForApi(parsedDate);
}

function buildStorePayload(scanData) {
  const items = (scanData?.item ?? []).map((item, index) => ({
    item_name: item?.item_name?.trim() || `Item ${index + 1}`,
    price: toNumber(item?.price, 0),
    category: item?.transaction_category?.trim() || item?.category?.trim() || 'Lainnya',
  }));

  if (items.length === 0) {
    items.push({
      item_name: 'Item dari OCR',
      price: toNumber(scanData?.price_total, 0),
      category: 'Lainnya',
    });
  }

  const tax = toNumber(scanData?.tax, 0);
  const serviceCharge = toNumber(scanData?.service_charge, 0);
  const itemTotal = items.reduce((acc, item) => acc + item.price, 0);

  let priceTotal = toNumber(scanData?.price_total, itemTotal + tax + serviceCharge);
  if (priceTotal <= 0 && itemTotal + tax + serviceCharge > 0) {
    priceTotal = itemTotal + tax + serviceCharge;
  }

  return {
    merchant_name: scanData?.merchant?.trim() || 'Tanpa Merchant',
    description: scanData?.description?.trim() || 'Hasil OCR struk',
    price_total: priceTotal,
    tax,
    service_charge: serviceCharge,
    transaction_date: normalizeTransactionDate(scanData?.transaction_date),
    input_method: 'scan',
    items,
  };
}

export default function OCRResultScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const scanId = route.params?.scanId ?? null;
  const initialStatus = route.params?.initialStatus ?? (scanId ? 'pending' : 'idle');

  const [status, setStatus] = useState(initialStatus);
  const [scanData, setScanData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const receiptFields = useMemo(() => {
    if (!scanData) {
      return [];
    }

    return [
      { label: 'Nama toko', value: scanData.merchant || '-' },
      { label: 'Tanggal', value: scanData.transaction_date || '-' },
      { label: 'Total bayar', value: formatCurrency(scanData.price_total), emphasized: true },
      { label: 'PPN', value: formatCurrency(scanData.tax) },
      { label: 'Biaya layanan', value: formatCurrency(scanData.service_charge) },
      { label: 'Durasi analisa', value: `${scanData.duration_analyzed_image ?? '-'} detik` },
      { label: 'Akurasi OCR', value: `${scanData.accuration_analyzed_image ?? '-'}%` },
    ];
  }, [scanData]);

  useEffect(() => {
    if (!scanId) {
      return undefined;
    }

    let isMounted = true;
    let timerId;

    const pollStatus = async () => {
      try {
        const response = await getReceiptScanStatus(scanId);
        if (!isMounted) return;

        const nextStatus = response?.status ?? 'pending';
        setStatus(nextStatus);
        setErrorMessage(response?.error_message ?? null);

        if (nextStatus === 'completed') {
          setScanData(response?.data?.data?.[0] ?? null);
          return;
        }

        if (nextStatus === 'failed' || nextStatus === 'error') {
          return;
        }

        timerId = setTimeout(pollStatus, 2000);
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(getErrorMessage(error));
        timerId = setTimeout(pollStatus, 3000);
      }
    };

    pollStatus();

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [scanId]);

  const refreshStatus = async () => {
    if (!scanId) return;

    try {
      setIsRefreshing(true);
      const response = await getReceiptScanStatus(scanId);
      const nextStatus = response?.status ?? 'pending';

      setStatus(nextStatus);
      setErrorMessage(response?.error_message ?? null);

      if (nextStatus === 'completed') {
        setScanData(response?.data?.data?.[0] ?? null);
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsRefreshing(false);
    }
  };

  const saveTransaction = async () => {
    if (status !== 'completed' || !scanData || isSaving || isSaved) {
      return;
    }

    try {
      setIsSaving(true);
      const payload = buildStorePayload(scanData);
      await storeTransaction(payload);
      setIsSaved(true);

      Alert.alert('Transaksi tersimpan', 'Data hasil scan berhasil disimpan.', [
        {
          text: 'Lihat transaksi',
          onPress: () => navigation.navigate(MAIN_ROUTES.TRANSACTIONS),
        },
      ]);
    } catch (error) {
      Alert.alert('Simpan gagal', getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View className="flex-row items-center justify-between border-b border-neutral-200 px-5 pb-3 pt-4">
        <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.goBack()}>
          <Text className="text-base font-medium text-blue-700">‹ Kembali</Text>
        </TouchableOpacity>
        <Text className="text-[20px] font-semibold text-neutral-900">Hasil scan</Text>
        <View className="w-14" />
      </View>

      <ScrollView
        className="flex-1 px-5 py-4"
        contentContainerClassName="gap-2.5 pb-6"
        showsVerticalScrollIndicator={false}
      >
        <View
          className={`flex-row items-start gap-2 rounded-lg p-4 ${
            status === 'completed'
              ? 'bg-emerald-100'
              : status === 'failed' || status === 'error'
                ? 'bg-red-100'
                : 'bg-blue-100'
          }`}
        >
          <View className="mt-0.5">
            {status === 'completed' ? (
              <Text className="text-lg text-emerald-700">✓</Text>
            ) : status === 'failed' || status === 'error' ? (
              <Text className="text-lg text-red-700">!</Text>
            ) : (
              <ActivityIndicator color="#1d4ed8" />
            )}
          </View>
          <View className="flex-1">
            <Text
              className={`text-base font-semibold ${
                status === 'completed'
                  ? 'text-emerald-800'
                  : status === 'failed' || status === 'error'
                    ? 'text-red-800'
                    : 'text-blue-800'
              }`}
            >
              {status === 'completed'
                ? 'OCR selesai diproses'
                : status === 'failed' || status === 'error'
                  ? 'OCR gagal diproses'
                  : 'OCR sedang diproses'}
            </Text>
            <Text
              className={`mt-0.5 text-sm ${
                status === 'completed'
                  ? 'text-emerald-700'
                  : status === 'failed' || status === 'error'
                    ? 'text-red-700'
                    : 'text-blue-700'
              }`}
            >
              Scan ID: {scanId ?? '-'} · status: {status}
            </Text>
            {errorMessage ? (
              <Text className="mt-1 text-sm text-red-700">{errorMessage}</Text>
            ) : null}
          </View>
        </View>

        {scanData ? (
          <>
            <View className="rounded-xl border border-neutral-200 bg-white p-4">
              <Text className="mb-1 text-base font-medium text-neutral-600">
                Informasi struk
              </Text>
              {receiptFields.map(field => (
                <View
                  key={field.label}
                  className="flex-row items-center justify-between border-b border-neutral-200 py-2 last:border-b-0"
                >
                  <Text className="text-sm text-neutral-500">{field.label}</Text>
                  <Text
                    className={`text-base font-semibold ${field.emphasized ? 'text-emerald-700' : 'text-neutral-900'}`}
                  >
                    {field.value}
                  </Text>
                </View>
              ))}
            </View>

            <View className="rounded-xl border border-neutral-200 bg-white p-4">
              <Text className="mb-1 text-base font-medium text-neutral-600">
                Item terdeteksi ({scanData.item?.length ?? 0} item)
              </Text>
              {(scanData.item ?? []).map((item, index) => (
                <View
                  key={`${item.item_name}-${index}`}
                  className="flex-row border-b border-neutral-200 py-2.5 last:border-b-0"
                >
                  <View className="flex-1">
                    <Text className="text-base font-medium text-neutral-900">
                      {item.item_name || '-'}
                    </Text>
                    <Text className="mt-1 text-sm text-neutral-500">
                      {item.transaction_category || 'Uncategorized'}
                    </Text>
                  </View>
                  <Text className="text-base font-semibold text-neutral-900">
                    {formatCurrency(item.price)}
                  </Text>
                </View>
              ))}
            </View>

            <View className="rounded-xl border border-neutral-200 bg-white p-4">
              <Text className="text-base font-medium text-neutral-600">Deskripsi OCR</Text>
              <Text className="mt-2 text-sm leading-6 text-neutral-600">
                {scanData.description || '-'}
              </Text>
            </View>
          </>
        ) : (
          <View className="rounded-xl border border-neutral-200 bg-white p-4">
            <Text className="text-base font-medium text-neutral-700">
              Menunggu hasil scan...
            </Text>
            <Text className="mt-2 text-sm text-neutral-500">
              Setelah status menjadi completed, detail struk akan muncul di sini.
            </Text>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.85}
          className={`h-14 items-center justify-center rounded-xl ${
            isSaved ? 'bg-emerald-600' : status === 'completed' ? 'bg-blue-700' : 'bg-blue-300'
          }`}
          disabled={status !== 'completed' || !scanData || isSaving || isSaved}
          onPress={saveTransaction}
        >
          {isSaving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-lg font-semibold text-white">
              {isSaved ? 'Transaksi tersimpan' : 'Simpan transaksi'}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          className="h-14 items-center justify-center rounded-xl border border-neutral-300"
          onPress={() => {
            refreshStatus();
          }}
        >
          <Text className="text-lg font-medium text-neutral-600">
            {isRefreshing ? 'Memuat...' : 'Cek status lagi'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
