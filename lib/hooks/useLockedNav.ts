import { useCallback } from 'react';
import { useRouter, type Href } from 'expo-router';

import { beginNav, hrefKey } from '@/lib/navLock';

export function useLockedNav() {
  const router = useRouter();
  const push = useCallback(
    (href: Href) => {
      if (!beginNav(hrefKey(href))) return false;
      router.push(href);
      return true;
    },
    [router],
  );
  const replace = useCallback(
    (href: Href) => {
      if (!beginNav(hrefKey(href))) return false;
      router.replace(href);
      return true;
    },
    [router],
  );
  return { push, replace };
}
