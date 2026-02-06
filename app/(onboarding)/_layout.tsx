import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="how-it-works" />
      <Stack.Screen name="celebration" />
    </Stack>
  );
}
