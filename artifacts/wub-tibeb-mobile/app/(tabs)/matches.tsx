import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/expo';
import { useGetMatches, type Match } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { fontFor, useLocale } from '@/lib/locale';
import { BrandHeader, DressImage, LoadingState, Page, PageHeading, Panel, StatusMessage } from '@/components/ui';

function MatchCard({ match, onPress, currentUserId }: { match: Match; onPress: () => void; currentUserId?: string }) {
  const colors = useColors();
  const { lang, t } = useLocale();
  const own = match.dressA.ownerId === currentUserId ? match.dressA : match.dressB;
  const other = match.dressA.ownerId === currentUserId ? match.dressB : match.dressA;
  const label = match.status === 'completed' ? t('completed') : match.status === 'accepted' ? t('accepted') : match.status === 'proposed' ? t('proposed') : t('matched');
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.84 : 1 }]}>
      <Panel style={{ padding: 12, marginHorizontal: 18, marginVertical: 6 }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <DressImage uri={own.photos[0]} style={{ flex: 1, height: 135, borderRadius: 12 }} />
          <View style={{ width: 28, alignItems: 'center' }}>
            <Text style={{ color: colors.accent, fontSize: 22, fontFamily: fontFor(lang, 'bold') }}>↔</Text>
          </View>
          <DressImage uri={other.photos[0]} style={{ flex: 1, height: 135, borderRadius: 12 }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 11 }}>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ color: colors.foreground, fontFamily: fontFor(lang, 'semibold'), fontSize: 14 }}>{other.ownerName} · {other.neighborhood}</Text>
            <Text numberOfLines={1} style={{ color: colors.mutedForeground, fontFamily: fontFor(lang), fontSize: 12, marginTop: 3 }}>{own.title} ↔ {other.title}</Text>
          </View>
          <View style={{ backgroundColor: colors.secondary, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 14 }}>
            <Text style={{ color: colors.secondaryForeground, fontFamily: fontFor(lang, 'semibold'), fontSize: 10 }}>{label}</Text>
          </View>
        </View>
      </Panel>
    </Pressable>
  );
}

export default function MatchesScreen() {
  const { lang, t } = useLocale();
  const colors = useColors();
  const router = useRouter();
  const { user } = useUser();
  const matches = useGetMatches();
  const current = (matches.data ?? []).filter((match) => match.status !== 'completed' && match.status !== 'cancelled');
  const history = (matches.data ?? []).filter((match) => match.status === 'completed');
  return (
    <Page>
      <BrandHeader />
      <PageHeading title={t('matches')} subtitle={lang === 'am' ? 'በሁለቱ ቀሚሶች ላይ የጋራ ፍላጎት' : 'Mutual interest in the same two dresses'} />
      {matches.isLoading ? (
        <LoadingState label={t('loading')} />
      ) : matches.error ? (
        <StatusMessage icon="wifi-off">{lang === 'am' ? 'ልውውጦችን መጫን አልተቻለም።' : 'Could not load your swaps.'}</StatusMessage>
      ) : (
        <>
          {!current.length && <StatusMessage icon="repeat">{t('noMatches')}</StatusMessage>}
          {!!current.length && (
            <>
              <Text style={{ color: colors.foreground, fontFamily: fontFor(lang, 'bold'), fontSize: 16, paddingHorizontal: 20, paddingTop: 8 }}>{lang === 'am' ? 'የአሁኑ ልውውጦች' : 'Active swaps'}</Text>
              {current.map((match) => <MatchCard key={match.id} match={match} currentUserId={user?.id} onPress={() => router.push(`/match/${match.id}`)} />)}
            </>
          )}
          <Text style={{ color: colors.foreground, fontFamily: fontFor(lang, 'bold'), fontSize: 16, paddingHorizontal: 20, paddingTop: 14 }}>{t('history')}</Text>
          {!history.length ? (
            <Text style={{ color: colors.mutedForeground, fontFamily: fontFor(lang), fontSize: 13, paddingHorizontal: 20, paddingTop: 8 }}>{t('emptyHistory')}</Text>
          ) : (
            history.map((match) => <MatchCard key={match.id} match={match} currentUserId={user?.id} onPress={() => router.push(`/match/${match.id}`)} />)
          )}
        </>
      )}
    </Page>
  );
}
