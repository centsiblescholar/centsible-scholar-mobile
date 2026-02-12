import { useEffect, useRef, ReactNode } from 'react';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { getRevenueCatApiKey } from '../constants/revenuecatConfig';
import { useAuth } from '../contexts/AuthContext';

// RevenueCat native SDK doesn't work in Expo Go - only in dev builds
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

interface RevenueCatProviderProps {
  children: ReactNode;
}

export function RevenueCatProvider({ children }: RevenueCatProviderProps) {
  const { user } = useAuth();
  const isConfigured = useRef(false);

  // Configure SDK once on mount (skip in Expo Go)
  useEffect(() => {
    if (isConfigured.current || isExpoGo) return;

    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
    }

    Purchases.configure({ apiKey: getRevenueCatApiKey() });
    isConfigured.current = true;
  }, []);

  // Identify user when auth state changes (skip in Expo Go)
  useEffect(() => {
    if (!isConfigured.current || isExpoGo) return;

    const syncUser = async () => {
      try {
        if (user) {
          await Purchases.logIn(user.id);
        } else {
          await Purchases.logOut();
        }
      } catch (error) {
        console.warn('RevenueCat user sync error:', error);
      }
    };

    syncUser();
  }, [user?.id]);

  return <>{children}</>;
}
