// Single source of truth for the how-to clips: the recording harness renders
// these captions into the frames, the render script writes them to .vtt, and
// the help page shows them as the always-available transcript.
export type LessonId = "listing" | "matching" | "exchange";
export type TutorialStep = { scene: string; dur: number; en: string; am: string };
export type Lesson = { id: LessonId; href: string; steps: TutorialStep[]; title: { en: string; am: string }; short: { en: string; am: string }; cta: { en: string; am: string } };

export const LESSONS: Lesson[] = [
  {
    id: "listing", href: "/wardrobe?new=1",
    title: { en: "List your kemis", am: "ቀሚስዎን ይመዝግቡ" },
    short: { en: "List", am: "ይመዝግቡ" },
    cta: { en: "Add a kemis", am: "ቀሚስ ያክሉ" },
    steps: [
      { scene: "auth", dur: 5, en: "Tap “Join Wub Tibeb” to sign up, or “Sign in”. Then add your display name and neighborhood in Profile.", am: "ለመመዝገብ «ይቀላቀሉ»ን ወይም «ይግቡ»ን ይንኩ። ከዚያ በመገለጫ የሚታይ ስምና ሰፈር ያስገቡ።" },
      { scene: "wardrobe", dur: 4, en: "Open Wardrobe and tap “Add a kemis”.", am: "ወደ «ቁም ሳጥን» ገብተው «ቀሚስ ያክሉ»ን ይንኩ።" },
      { scene: "form", dur: 4, en: "The “New listing” form opens. Only Habesha kemis may be listed.", am: "የ«አዲስ ቀሚስ» ቅጽ ይከፈታል። የሀበሻ ቀሚስ ብቻ ይመዘገባል።" },
      { scene: "photos", dur: 4, en: "Add 1 to 6 photos. The app compresses them to save your data.", am: "ከ1 እስከ 6 ፎቶ ያክሉ። ዳታ ለመቆጠብ ፎቶዎቹ ይጨመቃሉ።" },
      { scene: "details", dur: 5, en: "Write a title and a description.", am: "ርዕስና መግለጫ ይጻፉ።" },
      { scene: "select", dur: 5, en: "Choose the occasion and condition, then write the color and fabric.", am: "በዓሉንና ሁኔታውን ይምረጡ፤ ቀለሙንና ጨርቁን ይጻፉ።" },
      { scene: "embroidery", dur: 4, en: "Describe the embroidery (tibeb) and how many times it was worn.", am: "ጥበቡን ይግለጹ፤ የተለበሰበትን ብዛት ያስገቡ።" },
      { scene: "measure", dur: 6, en: "Enter all six measurements in cm: bust, waist, hips, shoulder, length and sleeves.", am: "ስድስቱንም ልኬቶች በሴ.ሜ ያስገቡ፦ ደረት፣ ወገብ፣ ዳሌ፣ ትከሻ፣ ርዝመት፣ እጅጌ።" },
      { scene: "save", dur: 5, en: "Tap “Save”. Your dress then appears in your Wardrobe. This tutorial saves nothing.", am: "«አስቀምጥ»ን ይንኩ። ቀሚሱ በቁም ሳጥንዎ ይታያል። ይህ ማሳያ ምንም አያስቀምጥም።" },
    ],
  },
  {
    id: "matching", href: "/discover",
    title: { en: "Find a match", am: "ተዛማጅ ያግኙ" },
    short: { en: "Match", am: "ይዛመዱ" },
    cta: { en: "Open Discover", am: "ወደ ያስሱ ይሂዱ" },
    steps: [
      { scene: "offer", dur: 5, en: "In Discover, under “You offer”, choose one of your own active dresses.", am: "በ«ያስሱ» ገጽ «የሚያቀርቡት» ስር ከራስዎ ንቁ ቀሚሶች አንዱን ይምረጡ።" },
      { scene: "card", dur: 5, en: "Look through dresses. Check the measurements, occasion and “Likely fits you”.", am: "ቀሚሶቹን ይመልከቱ። ልኬቱን፣ በዓሉንና «ሊሆንዎ ይችላል» የሚለውን ያስተውሉ።" },
      { scene: "like", dur: 5, en: "Tap “Swap for it” to offer your dress for this exact dress, or “Pass” to skip.", am: "የእርስዎን ቀሚስ ለዚህ ቀሚስ ለማቅረብ «ልለዋወጥ»ን፣ ለማለፍ «እለፍ»ን ይንኩ።" },
      { scene: "sent", dur: 5, en: "Your interest is sent. You are not matched yet.", am: "ፍላጎትዎ ተልኳል። ገና አልተዛመዳችሁም።" },
      { scene: "pair", dur: 6, en: "A match happens only if she also likes your offered dress for this same dress. Same two dresses, both ways.", am: "መዛመድ የሚሆነው እሷም ለዚሁ ቀሚስ የእርስዎን ቀሚስ ከወደደች ብቻ ነው። ሁለቱ ቀሚሶች በሁለቱም አቅጣጫ።" },
      { scene: "match", dur: 6, en: "Then “It's a match” appears and the private chat opens from Matches. Sample listings cannot be swapped.", am: "ከዚያ «ተዛመዱ!» ይታያል፤ የግል ውይይቱ በ«ተዛማጆች» ይከፈታል። ናሙና ቀሚሶች አይለዋወጡም።" },
    ],
  },
  {
    id: "exchange", href: "/matches",
    title: { en: "Complete the swap", am: "ልውውጡን ያጠናቅቁ" },
    short: { en: "Swap", am: "ይለዋወጡ" },
    cta: { en: "Open Matches", am: "ወደ ተዛማጆች ይሂዱ" },
    steps: [
      { scene: "open", dur: 4, en: "Open Matches and choose your match. You see your dress and hers.", am: "«ተዛማጆች»ን ከፍተው ተዛማጅዎን ይምረጡ። የእርስዎንና የእሷን ቀሚስ ያያሉ።" },
      { scene: "chat", dur: 5, en: "Use the private chat to say hello and agree on details.", am: "በግል ውይይቱ ሰላም ይበሉና ዝርዝሩን ይስማሙ።" },
      { scene: "propose", dur: 5, en: "Write a handoff proposal with place, day and time, then tap “Send proposal”.", am: "ቦታ፣ ቀንና ሰዓት ያለው የርክክብ ሀሳብ ጽፈው «ሀሳብ ላክ»ን ይንኩ።" },
      { scene: "accept", dur: 5, en: "Each of you taps “Accept”. Both must accept the same proposal.", am: "እያንዳንዳችሁ «ተቀበል»ን ትነካላችሁ። ሁለታችሁም ያንኑ ሀሳብ መቀበል አለባችሁ።" },
      { scene: "handoff", dur: 5, en: "Meet and hand over the dresses. We recommend a busy public place in daylight.", am: "ተገናኝታችሁ ቀሚሶቹን ትለዋወጣላችሁ። ቀን ላይ ሕዝብ በሚበዛበት ቦታ እንመክራለን።" },
      { scene: "complete", dur: 5, en: "After the handoff, each of you taps “Mark complete” separately.", am: "ከርክክቡ በኋላ እያንዳንዳችሁ ለየብቻ «ተጠናቋል»ን ትነካላችሁ።" },
      { scene: "done", dur: 5, en: "When both confirm, the swap is completed. No money changes hands.", am: "ሁለታችሁም ስታረጋግጡ ልውውጡ ይጠናቀቃል። ገንዘብ አይከፈልም።" },
    ],
  },
];

export const TUTORIAL_COPY = {
  en: {
    banner: "Tutorial example · sample data · nothing is saved",
    example: "Example", partner: "Selam (example)", hood: "Bole",
    you: "You", her: "Her", waiting: "waiting",
    pairYou: "You like her dress, offering yours", pairHer: "She likes your dress, offering hers",
  },
  am: {
    banner: "የማሳያ ምሳሌ · ናሙና መረጃ · ምንም አይቀመጥም",
    example: "ምሳሌ", partner: "ሰላም (ምሳሌ)", hood: "ቦሌ",
    you: "እርስዎ", her: "እሷ", waiting: "በመጠበቅ ላይ",
    pairYou: "የእሷን ቀሚስ ወደዱ፤ የእርስዎን አቀረቡ", pairHer: "እሷ የእርስዎን ወደደች፤ የእሷን አቀረበች",
  },
} as const;

export const lessonDuration = (l: Lesson) => l.steps.reduce((s, x) => s + x.dur, 0);
