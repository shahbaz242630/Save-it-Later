import { Stack } from 'expo-router';
import { AuthProvider } from '@/providers/AuthProvider';
import { ShareReceiverProvider } from '@/providers/ShareReceiverProvider';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ShareReceiverProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="add-item"
            options={{
              headerShown: true,
              title: 'Save Link',
            }}
          />
        <Stack.Screen
          name="item/[id]"
          options={{
            headerShown: true,
            title: 'Saved Item',
          }}
        />
        <Stack.Screen
          name="item/[id]/edit"
          options={{
            headerShown: true,
            title: 'Edit Item',
          }}
        />
          <Stack.Screen
            name="tag/[id]"
            options={{
              headerShown: true,
              title: 'Tag Items',
            }}
          />
        </Stack>
      </ShareReceiverProvider>
    </AuthProvider>
  );
}
