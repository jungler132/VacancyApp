import { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { Text } from '@/components/AppText';
import { APPLY_STATUSES, type ApplyStatus } from '@/lib/apply';
import { keyOf } from '@/lib/i18n';
import { useT } from '@/lib/i18n/useT';
import { jobsForStatus } from '@/lib/pipeline';
import type { Job } from '@/lib/types';
import { fonts, radius, useColors, useThemedStyles, type ThemeColors } from '@/lib/theme';

type SectionBox = { y: number; height: number };

export const PipelineBoard = memo(function PipelineBoard({
  jobs,
  statuses,
  onOpen,
  onDrop,
}: {
  jobs: Job[];
  statuses: Record<string, ApplyStatus>;
  onOpen: (job: Job) => void;
  onDrop: (job: Job, status: ApplyStatus) => void;
}) {
  const t = useT();
  const colors = useColors();
  const styles = useThemedStyles(pipelineBoardStyles);
  const { height: windowH } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const containerOrigin = useRef({ x: 0, y: 0 });
  const sections = useRef(new Map<ApplyStatus, SectionBox>());
  const dragOrigin = useRef({ x: 0, y: 0 });
  const dragPos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [drag, setDrag] = useState<{ job: Job; from: ApplyStatus; width: number; height: number } | null>(null);
  const [over, setOver] = useState<ApplyStatus | null>(null);
  const grouped = useMemo(
    () => APPLY_STATUSES.map((item) => ({ ...item, jobs: jobsForStatus(jobs, statuses, item.id) })),
    [jobs, statuses],
  );

  const statusAtPoint = useCallback((pageY: number) => {
    const y = scrollY.current + (pageY - containerOrigin.current.y);
    for (const item of APPLY_STATUSES) {
      const box = sections.current.get(item.id);
      if (!box) continue;
      if (y >= box.y && y <= box.y + box.height) return item.id;
    }
    return null;
  }, []);

  const autoScroll = useCallback(
    (pageY: number) => {
      const edge = 72;
      let next = scrollY.current;
      if (pageY < edge) next = Math.max(0, scrollY.current - 18);
      else if (pageY > windowH - edge) next = scrollY.current + 18;
      else return;
      scrollY.current = next;
      scrollRef.current?.scrollTo({ y: next, animated: false });
    },
    [windowH],
  );

  const endDrag = useCallback(
    (job: Job, from: ApplyStatus, pageY: number) => {
      const next = statusAtPoint(pageY);
      setDrag(null);
      setOver(null);
      if (next && next !== from) onDrop(job, next);
    },
    [onDrop, statusAtPoint],
  );

  return (
    <View
      style={styles.screen}
      onLayout={(event) => {
        event.currentTarget.measureInWindow((x, y) => {
          containerOrigin.current = { x, y };
        });
      }}>
      <ScrollView
        ref={scrollRef}
        scrollEnabled={!drag}
        scrollEventThrottle={16}
        onScroll={(event) => {
          scrollY.current = event.nativeEvent.contentOffset.y;
        }}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.hint}>{t('pipeline.dragHint')}</Text>
        {grouped.map((item) => (
          <View
            key={item.id}
            collapsable={false}
            onLayout={(event) => {
              const { y, height } = event.nativeEvent.layout;
              sections.current.set(item.id, { y, height });
            }}
            style={[styles.section, over === item.id && styles.sectionOn]}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>{t(keyOf('apply', item.id))}</Text>
              <Text style={styles.sectionCount}>{item.jobs.length}</Text>
            </View>
            {item.jobs.length ? (
              item.jobs.map((job) => (
                <PipelineCard
                  key={job.id}
                  job={job}
                  status={item.id}
                  hidden={drag?.job.id === job.id}
                  colors={colors}
                  onOpen={onOpen}
                  onDragStart={(next) => {
                    dragOrigin.current = { x: next.x, y: next.y };
                    dragPos.setValue({
                      x: next.x - containerOrigin.current.x,
                      y: next.y - containerOrigin.current.y,
                    });
                    setDrag({ job, from: item.id, width: next.width, height: next.height });
                    setOver(item.id);
                  }}
                  onDragMove={(pageY, dx, dy) => {
                    dragPos.setValue({
                      x: dragOrigin.current.x + dx - containerOrigin.current.x,
                      y: dragOrigin.current.y + dy - containerOrigin.current.y,
                    });
                    autoScroll(pageY);
                    const hit = statusAtPoint(pageY);
                    setOver((current) => (current === hit ? current : hit));
                  }}
                  onDragEnd={(pageY) => endDrag(job, item.id, pageY)}
                />
              ))
            ) : (
              <Text style={styles.empty}>{t('pipeline.columnEmpty')}</Text>
            )}
          </View>
        ))}
      </ScrollView>
      {drag ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ghost,
            {
              width: drag.width,
              height: drag.height,
              transform: dragPos.getTranslateTransform(),
            },
          ]}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {drag.job.title}
          </Text>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {[drag.job.company, drag.job.sourceName].filter(Boolean).join(' · ')}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
});

const PipelineCard = memo(function PipelineCard({
  job,
  status,
  hidden,
  colors,
  onOpen,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  job: Job;
  status: ApplyStatus;
  hidden: boolean;
  colors: ThemeColors;
  onOpen: (job: Job) => void;
  onDragStart: (box: { x: number; y: number; width: number; height: number }) => void;
  onDragMove: (pageY: number, dx: number, dy: number) => void;
  onDragEnd: (pageY: number) => void;
}) {
  const styles = useThemedStyles(pipelineBoardStyles);
  const cardRef = useRef<View>(null);
  const origin = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const started = useRef(false);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          started.current = false;
          cardRef.current?.measureInWindow((x, y, width, height) => {
            origin.current = { x, y, width, height };
          });
        },
        onPanResponderMove: (_event: GestureResponderEvent, gesture: PanResponderGestureState) => {
          if (Math.abs(gesture.dx) + Math.abs(gesture.dy) <= 6) return;
          if (!started.current) {
            started.current = true;
            onDragStart(origin.current);
          }
          onDragMove(gesture.moveY, gesture.dx, gesture.dy);
        },
        onPanResponderRelease: (_event: GestureResponderEvent, gesture: PanResponderGestureState) => {
          if (started.current) onDragEnd(gesture.moveY);
          started.current = false;
        },
        onPanResponderTerminate: (_event: GestureResponderEvent, gesture: PanResponderGestureState) => {
          if (started.current) onDragEnd(gesture.moveY);
          started.current = false;
        },
      }),
    [onDragEnd, onDragMove, onDragStart],
  );

  return (
    <View
      ref={cardRef}
      collapsable={false}
      style={[styles.card, hidden && styles.cardHidden]}
      onLayout={() => {
        cardRef.current?.measureInWindow((x, y, width, height) => {
          origin.current = { x, y, width, height };
        });
      }}>
      <View {...pan.panHandlers} style={styles.handle} accessibilityLabel={status}>
        <MaterialDesignIcons name="drag" size={22} color={colors.faint} />
      </View>
      <Pressable style={styles.cardBody} onPress={() => onOpen(job)} disabled={hidden}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {job.title}
        </Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {[job.company, job.sourceName].filter(Boolean).join(' · ')}
        </Text>
      </Pressable>
    </View>
  );
});

function pipelineBoardStyles(colors: ThemeColors) {
  return {
    screen: { flex: 1 },
    list: { padding: 16, paddingBottom: 48, gap: 12 },
    hint: { color: colors.faint, fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
    section: {
      backgroundColor: colors.bgMid,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: radius.lg,
      padding: 10,
      gap: 8,
    },
    sectionOn: { borderColor: colors.accent, backgroundColor: colors.accentDim },
    sectionHead: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
    sectionTitle: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 12, textTransform: 'uppercase' as const },
    sectionCount: { color: colors.faint, fontFamily: fonts.medium, fontSize: 12 },
    empty: { color: colors.faint, fontFamily: fonts.medium, fontSize: 12, paddingVertical: 6 },
    card: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: radius.md,
      paddingVertical: 10,
      paddingRight: 12,
      minHeight: 56,
    },
    cardHidden: { opacity: 0.28 },
    handle: { width: 44, alignItems: 'center' as const, justifyContent: 'center' as const, alignSelf: 'stretch' as const },
    cardBody: { flex: 1, minWidth: 0 },
    cardTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20 },
    cardMeta: { color: colors.faint, fontFamily: fonts.medium, fontSize: 12, marginTop: 2 },
    ghost: {
      position: 'absolute' as const,
      left: 0,
      top: 0,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.accent,
      backgroundColor: colors.card,
    },
  };
}
