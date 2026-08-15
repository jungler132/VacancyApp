import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_CONTENT = 52;

export function useTabBarLayout() {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, 12);
  const height = TAB_CONTENT + paddingBottom;
  return {
    height,
    paddingBottom,
    listPaddingBottom: height + 20,
  };
}
