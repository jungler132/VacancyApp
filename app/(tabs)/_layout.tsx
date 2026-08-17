import { memo, useCallback, useMemo } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
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
import { colors, fonts } from '@/lib/theme';
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
  name: 'magnify' | 'briefcase-account' | 'account' | 'book-open-variant';
  color: string;
  focused: boolean;
}) {
  const icon =
    name === 'account'
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
  return (
    <View style={styles.iconWrap}>
      {focused ? <View style={styles.indicator} /> : <View style={styles.indicatorSpacer} />}
      <MaterialDesignIcons name={icon} color={color} size={22} />
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

const TAB_LABEL_WIDTH = Math.floor(Dimensions.get('window').width / 4) - 6;

const TabLabel = memo(function TabLabel({
  children,
  color,
}: {
  children: string;
  color: string;
}) {
  return (
    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.72}
      allowFontScaling={false}
      style={[styles.label, { color, maxWidth: TAB_LABEL_WIDTH }]}>
      {children}
    </Text>
  );
});

export default function TabLayout() {
  useJobsQuery();
  const tabBar = useTabBarLayout();
  const t = useT();

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
          tabBarItemStyle: { paddingHorizontal: 0 },
          tabBarAllowFontScaling: false,
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: fonts.bold, fontSize: 18 },
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'rgba(8, 12, 20, 0.92)',
            borderTopColor: 'rgba(255,255,255,0.08)',
            borderTopWidth: StyleSheet.hairlineWidth,
            elevation: 0,
            height: tabBar.height,
            paddingTop: 4,
            paddingBottom: tabBar.paddingBottom,
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
          }}
        />
      </Tabs>
      <FilterSheetHost />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  iconWrap: { alignItems: 'center', minWidth: 28 },
  label: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    textAlign: 'center',
    marginTop: 2,
    paddingHorizontal: 1,
  },
  indicator: {
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginBottom: 4,
  },
  indicatorSpacer: { width: 16, height: 3, marginBottom: 4 },
});
