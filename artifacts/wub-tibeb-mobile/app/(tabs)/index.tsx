import React, { useMemo, useRef, useState } from 'react';
import { Alert, PanResponder, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import {
  getGetListingsQueryKey,
  getGetMatchesQueryKey,
  useGetCommunity,
  useGetListings,
  useGetProfile,
  useSwipeDress,
  type Listing,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { fontFor, useLocale } from '@/lib/locale';
import { BrandHeader, Button, Chip, DressImage, LoadingState, Page, PageHeading, Panel, StatusMessage } from '@/components/ui';
import { ListingCard } from '@/components/listing-card';
import { OfferPicker } from '@/components/offer-picker';

const conditions = [
  { value: 'Like new', am: 'አዲስ ያህል', en: 'Like new' },
  { value: 'Excellent', am: 'በጣም ጥሩ', en: 'Excellent' },
  { value: 'Good', am: 'ጥሩ', en: 'Good' },
  { value: 'Fair', am: 'ተጠቅሞበታል', en: 'Fair' },
];
const occasions = [
  { value: 'Timket', am: 'ጥምቀት', en: 'Timket' },
  { value: 'Meskel', am: 'መስቀል', en: 'Meskel' },
  { value: 'Enkutatash', am: 'እንቁጣጣሽ', en: 'Enkutatash' },
  { value: 'Fasika', am: 'ፋሲካ', en: 'Fasika' },
  { value: 'Genna', am: 'ገና', en: 'Genna' },
  { value: 'Wedding', am: 'ሰርግ', en: 'Wedding' },
];

export default function DiscoverScreen() {
  const colors = useColors();
  const { lang, t } = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [queryDraft, setQueryDraft] = useState('');
  const [queryText, setQueryText] = useState('');
  const [condition, setCondition] = useState('');
  const [occasion, setOccasion] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [fabricFilter, setFabricFilter] = useState('');
  const [compatible, setCompatible] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<Listing | null>(null);
  const swipe = useSwipeDress();
  const profile = useGetProfile();
  const community = useGetCommunity();
  const mine = useGetListings({ mine: true });
  const params = useMemo(
    () => ({
      q: queryText || undefined,
      condition: condition || undefined,
      occasion: occasion || undefined,
      neighborhood: neighborhood || undefined,
      color: colorFilter || undefined,
      fabric: fabricFilter || undefined,
      compatible: compatible || undefined,
    }),
    [queryText, condition, occasion, neighborhood, colorFilter, fabricFilter, compatible],
  );
  const listings = useGetListings(params);
  const activeListings = (mine.data ?? []).filter((listing) => listing.status === 'active');
  const current = (listings.data ?? []).find((listing) => listing.status === 'active');

  const passCurrent = async () => {
    if (!current || busy) return;
    setBusy(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await swipe.mutateAsync({ data: { targetId: current.id, direction: 'pass' } });
      await queryClient.invalidateQueries({ queryKey: getGetListingsQueryKey() });
    } catch {
      Alert.alert(t('error'), lang === 'am' ? 'በዚህ ጊዜ ማለፍ አልተቻለም።' : 'Could not save that pass. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const sendLike = async (offered: Listing) => {
    if (!selectedTarget || busy) return;
    setBusy(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const result = await swipe.mutateAsync({
        data: { targetId: selectedTarget.id, offeredId: offered.id, direction: 'like' },
      });
      setOfferOpen(false);
      setSelectedTarget(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetListingsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetMatchesQueryKey() }),
      ]);
      if (result.matched && result.matchId) {
        Alert.alert(
          lang === 'am' ? 'ልውውጥ ተጣምሯል!' : 'It is a match!',
          lang === 'am' ? 'በቀሚሶቹ ላይ የጋራ ፍላጎት ተገኝቷል።' : 'You both chose the same two dresses.',
          [{ text: t('continue'), onPress: () => router.push(`/match/${result.matchId}`) }],
        );
      }
    } catch {
      Alert.alert(t('error'), lang === 'am' ? 'ፍላጎትዎን ማስቀመጥ አልተቻለም።' : 'Could not save your interest. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const openOffer = () => {
    if (!activeListings.length) {
      Alert.alert(t('noOwnDresses'), t('listFirst'), [
        { text: t('cancel'), style: 'cancel' },
        { text: t('addDress'), onPress: () => router.push('/listing/new') },
      ]);
      return;
    }
    if (current) {
      setSelectedTarget(current);
      setOfferOpen(true);
    }
  };

  const gestureActions = useRef({ pass: () => {}, like: () => {} });
  gestureActions.current = { pass: passCurrent, like: openOffer };
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderRelease: (_event, gesture) => {
          if (gesture.dx < -75) gestureActions.current.pass();
          if (gesture.dx > 75) gestureActions.current.like();
        },
      }),
    [],
  );

  const conditionLabel = (value: string) => {
    const found = conditions.find((item) => item.value === value);
    return found ? (lang === 'am' ? found.am : found.en) : value;
  };

  return (
    <Page>
      <BrandHeader />
      <PageHeading
        title={t('discover')}
        subtitle={community.data ? `${community.data.dresses} ${t('dresses')} · ${community.data.neighborhoods} ${lang === 'am' ? 'አካባቢዎች' : 'neighborhoods'}` : t('welcome')}
        action={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('filters')}
            accessibilityState={{ expanded: showFilters }}
            onPress={() => setShowFilters((value) => !value)}
            style={({ pressed }) => [{ minWidth: 44, height: 42, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.65 : 1 }]}
          >
            <Feather name="sliders" size={21} color={colors.primary} />
          </Pressable>
        }
      />
      <View style={{ paddingHorizontal: 18 }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.input, backgroundColor: colors.card, borderRadius: 24, paddingHorizontal: 13 }}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              value={queryDraft}
              onChangeText={setQueryDraft}
              onSubmitEditing={() => setQueryText(queryDraft.trim())}
              placeholder={t('search')}
              placeholderTextColor={colors.mutedForeground}
              returnKeyType="search"
              accessibilityLabel={t('search')}
              testID="search-listings"
              style={{ flex: 1, minHeight: 44, color: colors.foreground, fontFamily: fontFor(lang), fontSize: 14 }}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('search')}
            onPress={() => setQueryText(queryDraft.trim())}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}
          >
            <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
          </Pressable>
        </View>
      </View>

      {showFilters && (
        <Panel style={{ padding: 13 }}>
          <Text style={{ color: colors.foreground, fontFamily: fontFor(lang, 'semibold'), marginBottom: 8 }}>{t('condition')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            <Chip title={t('all')} selected={!condition} onPress={() => setCondition('')} />
            {conditions.map((item) => (
              <Chip key={item.value} title={conditionLabel(item.value)} selected={condition === item.value} onPress={() => setCondition(condition === item.value ? '' : item.value)} />
            ))}
          </View>
          <Text style={{ color: colors.foreground, fontFamily: fontFor(lang, 'semibold'), marginBottom: 8 }}>{t('occasion')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 11 }}>
            <Chip title={t('all')} selected={!occasion} onPress={() => setOccasion('')} />
            {occasions.map((item) => (
              <Chip key={item.value} title={lang === 'am' ? item.am : item.en} selected={occasion === item.value} onPress={() => setOccasion(occasion === item.value ? '' : item.value)} />
            ))}
          </View>
          <TextInput
            value={neighborhood}
            onChangeText={setNeighborhood}
            placeholder={t('neighborhood')}
            placeholderTextColor={colors.mutedForeground}
            accessibilityLabel={t('neighborhood')}
            style={{ minHeight: 44, borderWidth: 1, borderColor: colors.input, borderRadius: 12, backgroundColor: colors.background, paddingHorizontal: 12, color: colors.foreground, fontFamily: fontFor(lang) }}
          />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TextInput
              value={colorFilter}
              onChangeText={setColorFilter}
              placeholder={t('colorPlaceholder')}
              placeholderTextColor={colors.mutedForeground}
              accessibilityLabel={t('color')}
              style={{ flex: 1, minHeight: 44, borderWidth: 1, borderColor: colors.input, borderRadius: 12, backgroundColor: colors.background, paddingHorizontal: 12, color: colors.foreground, fontFamily: fontFor(lang), fontSize: 13 }}
            />
            <TextInput
              value={fabricFilter}
              onChangeText={setFabricFilter}
              placeholder={t('fabricPlaceholder')}
              placeholderTextColor={colors.mutedForeground}
              accessibilityLabel={t('fabric')}
              style={{ flex: 1, minHeight: 44, borderWidth: 1, borderColor: colors.input, borderRadius: 12, backgroundColor: colors.background, paddingHorizontal: 12, color: colors.foreground, fontFamily: fontFor(lang), fontSize: 13 }}
            />
          </View>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: compatible }}
            disabled={!profile.data?.measurements}
            onPress={() => setCompatible((value) => !value)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 12, opacity: profile.data?.measurements ? 1 : 0.5 }}
          >
            <Feather name={compatible ? 'check-square' : 'square'} size={18} color={colors.primary} />
            <Text style={{ color: colors.foreground, fontFamily: fontFor(lang), fontSize: 13 }}>{t('compatible')}</Text>
          </Pressable>
          {!profile.data?.measurements && (
            <Text style={{ color: colors.mutedForeground, fontFamily: fontFor(lang), fontSize: 11 }}>
              {lang === 'am' ? 'የመገለጫ መጠኖችዎን በመጀመሪያ ያስቀምጡ።' : 'Add your private measurements in Profile first.'}
            </Text>
          )}
        </Panel>
      )}

      {listings.isLoading ? (
        <LoadingState label={t('loading')} />
      ) : listings.error ? (
        <View style={{ paddingTop: 24 }}>
          <StatusMessage icon="wifi-off">{lang === 'am' ? 'ዝርዝሮችን መጫን አልተቻለም። የኢንተርኔት ግንኙነትዎን ይመልከቱ።' : 'Could not load dresses. Check your connection and try again.'}</StatusMessage>
          <View style={{ paddingHorizontal: 20, marginTop: 8 }}><Button title={t('refresh')} icon="refresh-cw" variant="secondary" onPress={() => listings.refetch()} /></View>
        </View>
      ) : !current ? (
        <View style={{ paddingTop: 20, paddingBottom: 30 }}>
          <StatusMessage icon="search">{`${t('noDresses')} ${t('tryFilters')}`}</StatusMessage>
          <View style={{ paddingHorizontal: 20, marginTop: 10 }}><Button title={t('addDress')} icon="plus" variant="secondary" onPress={() => router.push('/listing/new')} /></View>
        </View>
      ) : (
        <>
          <View style={{ paddingHorizontal: 18, paddingTop: 14 }} {...panResponder.panHandlers}>
            <ListingCard listing={current} onPress={() => router.push(`/dress/${current.id}`)} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 34, paddingTop: 10 }}>
            <Pressable accessibilityRole="button" accessibilityLabel={t('pass')} testID="pass-dress" onPress={passCurrent} disabled={busy} style={({ pressed }) => [{ width: 54, height: 54, alignItems: 'center', justifyContent: 'center', opacity: pressed || busy ? 0.55 : 1 }]}>
              <Feather name="x" size={28} color={colors.destructive} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={t('likes')} testID="like-dress" onPress={openOffer} disabled={busy} style={({ pressed }) => [{ width: 58, height: 58, borderRadius: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, opacity: pressed || busy ? 0.75 : 1 }]}>
              <Feather name="heart" size={24} color={colors.primaryForeground} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={t('viewDress')} onPress={() => router.push(`/dress/${current.id}`)} style={({ pressed }) => [{ width: 54, height: 54, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.55 : 1 }]}>
              <Feather name="info" size={23} color={colors.primary} />
            </Pressable>
          </View>
          <Text style={{ color: colors.mutedForeground, fontFamily: fontFor(lang), textAlign: 'center', fontSize: 11, marginTop: 2 }}>
            {lang === 'am' ? 'ለማለፍ ወደ ግራ፣ ፍላጎት ለማሳየት ወደ ቀኝ ያንሸራትቱ።' : 'Swipe left to pass · swipe right to choose a dress to offer'}
          </Text>
        </>
      )}

      <OfferPicker
        visible={offerOpen}
        listings={activeListings}
        busy={busy}
        onClose={() => setOfferOpen(false)}
        onList={() => {
          setOfferOpen(false);
          router.push('/listing/new');
        }}
        onChoose={sendLike}
      />
    </Page>
  );
}
