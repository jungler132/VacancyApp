import { memo, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import type { BottomTabBarButtonProps } from 'expo-router/build/react-navigation/bottom-tabs';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { useJobsQuery } from '@/lib/hooks/useJobsFeed';
import { useTabBarLayout } from '@/lib/layout';
import { noteShellReady } from '@/lib/shellReady';
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
      <MaterialDesignIcons name={icon} color={focused ? colors.accent : color} size={22} />
    </View>
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
  useEffect(() => {
    noteShellReady();
  }, []);
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
            left: 0,
            right: 0,
            bottom: 0,
            marginHorizontal: 0,
            width: '100%',
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
      width: 40,
      height: 28,
      borderRadius: 8,
      backgroundColor: colors.accentDim,
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
