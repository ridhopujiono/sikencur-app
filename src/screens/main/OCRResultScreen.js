import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MAIN_ROUTES } from '../../navigation/routes';

const RECEIPT_FIELDS = [
  { label: 'Nama toko', value: 'Indomaret Malang' },
  { label: 'Tanggal', value: '16 Maret 2025' },
  { label: 'Total bayar', value: 'Rp 87.500', emphasized: true },
  { label: 'PPN (10%)', value: 'Rp 7.500' },
  { label: 'Metode bayar', value: 'Tunai' },
];

const OCR_ITEMS = [
  { id: 'item-1', name: 'Beras Premium 5kg', category: 'Makanan pokok', price: 'Rp 62.000' },
  { id: 'item-2', name: 'Susu UHT Full Cream 1L', category: 'Minuman', price: 'Rp 18.000' },
  { id: 'item-3', name: 'Teh Celup Sariwangi 25pcs', category: 'Minuman', price: 'Rp 7.500' },
];

export default function OCRResultScreen() {
  const navigation = useNavigation();

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
        <View className="flex-row items-start gap-2 rounded-lg bg-emerald-100 p-4">
          <Text className="text-lg text-emerald-700">✓</Text>
          <View className="flex-1">
            <Text className="text-base font-semibold text-emerald-800">OCR berhasil — akurasi 96%</Text>
            <Text className="mt-0.5 text-sm text-emerald-700">
              PaddleOCR PP-OCRv5 · diproses 1.2 detik
            </Text>
          </View>
        </View>

        <View className="rounded-xl border border-neutral-200 bg-white p-4">
          <Text className="mb-1 text-base font-medium text-neutral-600">Informasi struk</Text>
          {RECEIPT_FIELDS.map(field => (
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
            Item terdeteksi ({OCR_ITEMS.length} item)
          </Text>
          {OCR_ITEMS.map(item => (
            <View key={item.id} className="flex-row border-b border-neutral-200 py-2.5 last:border-b-0">
              <View className="flex-1">
                <Text className="text-base font-medium text-neutral-900">{item.name}</Text>
                <Text className="mt-1 text-sm text-neutral-500">{item.category}</Text>
              </View>
              <Text className="text-base font-semibold text-neutral-900">{item.price}</Text>
            </View>
          ))}
          <TouchableOpacity activeOpacity={0.85} className="mt-2 flex-row items-center gap-2 py-1">
            <View className="h-5 w-5 items-center justify-center rounded-full border border-dashed border-neutral-400">
              <Text className="text-xs text-neutral-400">+</Text>
            </View>
            <Text className="text-sm text-neutral-500">Tambah item yang tidak terdeteksi</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          className="h-14 items-center justify-center rounded-xl bg-blue-700"
          onPress={() => navigation.navigate(MAIN_ROUTES.TRANSACTIONS)}
        >
          <Text className="text-lg font-semibold text-white">Simpan transaksi</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          className="h-14 items-center justify-center rounded-xl border border-neutral-300"
        >
          <Text className="text-lg font-medium text-neutral-600">Edit semua field</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
