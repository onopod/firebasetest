import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';

export default function Layout() {
  return (
    <PaperProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: '記事一覧' }} />
        <Stack.Screen name="login" options={{ title: 'ログイン' }} />
        <Stack.Screen name="post" options={{ title: '記事投稿' }} />
      </Stack>
    </PaperProvider>
  );
}


