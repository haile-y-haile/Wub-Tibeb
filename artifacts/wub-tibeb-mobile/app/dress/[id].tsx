import React, { useState } from 'react';
import { Alert, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUser } from '@clerk/expo';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetListingsQueryKey,
  getGetMatchesQueryKey,
  useBlockUser,
  useGetListing,
  useGetListings,
  useSwipeDress,
  type Listing,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { displayCondition, displayOccasion, fontFor, useLocale } from '@/lib/locale';
import { BrandHeader, Button, DressImage, LoadingState, Page, PageHeading, Panel, StatusMessage } from '@/components/ui';
import { OfferPicker } from '@/components/offer-picker';

const measureKeys = ['bust', 'waist', 'hips', 'shoulder', 'length', 'sleeves'] as const;

export default function DressDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { lang, t } = useLocale();
  const { user } = useUser();
  const router = useRouter();
  const client = useQueryClient();
  const { width: screenWidth } = useWindowDimensions();
  const listingQuery = useGetListing(id);
  const myWardrobe = useGetListings({ mine: true });
  const swipe = useSwipeDress();
  const block = useBlockUser();
  const [offerOpen, setOfferOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const listing = listingQuery.data;
  const own = listing?.ownerId === user?.id;
  const offers = (myWardrobe.data ?? []).filter((dress) => dress.status === 'active');
  const otherMeasurements = [
    ['bust', 'ደረት'], ['waist', 'ወገብ'], ['hips', 'ዳሌ'],
    ['shoulder', 'ትከሻ'], ['length', 'ርዝመት'], ['sleeves', 'እጅጌ'],
  ] as const;

  const offerDress = async (offered: Listing) => {
    if (!listing) return;
    setBusy(true);
    try {
      const result = await swipe.mutateAsync({ data: { targetId: listing.id, offeredId: offered.id, direction: 'like' } });
      setOfferOpen(false);
      await Promise.all([
        client.invalidateQueries({ queryKey: getGetListingsQueryKey() }),
        client.invalidateQueries({ queryKey: getGetMatchesQueryKey() }),
      ]);
      if (result.matched && result.matchId) {
        Alert.alert(lang === 'am' ? 'ልውውጥ ተጣምሯል!' : 'It is a match!', undefined, [
          { text: t('continue'), onPress: () => router.push(`/match/${result.matchId}`) },
        ]);
      } else {
        Alert.alert(lang === 'am' ? 'ተቀምጧል' : 'Saved', lang === 'am' ? 'የተመረጡት ሁለት ቀሚሶች ተመዝግበዋል።' : 'Your interest in these two dresses was saved.');
      }
    } catch {
      Alert.alert(t('error'));
    } finally {
      setBusy(false);
    }
  };

  const blockMember = () => {
    if (!listing) return;
    Alert.alert(t('block'), lang === 'am' ? 'ይህ አባል ወደፊት ከዝርዝርዎ ይደበቃል እና ክፍት ልውውጦች ይዘጋሉ።' : 'This member will be hidden and open swaps with them will be safely closed.', [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('block'),
        style: 'destructive',
        onPress: async () => {
          try {
            await block.mutateAsync({ data: { userId: listing.ownerId } });
            router.back();
          } catch {
            Alert.alert(t('error'));
          }
        },
      },
    ]);
  };

  if (listingQuery.isLoading) return <Page><LoadingState label={t('loading')} /></Page>;
  if (!listing || listingQuery.error) return <Page><StatusMessage icon="alert-circle">{t('notFound')}</StatusMessage></Page>;

  return (
    <Page>
      <BrandHeader />
      <PageHeading title={listing.title} subtitle={`${listing.ownerName} · ${listing.neighborhood}`} />
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ height: 390 }}>
        {(listing.photos.length ? listing.photos : ['']).map((photo, index) => (
          <DressImage key={`${photo}-${index}`} uri={photo} style={{ width: screenWidth - 24, height: Math.min(screenWidth - 30, 390), marginHorizontal: 12, borderRadius: 19 }} />
        ))}
      </ScrollView>
      {listing.demo && <View style={{ paddingHorizontal: 18 }}><StatusMessage icon="info">{lang === 'am' ? 'ይህ ለማሳያ የተዘጋጀ ዝርዝር ነው።' : 'This is a demonstration listing.'}</StatusMessage></View>}
      <Panel>
        <Text style={{ color: colors.foreground, fontFamily: fontFor(lang, 'bold'), fontSize: 17 }}>{listing.description}</Text>
        <Text style={{ color: colors.mutedForeground, fontFamily: fontFor(lang), fontSize: 13, lineHeight: 20, marginTop: 8 }}>
          {displayOccasion(lang, listing.occasion)} · {listing.color} · {listing.fabric} · {displayCondition(lang, listing.condition)} · {listing.timesWorn} {lang === 'am' ? 'ጊዜ ተለብሷል' : 'times worn'}
        </Text>
        <Text style={{ color: colors.foreground, fontFamily: fontFor(lang, 'semibold'), fontSize: 14, marginTop: 16, marginBottom: 7 }}>{t('measurements')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
          {measureKeys.map((key, index) => (
            <View key={key} style={{ borderRadius: 10, backgroundColor: colors.secondary, paddingHorizontal: 10, paddingVertical: 7 }}>
              <Text style={{ color: colors.secondaryForeground, fontFamily: fontFor(lang), fontSize: 12 }}>
                {lang === 'am' ? otherMeasurements[index][1] : t(key)} · {listing.measurements[key]} cm
              </Text>
            </View>
          ))}
        </View>
      </Panel>
      <View style={{ paddingHorizontal: 18, gap: 9, marginBottom: 20 }}>
        {own ? (
          <Button title={t('edit')} icon="edit-2" onPress={() => router.push(`/listing/${listing.id}/edit`)} />
        ) : (
          <Button title={t('likes')} icon="heart" onPress={() => offers.length ? setOfferOpen(true) : router.push('/listing/new')} testID="offer-a-dress" />
        )}
        {!own && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}><Button title={t('report')} variant="secondary" icon="flag" onPress={() => router.push(`/report/${listing.id}`)} /></View>
            <View style={{ flex: 1 }}><Button title={t('block')} variant="ghost" icon="slash" onPress={blockMember} /></View>
          </View>
        )}
      </View>
      <OfferPicker
        visible={offerOpen}
        listings={offers}
        busy={busy}
        onClose={() => setOfferOpen(false)}
        onList={() => { setOfferOpen(false); router.push('/listing/new'); }}
        onChoose={offerDress}
      />
    </Page>
  );
}
