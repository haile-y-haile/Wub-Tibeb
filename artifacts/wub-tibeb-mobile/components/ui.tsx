import React, { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { fontFor, useLocale } from '@/lib/locale';
import { imageUrl } from '@/lib/app';

export function Page({
  children,
  scroll = true,
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: object;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const top = Platform.OS === 'web' ? 67 : insets.top;
  const bottom = Platform.OS === 'web' ? 120 : Math.max(insets.bottom, 12) + 90;
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: top }}>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[{ paddingBottom: bottom }, contentStyle]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </View>
  );
}

export function BrandHeader({ title, showBell = true }: { title?: string; showBell?: boolean }) {
  const colors = useColors();
  const router = useRouter();
  const { lang, setLang, t } = useLocale();
  return (
    <View style={styles.brandHeader}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.wordmark, { color: colors.primary, fontFamily: lang === 'am' ? fontFor(lang, 'bold') : 'Fraunces_600SemiBold' }]}>
          {title ?? t('brand')}
        </Text>
        <Text style={[styles.tagline, { color: colors.mutedForeground, fontFamily: fontFor(lang) }]}>
          {t('tagline')}
        </Text>
      </View>
      {showBell && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('notifications')}
          testID="notifications-button"
          onPress={() => router.push('/notifications')}
          style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.65 }]}
        >
          <Feather name="bell" size={20} color={colors.primary} />
        </Pressable>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={lang === 'am' ? 'Switch to English' : 'ወደ አማርኛ ቀይር'}
        accessibilityState={{ selected: lang === 'am' }}
        testID="language-toggle"
        onPress={() => setLang(lang === 'am' ? 'en' : 'am')}
        style={({ pressed }) => [styles.languageButton, { borderColor: colors.border }, pressed && { opacity: 0.65 }]}
      >
        <Text style={{ color: colors.primary, fontFamily: fontFor(lang, 'semibold'), fontSize: 12 }}>
          {lang === 'am' ? 'አማ / EN' : 'አማ / EN'}
        </Text>
      </Pressable>
    </View>
  );
}

export function PageHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  const colors = useColors();
  const { lang } = useLocale();
  return (
    <View style={styles.pageHeading}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.pageTitle, { color: colors.foreground, fontFamily: fontFor(lang, 'bold') }]}>{title}</Text>
        {!!subtitle && (
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: fontFor(lang) }]}>{subtitle}</Text>
        )}
      </View>
      {action}
    </View>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  testID,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: keyof typeof Feather.glyphMap;
  disabled?: boolean;
  testID?: string;
}) {
  const colors = useColors();
  const { lang } = useLocale();
  const bg =
    variant === 'primary' ? colors.primary : variant === 'danger' ? colors.destructive : variant === 'secondary' ? colors.secondary : 'transparent';
  const fg =
    variant === 'primary' || variant === 'danger' ? colors.primaryForeground : colors.foreground;
  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: variant === 'ghost' ? 'transparent' : colors.border, opacity: disabled ? 0.5 : pressed ? 0.82 : 1 },
      ]}
    >
      {icon && <Feather name={icon} size={17} color={fg} />}
      <Text style={{ color: fg, fontFamily: fontFor(lang, 'semibold'), fontSize: 14 }}>{title}</Text>
    </Pressable>
  );
}

export function IconAction({
  icon,
  label,
  onPress,
  color,
  testID,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  testID?: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [styles.iconAction, pressed && { opacity: 0.55 }]}
    >
      <Feather name={icon} size={22} color={color ?? colors.primary} />
    </Pressable>
  );
}

export function Field({
  label,
  ...props
}: TextInputProps & { label: string }) {
  const colors = useColors();
  const { lang } = useLocale();
  return (
    <View style={{ gap: 6, marginBottom: 13 }}>
      <Text style={{ color: colors.foreground, fontSize: 13, fontFamily: fontFor(lang, 'semibold') }}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.input,
          { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.input, fontFamily: fontFor(lang) },
          props.style,
        ]}
      />
    </View>
  );
}

export function Chip({
  title,
  selected,
  onPress,
  testID,
}: {
  title: string;
  selected?: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const colors = useColors();
  const { lang } = useLocale();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.card,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <Text style={{ color: selected ? colors.primaryForeground : colors.foreground, fontFamily: fontFor(lang, 'medium'), fontSize: 12 }}>
        {title}
      </Text>
    </Pressable>
  );
}

export function Panel({ children, style }: { children: ReactNode; style?: object }) {
  const colors = useColors();
  return <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }, style]}>{children}</View>;
}

export function StatusMessage({ children, icon = 'info' }: { children: string; icon?: keyof typeof Feather.glyphMap }) {
  const colors = useColors();
  const { lang } = useLocale();
  return (
    <Panel style={styles.statusPanel}>
      <Feather name={icon} size={20} color={colors.primary} />
      <Text style={{ flex: 1, color: colors.mutedForeground, fontFamily: fontFor(lang), fontSize: 14, lineHeight: 21 }}>{children}</Text>
    </Panel>
  );
}

export function LoadingState({ label }: { label: string }) {
  const colors = useColors();
  const { lang } = useLocale();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: 36, gap: 12 }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ color: colors.mutedForeground, fontFamily: fontFor(lang) }}>{label}</Text>
    </View>
  );
}

export function DressImage({ uri, style }: { uri?: string; style?: object }) {
  const colors = useColors();
  return uri ? (
    <Image source={{ uri: imageUrl(uri) }} contentFit="cover" cachePolicy="memory-disk" transition={120} style={style as never} />
  ) : (
    <View style={[styles.imageFallback, { backgroundColor: colors.secondary }, style]}>
      <Feather name="image" size={28} color={colors.mutedForeground} />
    </View>
  );
}

export function Muted({ children }: { children: ReactNode }) {
  const colors = useColors();
  const { lang } = useLocale();
  return <Text style={{ color: colors.mutedForeground, fontFamily: fontFor(lang), fontSize: 13, lineHeight: 20 }}>{children}</Text>;
}

const styles = StyleSheet.create({
  brandHeader: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
  wordmark: { fontSize: 20, lineHeight: 26 },
  tagline: { fontSize: 11, marginTop: 2 },
  iconButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  languageButton: { minHeight: 36, paddingHorizontal: 10, borderWidth: 1, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  pageHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, paddingHorizontal: 20, paddingVertical: 12 },
  pageTitle: { fontSize: 25, lineHeight: 32 },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: 4 },
  button: { minHeight: 48, borderRadius: 25, borderWidth: 1, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  iconAction: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  input: { minHeight: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15 },
  chip: { minHeight: 34, borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  panel: { marginHorizontal: 18, marginVertical: 7, borderWidth: 1, borderRadius: 18, padding: 15 },
  statusPanel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  imageFallback: { alignItems: 'center', justifyContent: 'center', borderRadius: 14, overflow: 'hidden' },
});
