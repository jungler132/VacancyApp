import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';

import { exchangeAuthUrl } from '@/lib/backend/auth';
import { useFormStyles } from '@/components/FormField';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const formStyles = useFormStyles();

  useEffect(() => {
    Linking.getInitialURL()
      .then((url) => (url ? exchangeAuthUrl(url) : undefined))
      .finally(() => router.replace('/(tabs)/settings'));
  }, [router]);

  return <View style={formStyles.screen} />;
}
