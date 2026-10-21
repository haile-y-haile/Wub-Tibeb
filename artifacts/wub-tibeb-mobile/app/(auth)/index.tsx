import React, { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useAuth, useSignIn, useSignUp, useSSO } from '@clerk/expo';
import { useColors } from '@/hooks/useColors';
import { Button, Field, Page, Panel } from '@/components/ui';
import { fontFor, useLocale } from '@/lib/locale';

WebBrowser.maybeCompleteAuthSession();

function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}

export default function AuthScreen() {
  useWarmUpBrowser();
  const colors = useColors();
  const { lang, setLang, t } = useLocale();
  const { isSignedIn } = useAuth();
  const { signIn, fetchStatus: signInStatus } = useSignIn();
  const { signUp, fetchStatus: signUpStatus } = useSignUp();
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'credentials' | 'verify'>('credentials');
  const [error, setError] = useState('');
  const busy = signInStatus === 'fetching' || signUpStatus === 'fetching';

  const finish = useCallback(async (decorateUrl?: (url: string) => string) => {
    const destination = decorateUrl ? decorateUrl('/') : '/';
    router.replace(destination as never);
  }, [router]);

  const submitCredentials = async () => {
    setError('');
    try {
      if (mode === 'sign-up') {
        const result = await signUp.password({ emailAddress: email.trim(), password });
        if (result.error) throw result.error;
        const sent = await signUp.verifications.sendEmailCode();
        if (sent.error) throw sent.error;
        setStep('verify');
        return;
      }
      const result = await signIn.password({ emailAddress: email.trim(), password });
      if (result.error) throw result.error;
      if (signIn.status === 'complete') {
        await signIn.finalize({ navigate: async ({ decorateUrl }) => finish(decorateUrl) });
        return;
      }
      if (signIn.status === 'needs_client_trust') {
        const factor = signIn.supportedSecondFactors.find((item) => item.strategy === 'email_code');
        if (factor) {
          const sent = await signIn.mfa.sendEmailCode();
          if (sent.error) throw sent.error;
          setStep('verify');
          return;
        }
      }
      setError(t('error'));
    } catch (caught) {
      setError(lang === 'am' ? t('error') : caught instanceof Error ? caught.message : t('error'));
    }
  };

  const verifyCode = async () => {
    setError('');
    try {
      if (mode === 'sign-up') {
        const result = await signUp.verifications.verifyEmailCode({ code: verificationCode.trim() });
        if (result.error) throw result.error;
        if (signUp.status === 'complete') {
          await signUp.finalize({ navigate: async ({ decorateUrl }) => finish(decorateUrl) });
        }
      } else {
        const result = await signIn.mfa.verifyEmailCode({ code: verificationCode.trim() });
        if (result.error) throw result.error;
        if (signIn.status === 'complete') {
          await signIn.finalize({ navigate: async ({ decorateUrl }) => finish(decorateUrl) });
        }
      }
    } catch (caught) {
      setError(lang === 'am' ? t('error') : caught instanceof Error ? caught.message : t('error'));
    }
  };

  const signInWithGoogle = async () => {
    setError('');
    try {
      const result = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: AuthSession.makeRedirectUri({ scheme: 'wubtibeb' }),
      });
      if (result.createdSessionId) {
        await result.setActive?.({
          session: result.createdSessionId,
          navigate: async ({ decorateUrl }) => finish(decorateUrl),
        });
      } else {
        setError(t('error'));
      }
    } catch (caught) {
      setError(lang === 'am' ? t('error') : caught instanceof Error ? caught.message : t('error'));
    }
  };

  if (isSignedIn) return null;

  return (
    <Page scroll={false}>
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 28, paddingTop: 20, gap: 12 }}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', paddingTop: 22, paddingBottom: 12 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={lang === 'am' ? 'ቋንቋ ቀይር' : 'Switch to Amharic'}
            testID="auth-language-toggle"
            onPress={() => setLang(lang === 'am' ? 'en' : 'am')}
            style={({ pressed }) => ({
              position: 'absolute',
              top: 0,
              right: 0,
              minHeight: 34,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 10,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.65 : 1,
            })}
          >
            <Text style={{ color: colors.primary, fontFamily: fontFor(lang, 'semibold'), fontSize: 11 }}>አማ / EN</Text>
          </Pressable>
          <Text style={{ color: colors.primary, fontFamily: lang === 'am' ? fontFor(lang, 'bold') : 'Fraunces_600SemiBold', fontSize: 32, lineHeight: 43 }}>
            {t('brand')}
          </Text>
          <Text style={{ color: colors.accentForeground, fontFamily: fontFor(lang, 'semibold'), fontSize: 13, marginTop: 4 }}>
            {t('tagline')}
          </Text>
          <View style={{ width: 58, height: 3, borderRadius: 2, backgroundColor: colors.accent, marginTop: 18 }} />
        </View>
        <Text style={{ color: colors.foreground, fontFamily: fontFor(lang, 'bold'), fontSize: 25, textAlign: 'center' }}>
          {step === 'verify' ? t('verifyEmail') : t('welcome')}
        </Text>
        <Text style={{ color: colors.mutedForeground, fontFamily: fontFor(lang), textAlign: 'center', fontSize: 14, lineHeight: 21, marginBottom: 8 }}>
          {step === 'verify' ? email : t('welcomeBody')}
        </Text>
        <Panel style={{ padding: 17, gap: 2 }}>
          {step === 'verify' ? (
            <>
              <Field label={t('code')} value={verificationCode} onChangeText={setVerificationCode} keyboardType="number-pad" autoComplete="one-time-code" />
              <Button title={t('continue')} icon="check" onPress={verifyCode} disabled={busy || !verificationCode.trim()} testID="verify-email" />
              <Pressable
                onPress={() => mode === 'sign-up' ? signUp.verifications.sendEmailCode() : signIn.mfa.sendEmailCode()}
                style={{ paddingVertical: 14, alignItems: 'center' }}
              >
                <Text style={{ color: colors.primary, fontFamily: fontFor(lang, 'semibold') }}>{t('resendCode')}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Field label={t('email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
              <Field label={t('password')} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" textContentType={mode === 'sign-up' ? 'newPassword' : 'password'} />
              <Button
                title={mode === 'sign-in' ? t('signIn') : t('createAccount')}
                icon="arrow-right"
                onPress={submitCredentials}
                disabled={busy || !email.trim() || !password}
                testID="auth-submit"
              />
              <Button title={t('useGoogle')} variant="secondary" icon="globe" onPress={signInWithGoogle} disabled={busy} testID="google-auth" />
            </>
          )}
          {!!error && (
            <Text accessibilityRole="alert" style={{ color: colors.destructive, fontFamily: fontFor(lang), fontSize: 13, marginTop: 8 }}>
              {error}
            </Text>
          )}
        </Panel>
        {step === 'credentials' && (
          <Pressable
            onPress={() => {
              setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
              setError('');
            }}
            style={{ paddingVertical: 15, alignItems: 'center' }}
          >
            <Text style={{ color: colors.mutedForeground, fontFamily: fontFor(lang), fontSize: 14 }}>
              {mode === 'sign-in' ? t('noAccount') : t('haveAccount')}{' '}
              <Text style={{ color: colors.primary, fontFamily: fontFor(lang, 'bold') }}>
                {mode === 'sign-in' ? t('signUp') : t('signIn')}
              </Text>
            </Text>
          </Pressable>
        )}
        <View nativeID="clerk-captcha" />
      </KeyboardAwareScrollViewCompat>
    </Page>
  );
}
