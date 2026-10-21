import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Listing } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { displayCondition, displayOccasion, fontFor, useLocale } from '@/lib/locale';
import { DressImage, IconAction } from '@/components/ui';

export function ListingCard({
  listing,
  onPress,
  onEdit,
  onArchive,
}: {
  listing: Listing;
  onPress: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
}) {
  const colors = useColors();
  const { lang, t } = useLocale();
  const label = displayCondition(lang, listing.condition);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${listing.title}, ${listing.neighborhood}`}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 18,
        overflow: 'hidden',
        opacity: pressed ? 0.88 : 1,
      })}
    >
      <View style={{ position: 'relative' }}>
        <DressImage uri={listing.photos[0]} style={{ width: '100%', height: 224 }} />
        {listing.demo && (
          <View style={{ position: 'absolute', top: 12, left: 12, backgroundColor: colors.accent, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5 }}>
            <Text style={{ color: colors.foreground, fontFamily: fontFor(lang, 'bold'), fontSize: 10 }}>{t('demo')}</Text>
          </View>
        )}
        {listing.compatible && (
          <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5 }}>
            <Text style={{ color: colors.primaryForeground, fontFamily: fontFor(lang, 'semibold'), fontSize: 10 }}>
              {lang === 'am' ? 'መጠን ይስማማል' : 'Size match'}
            </Text>
          </View>
        )}
      </View>
      <View style={{ padding: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ color: colors.foreground, fontFamily: fontFor(lang, 'bold'), fontSize: 17 }}>{listing.title}</Text>
            <Text style={{ color: colors.mutedForeground, fontFamily: fontFor(lang), fontSize: 12, marginTop: 4 }}>
              {listing.ownerName} · {listing.neighborhood}
            </Text>
          </View>
          {(onEdit || onArchive) && (
            <View style={{ flexDirection: 'row', marginTop: -9, marginRight: -8 }}>
              {onEdit && <IconAction icon="edit-2" label={t('edit')} onPress={onEdit} />}
              {onArchive && <IconAction icon="archive" label={t('archive')} color={colors.destructive} onPress={onArchive} />}
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          {[label, displayOccasion(lang, listing.occasion), listing.color].map((tag) => (
            <View key={tag} style={{ borderRadius: 12, backgroundColor: colors.secondary, paddingHorizontal: 9, paddingVertical: 5 }}>
              <Text numberOfLines={1} style={{ color: colors.secondaryForeground, fontFamily: fontFor(lang), fontSize: 11 }}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}
