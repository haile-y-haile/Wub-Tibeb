import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useClerk, useUser } from '@clerk/expo';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetProfileQueryKey,
  useGetProfile,
  useSaveProfile,
  type Measurements,
  type Profile,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { fontFor, useLocale } from '@/lib/locale';
import { BrandHeader, Button, Field, LoadingState, Page, PageHeading, Panel, StatusMessage } from '@/components/ui';

const keys: Array<keyof Measurements> = ['bust', 'waist', 'hips', 'shoulder', 'length', 'sleeves'];

export function ProfileForm({ profile, onSaved }: { profile?: Profile; onSaved?: () => void }) {
  const colors = useColors();
  const { lang, setLang, t } = useLocale();
  const client = useQueryClient();
  const save = useSaveProfile();
  const [name, setName] = useState(profile?.name === 'Member' ? '' : profile?.name ?? '');
  const [neighborhood, setNeighborhood] = useState(profile?.neighborhood ?? '');
  const [measurements, setMeasurements] = useState<Record<keyof Measurements, string>>({
    bust: String(profile?.measurements?.bust ?? ''),
    waist: String(profile?.measurements?.waist ?? ''),
    hips: String(profile?.measurements?.hips ?? ''),
    shoulder: String(profile?.measurements?.shoulder ?? ''),
    length: String(profile?.measurements?.length ?? ''),
    sleeves: String(profile?.measurements?.sleeves ?? ''),
  });
  const [error, setError] = useState('');
  const submit = async () => {
    setError('');
    if (!name.trim() || !neighborhood.trim()) {
      setError(t('required'));
      return;
    }
    const hasMeasurements = keys.some((key) => measurements[key].trim() !== '');
    const parsed = Object.fromEntries(keys.map((key) => [key, Number(measurements[key])])) as unknown as Measurements;
    if (hasMeasurements && keys.some((key) => !Number.isFinite(parsed[key]) || parsed[key] <= 0)) {
      setError(lang === 'am' ? 'የመጠን መስኮቹን ሁሉ በሴ.ሜ. ያስገቡ ወይም ሁሉንም ባዶ ይተዉ።' : 'Enter all six measurements in cm, or leave them all empty.');
      return;
    }
    try {
      await save.mutateAsync({
        data: {
          name: name.trim(),
          neighborhood: neighborhood.trim(),
          language: lang,
          ...(hasMeasurements ? { measurements: parsed } : {}),
        },
      });
      setLang(lang);
      await client.invalidateQueries({ queryKey: getGetProfileQueryKey() });
      Alert.alert(t('profileSaved'));
      onSaved?.();
    } catch {
      setError(lang === 'am' ? 'መገለጫውን ማስቀመጥ አልተቻለም። እንደገና ይሞክሩ።' : 'Could not save your profile. Please try again.');
    }
  };

  return (
    <Panel style={{ padding: 16 }}>
      <Text style={{ color: colors.foreground, fontFamily: fontFor(lang, 'bold'), fontSize: 16, marginBottom: 12 }}>{t('profileSetup')}</Text>
      <Field label={t('fullName')} value={name} onChangeText={setName} maxLength={80} autoComplete="name" />
      <Field label={t('neighborhood')} value={neighborhood} onChangeText={setNeighborhood} maxLength={80} />
      <Text style={{ color: colors.foreground, fontFamily: fontFor(lang, 'bold'), fontSize: 14, marginTop: 4, marginBottom: 4 }}>{t('measurements')}</Text>
      <Text style={{ color: colors.mutedForeground, fontFamily: fontFor(lang), fontSize: 12, lineHeight: 18, marginBottom: 10 }}>{t('profileHelp')}</Text>
      {keys.map((key) => (
        <Field
          key={key}
          label={t(key)}
          value={measurements[key]}
          onChangeText={(value) => setMeasurements((previous) => ({ ...previous, [key]: value.replace(/[^\d.]/g, '') }))}
          keyboardType="decimal-pad"
          placeholder="cm"
        />
      ))}
      {!!error && <Text accessibilityRole="alert" style={{ color: colors.destructive, fontFamily: fontFor(lang), fontSize: 13, marginBottom: 10 }}>{error}</Text>}
      <Button title={save.isPending ? t('loading') : t('saveProfile')} icon="check" onPress={submit} disabled={save.isPending} testID="save-profile" />
    </Panel>
  );
}

export default function ProfileScreen() {
  const { lang, t } = useLocale();
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const colors = useColors();
  const profile = useGetProfile();
  const fullName = user?.fullName ?? '';
  return (
    <Page>
      <BrandHeader />
      <PageHeading title={t('profile')} subtitle={user?.primaryEmailAddress?.emailAddress ?? ''} />
      {profile.isLoading ? (
        <LoadingState label={t('loading')} />
      ) : (
        <ProfileForm key={profile.data?.id ?? 'new-profile'} profile={profile.data} />
      )}
      <View style={{ paddingHorizontal: 18, paddingTop: 8, gap: 8 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/help')}
          style={({ pressed }) => [{ minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: 1, borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}
        >
          <Text style={{ color: colors.foreground, fontFamily: fontFor(lang, 'semibold'), fontSize: 14 }}>{t('help')}</Text>
          <Text style={{ color: colors.mutedForeground }}>›</Text>
        </Pressable>
        {profile.data?.role === 'admin' && (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/moderation')}
            style={({ pressed }) => [{ minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: 1, borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}
          >
            <Text style={{ color: colors.foreground, fontFamily: fontFor(lang, 'semibold'), fontSize: 14 }}>{t('admin')}</Text>
            <Text style={{ color: colors.mutedForeground }}>›</Text>
          </Pressable>
        )}
        <Button
          title={t('signOut')}
          variant="secondary"
          icon="log-out"
          onPress={async () => {
            await signOut();
            router.replace('/(auth)');
          }}
        />
        {!!fullName && <StatusMessage icon="shield">{lang === 'am' ? 'መለያዎ በደህና ተጠብቋል።' : 'Your account is protected by secure sign-in.'}</StatusMessage>}
      </View>
    </Page>
  );
}
