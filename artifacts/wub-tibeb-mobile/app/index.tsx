import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { useGetProfile } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { Button, LoadingState, Page, StatusMessage } from '@/components/ui';
import { useLocale } from '@/lib/locale';

function ProfileGate() {
  const colors = useColors();
  const { lang, t } = useLocale();
  const profile = useGetProfile();
  if (profile.isLoading) return <Page><LoadingState label={t('loading')} /></Page>;
  if (profile.error) {
    return (
      <Page>
        <StatusMessage icon="wifi-off">
          {lang === 'am' ? 'መገለጫዎን ማረጋገጥ አልተቻለም። ግንኙነትዎን ይመልከቱ።' : 'Could not check your profile. Check your connection and retry.'}
        </StatusMessage>
        <View style={{ paddingHorizontal: 20, marginTop: 10 }}><Button title={t('refresh')} icon="refresh-cw" onPress={() => profile.refetch()} /></View>
      </Page>
    );
  }
  const needsSetup = !profile.data || !profile.data.name || profile.data.name === 'Member' || !profile.data.neighborhood;
  if (needsSetup) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}

export default function IndexScreen() {
  const colors = useColors();
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (!isSignedIn) return <Redirect href="/(auth)" />;
  return <ProfileGate />;
}
