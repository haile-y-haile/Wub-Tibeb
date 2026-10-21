import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useGetListing } from '@workspace/api-client-react';
import { LoadingState, Page, StatusMessage } from '@/components/ui';
import { useLocale } from '@/lib/locale';
import { ListingEditor } from '@/components/listing-editor';

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useLocale();
  const listing = useGetListing(id);
  if (listing.isLoading) return <Page><LoadingState label={t('loading')} /></Page>;
  if (!listing.data || listing.error) {
    return <Page><StatusMessage icon="alert-circle">{lang === 'am' ? 'ይህን ዝርዝር ማስተካከል አልተቻለም።' : 'This listing could not be loaded for editing.'}</StatusMessage></Page>;
  }
  return <ListingEditor key={listing.data.id} listing={listing.data} />;
}
