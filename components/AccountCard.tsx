import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

import { ConfirmModal } from '@/components/ConfirmModal';
import { FormField, useFormStyles } from '@/components/FormField';
import { Text } from '@/components/AppText';
import { linkEmail, sendEmailOtp, signOutAccount, startAnonymous, verifyEmailOtp } from '@/lib/backend/auth';
import { resetPushCache } from '@/lib/backend/sync';
import type { MsgId } from '@/lib/i18n';
import { useT } from '@/lib/i18n/useT';
import { setAuthBusy, setAuthNotice } from '@/lib/store/authSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { fonts, useThemedStyles, type ThemeColors } from '@/lib/theme';

type AuthPrompt = 'send' | 'verify' | 'sync' | 'link' | 'out';

const PROMPT_COPY: Record<AuthPrompt, { title: MsgId; body: MsgId }> = {
  send: { title: 'auth.explain.send.title', body: 'auth.explain.send.body' },
  verify: { title: 'auth.explain.verify.title', body: 'auth.explain.verify.body' },
  sync: { title: 'auth.explain.sync.title', body: 'auth.explain.sync.body' },
  link: { title: 'auth.explain.link.title', body: 'auth.explain.link.body' },
  out: { title: 'auth.explain.out.title', body: 'auth.explain.out.body' },
};

function noticeFromError(error: unknown, fallback: string, taken: string) {
  const raw = error instanceof Error ? error.message : '';
  if (/already been registered/i.test(raw)) return taken;
  return raw || fallback;
}

export function AccountCard() {
  const t = useT();
  const dispatch = useAppDispatch();
  const formStyles = useFormStyles();
  const styles = useThemedStyles(accountStyles);
  const auth = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState(auth.email ?? '');
  const [code, setCode] = useState('');
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [prompt, setPrompt] = useState<AuthPrompt | null>(null);

  const run = useCallback(
    async (fn: () => Promise<void>, notice: string) => {
      dispatch(setAuthBusy(true));
      try {
        await fn();
        dispatch(setAuthNotice(notice));
      } catch (error) {
        dispatch(setAuthNotice(noticeFromError(error, t('auth.error'), t('auth.emailTaken'))));
      }
    },
    [dispatch, t],
  );

  const closePrompt = useCallback(() => setPrompt(null), []);

  const confirmPrompt = useCallback(() => {
    const next = prompt;
    setPrompt(null);
    if (!next) return;
    if (next === 'send') {
      run(async () => {
        await sendEmailOtp(email.trim());
        setAwaitingCode(true);
      }, t('auth.sent'));
      return;
    }
    if (next === 'verify') {
      run(() => verifyEmailOtp(email.trim(), code.trim()), t('auth.linked'));
      return;
    }
    if (next === 'sync') {
      run(startAnonymous, t('auth.linked'));
      return;
    }
    if (next === 'link') {
      run(() => linkEmail(email.trim()), t('auth.sent'));
      return;
    }
    run(async () => {
      resetPushCache();
      await signOutAccount();
      setAwaitingCode(false);
    }, t('auth.guest'));
  }, [code, email, prompt, run, t]);

  if (!auth.configured) {
    return (
      <View>
        <Text style={formStyles.lead}>{t('auth.off')}</Text>
      </View>
    );
  }

  const signedIn = Boolean(auth.userId && auth.email && !auth.anonymous);
  const anonymous = Boolean(auth.userId && auth.anonymous);
  const guest = !auth.userId;

  return (
    <View style={styles.box}>
      <Text style={formStyles.lead}>
        {signedIn ? t('auth.signedIn', { email: auth.email ?? '' }) : anonymous ? t('auth.anonymous') : t('auth.guest')}
      </Text>

      {guest || anonymous ? (
        <FormField
          label={t('auth.email')}
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setAwaitingCode(false);
          }}
          placeholder="name@mail.com"
          keyboardType="email-address"
        />
      ) : null}

      {guest && !awaitingCode ? (
        <Pressable
          onPress={() => {
            if (!email.trim()) {
              dispatch(setAuthNotice(t('auth.needEmail')));
              return;
            }
            setPrompt('send');
          }}
          style={({ pressed }) => [formStyles.primary, pressed && formStyles.pressed]}>
          <Text style={formStyles.primaryText}>{t('auth.sendCode')}</Text>
        </Pressable>
      ) : null}

      {guest && awaitingCode ? (
        <>
          <FormField
            label={t('auth.code')}
            value={code}
            onChangeText={setCode}
            placeholder="000000"
            keyboardType="number-pad"
          />
          <Pressable
            onPress={() => {
              if (!code.trim()) {
                dispatch(setAuthNotice(t('auth.needCode')));
                return;
              }
              setPrompt('verify');
            }}
            style={({ pressed }) => [formStyles.primary, pressed && formStyles.pressed]}>
            <Text style={formStyles.primaryText}>{t('auth.verify')}</Text>
          </Pressable>
        </>
      ) : null}

      {anonymous ? (
        <Pressable
          onPress={() => {
            if (!email.trim()) {
              dispatch(setAuthNotice(t('auth.needEmail')));
              return;
            }
            setPrompt('link');
          }}
          style={({ pressed }) => [formStyles.primary, pressed && formStyles.pressed]}>
          <Text style={formStyles.primaryText}>{t('auth.linkEmail')}</Text>
        </Pressable>
      ) : null}

      {guest ? (
        <Pressable onPress={() => setPrompt('sync')} style={({ pressed }) => [styles.textBtn, pressed && formStyles.pressed]}>
          <Text style={styles.textBtnLabel}>{t('auth.syncDevice')}</Text>
        </Pressable>
      ) : null}

      {auth.userId ? (
        <Pressable onPress={() => setPrompt('out')} style={({ pressed }) => [styles.textBtn, pressed && formStyles.pressed]}>
          <Text style={styles.textBtnLabel}>{t('auth.signOut')}</Text>
        </Pressable>
      ) : null}

      {auth.busy ? <Text style={styles.meta}>{t('auth.syncing')}</Text> : null}
      {auth.notice ? <Text style={styles.meta}>{auth.notice}</Text> : null}

      <ConfirmModal
        open={prompt !== null}
        title={prompt ? t(PROMPT_COPY[prompt].title) : ''}
        body={prompt ? t(PROMPT_COPY[prompt].body) : ''}
        onConfirm={confirmPrompt}
        onClose={closePrompt}
      />
    </View>
  );
}

function accountStyles(colors: ThemeColors) {
  return {
    box: { gap: 10 },
    meta: { color: colors.faint, fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
    textBtn: { alignSelf: 'flex-start' as const, paddingVertical: 4 },
    textBtnLabel: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 14 },
  };
}
