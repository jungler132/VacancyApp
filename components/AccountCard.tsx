import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { ConfirmModal } from '@/components/ConfirmModal';
import { FormField, useFormStyles } from '@/components/FormField';
import { Text } from '@/components/AppText';
import { isAuthCancelled, isDroppedAuthFetch, linkEmail, sendEmailOtp, signInWithEmailOtp, signInWithGoogle } from '@/lib/backend/auth';
import { EMAIL_OTP_LENGTH } from '@/lib/backend/config';
import { leaveAccount } from '@/lib/backend/sync';
import type { MsgId } from '@/lib/i18n';
import { useT } from '@/lib/i18n/useT';
import { setAuthBusy, setAuthNotice } from '@/lib/store/authSlice';
import { useAppDispatch, useAppSelector, useAppStore } from '@/lib/store/hooks';
import { fonts, radius, useThemedStyles, type ThemeColors } from '@/lib/theme';

type AuthPrompt = 'send' | 'verify' | 'link' | 'out' | 'google';

const PROMPT_COPY: Record<AuthPrompt, { title: MsgId; body: MsgId }> = {
  send: { title: 'auth.explain.send.title', body: 'auth.explain.send.body' },
  verify: { title: 'auth.explain.verify.title', body: 'auth.explain.verify.body' },
  link: { title: 'auth.explain.link.title', body: 'auth.explain.link.body' },
  out: { title: 'auth.explain.out.title', body: 'auth.explain.out.body' },
  google: { title: 'auth.explain.google.title', body: 'auth.explain.google.body' },
};

function digitsOnly(value: string, length: number) {
  return value.replace(/\D/g, '').slice(0, length);
}

function noticeFromError(error: unknown, t: (id: MsgId) => string) {
  const raw = error instanceof Error ? error.message : '';
  if (/already been registered/i.test(raw)) return t('auth.emailTaken');
  if (/expired|invalid/i.test(raw)) return t('auth.codeInvalid');
  if (/sending magic link|error sending/i.test(raw)) return t('auth.sendFailed');
  if (/unsupported provider|provider is not enabled|validation_failed|Unable to exchange/i.test(raw)) {
    return t('auth.googleFailed');
  }
  if (isDroppedAuthFetch(error) || /fetch failed/i.test(raw)) return t('auth.dropped');
  return raw || t('auth.error');
}

export function AccountCard() {
  const t = useT();
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const formStyles = useFormStyles();
  const styles = useThemedStyles(accountStyles);
  const auth = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState(auth.email ?? '');
  const [code, setCode] = useState('');
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [prompt, setPrompt] = useState<AuthPrompt | null>(null);
  const prevAuthEmail = useRef(auth.email);

  useEffect(() => {
    if (auth.email && auth.email !== prevAuthEmail.current) {
      setEmail(auth.email);
      setAwaitingCode(false);
      setCode('');
    } else if (!auth.email && prevAuthEmail.current) {
      setEmail('');
      setAwaitingCode(false);
      setCode('');
    }
    prevAuthEmail.current = auth.email;
  }, [auth.email]);

  const run = useCallback(
    async (fn: () => Promise<void>, notice: string) => {
      dispatch(setAuthBusy(true));
      try {
        await fn();
        dispatch(setAuthNotice(notice));
      } catch (error) {
        if (isAuthCancelled(error)) {
          dispatch(setAuthNotice(''));
          return;
        }
        dispatch(setAuthNotice(noticeFromError(error, t)));
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
      setCode('');
      run(async () => {
        await sendEmailOtp(email.trim());
        setAwaitingCode(true);
      }, t('auth.sent'));
      return;
    }
    if (next === 'verify') {
      run(async () => {
        await signInWithEmailOtp(email.trim(), code.trim());
        setAwaitingCode(false);
        setCode('');
      }, t('auth.linked'));
      return;
    }
    if (next === 'link') {
      run(() => linkEmail(email.trim()), t('auth.sent'));
      return;
    }
    if (next === 'google') {
      run(async () => {
        await signInWithGoogle();
        setAwaitingCode(false);
        setCode('');
      }, t('auth.linked'));
      return;
    }
    run(async () => {
      await leaveAccount(dispatch, () => store.getState());
      setAwaitingCode(false);
      setCode('');
      setEmail('');
    }, t('auth.guest'));
  }, [code, dispatch, email, prompt, run, store, t]);

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
  const typed = email.trim().toLowerCase();
  const current = (auth.email ?? '').trim().toLowerCase();
  const switching = signedIn && Boolean(typed) && typed !== current;
  const canSend = (guest || switching) && !awaitingCode;
  const canVerify = (guest || signedIn) && awaitingCode;

  return (
    <View style={styles.box}>
      <Text style={formStyles.lead}>
        {signedIn ? t('auth.signedIn', { email: auth.email ?? '' }) : anonymous ? t('auth.anonymous') : t('auth.guest')}
      </Text>
      {guest ? <Text style={formStyles.lead}>{t('auth.lead')}</Text> : null}

      {guest || anonymous || signedIn ? (
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

      {canSend ? (
        <Pressable
          onPress={() => {
            if (!email.trim()) {
              dispatch(setAuthNotice(t('auth.needEmail')));
              return;
            }
            setPrompt('send');
          }}
          style={({ pressed }) => [formStyles.primary, pressed && formStyles.pressed]}>
          <Text style={formStyles.primaryText}>{signedIn ? t('auth.switchEmail') : t('auth.sendCode')}</Text>
        </Pressable>
      ) : null}

      {guest && !awaitingCode ? (
        <Pressable
          onPress={() => setPrompt('google')}
          style={({ pressed }) => [formStyles.secondary, pressed && formStyles.pressed]}>
          <Text style={formStyles.secondaryText}>{t('auth.google')}</Text>
        </Pressable>
      ) : null}

      {canVerify ? (
        <>
          <FormField
            label={t('auth.code')}
            value={code}
            onChangeText={(value) => setCode(digitsOnly(value, EMAIL_OTP_LENGTH))}
            placeholder={'0'.repeat(EMAIL_OTP_LENGTH)}
            keyboardType="number-pad"
            maxLength={EMAIL_OTP_LENGTH}
          />
          <Pressable
            onPress={() => {
              if (code.length !== EMAIL_OTP_LENGTH) {
                dispatch(setAuthNotice(t('auth.needCode')));
                return;
              }
              setPrompt('verify');
            }}
            style={({ pressed }) => [formStyles.primary, pressed && formStyles.pressed]}>
            <Text style={formStyles.primaryText}>{t('auth.verify')}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setCode('');
              setPrompt('send');
            }}
            style={({ pressed }) => [styles.textBtn, pressed && formStyles.pressed]}>
            <Text style={styles.textBtnLabel}>{t('auth.resend')}</Text>
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

      {auth.userId ? (
        <Pressable onPress={() => setPrompt('out')} style={({ pressed }) => [styles.outBtn, pressed && formStyles.pressed]}>
          <Text style={styles.outBtnText}>{t('auth.signOut')}</Text>
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
    outBtn: {
      height: 48,
      borderRadius: radius.full,
      borderWidth: 1.5,
      borderColor: colors.danger,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    outBtnText: { color: colors.danger, fontFamily: fonts.bold, fontSize: 16 },
  };
}
