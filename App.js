import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import OnboardingScreen from './src/screens/system/OnboardingScreen';
import SplashScreen from './src/screens/system/SplashScreen';
import './global.css';

const ONBOARDING_STORAGE_KEY = '@sikencur/onboarding-completed';
const SPLASH_MIN_DURATION_MS = 1600;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);
  const [isOnboardingReady, setIsOnboardingReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const startedAt = Date.now();

    const prepareAppExperience = async () => {
      try {
        const storedFlag = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        const splashElapsed = Date.now() - startedAt;
        const remainingSplash = Math.max(0, SPLASH_MIN_DURATION_MS - splashElapsed);

        if (remainingSplash > 0) {
          await new Promise(resolve => {
            setTimeout(resolve, remainingSplash);
          });
        }

        if (!isMounted) {
          return;
        }

        setHasCompletedOnboarding(storedFlag === 'true');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[Onboarding] restore state failed: ${message}`);

        if (!isMounted) {
          return;
        }

        setHasCompletedOnboarding(false);
      } finally {
        if (isMounted) {
          setIsOnboardingReady(true);
          setIsSplashVisible(false);
        }
      }
    };

    prepareAppExperience();

    return () => {
      isMounted = false;
    };
  }, []);

  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[Onboarding] persist state failed: ${message}`);
    } finally {
      setHasCompletedOnboarding(true);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {isSplashVisible || !isOnboardingReady ? (
            <SplashScreen />
          ) : hasCompletedOnboarding ? (
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          ) : (
            <OnboardingScreen onComplete={completeOnboarding} />
          )}
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
