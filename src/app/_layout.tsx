import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { GoalsProvider } from '@/lib/goals-store';

export default function RootLayout() {
  const theme = useTheme();
  const isDark = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <GoalsProvider>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: theme.background },
            headerStyle: { backgroundColor: theme.surface },
            headerTintColor: theme.accent,
            headerTitleStyle: { color: theme.text },
            headerShadowVisible: false,
          }}>
          <Stack.Screen name="index" options={{ title: 'Habit Tracker' }} />
          <Stack.Screen name="goal/new" options={{ title: 'Yeni goal', presentation: 'modal' }} />
          <Stack.Screen
            name="goal/[id]"
            options={{ title: "Goal'ı düzenle", presentation: 'modal' }}
          />
        </Stack>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </GoalsProvider>
    </SafeAreaProvider>
  );
}
