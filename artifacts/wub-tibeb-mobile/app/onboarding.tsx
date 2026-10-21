import React from 'react';
import { useRouter } from 'expo-router';
import { useGetProfile } from '@workspace/api-client-react';
import { BrandHeader, LoadingState, Page, PageHeading, StatusMessage } from '@/components/ui';
import { useLocale } from '@/lib/locale';
import { ProfileForm } from '@/app/(tabs)/profile';

export default function OnboardingScreen() {
  const { lang, t } = useLocale();
  const router = useRouter();
  const profile = useGetProfile();
  return (
    <Page>
      <BrandHeader showBell={false} />
      <PageHeading
        title={t('profileSetup')}
        subtitle={lang === 'am' ? 'ቁም ሣጥንዎን ለመጠቀም ስምዎንና አጠቃላይ አካባቢዎን ያስገቡ።' : 'Add your name and general neighborhood before you start swapping.'}
      />
      {profile.isLoading ? (
        <LoadingState label={t('loading')} />
      ) : profile.error ? (
        <StatusMessage icon="wifi-off">{lang === 'am' ? 'መገለጫዎን መጫን አልተቻለም።' : 'Could not load your profile.'}</StatusMessage>
      ) : (
        <ProfileForm key={profile.data?.id ?? 'onboarding'} profile={profile.data} onSaved={() => router.replace('/(tabs)')} />
      )}
    </Page>
  );
}
