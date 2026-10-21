import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'am' | 'en';
const STORAGE_KEY = 'wub-tibeb-language';

const messages = {
  am: {
    brand: 'ውብ ጥበብ',
    tagline: 'ይልበሱ። ያጋሩ። ይድገሙ።',
    englishTagline: 'Wear. Share. Repeat.',
    discover: 'ፈልግ',
    wardrobe: 'ቁም ሣጥን',
    matches: 'ልውውጦች',
    profile: 'መገለጫ',
    welcome: 'የሃበሻ ቀሚስ ልውውጥ',
    welcomeBody: 'ለበዓላት የሚለበሱ ቀሚሶችን በማህበረሰብዎ ውስጥ ይለዋወጡ።',
    signIn: 'ይግቡ',
    signUp: 'መለያ ይፍጠሩ',
    email: 'ኢሜይል',
    password: 'የይለፍ ቃል',
    fullName: 'ሙሉ ስም',
    neighborhood: 'አጠቃላይ አካባቢ',
    continue: 'ይቀጥሉ',
    createAccount: 'መለያ ይፍጠሩ',
    useGoogle: 'በGoogle ይቀጥሉ',
    verifyEmail: 'ኢሜይልዎን ያረጋግጡ',
    code: 'የማረጋገጫ ኮድ',
    resendCode: 'ኮዱን እንደገና ላክ',
    noAccount: 'መለያ የለዎትም?',
    haveAccount: 'መለያ አለዎት?',
    signOut: 'ይውጡ',
    search: 'ቀሚሶችን ይፈልጉ',
    filters: 'ማጣሪያዎች',
    occasion: 'የሚለበስበት በዓል',
    color: 'ቀለም',
    fabric: 'ጨርቅ',
    condition: 'ሁኔታ',
    compatible: 'ከመጠኔ ጋር የሚስማሙ',
    likeNew: 'አዲስ ያህል',
    excellent: 'በጣም ጥሩ',
    good: 'ጥሩ',
    fair: 'ተጠቅሞበታል',
    dresses: 'ቀሚሶች',
    likes: 'ወድጄዋለሁ',
    pass: 'አልፍ',
    chooseOffer: 'ለዚህ ቀሚስ የምታቀርቡትን ይምረጡ',
    selectDress: 'ቀሚስ ይምረጡ',
    confirmLike: 'ወድጄዋለሁ ብለው ያረጋግጡ',
    noOwnDresses: 'ለልውውጥ የሚቀርብ ቀሚስ የለዎትም።',
    listFirst: 'መጀመሪያ ቀሚስ ይዘርዝሩ',
    noDresses: 'አሁን የሚታዩ ቀሚሶች የሉም።',
    tryFilters: 'ማጣሪያዎችን ይቀይሩ ወይም ቆይተው እንደገና ይመልከቱ።',
    refresh: 'እንደገና ይሞክሩ',
    viewDress: 'ዝርዝሩን ይመልከቱ',
    addDress: 'ቀሚስ ይዘርዝሩ',
    edit: 'አስተካክል',
    archive: 'ከዝርዝር አስወግድ',
    noListings: 'ቁም ሣጥንዎ ገና ባዶ ነው።',
    listingTitle: 'የቀሚሱ ስም',
    description: 'መግለጫ',
    photos: 'ፎቶዎች (እስከ 6)',
    addPhotos: 'ፎቶ ይምረጡ',
    timesWorn: 'ስንት ጊዜ ተለብሷል?',
    embroidery: 'ጥልፍ',
    measurements: 'የቀሚሱ መጠኖች (ሴ.ሜ.)',
    bust: 'ደረት',
    waist: 'ወገብ',
    hips: 'ዳሌ',
    shoulder: 'ትከሻ',
    length: 'ርዝመት',
    sleeves: 'እጅጌ',
    saveListing: 'ቀሚሱን ያስቀምጡ',
    saveChanges: 'ለውጦችን ያስቀምጡ',
    required: 'እባክዎ የጠየቁትን መረጃ ያስገቡ።',
    profileSetup: 'መገለጫዎን ያዘጋጁ',
    profileHelp: 'መጠኖችዎ ለእርስዎ ብቻ የሚታዩ ናቸው።',
    saveProfile: 'መገለጫን ያስቀምጡ',
    profileSaved: 'መገለጫዎ ተቀምጧል።',
    noMatches: 'ገና የተጣመሙ ልውውጦች የሉም።',
    matched: 'ተጣምሯል',
    proposed: 'ሀሳብ ቀርቧል',
    accepted: 'ተስማምተዋል',
    completed: 'ልውውጡ ተጠናቋል',
    history: 'የቀድሞ ልውውጦች',
    message: 'መልዕክት',
    send: 'ላክ',
    proposal: 'የስብሰባ ጊዜና ቦታ ይጠቁሙ',
    propose: 'የልውውጥ ሀሳብ ያቅርቡ',
    accept: 'ሀሳቡን ተቀበል',
    complete: 'ልውውጡን አረጋግጥ',
    cancel: 'ሰርዝ',
    cancelSwap: 'ይህን ልውውጥ መሰረዝ ይፈልጋሉ?',
    counterProposal: 'ሌላ ጊዜና ቦታ ጠቁም',
    handoffPrompt: 'ቀሚሶቹን በእርግጥ ተለዋውጠዋል?',
    report: 'ተጠቃሚን ወይም ቀሚስን ሪፖርት አድርግ',
    block: 'ተጠቃሚን አግድ',
    reportReason: 'የሪፖርት ምክንያት',
    submitReport: 'ሪፖርት ላክ',
    notifications: 'ማሳወቂያዎች',
    markRead: 'ሁሉንም እንደተነበቡ ምልክት አድርግ',
    noNotifications: 'ማሳወቂያዎች የሉም።',
    help: 'እንዴት እንደሚሰራ',
    tutorial: 'የመጀመሪያ ጊዜ መመሪያ',
    loading: 'በመጫን ላይ…',
    error: 'የሆነ ችግር ተፈጥሯል።',
    demo: 'ማሳያ',
    all: 'ሁሉም',
    clear: 'አጽዳ',
    apply: 'ውጤቶችን አሳይ',
    colorPlaceholder: 'ለምሳሌ፦ ነጭ',
    fabricPlaceholder: 'ለምሳሌ፦ ጥጥ',
    admin: 'የአስተዳዳሪ ግምገማ',
    emptyHistory: 'የተጠናቀቁ ልውውጦች ገና የሉም።',
    notFound: 'ይህ ቀሚስ አልተገኘም።',
  },
  en: {
    brand: 'Wub Tibeb',
    tagline: 'Wear. Share. Repeat.',
    englishTagline: 'Wear. Share. Repeat.',
    discover: 'Discover',
    wardrobe: 'My dresses',
    matches: 'Swaps',
    profile: 'Profile',
    welcome: 'Habesha kemis exchange',
    welcomeBody: 'Pass a holiday dress on and find one you will love wearing.',
    signIn: 'Sign in',
    signUp: 'Create account',
    email: 'Email address',
    password: 'Password',
    fullName: 'Full name',
    neighborhood: 'General neighborhood',
    continue: 'Continue',
    createAccount: 'Create account',
    useGoogle: 'Continue with Google',
    verifyEmail: 'Verify your email',
    code: 'Verification code',
    resendCode: 'Send a new code',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    signOut: 'Sign out',
    search: 'Search dresses',
    filters: 'Filters',
    occasion: 'Occasion',
    color: 'Color',
    fabric: 'Fabric',
    condition: 'Condition',
    compatible: 'Fits my measurements',
    likeNew: 'Like new',
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    dresses: 'dresses',
    likes: 'Like',
    pass: 'Pass',
    chooseOffer: 'Choose the dress you are offering',
    selectDress: 'Choose a dress',
    confirmLike: 'Send like',
    noOwnDresses: 'You do not have an active dress to offer yet.',
    listFirst: 'List a dress first',
    noDresses: 'No dresses to show right now.',
    tryFilters: 'Change your filters or check again later.',
    refresh: 'Try again',
    viewDress: 'View details',
    addDress: 'List a dress',
    edit: 'Edit',
    archive: 'Archive',
    noListings: 'Your wardrobe is empty for now.',
    listingTitle: 'Dress title',
    description: 'Description',
    photos: 'Photos (up to 6)',
    addPhotos: 'Choose photos',
    timesWorn: 'Times worn',
    embroidery: 'Embroidery',
    measurements: 'Dress measurements (cm)',
    bust: 'Bust',
    waist: 'Waist',
    hips: 'Hips',
    shoulder: 'Shoulder',
    length: 'Length',
    sleeves: 'Sleeves',
    saveListing: 'Publish dress',
    saveChanges: 'Save changes',
    required: 'Please complete all required fields.',
    profileSetup: 'Set up your profile',
    profileHelp: 'Your preferred measurements are private to you.',
    saveProfile: 'Save profile',
    profileSaved: 'Your profile is saved.',
    noMatches: 'No garment matches yet.',
    matched: 'Matched',
    proposed: 'Proposal sent',
    accepted: 'Accepted',
    completed: 'Swap completed',
    history: 'Swap history',
    message: 'Message',
    send: 'Send',
    proposal: 'Suggest a safe time and public meeting place',
    propose: 'Propose a swap',
    accept: 'Accept proposal',
    complete: 'Confirm handoff',
    cancel: 'Cancel',
    cancelSwap: 'Do you want to cancel this swap?',
    counterProposal: 'Suggest another time and place',
    handoffPrompt: 'Have you both exchanged the dresses in person?',
    report: 'Report member or dress',
    block: 'Block member',
    reportReason: 'Why are you reporting this?',
    submitReport: 'Submit report',
    notifications: 'Notifications',
    markRead: 'Mark all as read',
    noNotifications: 'No notifications yet.',
    help: 'How it works',
    tutorial: 'First-time guide',
    loading: 'Loading…',
    error: 'Something went wrong.',
    demo: 'DEMO',
    all: 'All',
    clear: 'Clear',
    apply: 'Show results',
    colorPlaceholder: 'e.g. White',
    fabricPlaceholder: 'e.g. Cotton',
    admin: 'Moderation review',
    emptyHistory: 'No completed swaps yet.',
    notFound: 'This dress could not be found.',
  },
} as const;

export type MessageKey = keyof typeof messages.am;
const occasionLabels: Record<string, string> = {
  Timket: 'ጥምቀት',
  Meskel: 'መስቀል',
  Enkutatash: 'እንቁጣጣሽ',
  Fasika: 'ፋሲካ',
  Genna: 'ገና',
  Wedding: 'ሰርግ',
  'Other holiday': 'ሌላ በዓል',
};
const conditionLabels: Record<string, string> = {
  'Like new': 'አዲስ ያህል',
  Excellent: 'በጣም ጥሩ',
  Good: 'ጥሩ',
  Fair: 'ተጠቅሞበታል',
};

export function displayOccasion(lang: Language, value: string) {
  return lang === 'am' ? occasionLabels[value] ?? value : value;
}

export function displayCondition(lang: Language, value: string) {
  return lang === 'am' ? conditionLabels[value] ?? value : value;
}

type LocaleContextValue = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: MessageKey) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('am');

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (mounted && (saved === 'am' || saved === 'en')) setLangState(saved);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ lang, setLang, t: (key: MessageKey) => messages[lang][key] }),
    [lang, setLang],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error('useLocale must be used inside LocaleProvider');
  return value;
}

export function fontFor(lang: Language, weight: 'regular' | 'medium' | 'semibold' | 'bold' = 'regular') {
  if (lang === 'am') {
    return weight === 'bold' || weight === 'semibold'
      ? 'NotoSansEthiopic_700Bold'
      : 'NotoSansEthiopic_400Regular';
  }
  return {
    regular: 'Figtree_400Regular',
    medium: 'Figtree_500Medium',
    semibold: 'Figtree_600SemiBold',
    bold: 'Figtree_700Bold',
  }[weight];
}
