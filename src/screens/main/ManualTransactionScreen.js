import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FadeInView from '../../components/common/FadeInView';
import { storeTransaction, updateTransaction } from '../../api/transactions';

const CATEGORY_OPTIONS = [
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

function getErrorMessage(error) {
  if (typeof error === 'string') return error;
  if (error?.data?.message) return error.data.message;
  if (error?.message) return error.message;
  return 'Gagal menyimpan transaksi manual.';
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

function formatDateTimeForDisplay(date) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
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

function parseApiDate(dateString) {
  if (typeof dateString !== 'string' || dateString.trim() === '') {
    return new Date();
  }

  const normalized = dateString.includes(' ')
    ? dateString.replace(' ', 'T')
    : dateString;
  const parsedDate = new Date(normalized);
  return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
}

export default function ManualTransactionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const editTransaction = route.params?.transaction ?? null;
  const isEditMode = route.params?.mode === 'edit' && editTransaction?.id != null;

  const [merchantName, setMerchantName] = useState(
    isEditMode ? editTransaction?.merchant_name ?? '' : '',
  );
  const [description, setDescription] = useState(
    isEditMode ? editTransaction?.description ?? '' : '',
  );
  const [transactionDate, setTransactionDate] = useState(
    isEditMode ? parseApiDate(editTransaction?.transaction_date) : new Date(),
  );
  const [showIOSPicker, setShowIOSPicker] = useState(false);
  const [taxInput, setTaxInput] = useState(
    isEditMode ? String(editTransaction?.tax ?? '') : '',
  );
  const [serviceChargeInput, setServiceChargeInput] = useState(
    isEditMode ? String(editTransaction?.service_charge ?? '') : '',
  );
  const [items, setItems] = useState(() => {
    if (isEditMode && Array.isArray(editTransaction?.items) && editTransaction.items.length > 0) {
      return editTransaction.items.map(item => ({
        item_name: item?.item_name ?? '',
        price: String(item?.price ?? ''),
        category: item?.category ?? 'Lainnya',
      }));
    }

    return [{ item_name: '', price: '', category: 'Makanan & Minuman' }];
  });
  const [isSaving, setIsSaving] = useState(false);

  const tax = toNumber(taxInput, 0);
  const serviceCharge = toNumber(serviceChargeInput, 0);
  const itemTotal = useMemo(
    () =>
      items.reduce((total, item) => {
        const price = toNumber(item?.price, 0);
        return total + (price > 0 ? price : 0);
      }, 0),
    [items],
  );
  const grandTotal = itemTotal + tax + serviceCharge;

  const updateItem = (index, key, value) => {
    setItems(previous => {
      const next = [...previous];
      next[index] = {
        ...next[index],
        [key]: value,
      };
      return next;
    });
  };

  const addItem = () => {
    setItems(previous => [
      ...previous,
      { item_name: '', price: '', category: 'Lainnya' },
    ]);
  };

  const removeItem = index => {
    if (items.length <= 1) return;
    setItems(previous => previous.filter((_, currentIndex) => currentIndex !== index));
  };

  const openAndroidDateAndTimePicker = () => {
    DateTimePickerAndroid.open({
      mode: 'date',
      value: transactionDate,
      display: 'calendar',
      onChange: (dateEvent, selectedDate) => {
        if (dateEvent.type !== 'set' || !selectedDate) {
          return;
        }

        const datePart = new Date(transactionDate);
        datePart.setFullYear(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
        );

        DateTimePickerAndroid.open({
          mode: 'time',
          value: datePart,
          display: 'clock',
          is24Hour: true,
          onChange: (timeEvent, selectedTime) => {
            if (timeEvent.type !== 'set' || !selectedTime) {
              setTransactionDate(datePart);
              return;
            }

            const finalDate = new Date(datePart);
            finalDate.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
            setTransactionDate(finalDate);
          },
        });
      },
    });
  };

  const openDatePicker = () => {
    if (Platform.OS === 'android') {
      openAndroidDateAndTimePicker();
      return;
    }

    setShowIOSPicker(true);
  };

  const handleSave = async () => {
    const normalizedMerchantName = merchantName.trim();
    if (!normalizedMerchantName) {
      Alert.alert('Validasi', 'Nama merchant wajib diisi.');
      return;
    }

    const normalizedItems = items
      .map(item => ({
        item_name: item?.item_name?.trim() ?? '',
        price: toNumber(item?.price, 0),
        category: item?.category?.trim() || 'Lainnya',
      }))
      .filter(
        item => item.item_name !== '' || item.price > 0 || item.category !== 'Lainnya',
      );

    if (normalizedItems.length === 0) {
      Alert.alert('Validasi', 'Tambahkan minimal satu item transaksi.');
      return;
    }

    const invalidItem = normalizedItems.find(
      item => item.item_name === '' || item.price <= 0,
    );

    if (invalidItem) {
      Alert.alert('Validasi', 'Setiap item wajib punya nama dan harga > 0.');
      return;
    }

    if (grandTotal <= 0) {
      Alert.alert('Validasi', 'Total transaksi harus lebih besar dari 0.');
      return;
    }

    const payload = {
      merchant_name: normalizedMerchantName,
      description: description.trim() || 'Input manual transaksi',
      price_total: grandTotal,
      tax,
      service_charge: serviceCharge,
      transaction_date: formatDateTimeForApi(transactionDate),
      input_method: isEditMode
        ? (editTransaction?.input_method ?? 'manual')
        : 'manual',
      items: normalizedItems,
    };

    try {
      setIsSaving(true);
      if (isEditMode) {
        await updateTransaction(editTransaction.id, payload);
      } else {
        await storeTransaction(payload);
      }
      Alert.alert(
        'Berhasil',
        isEditMode
          ? 'Transaksi berhasil diperbarui.'
          : 'Transaksi manual berhasil disimpan.',
        [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ],
      );
    } catch (error) {
      Alert.alert(
        isEditMode ? 'Update gagal' : 'Simpan gagal',
        getErrorMessage(error),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-row items-center justify-between border-b border-neutral-200 px-5 pb-3 pt-4">
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <Text className="text-base font-medium text-blue-700">‹ Kembali</Text>
          </TouchableOpacity>
          <Text className="text-[20px] font-semibold text-neutral-900">
            {isEditMode ? 'Edit transaksi' : 'Tambah transaksi'}
          </Text>
          <View className="w-14" />
        </View>

        <ScrollView
          className="flex-1 px-5 py-4"
          contentContainerClassName="gap-3 pb-6"
          showsVerticalScrollIndicator={false}
        >
          <FadeInView delay={30}>
            <View className="rounded-xl border border-neutral-200 bg-white p-4">
              <Text className="mb-1 text-sm text-neutral-500">Merchant</Text>
              <TextInput
                value={merchantName}
                onChangeText={setMerchantName}
                className="rounded-xl border border-neutral-300 px-3 py-2.5 text-base text-neutral-900"
                placeholder="Contoh: Indomaret"
                placeholderTextColor="#737373"
              />

              <Text className="mb-1 mt-3 text-sm text-neutral-500">Tanggal transaksi</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                className="rounded-xl border border-neutral-300 px-3 py-3"
                onPress={openDatePicker}
              >
                <Text className="text-base text-neutral-900">
                  {formatDateTimeForDisplay(transactionDate)}
                </Text>
                <Text className="mt-1 text-xs text-neutral-500">
                  Ketuk untuk pilih tanggal dari kalender
                </Text>
              </TouchableOpacity>
            </View>
          </FadeInView>

          <FadeInView delay={90}>
            <View className="rounded-xl border border-neutral-200 bg-white p-4">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-base font-medium text-neutral-700">
                  Item transaksi ({items.length})
                </Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5"
                  onPress={addItem}
                >
                  <Text className="text-sm font-semibold text-emerald-700">+ Item</Text>
                </TouchableOpacity>
              </View>

              {items.map((item, index) => (
                <FadeInView
                  key={`manual-item-${index}`}
                  delay={Math.min(130 + index * 35, 280)}
                >
                  <View className="mb-3 rounded-xl border border-neutral-200 p-3 last:mb-0">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-semibold text-neutral-700">
                        Item {index + 1}
                      </Text>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => removeItem(index)}
                        disabled={items.length <= 1}
                      >
                        <Text
                          className={`text-sm font-semibold ${
                            items.length <= 1 ? 'text-neutral-400' : 'text-red-600'
                          }`}
                        >
                          Hapus
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View className="mt-2 gap-2">
                      <TextInput
                        value={item.item_name}
                        onChangeText={value => updateItem(index, 'item_name', value)}
                        className="rounded-xl border border-neutral-300 px-3 py-2.5 text-base text-neutral-900"
                        placeholder="Nama item"
                        placeholderTextColor="#737373"
                      />
                      <TextInput
                        value={item.price}
                        onChangeText={value => updateItem(index, 'price', value)}
                        className="rounded-xl border border-neutral-300 px-3 py-2.5 text-base text-neutral-900"
                        placeholder="Harga item"
                        placeholderTextColor="#737373"
                        keyboardType="numeric"
                      />
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View className="flex-row gap-1.5 pr-2">
                          {CATEGORY_OPTIONS.map(category => {
                            const isActive = item.category === category;
                            return (
                              <TouchableOpacity
                                key={`${category}-${index}`}
                                activeOpacity={0.85}
                                className={`rounded-full border px-3 py-1.5 ${
                                  isActive
                                    ? 'border-blue-700 bg-blue-100'
                                    : 'border-neutral-300 bg-transparent'
                                }`}
                                onPress={() => updateItem(index, 'category', category)}
                              >
                                <Text
                                  className={`text-xs ${
                                    isActive
                                      ? 'font-semibold text-blue-700'
                                      : 'text-neutral-600'
                                  }`}
                                >
                                  {category}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </ScrollView>
                    </View>
                  </View>
                </FadeInView>
              ))}
            </View>
          </FadeInView>

          <FadeInView delay={140}>
            <View className="rounded-xl border border-neutral-200 bg-white p-4">
              <Text className="text-base font-medium text-neutral-700">Ringkasan</Text>
              <View className="mt-3 flex-row items-center gap-2">
                <TextInput
                  value={taxInput}
                  onChangeText={setTaxInput}
                  className="flex-1 rounded-xl border border-neutral-300 px-3 py-2.5 text-base text-neutral-900"
                  placeholder="PPN"
                  placeholderTextColor="#737373"
                  keyboardType="numeric"
                />
                <TextInput
                  value={serviceChargeInput}
                  onChangeText={setServiceChargeInput}
                  className="flex-1 rounded-xl border border-neutral-300 px-3 py-2.5 text-base text-neutral-900"
                  placeholder="Service"
                  placeholderTextColor="#737373"
                  keyboardType="numeric"
                />
              </View>

              <Text className="mb-1 mt-3 text-sm text-neutral-500">Deskripsi (opsional)</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                className="min-h-[84px] rounded-xl border border-neutral-300 px-3 py-2.5 text-base text-neutral-900"
                placeholder="Catatan transaksi"
                placeholderTextColor="#737373"
                multiline
                textAlignVertical="top"
              />

              <View className="mt-3 rounded-lg bg-neutral-100 px-3 py-2.5">
                <Text className="text-sm text-neutral-600">Total transaksi</Text>
                <Text className="mt-1 text-xl font-semibold text-neutral-900">
                  {formatCurrency(grandTotal)}
                </Text>
              </View>
            </View>
          </FadeInView>

          <FadeInView delay={190}>
            <TouchableOpacity
              activeOpacity={0.85}
              className={`h-14 items-center justify-center rounded-xl ${
                isSaving ? 'bg-blue-500' : 'bg-blue-700'
              }`}
              disabled={isSaving}
              onPress={handleSave}
            >
              {isSaving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-lg font-semibold text-white">
                  {isEditMode ? 'Update transaksi' : 'Simpan transaksi'}
                </Text>
              )}
            </TouchableOpacity>
          </FadeInView>
        </ScrollView>

        {Platform.OS === 'ios' ? (
          <Modal
            visible={showIOSPicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowIOSPicker(false)}
          >
            <View className="flex-1 justify-end bg-black/35">
              <FadeInView delay={40} offset={20}>
                <View className="rounded-t-3xl bg-white px-5 pb-7 pt-5">
                  <View className="mb-3 h-1.5 w-14 self-center rounded-full bg-neutral-300" />
                  <Text className="text-lg font-semibold text-neutral-900">Pilih tanggal</Text>

                  <DateTimePicker
                    value={transactionDate}
                    mode="datetime"
                    display="spinner"
                    onChange={(event, selectedDate) => {
                      if (event.type === 'set' && selectedDate) {
                        setTransactionDate(selectedDate);
                      }
                    }}
                  />

                  <TouchableOpacity
                    activeOpacity={0.85}
                    className="mt-2 h-12 items-center justify-center rounded-xl bg-blue-700"
                    onPress={() => setShowIOSPicker(false)}
                  >
                    <Text className="text-base font-semibold text-white">Selesai</Text>
                  </TouchableOpacity>
                </View>
              </FadeInView>
            </View>
          </Modal>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
