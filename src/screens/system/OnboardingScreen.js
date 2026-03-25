import React, { useMemo, useRef, useState } from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

const SLIDES = [
  {
    id: 'overview',
    eyebrow: 'Selamat datang di SiKencur',
    title: 'Catat dan pantau keuangan harian dalam satu aplikasi.',
    description:
      'SiKencur membantu Anda melihat total pengeluaran, kategori terbesar, aktivitas 7 hari terakhir, dan progres budget bulanan dari satu dashboard.',
    icon: 'home-outline',
    imageUrl:
      'https://placehold.co/1200x900/e0f2fe/0f172a?text=Ganti+dengan+gambar+beranda',
    imageLabel: 'Placeholder gambar beranda / dashboard aplikasi',
    accentClass: 'bg-sky-100',
    iconColor: '#0369a1',
  },
  {
    id: 'scan',
    eyebrow: 'Scan struk lebih cepat',
    title: 'Ubah struk belanja menjadi transaksi secara otomatis.',
    description:
      'Gunakan kamera, auto scan dokumen, galeri, atau file PDF untuk membaca struk. Hasil OCR masih bisa diedit sebelum disimpan.',
    icon: 'scan-outline',
    imageUrl:
      'https://placehold.co/1200x900/dbeafe/0f172a?text=Ganti+dengan+gambar+scan+struk',
    imageLabel: 'Placeholder gambar fitur scan struk / OCR',
    accentClass: 'bg-blue-100',
    iconColor: '#1d4ed8',
  },
  {
    id: 'insight',
    eyebrow: 'Insight yang lebih berguna',
    title: 'Pantau transaksi, budget, notifikasi, dan profil DSS.',
    description:
      'Lihat daftar transaksi terfilter, atur budget bulanan, kelola notifikasi, dan jalankan analisis DSS untuk mengenali pola keuangan Anda.',
    icon: 'stats-chart-outline',
    imageUrl:
      'https://placehold.co/1200x900/dcfce7/0f172a?text=Ganti+dengan+gambar+DSS+dan+transaksi',
    imageLabel: 'Placeholder gambar fitur transaksi, budget, dan DSS',
    accentClass: 'bg-emerald-100',
    iconColor: '#059669',
  },
];

export default function OnboardingScreen({ onComplete }) {
  const { width } = useWindowDimensions();
  const scrollViewRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const isLastSlide = activeIndex === SLIDES.length - 1;
  const activeSlide = SLIDES[activeIndex];
  const cardWidth = useMemo(() => Math.max(width - 48, 280), [width]);

  const handleScrollEnd = event => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(Math.min(Math.max(nextIndex, 0), SLIDES.length - 1));
  };

  const goToSlide = nextIndex => {
    const boundedIndex = Math.min(Math.max(nextIndex, 0), SLIDES.length - 1);
    scrollViewRef.current?.scrollTo({ x: boundedIndex * width, animated: true });
    setActiveIndex(boundedIndex);
  };

  const handleNext = () => {
    if (isLastSlide) {
      onComplete();
      return;
    }

    goToSlide(activeIndex + 1);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View className="flex-row items-center justify-between px-6 pb-2 pt-3">
        <View>
          <Text className="text-sm font-semibold uppercase tracking-[2px] text-blue-700">
            Wizard Aplikasi
          </Text>
          <Text className="mt-1 text-sm text-neutral-500">
            Kenali fitur utama sebelum mulai.
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          className="rounded-full border border-neutral-300 px-4 py-2"
          onPress={onComplete}
        >
          <Text className="text-sm font-semibold text-neutral-700">Lewati</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={handleScrollEnd}
      >
        {SLIDES.map(slide => (
          <View key={slide.id} style={{ width }} className="px-6 pb-6 pt-2">
            <View className="flex-1 rounded-[32px] border border-neutral-200 bg-neutral-50 p-5">
              <View
                className={`h-14 w-14 items-center justify-center rounded-2xl ${slide.accentClass}`}
              >
                <Ionicons name={slide.icon} size={28} color={slide.iconColor} />
              </View>

              <Text className="mt-5 text-xs font-semibold uppercase tracking-[2px] text-blue-700">
                {slide.eyebrow}
              </Text>
              <Text className="mt-2 text-[28px] font-extrabold leading-9 text-neutral-900">
                {slide.title}
              </Text>
              <Text className="mt-3 text-base leading-7 text-neutral-600">
                {slide.description}
              </Text>

              <View className="mt-6 flex-1 items-center justify-center">
                <View
                  className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white"
                  style={{ width: cardWidth }}
                >
                  <Image
                    source={{ uri: slide.imageUrl }}
                    className="h-64 w-full bg-neutral-200"
                    resizeMode="cover"
                  />
                  <View className="border-t border-dashed border-neutral-200 bg-neutral-50 px-4 py-3">
                    <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-neutral-500">
                      Placeholder Gambar
                    </Text>
                    <Text className="mt-1 text-sm text-neutral-600">{slide.imageLabel}</Text>
                    <Text className="mt-2 text-xs text-neutral-400">
                      Ganti `imageUrl` slide ini dengan URL gambar final Anda.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View className="px-6 pb-8 pt-2">
        <View className="mb-5 flex-row items-center justify-center gap-2">
          {SLIDES.map((slide, index) => {
            const isActive = index === activeIndex;

            return (
              <View
                key={slide.id}
                className={`h-2.5 rounded-full ${
                  isActive ? 'w-8 bg-blue-700' : 'w-2.5 bg-neutral-300'
                }`}
              />
            );
          })}
        </View>

        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-medium text-neutral-500">
              Slide {activeIndex + 1} dari {SLIDES.length}
            </Text>
            <Text className="mt-1 text-sm text-neutral-400">
              {activeSlide.eyebrow}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            className="flex-row items-center gap-2 rounded-full bg-blue-700 px-5 py-3"
            onPress={handleNext}
          >
            <Text className="text-sm font-semibold text-white">
              {isLastSlide ? 'Mulai' : 'Lanjut'}
            </Text>
            <Ionicons
              name={isLastSlide ? 'checkmark-circle-outline' : 'arrow-forward-outline'}
              size={18}
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
