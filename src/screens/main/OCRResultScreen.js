import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import Animated, {
  FadeInDown,
  FadeInUp,
  LinearTransition,
} from 'react-native-reanimated';
import { MAIN_ROUTES } from '../../navigation/routes';
import { getReceiptScanStatus } from '../../api/scan';
import { storeTransaction } from '../../api/transactions';

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

function toInputValue(value) {
  if (value == null) return '';
  return String(value);
}

function createEditableScanData(rawData) {
  const items = Array.isArray(rawData?.item) ? rawData.item : [];

  return {
    merchant: rawData?.merchant ?? '',
    transaction_date: rawData?.transaction_date ?? '',
    price_total: toInputValue(rawData?.price_total),
    tax: toInputValue(rawData?.tax),
    service_charge: toInputValue(rawData?.service_charge),
    description: rawData?.description ?? '',
    duration_analyzed_image: rawData?.duration_analyzed_image ?? null,
    accuration_analyzed_image: rawData?.accuration_analyzed_image ?? null,
    item: items.map((item, index) => ({
      item_name: item?.item_name?.trim() || `Item ${index + 1}`,
      price: toInputValue(item?.price),
      transaction_category:
        item?.transaction_category?.trim() || item?.category?.trim() || 'Lainnya',
    })),
  };
}

export default function OCRResultScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const scanId = route.params?.scanId ?? null;
  const initialStatus = route.params?.initialStatus ?? (scanId ? 'pending' : 'idle');

  const [status, setStatus] = useState(initialStatus);
  const [scanData, setScanData] = useState(null);
  const [editedScanData, setEditedScanData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

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
          const nextScanData = createEditableScanData(response?.data?.data?.[0] ?? null);
          setScanData(nextScanData);
          setEditedScanData(nextScanData);
          setIsEditing(false);
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
        const nextScanData = createEditableScanData(response?.data?.data?.[0] ?? null);
        setScanData(nextScanData);
        setEditedScanData(nextScanData);
        setIsEditing(false);
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsRefreshing(false);
    }
  };

  const updateEditedField = (key, value) => {
    setEditedScanData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [key]: value,
      };
    });
  };

  const updateEditedItemField = (index, key, value) => {
    setEditedScanData(prev => {
      if (!prev) return prev;

      const nextItems = [...(prev.item ?? [])];
      if (!nextItems[index]) return prev;

      nextItems[index] = {
        ...nextItems[index],
        [key]: value,
      };

      return {
        ...prev,
        item: nextItems,
      };
    });
  };

  const addEditedItem = () => {
    animateNextLayout();
    setEditedScanData(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        item: [
          ...(prev.item ?? []),
          {
            item_name: `Item ${(prev.item?.length ?? 0) + 1}`,
            price: '',
            transaction_category: 'Lainnya',
          },
        ],
      };
    });
  };

  const removeEditedItem = index => {
    animateNextLayout();
    setEditedScanData(prev => {
      if (!prev) return prev;

      const nextItems = [...(prev.item ?? [])];
      if (nextItems.length <= 1) return prev;

      nextItems.splice(index, 1);

      return {
        ...prev,
        item: nextItems,
      };
    });
  };

  const openEditMode = () => {
    if (!scanData || isSaved) return;
    setEditedScanData(createEditableScanData(scanData));
    setIsEditing(true);
  };

  const cancelEditMode = () => {
    setEditedScanData(createEditableScanData(scanData));
    setIsEditing(false);
  };

  const applyEditedChanges = () => {
    if (!editedScanData) return;
    setScanData(createEditableScanData(editedScanData));
    setIsEditing(false);
  };

  const saveTransaction = async () => {
    const sourceData = isEditing ? editedScanData : scanData;

    if (status !== 'completed' || !sourceData || isSaving || isSaved) {
      return;
    }

    try {
      setIsSaving(true);
      const payload = buildStorePayload(sourceData);
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
    <SafeAreaView edges={['top']} className="flex-1 bg-neutral-50">
      <View className="border-b border-neutral-200 bg-neutral-50 px-5 pb-4 pt-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            activeOpacity={0.88}
            className="h-11 w-11 items-center justify-center rounded-full bg-white"
            style={CARD_SHADOW_STYLE}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={20} color="#1d4ed8" />
          </TouchableOpacity>
          <View className="flex-1 px-4">
            <Text className="text-center text-[22px] font-semibold text-neutral-900">
              Hasil scan
            </Text>
            <Text className="mt-1 text-center text-xs text-neutral-500">
              Review hasil OCR sebelum disimpan jadi transaksi.
            </Text>
          </View>
          <View className="h-11 w-11" />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5 py-4"
        contentContainerClassName="gap-3 pb-8"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInUp.duration(300)}
          layout={LinearTransition.duration(220)}
          className={`overflow-hidden rounded-[28px] px-5 pb-5 pt-4 ${
            status === 'completed'
              ? 'bg-emerald-600'
              : status === 'failed' || status === 'error'
                ? 'bg-red-600'
                : 'bg-blue-700'
          }`}
        >
          <View className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10" />
          <Text className="text-xs font-semibold uppercase tracking-[1px] text-white/80">
            OCR Status
          </Text>
          <View className="mt-4 flex-row items-start">
            <View className="mr-4 h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              {status === 'completed' ? (
                <Ionicons name="checkmark" size={28} color="#ffffff" />
              ) : status === 'failed' || status === 'error' ? (
                <Ionicons name="close" size={28} color="#ffffff" />
              ) : (
                <ActivityIndicator color="#ffffff" />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-xl font-semibold text-white">
                {status === 'completed'
                  ? 'OCR selesai diproses'
                  : status === 'failed' || status === 'error'
                    ? 'OCR gagal diproses'
                    : 'OCR sedang diproses'}
              </Text>
              <Text className="mt-2 text-sm text-white/80">
                Scan ID: {scanId ?? '-'} · status: {status}
              </Text>
              {errorMessage ? (
                <Text className="mt-2 text-sm text-red-100">{errorMessage}</Text>
              ) : null}
            </View>
          </View>
        </Animated.View>

        {scanData ? (
          <>
            <Animated.View
              entering={FadeInDown.delay(70).duration(280)}
              layout={LinearTransition.duration(220)}
              className="rounded-[26px] border border-neutral-200 bg-white p-4"
              style={CARD_SHADOW_STYLE}
            >
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-base font-medium text-neutral-600">Informasi struk</Text>
                {!isEditing ? (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5"
                    onPress={openEditMode}
                    disabled={isSaved}
                  >
                    <Text className="text-sm font-semibold text-blue-700">Edit</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {!isEditing ? (
                receiptFields.map(field => (
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
                ))
              ) : (
                <View className="gap-3">
                  <View>
                    <Text className="mb-1 text-sm text-neutral-500">Nama toko</Text>
                    <TextInput
                      value={editedScanData?.merchant ?? ''}
                      onChangeText={value => updateEditedField('merchant', value)}
                      className="rounded-xl border border-neutral-300 px-3 py-2.5 text-base text-neutral-900"
                      placeholder="Contoh: Indomaret"
                      placeholderTextColor="#737373"
                    />
                  </View>
                  <View>
                    <Text className="mb-1 text-sm text-neutral-500">Tanggal transaksi</Text>
                    <TextInput
                      value={editedScanData?.transaction_date ?? ''}
                      onChangeText={value => updateEditedField('transaction_date', value)}
                      className="rounded-xl border border-neutral-300 px-3 py-2.5 text-base text-neutral-900"
                      placeholder="YYYY-MM-DD HH:mm:ss"
                      placeholderTextColor="#737373"
                    />
                  </View>
                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <Text className="mb-1 text-sm text-neutral-500">Total bayar</Text>
                      <TextInput
                        value={editedScanData?.price_total ?? ''}
                        onChangeText={value => updateEditedField('price_total', value)}
                        className="rounded-xl border border-neutral-300 px-3 py-2.5 text-base text-neutral-900"
                        placeholder="0"
                        placeholderTextColor="#737373"
                        keyboardType="numeric"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="mb-1 text-sm text-neutral-500">PPN</Text>
                      <TextInput
                        value={editedScanData?.tax ?? ''}
                        onChangeText={value => updateEditedField('tax', value)}
                        className="rounded-xl border border-neutral-300 px-3 py-2.5 text-base text-neutral-900"
                        placeholder="0"
                        placeholderTextColor="#737373"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  <View>
                    <Text className="mb-1 text-sm text-neutral-500">Biaya layanan</Text>
                    <TextInput
                      value={editedScanData?.service_charge ?? ''}
                      onChangeText={value => updateEditedField('service_charge', value)}
                      className="rounded-xl border border-neutral-300 px-3 py-2.5 text-base text-neutral-900"
                      placeholder="0"
                      placeholderTextColor="#737373"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              )}
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(110).duration(280)}
              layout={LinearTransition.duration(220)}
              className="rounded-[26px] border border-neutral-200 bg-white p-4"
              style={CARD_SHADOW_STYLE}
            >
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-base font-medium text-neutral-600">
                  Item terdeteksi ({(isEditing ? editedScanData?.item : scanData.item)?.length ?? 0} item)
                </Text>
                {isEditing ? (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5"
                    onPress={addEditedItem}
                  >
                    <Text className="text-sm font-semibold text-emerald-700">+ Item</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {!isEditing
                ? (scanData.item ?? []).map((item, index) => (
                    <View
                      key={`${item.item_name}-${index}`}
                      className="flex-row border-b border-neutral-200 py-3 last:border-b-0"
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
                  ))
                : (editedScanData?.item ?? []).map((item, index) => (
                    <Animated.View
                      key={`${item.item_name}-${index}`}
                      entering={FadeInDown.delay(60 + index * 30).duration(220)}
                      layout={LinearTransition.duration(200)}
                      className="mb-3 rounded-[22px] border border-neutral-200 p-3 last:mb-0"
                    >
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm font-semibold text-neutral-700">Item {index + 1}</Text>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => removeEditedItem(index)}
                          disabled={(editedScanData?.item ?? []).length <= 1}
                        >
                          <Text
                            className={`text-sm font-semibold ${
                              (editedScanData?.item ?? []).length <= 1
                                ? 'text-neutral-400'
                                : 'text-red-600'
                            }`}
                          >
                            Hapus
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <View className="mt-2 gap-2">
                        <TextInput
                          value={item.item_name ?? ''}
                          onChangeText={value => updateEditedItemField(index, 'item_name', value)}
                          className="rounded-xl border border-neutral-300 px-3 py-2.5 text-base text-neutral-900"
                          placeholder="Nama item"
                          placeholderTextColor="#737373"
                        />
                        <View className="flex-row gap-2">
                          <TextInput
                            value={item.price ?? ''}
                            onChangeText={value => updateEditedItemField(index, 'price', value)}
                            className="flex-1 rounded-xl border border-neutral-300 px-3 py-2.5 text-base text-neutral-900"
                            placeholder="Harga"
                            placeholderTextColor="#737373"
                            keyboardType="numeric"
                          />
                          <TextInput
                            value={item.transaction_category ?? ''}
                            onChangeText={value =>
                              updateEditedItemField(index, 'transaction_category', value)
                            }
                            className="flex-1 rounded-xl border border-neutral-300 px-3 py-2.5 text-base text-neutral-900"
                            placeholder="Kategori"
                            placeholderTextColor="#737373"
                          />
                        </View>
                      </View>
                    </Animated.View>
                  ))}
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(150).duration(280)}
              layout={LinearTransition.duration(220)}
              className="rounded-[26px] border border-neutral-200 bg-white p-4"
              style={CARD_SHADOW_STYLE}
            >
              <Text className="text-base font-medium text-neutral-600">Deskripsi OCR</Text>
              {!isEditing ? (
                <Text className="mt-2 text-sm leading-6 text-neutral-600">
                  {scanData.description || '-'}
                </Text>
              ) : (
                <TextInput
                  value={editedScanData?.description ?? ''}
                  onChangeText={value => updateEditedField('description', value)}
                  className="mt-2 min-h-[88px] rounded-xl border border-neutral-300 px-3 py-2.5 text-base text-neutral-900"
                  placeholder="Catatan transaksi"
                  placeholderTextColor="#737373"
                  multiline
                  textAlignVertical="top"
                />
              )}
            </Animated.View>

            {isEditing ? (
              <Animated.View
                entering={FadeInDown.delay(190).duration(260)}
                className="flex-row gap-2"
              >
                <TouchableOpacity
                  activeOpacity={0.85}
                  className="h-12 flex-1 items-center justify-center rounded-xl border border-neutral-300"
                  onPress={cancelEditMode}
                >
                  <Text className="text-base font-semibold text-neutral-700">Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.85}
                  className="h-12 flex-1 items-center justify-center rounded-xl bg-blue-700"
                  onPress={applyEditedChanges}
                >
                  <Text className="text-base font-semibold text-white">Selesai edit</Text>
                </TouchableOpacity>
              </Animated.View>
            ) : null}
          </>
        ) : (
          <Animated.View
            entering={FadeInDown.delay(70).duration(260)}
            className="rounded-[26px] border border-neutral-200 bg-white p-4"
            style={CARD_SHADOW_STYLE}
          >
            <Text className="text-base font-medium text-neutral-700">
              Menunggu hasil scan...
            </Text>
            <Text className="mt-2 text-sm text-neutral-500">
              Setelah status menjadi completed, detail struk akan muncul di sini.
            </Text>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(230).duration(280)}>
          <TouchableOpacity
            activeOpacity={0.88}
            className={`h-14 flex-row items-center justify-center rounded-2xl ${
              isSaved ? 'bg-emerald-600' : status === 'completed' ? 'bg-blue-700' : 'bg-blue-300'
            }`}
            disabled={status !== 'completed' || !scanData || isSaving || isSaved}
            onPress={saveTransaction}
          >
            {isSaving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#ffffff" />
                <Text className="ml-2 text-lg font-semibold text-white">
                  {isSaved ? 'Transaksi tersimpan' : 'Simpan transaksi'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(260).duration(280)}>
          <TouchableOpacity
            activeOpacity={0.88}
            className="h-14 items-center justify-center rounded-2xl border border-neutral-300 bg-white"
            style={CARD_SHADOW_STYLE}
            onPress={refreshStatus}
          >
            <Text className="text-lg font-medium text-neutral-600">
              {isRefreshing ? 'Memuat...' : 'Cek status lagi'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
