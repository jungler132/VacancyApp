import { memo, useCallback, useRef, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { Text } from '@/components/AppText';
import { useT } from '@/lib/i18n/useT';
import { fonts } from '@/lib/theme';

export const PhotoLightbox = memo(function PhotoLightbox({
  uris,
  index,
  onClose,
}: {
  uris: string[];
  index: number;
  onClose: () => void;
}) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [page, setPage] = useState(index);
  const open = uris.length > 0;

  return (
    <Modal visible={open} animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose}>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: '#07090F' }}>
        <PagerView
          style={{ flex: 1 }}
          initialPage={index}
          onPageSelected={(event) => setPage(event.nativeEvent.position)}>
          {uris.map((uri) => (
            <View key={uri} collapsable={false} style={{ width, height }}>
              <ZoomPage uri={uri} width={width} height={height} />
            </View>
          ))}
        </PagerView>
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            paddingTop: Math.max(insets.top, 12),
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Text style={{ color: '#fff', fontFamily: fonts.semibold, fontSize: 14 }}>
            {page + 1} / {uris.length}
          </Text>
          <Pressable onPress={onClose} hitSlop={12} style={{ paddingVertical: 8, paddingHorizontal: 4 }}>
            <Text style={{ color: '#fff', fontFamily: fonts.semibold, fontSize: 16 }}>{t('photo.close')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
});

const ZoomPage = memo(function ZoomPage({ uri, width, height }: { uri: string; width: number; height: number }) {
  if (Platform.OS === 'ios') {
    return (
      <ScrollView
        style={{ width, height }}
        contentContainerStyle={{ width, height, alignItems: 'center', justifyContent: 'center' }}
        maximumZoomScale={4}
        minimumZoomScale={1}
        centerContent
        bouncesZoom
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}>
        <Image source={{ uri }} style={{ width, height }} resizeMode="contain" />
      </ScrollView>
    );
  }
  return <AndroidZoom uri={uri} width={width} height={height} />;
});

const AndroidZoom = memo(function AndroidZoom({
  uri,
  width,
  height,
}: {
  uri: string;
  width: number;
  height: number;
}) {
  const [scale, setScale] = useState(1);
  const start = useRef(1);
  const dist0 = useRef(0);
  const lastTap = useRef(0);

  const onTouchStart = useCallback((event: { nativeEvent: { touches: { pageX: number; pageY: number }[] } }) => {
    const touches = event.nativeEvent.touches;
    if (touches.length >= 2) {
      dist0.current = Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
      start.current = scale;
      return;
    }
    const now = Date.now();
    if (now - lastTap.current < 280) {
      setScale((value) => (value > 1 ? 1 : 2.4));
    }
    lastTap.current = now;
  }, [scale]);

  const onTouchMove = useCallback((event: { nativeEvent: { touches: { pageX: number; pageY: number }[] } }) => {
    const touches = event.nativeEvent.touches;
    if (touches.length < 2 || dist0.current < 8) return;
    const dist = Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
    const next = Math.min(4, Math.max(1, start.current * (dist / dist0.current)));
    setScale(next);
  }, []);

  return (
    <View
      style={{ width, height, alignItems: 'center', justifyContent: 'center' }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={onTouchStart}
      onResponderMove={onTouchMove}>
      <Image
        source={{ uri }}
        resizeMode="contain"
        style={{ width, height, transform: [{ scale }] }}
      />
    </View>
  );
});
