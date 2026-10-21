import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useGetNotifications, useReadNotifications } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { fontFor, useLocale } from '@/lib/locale';
import { BrandHeader, Button, LoadingState, Page, PageHeading, Panel, StatusMessage } from '@/components/ui';

export default function NotificationsScreen() {
  const { lang, t } = useLocale();
  const colors = useColors();
  const client = useQueryClient();
  const notifications = useGetNotifications();
  const markAll = useReadNotifications();
  const read = async () => {
    try {
      await markAll.mutateAsync();
      await client.invalidateQueries({ queryKey: notifications.queryKey });
    } catch {
      // The list remains available if marking read is temporarily unavailable.
    }
  };
  return (
    <Page>
      <BrandHeader showBell={false} />
      <PageHeading
        title={t('notifications')}
        action={!!notifications.data?.some((notice) => !notice.read) ? (
          <View style={{ width: 150 }}><Button title={t('markRead')} variant="secondary" onPress={read} disabled={markAll.isPending} /></View>
        ) : undefined}
      />
      {notifications.isLoading ? (
        <LoadingState label={t('loading')} />
      ) : notifications.error ? (
        <StatusMessage icon="wifi-off">{lang === 'am' ? 'ማሳወቂያዎችን መጫን አልተቻለም።' : 'Could not load notifications.'}</StatusMessage>
      ) : !notifications.data?.length ? (
        <StatusMessage icon="bell">{t('noNotifications')}</StatusMessage>
      ) : (
        <View style={{ paddingHorizontal: 14 }}>
          {notifications.data.map((notice) => (
            <Panel key={notice.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginHorizontal: 4 }}>
              <View style={{ width: 9, height: 9, borderRadius: 5, marginTop: 6, backgroundColor: notice.read ? colors.border : colors.accent }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontFamily: fontFor(lang), fontSize: 14, lineHeight: 21 }}>{notice.text}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 6 }}>{new Date(notice.createdAt).toLocaleString(lang === 'am' ? 'am-ET' : 'en-ET')}</Text>
              </View>
            </Panel>
          ))}
        </View>
      )}
    </Page>
  );
}
