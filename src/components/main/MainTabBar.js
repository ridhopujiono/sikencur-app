import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { MAIN_ROUTES } from '../../navigation/routes';

const TAB_ITEMS = [
  {
    label: 'Beranda',
    route: MAIN_ROUTES.HOME,
    activeIcon: 'home',
    inactiveIcon: 'home-outline',
  },
  {
    label: 'Transaksi',
    route: MAIN_ROUTES.TRANSACTIONS,
    activeIcon: 'list',
    inactiveIcon: 'list-outline',
  },
  {
    label: 'Scan',
    route: MAIN_ROUTES.SCAN,
    activeIcon: 'scan',
    inactiveIcon: 'scan-outline',
  },
  {
    label: 'DSS',
    route: MAIN_ROUTES.DSS,
    activeIcon: 'stats-chart',
    inactiveIcon: 'stats-chart-outline',
  },
  {
    label: 'Akun',
    route: MAIN_ROUTES.SETTINGS,
    activeIcon: 'person',
    inactiveIcon: 'person-outline',
  },
];

const SCAN_BUTTON_SHADOW_STYLE = {
  shadowColor: '#1d4ed8',
  shadowOpacity: 0.3,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 6 },
  elevation: 8,
};

export default function MainTabBar({ activeRoute }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-row border-t border-neutral-200 bg-white pt-1.5"
      style={{ paddingBottom: Math.max(insets.bottom, 10) }}
    >
      {TAB_ITEMS.map(item => {
        const isActive = item.route === activeRoute;
        const isScan = item.route === MAIN_ROUTES.SCAN;

        if (isScan) {
          return (
            <View key={item.route} className="flex-1 items-center -mt-7">
              <TouchableOpacity
                activeOpacity={0.9}
                className={`h-[64px] w-[64px] items-center justify-center rounded-full ${
                  isActive ? 'bg-blue-700' : 'bg-blue-600'
                }`}
                style={SCAN_BUTTON_SHADOW_STYLE}
                onPress={() => navigation.navigate(item.route)}
              >
                <Ionicons
                  name={isActive ? 'camera' : 'camera-outline'}
                  size={34}
                  color="#ffffff"
                />
              </TouchableOpacity>
              <Text
                className={`mt-1 text-[13px] ${
                  isActive ? 'font-semibold text-blue-700' : 'text-neutral-500'
                }`}
              >
                {item.label}
              </Text>
            </View>
          );
        }

        return (
          <TouchableOpacity
            key={item.route}
            activeOpacity={0.8}
            className="flex-1 items-center gap-1 py-1.5"
            onPress={() => navigation.navigate(item.route)}
          >
            <Ionicons
              name={isActive ? item.activeIcon : item.inactiveIcon}
              size={isActive ? 24 : 23}
              color={isActive ? '#1d4ed8' : '#9ca3af'}
            />
            <Text
              className={`text-[13px] ${
                isActive ? 'font-semibold text-blue-700' : 'text-neutral-500'
              }`}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
