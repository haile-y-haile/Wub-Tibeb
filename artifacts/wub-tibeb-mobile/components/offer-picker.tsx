import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import type { Listing } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { displayOccasion, fontFor, useLocale } from '@/lib/locale';
import { Button, DressImage, Panel } from '@/components/ui';

export function OfferPicker({
  visible,
  listings,
  onChoose,
  onClose,
  onList,
  busy,
}: {
  visible: boolean;
  listings: Listing[];
  onChoose: (listing: Listing) => void;
  onClose: () => void;
  onList: () => void;
  busy?: boolean;
}) {
  const colors = useColors();
  const { lang, t } = useLocale();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(12, 24, 18, 0.45)' }}>
        <View style={{ maxHeight: '82%', backgroundColor: colors.background, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 12, paddingBottom: 30 }}>
          <View style={{ width: 42, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 14 }} />
          <Text style={{ color: colors.foreground, fontFamily: fontFor(lang, 'bold'), fontSize: 20, paddingHorizontal: 20, marginBottom: 4 }}>{t('chooseOffer')}</Text>
          <Text style={{ color: colors.mutedForeground, fontFamily: fontFor(lang), fontSize: 13, paddingHorizontal: 20, marginBottom: 12 }}>
            {lang === 'am' ? 'ለዚህ ቀሚስ የሚያቀርቡት ቀሚስ ይህ ነው።' : 'A match is about these two specific dresses.'}
          </Text>
          {listings.length === 0 ? (
            <Panel style={{ marginBottom: 14 }}>
              <Text style={{ color: colors.foreground, fontFamily: fontFor(lang), fontSize: 14, lineHeight: 22 }}>{t('noOwnDresses')}</Text>
              <View style={{ marginTop: 14 }}><Button title={t('listFirst')} icon="plus" onPress={onList} /></View>
            </Panel>
          ) : (
            <View style={{ maxHeight: 390 }}>
              {listings.map((listing) => (
                <Pressable
                  key={listing.id}
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={() => onChoose(listing)}
                  style={({ pressed }) => ({
                    minHeight: 74,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    marginHorizontal: 18,
                    marginVertical: 5,
                    padding: 8,
                    borderRadius: 15,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                    opacity: pressed || busy ? 0.65 : 1,
                  })}
                >
                  <DressImage uri={listing.photos[0]} style={{ width: 54, height: 62, borderRadius: 9 }} />
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ color: colors.foreground, fontFamily: fontFor(lang, 'semibold'), fontSize: 14 }}>{listing.title}</Text>
                    <Text style={{ color: colors.mutedForeground, fontFamily: fontFor(lang), fontSize: 12, marginTop: 3 }}>{displayOccasion(lang, listing.occasion)} · {listing.color}</Text>
                  </View>
                  <Text style={{ color: colors.primary, fontFamily: fontFor(lang, 'bold'), fontSize: 12 }}>{t('selectDress')}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <Pressable onPress={onClose} style={{ alignItems: 'center', padding: 15 }}>
            <Text style={{ color: colors.mutedForeground, fontFamily: fontFor(lang, 'semibold') }}>{t('cancel')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
