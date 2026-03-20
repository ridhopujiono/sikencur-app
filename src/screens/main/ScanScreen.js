import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  errorCodes as documentErrorCodes,
  isErrorWithCode as isDocumentPickerErrorWithCode,
  pick as pickDocument,
  types as documentTypes,
} from '@react-native-documents/picker';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import MainTabBar from '../../components/main/MainTabBar';
import { MAIN_ROUTES } from '../../navigation/routes';
import { submitReceiptScan } from '../../api/scan';
import { listTransactions } from '../../api/transactions';

const TIPS = [
  'Struk di permukaan datar, pencahayaan cukup',
  'Seluruh struk masuk dalam frame kamera',
  'Foto dari atas tegak lurus, tidak miring',
];

const CATEGORY_BADGE_CLASS = {
  'Makanan & Minuman': 'bg-emerald-100 text-emerald-700',
  Makanan: 'bg-emerald-100 text-emerald-700',
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

function formatTransactionDate(value) {
  if (!value || typeof value !== 'string') return '-';

  const normalizedValue = value.includes(' ') ? value.replace(' ', 'T') : value;
  const parsedDate = new Date(normalizedValue);

  if (Number.isNaN(parsedDate.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsedDate);
}

function getPrimaryCategory(transaction) {
  const items = Array.isArray(transaction?.items) ? transaction.items : [];
  return items[0]?.category || 'Lainnya';
}

export default function ScanScreen() {
  const navigation = useNavigation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [recentScans, setRecentScans] = React.useState([]);
  const [isRecentLoading, setIsRecentLoading] = React.useState(true);
  const [recentError, setRecentError] = React.useState(null);

  const getErrorMessage = error => {
    if (typeof error === 'string') return error;
    if (error?.data?.message) return error.data.message;
    if (error?.message) return error.message;
    return 'Gagal memproses scan. Silakan coba lagi.';
  };

  const fetchRecentScans = useCallback(async () => {
    try {
      setIsRecentLoading(true);
      setRecentError(null);

      const response = await listTransactions({
        input_method: 'scan',
        sort_by: 'transaction_date',
        sort_direction: 'desc',
        per_page: 5,
      });

      setRecentScans(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      setRecentError(getErrorMessage(error));
    } finally {
      setIsRecentLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRecentScans();
    }, [fetchRecentScans]),
  );

  const startScan = async file => {
    try {
      setIsSubmitting(true);
      const response = await submitReceiptScan(file);
      const scanId = response?.scan_id;

      if (!scanId) {
        throw new Error('Scan ID tidak ditemukan pada response API.');
      }

      navigation.navigate(MAIN_ROUTES.OCR, {
        scanId,
        initialStatus: response?.status ?? 'pending',
        sourceName: file.name ?? 'receipt',
      });
    } catch (error) {
      Alert.alert('Scan Gagal', getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCamera = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        cameraType: 'back',
        quality: 0.8,
        saveToPhotos: false,
      });

      if (result.didCancel) return;
      if (result.errorCode) {
        throw new Error(result.errorMessage ?? `Camera error (${result.errorCode})`);
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        throw new Error('Foto tidak ditemukan.');
      }

      await startScan({
        uri: asset.uri,
        name: asset.fileName ?? `camera-${Date.now()}.jpg`,
        type: asset.type ?? 'image/jpeg',
      });
    } catch (error) {
      Alert.alert('Kamera', getErrorMessage(error));
    }
  };

  const openGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.8,
      });

      if (result.didCancel) return;
      if (result.errorCode) {
        throw new Error(result.errorMessage ?? `Gallery error (${result.errorCode})`);
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        throw new Error('File galeri tidak ditemukan.');
      }

      await startScan({
        uri: asset.uri,
        name: asset.fileName ?? `gallery-${Date.now()}.jpg`,
        type: asset.type ?? 'image/jpeg',
      });
    } catch (error) {
      Alert.alert('Galeri', getErrorMessage(error));
    }
  };

  const openPdf = async () => {
    try {
      const [file] = await pickDocument({
        type: [documentTypes.pdf],
        allowMultiSelection: false,
      });

      await startScan({
        uri: file.uri,
        name: file.name ?? `receipt-${Date.now()}.pdf`,
        type: file.type ?? 'application/pdf',
      });
    } catch (error) {
      if (
        isDocumentPickerErrorWithCode(error) &&
        error.code === documentErrorCodes.OPERATION_CANCELED
      ) {
        return;
      }
      Alert.alert('Dokumen', getErrorMessage(error));
    }
  };

  const openFileOptions = () => {
    Alert.alert('Pilih sumber', 'Pilih file dari galeri atau PDF.', [
      { text: 'Galeri', onPress: () => { openGallery(); } },
      { text: 'PDF', onPress: () => { openPdf(); } },
      { text: 'Batal', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View className="flex-row items-center justify-between border-b border-neutral-200 px-5 pb-3 pt-4">
        <Text className="text-[20px] font-semibold text-neutral-900">Pindai struk</Text>
        <Text className="text-2xl text-neutral-500">ⓘ</Text>
      </View>

      <ScrollView
        className="flex-1 px-5 py-4"
        contentContainerClassName="gap-2.5 pb-6"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          className="h-44 items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-100"
          onPress={() => {
            if (!isSubmitting) {
              openCamera();
            }
          }}
        >
          <View className="h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
            <Text className="text-2xl text-blue-700">◉</Text>
          </View>
          <Text className="mt-3 text-lg font-semibold text-neutral-700">Foto atau unggah struk</Text>
          <Text className="mt-1 text-sm text-neutral-500">Ketuk untuk buka kamera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          className="h-14 items-center justify-center rounded-xl bg-blue-700"
          disabled={isSubmitting}
          onPress={() => {
            openCamera();
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-lg font-semibold text-white">Buka kamera</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          className="h-14 items-center justify-center rounded-xl border border-neutral-300"
          disabled={isSubmitting}
          onPress={openFileOptions}
        >
          <Text className="text-lg font-medium text-neutral-600">
            Pilih dari galeri / PDF
          </Text>
        </TouchableOpacity>

        <View className="rounded-xl bg-neutral-100 p-4">
          <Text className="mb-2 text-lg font-medium text-neutral-600">Tips scan optimal</Text>
          <View className="gap-2">
            {TIPS.map(item => (
              <View key={item} className="flex-row items-start gap-2">
                <View className="mt-0.5 h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
                  <Text className="text-xs text-emerald-700">✓</Text>
                </View>
                <Text className="flex-1 text-base leading-6 text-neutral-600">{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="rounded-xl border border-neutral-200 bg-white p-4">
          <Text className="mb-1 text-lg font-medium text-neutral-600">Scan terbaru</Text>
          {isRecentLoading ? (
            <View className="items-center py-6">
              <ActivityIndicator color="#1d4ed8" />
              <Text className="mt-2 text-sm text-neutral-500">Memuat scan terbaru...</Text>
            </View>
          ) : null}

          {!isRecentLoading && recentError ? (
            <View className="rounded-lg border border-red-200 bg-red-50 p-3">
              <Text className="text-sm font-medium text-red-700">{recentError}</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                className="mt-2 self-start rounded-full bg-red-600 px-3 py-1.5"
                onPress={fetchRecentScans}
              >
                <Text className="text-xs font-semibold text-white">Coba lagi</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {!isRecentLoading && !recentError && recentScans.length === 0 ? (
            <Text className="py-3 text-sm text-neutral-500">
              Belum ada transaksi hasil scan.
            </Text>
          ) : null}

          {!isRecentLoading && !recentError
            ? recentScans.map(transaction => {
                const category = getPrimaryCategory(transaction);

                return (
                  <View
                    key={String(transaction.id)}
                    className="flex-row items-center border-b border-neutral-200 py-2.5 last:border-b-0"
                  >
                    <View className="h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                      <Text className="text-lg text-emerald-700">🧾</Text>
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-base font-medium text-neutral-900">
                        {transaction.merchant_name || 'Tanpa Merchant'}
                      </Text>
                      <Text className="text-sm text-neutral-500">
                        {formatTransactionDate(transaction.transaction_date)}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-base font-semibold text-neutral-900">
                        {formatCurrency(transaction.price_total)}
                      </Text>
                      <Text
                        className={`mt-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          CATEGORY_BADGE_CLASS[category] ?? 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {category}
                      </Text>
                    </View>
                  </View>
                );
              })
            : null}
        </View>
      </ScrollView>

      <MainTabBar activeRoute={MAIN_ROUTES.SCAN} />
    </SafeAreaView>
  );
}
