import React from 'react';
import { Alert, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useGetModeration, useModerateReport } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { fontFor, useLocale } from '@/lib/locale';
import { Button, LoadingState, Page, PageHeading, Panel, StatusMessage } from '@/components/ui';

export default function ModerationScreen() {
  const { lang, t } = useLocale();
  const colors = useColors();
  const client = useQueryClient();
  const query = useGetModeration();
  const moderate = useModerateReport();
  const act = async (reportId: string, action: 'dismiss' | 'hide' | 'close_dispute') => {
    try {
      await moderate.mutateAsync({ data: { reportId, action } });
      await client.invalidateQueries({ queryKey: query.queryKey });
    } catch {
      Alert.alert(t('error'), lang === 'am' ? 'የአስተዳዳሪ ውሳኔው አልተቀመጠም።' : 'The moderation action was not saved.');
    }
  };
  return (
    <Page>
      <PageHeading title={t('admin')} subtitle={lang === 'am' ? 'የቀረቡ ሪፖርቶችን በጥንቃቄ ይገምግሙ።' : 'Review member reports and handoff disputes.'} />
      {query.isLoading ? (
        <LoadingState label={t('loading')} />
      ) : query.error ? (
        <StatusMessage icon="lock">{lang === 'am' ? 'ይህን ገጽ የማየት ፍቃድ የለዎትም።' : 'You do not have permission to view this page.'}</StatusMessage>
      ) : !query.data?.length ? (
        <StatusMessage icon="check-circle">{lang === 'am' ? 'ግምገማ የሚጠብቅ ሪፖርት የለም።' : 'No reports are waiting for review.'}</StatusMessage>
      ) : (
        <View style={{ paddingHorizontal: 12 }}>
          {query.data.map((report) => (
            <Panel key={report.id} style={{ padding: 14 }}>
              <Text style={{ color: colors.foreground, fontFamily: fontFor(lang, 'bold'), fontSize: 14 }}>{report.reason}</Text>
              <Text style={{ color: colors.mutedForeground, fontFamily: fontFor(lang), fontSize: 11, marginTop: 6 }}>{lang === 'am' ? report.status === 'pending' ? 'በግምገማ ላይ' : report.status === 'resolved' ? 'ተፈትቷል' : report.status : report.status} · {report.handoffHold ? (lang === 'am' ? 'ልውውጡ በጊዜያዊነት ቆሟል' : 'swap on hold') : ''}</Text>
              <View style={{ gap: 7, marginTop: 12 }}>
                <Button title={lang === 'am' ? 'ሪፖርቱን ዝጋ' : 'Dismiss report'} variant="secondary" onPress={() => act(report.id, 'dismiss')} disabled={moderate.isPending} />
                <Button title={lang === 'am' ? 'ዝርዝሩን ደብቅ' : 'Hide listing'} variant="danger" onPress={() => act(report.id, 'hide')} disabled={moderate.isPending} />
                {report.handoffHold && <Button title={lang === 'am' ? 'የልውውጥ ክርክሩን መዝጋት' : 'Close handoff dispute'} variant="ghost" onPress={() => act(report.id, 'close_dispute')} disabled={moderate.isPending} />}
              </View>
            </Panel>
          ))}
        </View>
      )}
    </Page>
  );
}
