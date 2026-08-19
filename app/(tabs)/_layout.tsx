import { memo, useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import type { BottomTabBarButtonProps } from 'expo-router/build/react-navigation/bottom-tabs';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { FiltersSheet } from '@/components/FiltersSheet';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { alertLabel, makeAlertKey } from '@/lib/alerts';
import { useFilterSheet, useJobsQuery } from '@/lib/hooks/useJobsFeed';
import { useTabBarLayout } from '@/lib/layout';
import { requestAlertPermission } from '@/lib/notifications';
import { applySearch } from '@/lib/store/filtersSlice';
import { removeSearch, saveSearch, toggleSearch } from '@/lib/store/alertsSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { selectActiveFeed, selectVisibleCount, selectVisibleIds } from '@/lib/store/selectors';
import { fonts, shadowsFor, useAppTheme, useThemedStyles, type ColorSchemeName, type ThemeColors } from '@/lib/theme';
import { useT } from '@/lib/i18n/useT';

const TabBarButton = memo(function TabBarButton({
  children,
  style,
  onPress,
  onLongPress,
  accessibilityState,
  accessibilityLabel,
  accessibilityRole,
  testID,
}: BottomTabBarButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={style}
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole ?? 'button'}
      testID={testID}
      android_ripple={null}>
      {children}
    </Pressable>
  );
});

const TabIcon = memo(function TabIcon({
  name,
  color,
  focused,
}: {
  name: 'magnify' | 'briefcase-account' | 'account' | 'cog' | 'book-open-variant';
  color: string;
  focused: boolean;
}) {
  const icon =
    name === 'cog'
      ? focused
        ? 'cog'
        : 'cog-outline'
      : name === 'account'
        ? focused
          ? 'account'
          : 'account-outline'
        : name === 'briefcase-account'
        ? focused
          ? 'briefcase-account'
          : 'briefcase-account-outline'
        : name === 'book-open-variant'
          ? focused
            ? 'book-open-variant'
            : 'book-open-outline'
          : name;
  const colors = useAppTheme().colors;
  const styles = useThemedStyles(tabStyles);
  return (
    <View style={styles.iconWrap}>
      {focused ? <View pointerEvents="none" style={styles.iconPill} /> : null}
      <MaterialDesignIcons name={icon} color={focused ? colors.onPrimaryContainer : color} size={22} />
    </View>
  );
});

const FilterSheetHost = memo(function FilterSheetHost() {
  const dispatch = useAppDispatch();
  const sheet = useFilterSheet();
  const locale = useAppSelector((state) => state.appearance.locale);
  const count = useAppSelector(selectVisibleCount);
  const visibleIds = useAppSelector(selectVisibleIds);
  const status = useAppSelector((state) => selectActiveFeed(state).status);
  const alerts = useAppSelector((state) => state.alerts.items);
  const resultCount = status === 'loading' && count === 0 ? null : count;
  const snapshot = useMemo(
    () => ({
      query: sheet.query ?? '',
      region: sheet.region,
      categories: sheet.categories,
      extra: sheet.extra,
    }),
    [sheet.query, sheet.region, sheet.categories, sheet.extra],
  );
  const currentKey = makeAlertKey(snapshot);
  const watching = alerts.some((item) => item.enabled && makeAlertKey(item) === currentKey);
  const watches = useMemo(
    () => alerts.map((item) => ({ id: item.id, label: alertLabel(item, locale), enabled: item.enabled })),
    [alerts, locale],
  );

  const onToggleWatch = useCallback(() => {
    const match = alerts.find((item) => makeAlertKey(item) === currentKey);
    if (match?.enabled) {
      dispatch(removeSearch(match.id));
      return;
    }
    requestAlertPermission().catch(() => undefined);
    dispatch(saveSearch({ ...snapshot, lastSeenIds: visibleIds }));
  }, [alerts, currentKey, dispatch, snapshot, visibleIds]);

  const onOpenWatch = useCallback(
    (id: string) => {
      const alert = alerts.find((item) => item.id === id);
      if (alert) dispatch(applySearch(alert));
    },
    [alerts, dispatch],
  );

  return (
    <FiltersSheet
      open={sheet.open}
      region={sheet.region}
      categories={sheet.categories}
      extra={sheet.extra}
      resultCount={resultCount}
      watching={watching}
      watches={watches}
      onToggleWatch={onToggleWatch}
      onOpenWatch={onOpenWatch}
      onRemoveWatch={(id) => dispatch(removeSearch(id))}
      onToggleWatchEnabled={(id) => dispatch(toggleSearch(id))}
      onChangeRegion={sheet.setRegion}
      onToggleCategory={sheet.onToggleCategory}
      onChangeExtra={sheet.setExtra}
      onClose={sheet.onClose}
      onReset={sheet.onReset}
    />
  );
});

const TabLabel = memo(function TabLabel({
  children,
  color,
}: {
  children: string;
  color: string;
}) {
  const styles = useThemedStyles(tabStyles);
  return (
    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.55}
      allowFontScaling={false}
      style={[styles.label, { color }]}>
      {children}
    </Text>
  );
});

export default function TabLayout() {
  useJobsQuery();
  const tabBar = useTabBarLayout();
  const t = useT();
  const { colors, scheme } = useAppTheme();
  const styles = useThemedStyles(tabStyles);
  const tabShadows = shadowsFor(scheme);

  return (
    <View style={styles.root}>
      <ScreenBackdrop />
      <Tabs
        detachInactiveScreens={false}
        screenOptions={{
          headerShown: false,
          freezeOnBlur: false,
          lazy: true,
          animation: 'none',
          tabBarButton: (props) => <TabBarButton {...props} />,
          tabBarItemStyle: { paddingHorizontal: 0, minWidth: 0 },
          tabBarAllowFontScaling: false,
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: fonts.bold, fontSize: 18 },
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: colors.card,
            borderTopColor: colors.cardBorder,
            borderTopWidth: StyleSheet.hairlineWidth,
            height: tabBar.height,
            paddingTop: 6,
            paddingBottom: tabBar.paddingBottom,
            ...tabShadows.tabBar,
          },
          tabBarLabel: ({ children, color }) => <TabLabel color={String(color)}>{String(children)}</TabLabel>,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.faint,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: t('tab.jobs'),
            tabBarIcon: ({ color, focused }) => <TabIcon name="magnify" color={String(color)} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="services"
          options={{
            title: t('tab.services'),
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="briefcase-account" color={String(color)} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="telegram"
          options={{
            title: t('tab.resources'),
            tabBarIcon: ({ color, focused }) => <TabIcon name="book-open-variant" color={String(color)} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('tab.profile'),
            tabBarIcon: ({ color, focused }) => <TabIcon name="account" color={String(color)} focused={focused} />,
            freezeOnBlur: true,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t('tab.settings'),
            tabBarIcon: ({ color, focused }) => <TabIcon name="cog" color={String(color)} focused={focused} />,
          }}
        />
      </Tabs>
      <FilterSheetHost />
    </View>
  );
}

function tabStyles(colors: ThemeColors) {
  return {
    root: { flex: 1, backgroundColor: colors.bg },
    iconWrap: {
      width: 44,
      height: 32,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      overflow: 'visible' as const,
    },
    iconPill: {
      position: 'absolute' as const,
      width: 44,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primaryContainer,
    },
    label: {
      fontSize: 10,
      lineHeight: 12,
      fontFamily: fonts.semibold,
      textAlign: 'center' as const,
      marginTop: 2,
      width: '100%' as const,
      includeFontPadding: false,
    },
  };
}
