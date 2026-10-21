import React from 'react';
import { Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { getGetListingsQueryKey, useDeleteListing, useGetListings } from '@workspace/api-client-react';
import { BrandHeader, Button, LoadingState, Page, PageHeading, StatusMessage } from '@/components/ui';
import { ListingCard } from '@/components/listing-card';
import { useLocale } from '@/lib/locale';

export default function WardrobeScreen() {
  const { lang, t } = useLocale();
  const router = useRouter();
  const client = useQueryClient();
  const listings = useGetListings({ mine: true });
  const archiveListing = useDeleteListing();

  const archive = (id: string) => {
    Alert.alert(t('archive'), lang === 'am' ? 'ይህን ቀሚስ ከዝርዝር ማስወገድ ይፈልጋሉ?' : 'Remove this dress from active discovery?', [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('archive'),
        style: 'destructive',
        onPress: async () => {
          try {
            await archiveListing.mutateAsync({ id });
            await client.invalidateQueries({ queryKey: getGetListingsQueryKey() });
          } catch {
            Alert.alert(t('error'));
          }
        },
      },
    ]);
  };

  return (
    <Page>
      <BrandHeader />
      <PageHeading
        title={t('wardrobe')}
        subtitle={lang === 'am' ? 'ለልውውጥ የሚያቀርቧቸው ቀሚሶች' : 'The dresses you can offer in a swap'}
        action={<View style={{ width: 118 }}><Button title={t('addDress')} icon="plus" onPress={() => router.push('/listing/new')} /></View>}
      />
      {listings.isLoading ? (
        <LoadingState label={t('loading')} />
      ) : listings.error ? (
        <StatusMessage icon="wifi-off">{lang === 'am' ? 'ቁም ሣጥንዎን መጫን አልተቻለም።' : 'Could not load your wardrobe.'}</StatusMessage>
      ) : !listings.data?.length ? (
        <View style={{ paddingTop: 16 }}>
          <StatusMessage icon="archive">{t('noListings')}</StatusMessage>
          <View style={{ paddingHorizontal: 20, marginTop: 10 }}><Button title={t('addDress')} icon="plus" onPress={() => router.push('/listing/new')} /></View>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 18, gap: 12 }}>
          {listings.data.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onPress={() => router.push(`/dress/${listing.id}`)}
              onEdit={listing.status === 'active' ? () => router.push(`/listing/${listing.id}/edit`) : undefined}
              onArchive={listing.status === 'active' ? () => archive(listing.id) : undefined}
            />
          ))}
        </View>
      )}
    </Page>
  );
}
