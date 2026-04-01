import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

export default function InviteRedirectScreen() {
  const params = useLocalSearchParams<{ token?: string }>();

  useEffect(() => {
    const token = typeof params.token === 'string' ? params.token : '';
    if (!token) {
      router.replace('/(auth)/welcome');
      return;
    }

    router.replace(`/(auth)/welcome?invite_token=${encodeURIComponent(token)}` as any);
  }, [params.token]);

  return null;
}
