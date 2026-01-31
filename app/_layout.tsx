import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../src/contexts/AuthContext';
import { StudentProvider } from '../src/contexts/StudentContext';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StudentProvider>
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: '#4F46E5',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
          </Stack>
        </StudentProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
