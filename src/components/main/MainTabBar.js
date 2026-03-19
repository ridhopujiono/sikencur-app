import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MAIN_ROUTES } from '../../navigation/routes';

const TAB_ITEMS = [
  { label: 'Beranda', route: MAIN_ROUTES.HOME, icon: '⌂' },
  { label: 'Transaksi', route: MAIN_ROUTES.TRANSACTIONS, icon: '≡' },
  { label: 'Scan', route: MAIN_ROUTES.SCAN, icon: '◉' },
  { label: 'DSS', route: MAIN_ROUTES.DSS, icon: '◇' },
  { label: 'Akun', route: MAIN_ROUTES.SETTINGS, icon: '◌' },
];

export default function MainTabBar({ activeRoute }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-row border-t border-neutral-200 bg-white pt-2"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      {TAB_ITEMS.map(item => {
        const isActive = item.route === activeRoute;

        return (
          <TouchableOpacity
            key={item.route}
            activeOpacity={0.8}
            className="flex-1 items-center gap-1 py-1.5"
            onPress={() => navigation.navigate(item.route)}
          >
            <Text
              className={`text-[22px] ${isActive ? 'text-blue-700' : 'text-neutral-400'}`}
            >
              {item.icon}
            </Text>
            <Text
              className={`text-[13px] ${isActive ? 'font-semibold text-blue-700' : 'text-neutral-500'}`}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
