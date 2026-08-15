import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { FiltersSheet } from '@/components/FiltersSheet';
import { useFilterSheet, useJobsQuery } from '@/lib/hooks/useJobsFeed';
import { useTabBarLayout } from '@/lib/layout';
import { colors, fonts } from '@/lib/theme';

const TabIcon = memo(function TabIcon({
  name,
  color,
  focused,
}: {
  name: 'magnify' | 'chart-donut' | 'star' | 'earth';
  color: string;
  focused: boolean;
}) {
  const icon =
    name === 'star'
      ? focused
        ? 'star'
        : 'star-outline'
      : name === 'chart-donut'
        ? focused
          ? 'chart-donut'
          : 'chart-arc'
        : name;
  return (
    <View style={styles.iconWrap}>
      {focused ? <View style={styles.indicator} /> : <View style={styles.indicatorSpacer} />}
      <MaterialDesignIcons name={icon} color={color} size={22} />
    </View>
  );
});

const FilterSheetHost = memo(function FilterSheetHost() {
  const sheet = useFilterSheet();
  return (
    <FiltersSheet
      open={sheet.open}
      region={sheet.region}
      categories={sheet.categories}
      extra={sheet.extra}
      onChangeRegion={sheet.setRegion}
      onToggleCategory={sheet.onToggleCategory}
      onChangeExtra={sheet.setExtra}
      onClose={sheet.onClose}
      onReset={sheet.onReset}
    />
  );
});

export default function TabLayout() {
  useJobsQuery();
  const tabBar = useTabBarLayout();

  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerShown: false,
          freezeOnBlur: true,
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: fonts.bold, fontSize: 22 },
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
          tabBarLabelStyle: { fontSize: 11, fontFamily: fonts.semibold },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.faint,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Вакансии',
            tabBarIcon: ({ color, focused }) => <TabIcon name="magnify" color={String(color)} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: 'Сводка',
            tabBarIcon: ({ color, focused }) => <TabIcon name="chart-donut" color={String(color)} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="saved"
          options={{
            title: 'Избранное',
            headerShown: true,
            tabBarIcon: ({ color, focused }) => <TabIcon name="star" color={String(color)} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="sources"
          options={{
            title: 'Источники',
            headerShown: true,
            tabBarIcon: ({ color, focused }) => <TabIcon name="earth" color={String(color)} focused={focused} />,
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
  indicator: {
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginBottom: 4,
  },
  indicatorSpacer: { width: 16, height: 3, marginBottom: 4 },
});
