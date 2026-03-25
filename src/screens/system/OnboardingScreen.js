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

const WIZARD_1 = require('../../../assets/onboarding/wizard1.png');
const WIZARD_2 = require('../../../assets/onboarding/wizard2.png');
const WIZARD_3 = require('../../../assets/onboarding/wizard3.png');

const SLIDES = [
  {
    id: 'overview',
    eyebrow: 'Selamat datang di SiKencur',
    title: 'Catat dan pantau keuangan harian dalam satu aplikasi.',
    description:
      'SiKencur membantu Anda melihat total pengeluaran, kategori terbesar, aktivitas 7 hari terakhir, dan progres budget bulanan dari satu dashboard.',
    icon: 'home-outline',
    imageSource: WIZARD_1,
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
    imageSource: WIZARD_2,
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
    imageSource: WIZARD_3,
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
            <View className="flex-1 rounded-[32px] bg-white p-5">
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
                <View className="overflow-hidden rounded-[28px]" style={{ width: cardWidth }}>
                  <Image
                    source={slide.imageSource}
                    className="h-64 w-full"
                    resizeMode="contain"
                    style={{ transform: [{ scale: 1.5 }] }}
                  />
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
