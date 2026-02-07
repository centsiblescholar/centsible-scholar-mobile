import { useEffect, useRef, ReactNode } from 'react';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { getRevenueCatApiKey } from '../constants/revenuecatConfig';
import { useAuth } from '../contexts/AuthContext';

interface RevenueCatProviderProps {
  children: ReactNode;
}

export function RevenueCatProvider({ children }: RevenueCatProviderProps) {
  const { user } = useAuth();
  const isConfigured = useRef(false);

  // Configure SDK once on mount
  useEffect(() => {
    if (isConfigured.current) return;

    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
    }

    Purchases.configure({ apiKey: getRevenueCatApiKey() });
    isConfigured.current = true;
  }, []);

  // Identify user when auth state changes
  useEffect(() => {
    if (!isConfigured.current) return;

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
