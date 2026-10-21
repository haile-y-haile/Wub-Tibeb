import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUser } from '@clerk/expo';
import { useQueryClient } from '@tanstack/react-query';
import {
  useBlockUser,
  getGetMessagesQueryKey,
  useGetMatches,
  useGetMessages,
  useSendMessage,
  useUpdateExchange,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { fontFor, useLocale } from '@/lib/locale';
import { BrandHeader, Button, DressImage, LoadingState, Page, PageHeading, Panel, StatusMessage } from '@/components/ui';

export default function MatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lang, t } = useLocale();
  const colors = useColors();
  const { user } = useUser();
  const router = useRouter();
  const client = useQueryClient();
  const matchQuery = useGetMatches({ id });
  const match = matchQuery.data?.[0];
  const messages = useGetMessages(id, undefined, {
    query: {
      queryKey: getGetMessagesQueryKey(id),
      refetchInterval: 10000,
      refetchIntervalInBackground: false,
    },
  });
  const send = useSendMessage();
  const exchange = useUpdateExchange();
  const block = useBlockUser();
  const [draft, setDraft] = useState('');
  const [proposal, setProposal] = useState('');
  const [error, setError] = useState('');
  const ownDress = match ? (match.dressA.ownerId === user?.id ? match.dressA : match.dressB) : undefined;
  const otherDress = match ? (match.dressA.ownerId === user?.id ? match.dressB : match.dressA) : undefined;
  const otherUserId = otherDress?.ownerId;
  const otherName = otherDress?.ownerName ?? (lang === 'am' ? 'የልውውጥ አጋር' : 'Swap partner');
  const sortedMessages = useMemo(() => [...(messages.data ?? [])].reverse(), [messages.data]);

  const invalidate = async () => {
    await Promise.all([client.invalidateQueries({ queryKey: matchQuery.queryKey }), client.invalidateQueries({ queryKey: messages.queryKey })]);
  };

  const sendText = async () => {
    const text = draft.trim();
    if (!text || send.isPending) return;
    setError('');
    try {
      await send.mutateAsync({ id, data: { text } });
      setDraft('');
      await client.invalidateQueries({ queryKey: messages.queryKey });
    } catch {
      setError(lang === 'am' ? 'መልዕክቱ አልተላከም። የግንኙነትዎን ይመልከቱና እንደገና ይሞክሩ።' : 'Message not sent. Check your connection and retry.');
    }
  };

  const updateSwap = async (action: 'propose' | 'accept' | 'complete' | 'cancel') => {
    if (!match) return;
    setError('');
    try {
      const data =
        action === 'propose'
          ? { action, proposal: proposal.trim() }
          : action === 'accept'
            ? { action, expectedProposal: match.proposal }
            : { action };
      await exchange.mutateAsync({ id, data });
      setProposal('');
      await invalidate();
    } catch {
      setError(lang === 'am' ? 'የልውውጥ ደረጃውን ማስቀመጥ አልተቻለም። ዝርዝሩ ሊቀየር ይችላል፤ እንደገና ያድሱ።' : 'Could not update the swap. It may have changed; refresh and try again.');
    }
  };

  const confirmComplete = () => {
    Alert.alert(t('complete'), t('handoffPrompt'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('complete'), onPress: () => updateSwap('complete') },
    ]);
  };

  const confirmCancel = () => {
    Alert.alert(t('cancel'), t('cancelSwap'), [
      { text: lang === 'am' ? 'ተወው' : 'Keep swap', style: 'cancel' },
      { text: t('cancel'), style: 'destructive', onPress: () => updateSwap('cancel') },
    ]);
  };

  const blockPartner = () => {
    if (!otherUserId) return;
    Alert.alert(t('block'), lang === 'am' ? 'ይህ አባል ይደበቃል እና ያልተጠናቀቀ ልውውጥ በደህና ይዘጋል።' : 'This member will be hidden and any open swap safely closed.', [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('block'),
        style: 'destructive',
        onPress: async () => {
          try {
            await block.mutateAsync({ data: { userId: otherUserId } });
            router.back();
          } catch {
            Alert.alert(t('error'));
          }
        },
      },
    ]);
  };

  if (matchQuery.isLoading) return <Page><LoadingState label={t('loading')} /></Page>;
  if (matchQuery.error || !match || !ownDress || !otherDress) {
    return <Page><StatusMessage icon="alert-circle">{lang === 'am' ? 'ይህን ልውውጥ መጫን አልተቻለም።' : 'This swap could not be loaded.'}</StatusMessage></Page>;
  }

  return (
    <Page scroll={false}>
      <View style={{ flex: 1 }}>
        <BrandHeader showBell={false} />
        <PageHeading title={otherName} subtitle={`${ownDress.title} ↔ ${otherDress.title}`} />
        <Panel style={{ padding: 10, marginTop: 0 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <DressImage uri={ownDress.photos[0]} style={{ flex: 1, height: 106, borderRadius: 11 }} />
            <DressImage uri={otherDress.photos[0]} style={{ flex: 1, height: 106, borderRadius: 11 }} />
          </View>
          <Text style={{ color: colors.mutedForeground, fontFamily: fontFor(lang), fontSize: 11, marginTop: 7 }}>
            {lang === 'am' ? 'ይህ ግጥሚያ በእነዚህ ሁለት ቀሚሶች ላይ ብቻ ነው።' : 'This match is for these two dresses only.'}
          </Text>
        </Panel>
        {match.status !== 'completed' && match.status !== 'cancelled' && (
          <Panel style={{ padding: 12 }}>
            <Text style={{ color: colors.foreground, fontFamily: fontFor(lang, 'semibold'), fontSize: 14 }}>
              {match.status === 'accepted' ? t('accepted') : match.status === 'proposed' ? t('proposed') : t('matched')}
            </Text>
            {match.proposal ? <Text style={{ color: colors.mutedForeground, fontFamily: fontFor(lang), fontSize: 13, marginTop: 6, lineHeight: 19 }}>{match.proposal}</Text> : null}
            {(match.status === 'matched' || match.status === 'proposed') && (
              <>
                <TextInput
                  value={proposal}
                  onChangeText={setProposal}
                  placeholder={t('proposal')}
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  maxLength={500}
                  accessibilityLabel={t('proposal')}
                  style={{ minHeight: 66, textAlignVertical: 'top', borderWidth: 1, borderColor: colors.input, borderRadius: 12, backgroundColor: colors.background, padding: 11, color: colors.foreground, fontFamily: fontFor(lang), marginTop: 9 }}
                />
                <View style={{ marginTop: 8 }}><Button title={match.status === 'proposed' ? t('counterProposal') : t('propose')} icon="map-pin" onPress={() => updateSwap('propose')} disabled={exchange.isPending || proposal.trim().length < 5} /></View>
              </>
            )}
            {match.status === 'proposed' && <View style={{ marginTop: 10 }}><Button title={t('accept')} icon="check" onPress={() => updateSwap('accept')} disabled={exchange.isPending} /></View>}
            {match.status === 'accepted' && (
              <View style={{ marginTop: 10 }}>
                <Button title={t('complete')} icon="check-circle" onPress={confirmComplete} disabled={exchange.isPending || match.completedBy.includes(user?.id ?? '')} />
                {match.completedBy.includes(user?.id ?? '') && <Text style={{ color: colors.mutedForeground, fontFamily: fontFor(lang), fontSize: 11, marginTop: 5 }}>{lang === 'am' ? 'የእርስዎ ማረጋገጫ ተቀምጧል። አጋርዎም ማረጋገጥ አለበት።' : 'Your confirmation is saved; your partner must also confirm.'}</Text>}
              </View>
            )}
            {match.status !== 'completed' && (
                <Pressable onPress={confirmCancel} style={{ paddingTop: 11, alignItems: 'center' }}>
                <Text style={{ color: colors.destructive, fontFamily: fontFor(lang, 'semibold'), fontSize: 13 }}>{t('cancel')}</Text>
              </Pressable>
            )}
          </Panel>
        )}
        {match.status === 'completed' && <Panel><StatusMessage icon="check-circle">{t('completed')}</StatusMessage></Panel>}
        {match.status === 'cancelled' && <Panel><StatusMessage icon="x-circle">{lang === 'am' ? 'ይህ ልውውጥ ተሰርዟል።' : 'This swap was cancelled.'}</StatusMessage></Panel>}
        {!!error && <Text accessibilityRole="alert" style={{ color: colors.destructive, fontFamily: fontFor(lang), paddingHorizontal: 20, paddingBottom: 5 }}>{error}</Text>}
        <View style={{ flex: 1, minHeight: 120, paddingHorizontal: 16 }}>
          {messages.isLoading ? (
            <LoadingState label={t('loading')} />
          ) : messages.error ? (
            <StatusMessage icon="wifi-off">{lang === 'am' ? 'መልዕክቶችን መጫን አልተቻለም።' : 'Could not load messages.'}</StatusMessage>
          ) : (
            <FlatList
              inverted
              data={sortedMessages}
              keyExtractor={(message) => message.id}
              contentContainerStyle={{ paddingVertical: 12, gap: 8 }}
              ListEmptyComponent={<Text style={{ color: colors.mutedForeground, fontFamily: fontFor(lang), textAlign: 'center', fontSize: 12 }}>{lang === 'am' ? 'ውይይቱን በደህና ይጀምሩ።' : 'Start the private conversation.'}</Text>}
              renderItem={({ item }) => {
                const mine = item.senderId === user?.id;
                return (
                  <View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '84%', borderRadius: 15, borderBottomRightRadius: mine ? 4 : 15, borderBottomLeftRadius: mine ? 15 : 4, backgroundColor: mine ? colors.primary : colors.secondary, paddingHorizontal: 12, paddingVertical: 9 }}>
                    <Text style={{ color: mine ? colors.primaryForeground : colors.secondaryForeground, fontFamily: fontFor(lang), fontSize: 14, lineHeight: 20 }}>{item.text}</Text>
                    <Text style={{ color: mine ? '#E4E9E5' : colors.mutedForeground, fontSize: 9, marginTop: 3 }}>{new Date(item.createdAt).toLocaleTimeString(lang === 'am' ? 'am-ET' : 'en-ET', { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                );
              }}
            />
          )}
        </View>
        {match.status !== 'completed' && match.status !== 'cancelled' && (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderTopWidth: 1, borderColor: colors.border, padding: 10, paddingBottom: 12, backgroundColor: colors.background }}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={t('message')}
                placeholderTextColor={colors.mutedForeground}
                multiline
                maxLength={2000}
                accessibilityLabel={t('message')}
                testID="match-message-input"
                style={{ flex: 1, maxHeight: 110, minHeight: 43, borderWidth: 1, borderColor: colors.input, borderRadius: 22, backgroundColor: colors.card, paddingHorizontal: 14, paddingVertical: 10, color: colors.foreground, fontFamily: fontFor(lang) }}
              />
              <Pressable accessibilityRole="button" accessibilityLabel={t('send')} testID="send-message" disabled={!draft.trim() || send.isPending} onPress={sendText} style={({ pressed }) => [{ width: 44, height: 44, borderRadius: 23, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: !draft.trim() || pressed ? 0.55 : 1 }]}>
                <Text style={{ color: colors.primaryForeground, fontSize: 19 }}>➤</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        )}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 24, paddingBottom: 8 }}>
          <Pressable onPress={() => router.push(`/report/${otherDress.id}`)}><Text style={{ color: colors.mutedForeground, fontFamily: fontFor(lang), fontSize: 11 }}>{t('report')}</Text></Pressable>
          <Pressable onPress={blockPartner}><Text style={{ color: colors.destructive, fontFamily: fontFor(lang), fontSize: 11 }}>{t('block')}</Text></Pressable>
        </View>
      </View>
    </Page>
  );
}
