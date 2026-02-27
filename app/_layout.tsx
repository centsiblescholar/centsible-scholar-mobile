import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../src/contexts/AuthContext';
import { RevenueCatProvider } from '../src/providers/RevenueCatProvider';
import { StudentProvider } from '../src/contexts/StudentContext';
import { ThemeProvider, useTheme } from '../src/theme';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function RootNavigator() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.textInverse,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="daily"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{
          title: 'Edit Profile',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="term-tracking"
        options={{
          title: 'Term Tracking',
        }}
      />
      <Stack.Screen
        name="family-meetings"
        options={{
          title: 'Family Meetings',
        }}
      />
      <Stack.Screen
        name="student-management"
        options={{
          title: 'Manage Students',
        }}
      />
      <Stack.Screen
        name="grade-approval"
        options={{
          title: 'Grade Approval',
        }}
      />
      <Stack.Screen
        name="paywall"
        options={{
          presentation: 'modal',
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="manage-subscription"
        options={{
          title: 'Manage Subscription',
        }}
      />
      <Stack.Screen
        name="data-export"
        options={{
          title: 'Export Data',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="delete-account"
        options={{
          title: 'Delete Account',
          headerStyle: { backgroundColor: colors.error },
          headerTintColor: colors.textInverse,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RevenueCatProvider>
          <ThemeProvider>
            <StudentProvider>
              <StatusBar style="auto" />
              <RootNavigator />
            </StudentProvider>
          </ThemeProvider>
        </RevenueCatProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
