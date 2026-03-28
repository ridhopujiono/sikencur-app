import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform,
  RefreshControl,
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
import Ionicons from '@react-native-vector-icons/ionicons';
import Animated, {
  FadeInDown,
  FadeInUp,
  LinearTransition,
} from 'react-native-reanimated';
import DocumentScanner from 'react-native-document-scanner-plugin';
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

const IMAGE_UPLOAD_OPTIONS = {
  quality: 0.6,
  maxWidth: 1600,
  maxHeight: 1600,
  conversionQuality: 0.6,
};

const IMAGE_UPLOAD_HINT = 'Gambar akan dikompres otomatis sebelum diunggah.';

const CATEGORY_BADGE_CLASS = {
  'Makanan & Minuman': 'bg-emerald-100 text-emerald-700',
  Makanan: 'bg-emerald-100 text-emerald-700',
  Transportasi: 'bg-blue-100 text-blue-700',
  Hiburan: 'bg-amber-100 text-amber-700',
  Kesehatan: 'bg-red-100 text-red-700',
  Belanja: 'bg-violet-100 text-violet-700',
  Lainnya: 'bg-neutral-100 text-neutral-700',
};

const CARD_SHADOW_STYLE = {
  shadowColor: '#0f172a',
  shadowOpacity: 0.05,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 10 },
  elevation: 4,
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

  const ensureCameraPermission = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Izin Kamera',
          message: 'FinSight memerlukan akses kamera untuk memindai struk.',
          buttonPositive: 'Izinkan',
          buttonNegative: 'Tolak',
        },
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
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
      const hasPermission = await ensureCameraPermission();
      if (!hasPermission) {
        Alert.alert('Izin Kamera', 'Akses kamera diperlukan untuk membuka kamera manual.');
        return;
      }

      const result = await launchCamera({
        mediaType: 'photo',
        cameraType: 'back',
        ...IMAGE_UPLOAD_OPTIONS,
        saveToPhotos: false,
      });

      if (result.didCancel) {
        if (Platform.OS === 'android' && !result.assets?.length) {
          Alert.alert(
            'Kamera Manual Tidak Tersedia',
            'Aplikasi kamera bawaan perangkat gagal dibuka. Coba pakai scan otomatis atau pilih file dari galeri/PDF.',
            [
              {
                text: 'Scan otomatis',
                onPress: () => {
                  openAutoScanner();
                },
              },
              {
                text: 'Galeri / PDF',
                onPress: openFileOptions,
              },
              { text: 'Tutup', style: 'cancel' },
            ],
          );
        }
        return;
      }

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
      if (Platform.OS === 'android') {
        Alert.alert(
          'Kamera Manual Gagal',
          'Kamera bawaan perangkat sedang bermasalah. Gunakan scan otomatis atau galeri/PDF dulu.',
          [
            {
              text: 'Scan otomatis',
              onPress: () => {
                openAutoScanner();
              },
            },
            {
              text: 'Galeri / PDF',
              onPress: openFileOptions,
            },
            { text: 'Tutup', style: 'cancel' },
          ],
        );
        return;
      }

      Alert.alert('Kamera', getErrorMessage(error));
    }
  };

  const openAutoScanner = async () => {
    try {
      const hasPermission = await ensureCameraPermission();
      if (!hasPermission) {
        Alert.alert('Izin Kamera', 'Akses kamera diperlukan untuk scan otomatis.');
        return;
      }

      const result = await DocumentScanner.scanDocument({
        maxNumDocuments: 1,
        croppedImageQuality: 70,
        responseType: 'imageFilePath',
      });

      if (!result?.scannedImages?.length || result?.status === 'cancel') {
        return;
      }

      const scannedUri = result.scannedImages[0];
      const uri = scannedUri.startsWith('file://') ? scannedUri : `file://${scannedUri}`;

      await startScan({
        uri,
        name: `scanner-${Date.now()}.jpg`,
        type: 'image/jpeg',
      });
    } catch (error) {
      Alert.alert('Auto Scan', getErrorMessage(error));
    }
  };

  const openGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        ...IMAGE_UPLOAD_OPTIONS,
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
    <SafeAreaView edges={['top']} className="flex-1 bg-neutral-50">
      <View className="border-b border-neutral-200 bg-neutral-50 px-5 pb-4 pt-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-[24px] font-semibold text-neutral-900">Pindai struk</Text>
            <Text className="mt-1 text-sm text-neutral-500">
              Ambil struk lebih cepat, lalu cek hasil OCR tanpa pindah alur.
            </Text>
          </View>
          <View className="h-11 w-11 items-center justify-center rounded-full bg-white" style={CARD_SHADOW_STYLE}>
            <Ionicons name="scan-outline" size={20} color="#1d4ed8" />
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5 py-4"
        contentContainerClassName="gap-3 pb-28"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRecentLoading && recentScans.length > 0}
            onRefresh={fetchRecentScans}
            tintColor="#1d4ed8"
            colors={['#1d4ed8']}
          />
        }
      >
        <Animated.View
          entering={FadeInUp.duration(300)}
          layout={LinearTransition.duration(220)}
          className="overflow-hidden rounded-[28px] bg-blue-700 px-5 pb-5 pt-4"
        >
          <View className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10" />
          <View className="absolute -bottom-10 left-8 h-24 w-24 rounded-full bg-blue-400/25" />

          <Text className="text-xs font-semibold uppercase tracking-[1px] text-blue-100">
            Scan Hub
          </Text>
          <Text className="mt-2 text-[26px] font-semibold text-white">
            Auto detect struk
          </Text>
          <Text className="mt-2 text-sm leading-6 text-blue-100">
            Ketuk area ini untuk scan otomatis dengan crop dan perspective correction.
          </Text>

          <TouchableOpacity
            activeOpacity={0.9}
            className="mt-5 items-center justify-center rounded-[24px] bg-white/12 px-4 py-6"
            onPress={() => {
              if (!isSubmitting) {
                openAutoScanner();
              }
            }}
          >
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Ionicons name="scan-circle-outline" size={34} color="#ffffff" />
              )}
            </View>
            <Text className="mt-4 text-lg font-semibold text-white">Tap untuk mulai scan</Text>
            <Text className="mt-1 text-sm text-blue-100">
              Cocok untuk struk fisik dengan crop otomatis
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(70).duration(280)}
          layout={LinearTransition.duration(220)}
          className="gap-2"
        >
          <TouchableOpacity
            activeOpacity={0.88}
            className="h-14 flex-row items-center justify-center rounded-2xl bg-blue-700"
            disabled={isSubmitting}
            onPress={openAutoScanner}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="scan-outline" size={18} color="#ffffff" />
                <Text className="ml-2 text-lg font-semibold text-white">Scan otomatis</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.88}
            className="h-14 flex-row items-center justify-center rounded-2xl border border-neutral-200 bg-white"
            style={CARD_SHADOW_STYLE}
            disabled={isSubmitting}
            onPress={openCamera}
          >
            <Ionicons name="camera-outline" size={18} color="#525252" />
            <Text className="ml-2 text-base font-medium text-neutral-700">
              Buka kamera manual
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.88}
            className="h-14 flex-row items-center justify-center rounded-2xl border border-neutral-200 bg-white"
            style={CARD_SHADOW_STYLE}
            disabled={isSubmitting}
            onPress={openFileOptions}
          >
            <Ionicons name="images-outline" size={18} color="#525252" />
            <Text className="ml-2 text-base font-medium text-neutral-700">
              Pilih dari galeri / PDF
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(110).duration(280)}
          layout={LinearTransition.duration(220)}
          className="rounded-[26px] border border-neutral-200 bg-white p-4"
          style={CARD_SHADOW_STYLE}
        >
          <Text className="mb-3 text-base font-semibold text-neutral-900">Tips scan optimal</Text>
          <View className="gap-3">
            {TIPS.map(item => (
              <View key={item} className="flex-row items-start rounded-2xl bg-neutral-50 px-3 py-3">
                <View className="mr-3 mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
                  <Ionicons name="checkmark" size={14} color="#047857" />
                </View>
                <Text className="flex-1 text-sm leading-6 text-neutral-600">{item}</Text>
              </View>
            ))}
          </View>
          <Text className="mt-4 text-sm text-neutral-500">{IMAGE_UPLOAD_HINT}</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(150).duration(300)}
          layout={LinearTransition.duration(220)}
          className="rounded-[26px] border border-neutral-200 bg-white p-4"
          style={CARD_SHADOW_STYLE}
        >
          <View className="mb-3 flex-row items-center justify-between">
            <View>
              <Text className="text-lg font-semibold text-neutral-900">Scan terbaru</Text>
              <Text className="mt-1 text-sm text-neutral-500">
                Riwayat hasil scan struk yang baru diproses.
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.88}
              className="rounded-full bg-neutral-100 px-3 py-1.5"
              onPress={fetchRecentScans}
            >
              <Text className="text-xs font-semibold text-neutral-700">Refresh</Text>
            </TouchableOpacity>
          </View>

          {isRecentLoading ? (
            <View className="items-center rounded-2xl bg-neutral-50 py-8">
              <ActivityIndicator color="#1d4ed8" />
              <Text className="mt-2 text-sm text-neutral-500">Memuat scan terbaru...</Text>
            </View>
          ) : null}

          {!isRecentLoading && recentError ? (
            <View className="rounded-2xl border border-red-200 bg-red-50 p-3">
              <Text className="text-sm font-medium text-red-700">{recentError}</Text>
              <TouchableOpacity
                activeOpacity={0.88}
                className="mt-3 self-start rounded-full bg-red-600 px-3 py-1.5"
                onPress={fetchRecentScans}
              >
                <Text className="text-xs font-semibold text-white">Coba lagi</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {!isRecentLoading && !recentError && recentScans.length === 0 ? (
            <View className="rounded-2xl bg-neutral-50 p-4">
              <Text className="text-sm text-neutral-500">
                Belum ada transaksi hasil scan.
              </Text>
            </View>
          ) : null}

          {!isRecentLoading && !recentError
            ? recentScans.map((transaction, index) => {
                const category = getPrimaryCategory(transaction);

                return (
                  <Animated.View
                    key={String(transaction.id)}
                    entering={FadeInDown.delay(110 + index * 35).duration(220)}
                    layout={LinearTransition.duration(200)}
                    className="mb-2 last:mb-0"
                  >
                    <View className="flex-row items-center rounded-[22px] bg-neutral-50 px-3.5 py-3">
                      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
                        <Ionicons name="receipt-outline" size={22} color="#047857" />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-base font-semibold text-neutral-900">
                          {transaction.merchant_name || 'Tanpa Merchant'}
                        </Text>
                        <Text className="mt-1 text-sm text-neutral-500">
                          {formatTransactionDate(transaction.transaction_date)}
                        </Text>
                      </View>
                      <View className="items-end pl-3">
                        <Text className="text-base font-semibold text-neutral-900">
                          {formatCurrency(transaction.price_total)}
                        </Text>
                        <Text
                          className={`mt-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            CATEGORY_BADGE_CLASS[category] ??
                            'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {category}
                        </Text>
                      </View>
                    </View>
                  </Animated.View>
                );
              })
            : null}
        </Animated.View>
      </ScrollView>

      <MainTabBar activeRoute={MAIN_ROUTES.SCAN} />
    </SafeAreaView>
  );
}
