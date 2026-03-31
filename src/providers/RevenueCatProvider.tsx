import { useEffect, useRef, ReactNode } from 'react';
import { InteractionManager } from 'react-native';
import { getRevenueCatApiKey } from '../constants/revenuecatConfig';
import { useAuth } from '../contexts/AuthContext';

// Lazy-load react-native-purchases to prevent its TurboModule bridge from
// initialising synchronously at import time.  On iPad (iPadOS 26.4) this
// triggers an NSException during the first-frame window that corrupts the
// Hermes GC and causes EXC_BAD_ACCESS → crash on launch.
let _Purchases: typeof import('react-native-purchases') | null = null;

async function getPurchases() {
  if (!_Purchases) {
    _Purchases = await import('react-native-purchases');
  }
  return _Purchases;
}

interface RevenueCatProviderProps {
  children: ReactNode;
}

export function RevenueCatProvider({ children }: RevenueCatProviderProps) {
  const { user } = useAuth();
  const isConfigured = useRef(false);

  // Configure SDK after initial render completes to avoid crash-on-launch
  // if the native module throws during the critical first-frame window.
  useEffect(() => {
    if (isConfigured.current) return;

    const apiKey = getRevenueCatApiKey();
    if (apiKey.includes('REPLACE_WITH_REAL_KEY')) {
      console.warn('RevenueCat: Using placeholder API key, skipping SDK configuration');
      return;
    }

    const task = InteractionManager.runAfterInteractions(async () => {
      try {
        // Check for Expo Go at runtime (lazy-load expo-constants too)
        const Constants = (await import('expo-constants')).default;
        const { ExecutionEnvironment } = await import('expo-constants');
        if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
          return;
        }

        const { default: Purchases, LOG_LEVEL } = await getPurchases();

        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
        }

        Purchases.configure({ apiKey });
        isConfigured.current = true;
      } catch (error) {
        console.warn('RevenueCat: Failed to configure SDK:', error);
      }
    });

    return () => task.cancel();
  }, []);

  // Identify user when auth state changes
  useEffect(() => {
    if (!isConfigured.current) return;

    const syncUser = async () => {
      try {
        const { default: Purchases } = await getPurchases();
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
