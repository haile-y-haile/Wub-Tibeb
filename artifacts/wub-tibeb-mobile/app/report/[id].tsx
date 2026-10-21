import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCreateReport } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { fontFor, useLocale } from '@/lib/locale';
import { Button, Field, Page, PageHeading, Panel, StatusMessage } from '@/components/ui';

export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lang, t } = useLocale();
  const colors = useColors();
  const router = useRouter();
  const report = useCreateReport();
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [error, setError] = useState('');
  const reasons = lang === 'am'
    ? ['አጠራጣሪ ዝርዝር', 'የማይመጥን ወይም የተሳሳተ ፎቶ', 'አደገኛ ወይም የማይመች ባህሪ', 'ስለ ልውውጥ አለመግባባት', 'ሌላ']
    : ['Suspicious listing', 'Misleading details or photos', 'Unsafe or inappropriate behavior', 'Swap or handoff dispute', 'Other'];
  const submit = async () => {
    const fullReason = [reason, detail.trim()].filter(Boolean).join(': ');
    if (fullReason.length < 5) {
      setError(t('required'));
      return;
    }
    setError('');
    try {
      await report.mutateAsync({ data: { listingId: id, reason: fullReason.slice(0, 1000) } });
      router.back();
    } catch {
      setError(lang === 'am' ? 'ሪፖርቱን ማስገባት አልተቻለም።' : 'Could not submit the report.');
    }
  };
  return (
    <Page>
      <PageHeading title={t('report')} subtitle={lang === 'am' ? 'ሪፖርቶች ለአስተዳዳሪ ግምገማ በግል ይላካሉ።' : 'Reports are sent privately for moderator review.'} />
      <Panel>
        <Text style={{ color: colors.foreground, fontFamily: fontFor(lang, 'semibold'), fontSize: 14, marginBottom: 10 }}>{t('reportReason')}</Text>
        {reasons.map((item) => {
          const selected = reason === item;
          return (
            <Pressable
              key={item}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setReason(item)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.border }}
            >
              <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: selected ? colors.primary : colors.input, alignItems: 'center', justifyContent: 'center' }}>
                {selected && <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary }} />}
              </View>
              <Text style={{ flex: 1, color: colors.foreground, fontFamily: fontFor(lang), fontSize: 13 }}>{item}</Text>
            </Pressable>
          );
        })}
        <View style={{ marginTop: 12 }}>
          <Field label={lang === 'am' ? 'ተጨማሪ ዝርዝር (አማራጭ)' : 'Additional details (optional)'} value={detail} onChangeText={setDetail} multiline maxLength={850} style={{ minHeight: 92, textAlignVertical: 'top' }} />
        </View>
        {!!error && <Text accessibilityRole="alert" style={{ color: colors.destructive, fontFamily: fontFor(lang), marginBottom: 10 }}>{error}</Text>}
        <Button title={t('submitReport')} icon="flag" onPress={submit} disabled={report.isPending || !reason} />
      </Panel>
      <View style={{ paddingHorizontal: 18 }}><StatusMessage icon="shield">{lang === 'am' ? 'እባክዎ የሚችሉትን ዝርዝር ብቻ ያካፍሉ። ተጠቃሚን ማገድ ከሪፖርት የተለየ ነው።' : 'Share only details you are comfortable providing. Blocking is a separate action.'}</StatusMessage></View>
    </Page>
  );
}
