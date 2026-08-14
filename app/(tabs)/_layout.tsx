import { StyleSheet, View, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { colors, fonts } from '@/lib/theme';

function TabIcon({
  focused,
  color,
  ios,
  iosFill,
  android,
}: {
  focused: boolean;
  color: ColorValue;
  ios: 'magnifyingglass' | 'star' | 'globe';
  iosFill: 'magnifyingglass' | 'star.fill' | 'globe';
  android: 'search' | 'star' | 'public';
}) {
  return (
    <View style={styles.iconWrap}>
      {focused ? <View style={styles.indicator} /> : <View style={styles.indicatorSpacer} />}
      <SymbolView
        name={{ ios: focused ? iosFill : ios, android, web: android }}
        tintColor={color}
        size={22}
        weight={focused ? 'bold' : 'regular'}
      />
    </View>
  );
}

function TabBarBackground() {
  return <View style={[StyleSheet.absoluteFill, styles.tabBlur]} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: fonts.bold, fontSize: 22 },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'rgba(8, 12, 20, 0.55)',
          borderTopColor: 'rgba(255,255,255,0.08)',
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 0,
          height: 64,
          paddingTop: 4,
        },
        tabBarBackground: TabBarBackground,
        tabBarLabelStyle: { fontSize: 11, fontFamily: fonts.semibold, marginBottom: 6 },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.faint,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Вакансии',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} ios="magnifyingglass" iosFill="magnifyingglass" android="search" />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Избранное',
          headerShown: true,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} ios="star" iosFill="star.fill" android="star" />
          ),
        }}
      />
      <Tabs.Screen
        name="sources"
        options={{
          title: 'Источники',
          headerShown: true,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} ios="globe" iosFill="globe" android="public" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', minWidth: 28 },
  indicator: {
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginBottom: 4,
    shadowColor: colors.accent,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  indicatorSpacer: { width: 16, height: 3, marginBottom: 4 },
  tabBlur: { backgroundColor: 'rgba(8, 12, 20, 0.82)' },
});
