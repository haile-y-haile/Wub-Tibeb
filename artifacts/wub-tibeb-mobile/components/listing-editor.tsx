import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import { fetch as expoFetch } from 'expo/fetch';
import {
  useCreateListing,
  useRequestUpload,
  useUpdateListing,
  getGetListingsQueryKey,
  type Listing,
  type ListingInputCondition,
  type ListingInputOccasion,
  type Measurements,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { displayCondition, displayOccasion, fontFor, useLocale } from '@/lib/locale';
import { absoluteUrl } from '@/lib/app';
import { Button, Chip, Field, Page, PageHeading, Panel, StatusMessage } from '@/components/ui';

type PhotoItem = { uri: string; path?: string };
type FormState = {
  title: string;
  description: string;
  condition: ListingInputCondition;
  color: string;
  fabric: string;
  embroidery: string;
  occasion: ListingInputOccasion;
  timesWorn: string;
  measurements: Record<keyof Measurements, string>;
};

const measurementKeys: Array<keyof Measurements> = ['bust', 'waist', 'hips', 'shoulder', 'length', 'sleeves'];
const occasionKeys: ListingInputOccasion[] = ['Timket', 'Meskel', 'Enkutatash', 'Fasika', 'Genna', 'Wedding', 'Other holiday'];
const conditionKeys: ListingInputCondition[] = ['Like new', 'Excellent', 'Good', 'Fair'];

const occasionAm: Record<ListingInputOccasion, string> = {
  Timket: 'ጥምቀት',
  Meskel: 'መስቀል',
  Enkutatash: 'እንቁጣጣሽ',
  Fasika: 'ፋሲካ',
  Genna: 'ገና',
  Wedding: 'ሰርግ',
  'Other holiday': 'ሌላ በዓል',
};

function emptyMeasurements(): Record<keyof Measurements, string> {
  return { bust: '', waist: '', hips: '', shoulder: '', length: '', sleeves: '' };
}

function initialForm(listing?: Listing): FormState {
  const measurements = emptyMeasurements();
  if (listing) {
    for (const key of measurementKeys) measurements[key] = String(listing.measurements[key]);
  }
  return {
    title: listing?.title ?? '',
    description: listing?.description ?? '',
    condition: listing?.condition ?? 'Excellent',
    color: listing?.color ?? '',
    fabric: listing?.fabric ?? '',
    embroidery: listing?.embroidery ?? '',
    occasion: listing?.occasion ?? 'Timket',
    timesWorn: listing ? String(listing.timesWorn) : '1',
    measurements,
  };
}

export function ListingEditor({ listing }: { listing?: Listing }) {
  const colors = useColors();
  const { lang, t } = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const createListing = useCreateListing();
  const updateListing = useUpdateListing();
  const requestUpload = useRequestUpload();
  const [form, setForm] = useState<FormState>(() => initialForm(listing));
  const [photos, setPhotos] = useState<PhotoItem[]>(() => listing?.photos.map((uri) => ({ uri, path: uri })) ?? []);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const change = (key: keyof FormState, value: string) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const pickPhotos = async () => {
    setError('');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(lang === 'am' ? 'ፎቶ ለመምረጥ ፍቃድ ያስፈልጋል። በቅንብሮች ውስጥ ፍቃዱን ይክፈቱ።' : 'Photo access is needed to choose listing images. Enable it in your device settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, 6 - photos.length),
      quality: 0.9,
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });
    if (!result.canceled) {
      const next = result.assets.slice(0, 6 - photos.length).map((asset) => ({ uri: asset.uri }));
      setPhotos((previous) => [...previous, ...next].slice(0, 6));
    }
  };

  const compressedFile = async (uri: string) => {
    let width = 1600;
    let quality = 0.76;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const compressed = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width } }],
        { compress: quality, format: ImageManipulator.SaveFormat.JPEG },
      );
      const file = new File(compressed.uri);
      if (file.size > 0 && file.size <= 1_900_000) return file;
      width = Math.round(width * 0.78);
      quality *= 0.76;
    }
    throw new Error(lang === 'am' ? 'ፎቶውን ከ2 ሜባ በታች ማጠቃለል አልተቻለም።' : 'Could not compress that photo below 2 MB.');
  };

  const uploadPhoto = async (photo: PhotoItem, index: number) => {
    if (photo.path) return photo.path;
    const file = await compressedFile(photo.uri);
    const signed = await requestUpload.mutateAsync({
      data: {
        name: `kemis-${Date.now()}-${index}.jpg`,
        size: file.size,
        contentType: 'image/jpeg',
      },
    });
    const response = await expoFetch(signed.uploadURL, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': 'image/jpeg' },
    });
    if (!response.ok) throw new Error(lang === 'am' ? 'ፎቶው አልተሰቀለም። እንደገና ይሞክሩ።' : 'A photo could not be uploaded. Please try again.');
    return signed.objectPath;
  };

  const submit = async () => {
    setError('');
    const title = form.title.trim();
    const description = form.description.trim();
    const color = form.color.trim();
    const fabric = form.fabric.trim();
    const embroidery = form.embroidery.trim();
    const timesWorn = Number(form.timesWorn);
    const parsedMeasurements = Object.fromEntries(
      measurementKeys.map((key) => [key, Number(form.measurements[key])]),
    ) as unknown as Measurements;
    if (
      title.length < 3 ||
      description.length < 10 ||
      !color ||
      !fabric ||
      !embroidery ||
      !Number.isInteger(timesWorn) ||
      timesWorn < 0 ||
      photos.length < 1 ||
      measurementKeys.some((key) => !Number.isFinite(parsedMeasurements[key]) || parsedMeasurements[key] <= 0)
    ) {
      setError(t('required'));
      return;
    }
    setBusy(true);
    try {
      const uploadedPhotos: string[] = [];
      for (const [index, photo] of photos.entries()) {
        uploadedPhotos.push(await uploadPhoto(photo, index));
      }
      const payload = {
        title,
        description,
        photos: uploadedPhotos,
        condition: form.condition,
        color,
        fabric,
        embroidery,
        occasion: form.occasion,
        timesWorn,
        measurements: parsedMeasurements,
      };
      if (listing) {
        await updateListing.mutateAsync({ id: listing.id, data: payload });
      } else {
        await createListing.mutateAsync({ data: payload });
      }
      await queryClient.invalidateQueries({ queryKey: getGetListingsQueryKey() });
      router.back();
    } catch (caught) {
      setError(lang === 'am' ? t('error') : caught instanceof Error ? caught.message : t('error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page>
      <PageHeading title={listing ? t('edit') : t('addDress')} subtitle={t('measurements')} />
      <View style={{ paddingHorizontal: 18 }}>
        <StatusMessage icon="lock">
          {lang === 'am'
            ? 'የቀሚሱ መጠኖች ዝርዝሩ ውስጥ ይታያሉ። የመገለጫዎ መጠኖች ግን ለእርስዎ ብቻ ናቸው።'
            : 'Dress measurements appear on the listing. Your preferred profile measurements stay private.'}
        </StatusMessage>
        <Panel style={{ padding: 14 }}>
          <Text style={{ color: colors.foreground, fontFamily: fontFor(lang, 'bold'), fontSize: 15, marginBottom: 10 }}>{t('photos')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 12 }}>
            {photos.map((photo, index) => (
              <View key={`${photo.uri}-${index}`} style={{ position: 'relative' }}>
                <Image source={{ uri: photo.path ? absoluteUrl(photo.path) : photo.uri }} contentFit="cover" cachePolicy="memory-disk" style={{ width: 74, height: 88, borderRadius: 10 }} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={lang === 'am' ? 'ፎቶ አስወግድ' : 'Remove photo'}
                  onPress={() => setPhotos((items) => items.filter((_, position) => position !== index))}
                  style={{ position: 'absolute', right: -5, top: -6, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.destructive, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: colors.destructiveForeground, fontSize: 15, lineHeight: 17 }}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>
          {photos.length < 6 && <Button title={t('addPhotos')} icon="image" variant="secondary" onPress={pickPhotos} testID="pick-listing-photos" />}
        </Panel>
        <Field label={t('listingTitle')} value={form.title} onChangeText={(value) => change('title', value)} maxLength={100} />
        <Field label={t('description')} value={form.description} onChangeText={(value) => change('description', value)} multiline numberOfLines={4} maxLength={2000} style={{ minHeight: 104, textAlignVertical: 'top' }} />
        <Text style={{ color: colors.foreground, fontFamily: fontFor(lang, 'semibold'), fontSize: 13, marginBottom: 8 }}>{t('condition')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
          {conditionKeys.map((condition) => (
            <Chip key={condition} title={displayCondition(lang, condition)} selected={form.condition === condition} onPress={() => change('condition', condition)} />
          ))}
        </View>
        <Field label={t('color')} value={form.color} onChangeText={(value) => change('color', value)} placeholder={t('colorPlaceholder')} maxLength={40} />
        <Field label={t('fabric')} value={form.fabric} onChangeText={(value) => change('fabric', value)} placeholder={t('fabricPlaceholder')} maxLength={60} />
        <Field label={t('embroidery')} value={form.embroidery} onChangeText={(value) => change('embroidery', value)} maxLength={120} />
        <Text style={{ color: colors.foreground, fontFamily: fontFor(lang, 'semibold'), fontSize: 13, marginBottom: 8 }}>{t('occasion')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
          {occasionKeys.map((occasion) => (
            <Chip key={occasion} title={displayOccasion(lang, occasion)} selected={form.occasion === occasion} onPress={() => change('occasion', occasion)} />
          ))}
        </View>
        <Field label={t('timesWorn')} value={form.timesWorn} onChangeText={(value) => change('timesWorn', value.replace(/\D/g, ''))} keyboardType="number-pad" />
        <Text style={{ color: colors.foreground, fontFamily: fontFor(lang, 'bold'), fontSize: 15, marginTop: 6, marginBottom: 10 }}>{t('measurements')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {measurementKeys.map((key) => (
            <View key={key} style={{ width: '47%', flexGrow: 1 }}>
              <Field
                label={t(key)}
                value={form.measurements[key]}
                onChangeText={(value) => setForm((previous) => ({ ...previous, measurements: { ...previous.measurements, [key]: value.replace(/[^\d.]/g, '') } }))}
                keyboardType="decimal-pad"
                placeholder="cm"
              />
            </View>
          ))}
        </View>
        {!!error && <Text accessibilityRole="alert" style={{ color: colors.destructive, fontFamily: fontFor(lang), fontSize: 13, marginVertical: 10 }}>{error}</Text>}
        <View style={{ marginTop: 8, marginBottom: 24 }}>
          <Button
            title={busy ? t('loading') : listing ? t('saveChanges') : t('saveListing')}
            icon="check"
            onPress={submit}
            disabled={busy}
            testID="save-listing"
          />
        </View>
      </View>
    </Page>
  );
}
