import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useColors } from '@/hooks/useColors';
import { absoluteUrl } from '@/lib/app';
import { fontFor, useLocale } from '@/lib/locale';
import { BrandHeader, Chip, LoadingState, Page, PageHeading, Panel, StatusMessage } from '@/components/ui';

type Tutorial = 'listing' | 'matching' | 'exchange';

export default function HelpScreen() {
  const { lang, t } = useLocale();
  const colors = useColors();
  const [tutorial, setTutorial] = useState<Tutorial>('listing');
  const videoUrl = useMemo(() => absoluteUrl(`/api/storage/public-objects/tutorials/${tutorial}-${lang}.mp4`), [tutorial, lang]);
  const player = useVideoPlayer(null, (instance) => {
    instance.loop = false;
    instance.muted = false;
  });
  useEffect(() => {
    player.replace({ uri: videoUrl });
    player.pause();
  }, [player, videoUrl]);

  const lessonText: Record<Tutorial, { am: string[]; en: string[] }> = {
    listing: {
      am: ['በብርሃን የተነሱ ፎቶዎችን ይምረጡ፤ ፊት፣ ጥልፍ እና ከታች ያለውን ክፍል ያሳዩ።', 'ሁኔታ፣ ጨርቅ፣ በዓል፣ የተለበሰበት ጊዜ እና ስድስቱን የቀሚስ መጠኖች በሴ.ሜ. ያስገቡ።', 'ዝርዝሩን ያስቀምጡ፤ ሌሎች አባላት ያዩታል።'],
      en: ['Choose clear photos in good light: front, embroidery, and hem.', 'Add condition, fabric, holiday, times worn, and all six garment measurements in cm.', 'Publish the listing so other members can discover it.'],
    },
    matching: {
      am: ['ቀሚሶችን ያስሱ ወይም በበዓልና በሁኔታ ያጣሩ።', 'በቀኝ ሲያንሸራትቱ ለልውውጥ ከራስዎ ቁም ሣጥን አንድ ቀሚስ ይምረጡ።', 'ግጥሚያ የሚፈጠረው ሁለታችሁም በተመሳሳይ ሁለት ቀሚሶች ላይ ፍላጎት ሲያሳዩ ብቻ ነው።'],
      en: ['Browse dresses or filter by holiday and condition.', 'On a right swipe, choose one active dress from your wardrobe to offer.', 'A match happens only when both members select the same two garments.'],
    },
    exchange: {
      am: ['በግል መልዕክት ይወያዩ፤ የህዝብ ቦታና ተስማሚ ጊዜ ይጠቁሙ።', 'እያንዳንዳችሁ ሀሳቡን እንደገመገማችሁ አረጋግጡ።', 'ቀሚሶቹን በእጅ ከተለዋወጣችሁ በኋላ ሁለታችሁም ልውውጡን ያጠናቅቁ።'],
      en: ['Use private messages and suggest a suitable time at a public place.', 'Both members review and accept the proposal before meeting.', 'After exchanging the dresses in person, both members confirm completion.'],
    },
  };
  const titles: Record<Tutorial, { am: string; en: string }> = {
    listing: { am: 'ቀሚስ መዘርዘር', en: 'List a dress' },
    matching: { am: 'ቀሚሶችን ማጣመር', en: 'Match dresses' },
    exchange: { am: 'ልውውጡን ማጠናቀቅ', en: 'Complete a swap' },
  };
  return (
    <Page>
      <BrandHeader showBell={false} />
      <PageHeading title={t('tutorial')} subtitle={t('help')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingHorizontal: 18, marginBottom: 8 }}>
        {(Object.keys(titles) as Tutorial[]).map((key) => <Chip key={key} title={titles[key][lang]} selected={tutorial === key} onPress={() => setTutorial(key)} />)}
      </View>
      <View style={{ marginHorizontal: 18, borderRadius: 17, overflow: 'hidden', backgroundColor: '#101A15' }}>
        <VideoView
          player={player}
          style={{ width: '100%', height: 220 }}
          nativeControls
          contentFit="contain"
        />
      </View>
      <Text style={{ color: colors.mutedForeground, fontFamily: fontFor(lang), fontSize: 11, paddingHorizontal: 20, marginTop: 8 }}>
        {lang === 'am' ? 'ቪዲዮው በእርስዎ ፈቃድ ብቻ ይጫወታል፤ ዳታ ለመቆጠብ በእጅ ይጀምሩ።' : 'The clip plays only when you choose; press play when ready to save data.'}
      </Text>
      <Panel>
        <Text style={{ color: colors.foreground, fontFamily: fontFor(lang, 'bold'), fontSize: 16, marginBottom: 10 }}>{titles[tutorial][lang]}</Text>
        {lessonText[tutorial][lang].map((step, index) => (
          <View key={step} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 7 }}>
            <Text style={{ color: colors.accent, fontFamily: fontFor(lang, 'bold'), fontSize: 14 }}>{index + 1}.</Text>
            <Text style={{ color: colors.foreground, fontFamily: fontFor(lang), fontSize: 13, lineHeight: 20, flex: 1 }}>{step}</Text>
          </View>
        ))}
      </Panel>
      <View style={{ paddingHorizontal: 18 }}><StatusMessage icon="shield">{lang === 'am' ? 'ለመጀመሪያ ግንኙነት የህዝብ ቦታ ይምረጡ፤ ግል አድራሻ አያጋሩ።' : 'Choose a public place for a first meeting; do not share a private home address.'}</StatusMessage></View>
    </Page>
  );
}
