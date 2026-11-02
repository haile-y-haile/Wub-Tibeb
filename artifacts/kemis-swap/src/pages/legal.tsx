import { Link, useLocation } from "wouter";
import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";
import { useI18n, type Lang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

type Section = { heading: string; paragraphs?: string[]; bullets?: string[] };
type LegalDocument = { title: string; intro: string; sections: Section[] };

const documents: Record<Lang, Record<string, LegalDocument>> = {
  en: {
    privacy: {
      title: "Privacy notice",
      intro: "How Wub Tibeb handles information when people exchange traditional Habesha kemis.",
      sections: [
        { heading: "Who operates Wub Tibeb", paragraphs: ["Wub Tibeb is a US-operated clothing-exchange service for members in Ethiopia. The operator's legal entity name and US state have not been provided. This notice is an operational draft and is not ready to replace a reviewed legal notice."] },
        { heading: "Information the service uses", paragraphs: ["Account sign-in is handled through Clerk using email or Google. The app stores a member's display name, general neighborhood, language choice, and preferred garment measurements. It also stores listing text and garment measurements, uploaded photos, likes and passes, matches, exchange proposals and confirmations, messages, reports, blocks, and notifications.", "Preferred profile measurements are private to the member and used for fit suggestions. Garment measurements attached to an active listing, photos, display name, and general neighborhood may be visible to people browsing that listing, including visitors who are not signed in. Messages are available to the two matched members in that exchange."] },
        { heading: "Why information is used", paragraphs: ["Information supports account access, listing and discovery, measurement suggestions, exact-garment matching, private exchange messages, notifications, fraud and abuse prevention, and moderation of reported listings or members."] },
        { heading: "Service providers and storage", paragraphs: ["Clerk provides authentication. Replit provides the website and API hosting, PostgreSQL database, and App Storage for photos; Replit App Storage is backed by Google Cloud Storage. Google may also process information when a member chooses Google sign-in. The actual storage regions, provider retention settings, and cross-border transfer terms have not been verified for this launch."] },
        { heading: "Payments, advertising, and sale", paragraphs: ["The current app does not process swap payments or display advertising. It does not currently contain an AdSense publisher ID. This describes the current implementation and is not a promise that future versions will remain unchanged."] },
        { heading: "Retention and member choices", paragraphs: ["Members can edit profile details and manage or archive their own listings. The app does not currently provide self-service account deletion or a published deletion/retention schedule. The operator must establish a verified privacy-request channel and retention rules before public launch."] },
        { heading: "Children and age eligibility", paragraphs: ["The service has no implemented age gate and the operator has not established an age-eligibility policy. Do not make the service available to minors until the operator and counsel decide the applicable age and consent requirements."] },
        { heading: "Cross-border privacy review", paragraphs: ["The service is operated from the United States for members in Ethiopia. Applicable US and Ethiopian privacy, consumer-protection, and cross-border data rules must be reviewed by qualified counsel. No storage location or legal jurisdiction is promised by this draft."] },
        { heading: "Privacy requests", paragraphs: ["There is no verified public privacy or support email configured in the app. The in-app Report control is for safety and listing concerns; it is not a complete privacy-request channel. Add a verified operator contact and account-data request process before public launch."] },
      ],
    },
    terms: {
      title: "Terms of service",
      intro: "Draft participation terms for a direct garment-for-garment exchange community.",
      sections: [
        { heading: "Draft status and operator", paragraphs: ["Wub Tibeb is a US-operated service for people in Ethiopia. The legal operator name, US state, governing law, dispute venue, and formal contact details have not been supplied. These terms require review by qualified US and Ethiopian counsel before launch."] },
        { heading: "Eligibility and accounts", paragraphs: ["Sign-in currently uses email or Google through Clerk; phone sign-in is not active. Keep your account credentials secure and provide accurate profile information. The service has no implemented age gate or approved minimum-age policy, so the operator must set an age rule before accepting public registrations."] },
        { heading: "Listings and member conduct", paragraphs: ["Only traditional Habesha kemis intended for holiday or cultural wear belong on this service. List dresses you have the right to offer, use accurate photos and measurements, and describe condition and known issues honestly. Do not post another person's private information, counterfeit claims, harassment, threats, or unsafe requests."] },
        { heading: "How a swap works", paragraphs: ["A like is tied to one specific dress offered for one specific dress. A match occurs only when both members express reciprocal interest in those same two garments. A match is not a completed exchange. Members propose a handoff plan, each accepts the current plan, and each confirms completion only after the physical exchange has happened."] },
        { heading: "No cash or payment service", paragraphs: ["The intended exchange is one garment for one garment. Wub Tibeb does not currently take payment, set a cash value, arrange shipping, authenticate garments, or guarantee that a member will perform. Do not send a deposit or payment through the app."] },
        { heading: "Handoffs and safety", paragraphs: ["Members arrange the handoff directly. Choose a public, busy, daytime place, verify the garments before exchanging, and do not share home or financial details. If a handoff is partly complete or a safety issue arises, do not use cancellation to imply that garments were returned; report the issue in the app."] },
        { heading: "Reports and moderation", paragraphs: ["Members may report listings or people and block another member. Moderators may review reports and take actions supported by the app, including hiding a listing or closing a disputed exchange. Moderation is not emergency assistance, and the service cannot guarantee a particular response time or outcome."] },
        { heading: "Service limits and legal review", paragraphs: ["The app is provided as-is while it is being piloted. No uptime, match, fit, condition, identity, or handoff outcome is guaranteed. The legal limits, governing law, dispute process, age rule, and consumer rights language must be completed with counsel; this draft does not waive rights that cannot legally be waived."] },
      ],
    },
    safety: {
      title: "Swap safely",
      intro: "Practical safety guidance for arranging a kemis handoff in person.",
      sections: [
        { heading: "Before you agree", paragraphs: ["Read the listing carefully. Ask about condition, fit, measurements, and any repair or stain. Confirm which two exact dresses are being exchanged and agree to the current proposal in the match conversation. A match alone is not an agreement to hand over a garment."] },
        { heading: "Choose a safer handoff", bullets: ["Meet during daylight in a busy public place; do not meet at a private home or isolated location.", "Tell someone you trust where you are going and consider bringing them.", "Keep communication in the app until you are comfortable. Do not share your home address, passwords, financial details, or identity documents.", "Inspect and try on garments only if you feel safe and have agreed to do so. Do not hand over your dress until you are ready.", "Do not pay a deposit or accept a request for money; the app is for garment-for-garment swaps, not payments."] },
        { heading: "Confirming or reporting", paragraphs: ["Confirm completion only after the physical exchange has happened. If one member has already confirmed a handoff and there is a problem, the exchange cannot be safely cancelled in the app; use Report and contact a moderator instead. Blocking may limit contact but does not recover a garment or replace local emergency help."] },
        { heading: "Use reporting and blocking", paragraphs: ["Use the Report or Block controls on a listing or match when you encounter fraud, harassment, unsafe behavior, or a serious mismatch. Include only relevant details; do not put private addresses or sensitive information in a public listing. The service is not an emergency-response service. If someone is in immediate danger, contact local emergency services."] },
        { heading: "Limits", paragraphs: ["Wub Tibeb cannot verify a member's identity, inspect a dress in person, supervise a meeting, or guarantee that a swap will be completed. Safety tools help document and limit contact; they cannot eliminate offline risk."] },
      ],
    },
    contact: {
      title: "Contact and help",
      intro: "Use the in-app controls for safety issues. Public operator contact details are not yet configured.",
      sections: [
        { heading: "Report a listing or member", paragraphs: ["Sign in, open the listing or matched exchange, and choose Report. Use Block if you need to stop contact. Reports are sent to the app's moderation queue; they are not monitored emergency messages."] },
        { heading: "Account and privacy requests", paragraphs: ["The app currently has no verified public support/privacy email, contact form, or self-service account deletion. Do not send sensitive information through a listing or message. The operator must publish a verified contact method and a data-request process before public launch."] },
        { heading: "Operator details still needed", bullets: ["Verified support and privacy contact address.", "Legal operator or business name and US state.", "A reviewed age-eligibility and account-deletion process.", "A response and retention policy for reports and privacy requests."] },
        { heading: "Immediate safety", paragraphs: ["Wub Tibeb is not an emergency service. If someone faces immediate danger, contact local emergency services. For a non-emergency exchange concern, use the in-app Report control."] },
      ],
    },
  },
  am: {
    privacy: {
      title: "የግላዊነት ማስታወቂያ",
      intro: "ውብ ጥበብ ባህላዊ የሐበሻ ቀሚሶችን ለመለዋወጥ የሚጠቀሙ መረጃዎችን እንዴት እንደሚያስተናግድ።",
      sections: [
        { heading: "ውብ ጥበብን ማን ያስተዳድራል?", paragraphs: ["ውብ ጥበብ በአሜሪካ የሚተዳደር፣ በኢትዮጵያ ላሉ አባላት የልብስ ልውውጥ አገልግሎት ነው። የኦፕሬተሩ ሕጋዊ ድርጅት ስምና የአሜሪካ ግዛት አልተሰጡም። ይህ ማስታወቂያ የሥራ ረቂቅ ነው፤ በሕግ ባለሙያ የተገመገመ ሰነድን አይተካም።"] },
        { heading: "አገልግሎቱ የሚጠቀምባቸው መረጃዎች", paragraphs: ["የመለያ መግቢያ በኢሜይል ወይም በGoogle በClerk ይከናወናል። መተግበሪያው የአባል የሚታይ ስም፣ አጠቃላይ ሰፈር፣ የቋንቋ ምርጫና የራሱን የልብስ ልኬቶች ያስቀምጣል። የቀሚስ ማስታወቂያ ጽሑፍና ልኬቶች፣ የተጫኑ ፎቶዎች፣ የመውደድና የማለፍ ምርጫዎች፣ ግጥሚያዎች፣ የልውውጥ ሀሳቦችና ማረጋገጫዎች፣ መልዕክቶች፣ ሪፖርቶች፣ እገዳዎችና ማሳወቂያዎችም ይቀመጣሉ።", "በመገለጫ ውስጥ ያሉ የግል ልኬቶች ለአባሉ ብቻ ይታያሉ፤ የተስማሚነት ጥቆማ ለመስጠት ይጠቅማሉ። ንቁ የቀሚስ ማስታወቂያ ልኬቶች፣ ፎቶዎች፣ የሚታይ ስምና አጠቃላይ ሰፈር ማስታወቂያውን ለሚያዩ ሰዎች፣ ያልገቡ ጎብኚዎችንም ጨምሮ፣ ሊታዩ ይችላሉ። የግጥሚያ መልዕክቶች በዚያ ልውውጥ ላይ ላሉ ሁለቱ አባላት ይታያሉ።"] },
        { heading: "መረጃው ለምን ይጠቀማል?", paragraphs: ["መረጃው መለያ ለመጠቀም፣ ቀሚስ ለመዘርዘርና ለማግኘት፣ የልኬት ጥቆማ ለመስጠት፣ በተወሰኑ ቀሚሶች ላይ ግጥሚያ ለማድረግ፣ የልውውጥ መልዕክቶችንና ማሳወቂያዎችን ለመላክ፣ ብልጠትንና ጥቃትን ለመከላከል እና የተሪፖርቱን ተጠቃሚዎች ለመቆጣጠር ይጠቅማል።"] },
        { heading: "አገልግሎት ሰጪዎችና ማከማቻ", paragraphs: ["Clerk የመለያ ማረጋገጫን ያቀርባል። Replit ድረ-ገጹንና API ማስተናገድን፣ PostgreSQL ዳታቤዝንና የፎቶ ማከማቻውን ያቀርባል፤ የReplit App Storage በGoogle Cloud Storage ላይ የተመሰረተ ነው። አባል Google መግቢያን ሲመርጥ Google መረጃን ሊያስተናግድ ይችላል። ትክክለኛው የማከማቻ ክልል፣ የአቅራቢዎች ማቆያ ቅንብርና ድንበር ተሻጋሪ የውሂብ ውሎች ለዚህ ማስጀመር አልተረጋገጡም።"] },
        { heading: "ክፍያ፣ ማስታወቂያና ሽያጭ", paragraphs: ["አሁን ያለው መተግበሪያ የልውውጥ ክፍያ አያስኬድም፤ ማስታወቂያም አያሳይም። የAdSense አሳታሚ መለያ ቁጥርም አልተገባም። ይህ አሁን ያለውን አፈጻጸም ይገልጻል፤ ወደፊት እንደዚሁ እንደሚቀጥል ቃል አይደለም።"] },
        { heading: "ማቆያና የአባላት ምርጫ", paragraphs: ["አባላት የመገለጫ መረጃን ማሻሻል፣ የራሳቸውን ቀሚሶች ማስተዳደር ወይም ከንቁ ዝርዝር ማውጣት ይችላሉ። አሁን የመለያ ራስ-ሰር ስረዛ ወይም የተገለጸ የመረጃ ማጥፊያና ማቆያ ጊዜ የለም። ኦፕሬተሩ ከሕዝብ ማስጀመር በፊት የተረጋገጠ የግላዊነት ጥያቄ መቀበያና የማቆያ ደንብ ማዘጋጀት አለበት።"] },
        { heading: "ሕፃናትና የዕድሜ መስፈርት", paragraphs: ["አገልግሎቱ የዕድሜ ማረጋገጫ የለውም፤ ኦፕሬተሩም የዕድሜ መስፈርት አልወሰነም። ተፈጻሚ የሆኑ የዕድሜና የወላጅ ፈቃድ መስፈርቶች በኦፕሬተሩና በሕግ አማካሪ እስኪወሰኑ ድረስ አገልግሎቱን ለታዳጊዎች አያቅርቡ።"] },
        { heading: "ድንበር ተሻጋሪ የግላዊነት ግምገማ", paragraphs: ["አገልግሎቱ ከአሜሪካ ሆኖ በኢትዮጵያ ላሉ አባላት ይሰራል። ተፈጻሚ የሆኑ የአሜሪካና የኢትዮጵያ የግላዊነት፣ የሸማቾች ጥበቃና ድንበር ተሻጋሪ ውሂብ ሕጎች በባለሙያ መገምገም አለባቸው። ይህ ረቂቅ የማከማቻ ቦታ ወይም የሕግ ሥልጣን ቦታ አይወስንም።"] },
        { heading: "የግላዊነት ጥያቄዎች", paragraphs: ["በመተግበሪያው ውስጥ የተረጋገጠ የሕዝብ ግላዊነት ወይም ድጋፍ ኢሜይል የለም። የሪፖርት መቆጣጠሪያው ለደህንነትና ለቀሚስ ጉዳዮች ነው፤ ሙሉ የግላዊነት ጥያቄ መቀበያ አይደለም። ከሕዝብ ማስጀመር በፊት የተረጋገጠ የኦፕሬተር አድራሻና የዳታ ጥያቄ ሂደት ያክሉ።"] },
      ],
    },
    terms: {
      title: "የአጠቃቀም ውሎች",
      intro: "በቀሚስ ለቀሚስ ልውውጥ ማህበረሰብ ውስጥ ለመሳተፍ የተዘጋጀ ረቂቅ ውል።",
      sections: [
        { heading: "የረቂቁ ሁኔታና ኦፕሬተር", paragraphs: ["ውብ ጥበብ በአሜሪካ ሆኖ በኢትዮጵያ ላሉ ሰዎች የሚያገለግል ነው። የሕጋዊ ኦፕሬተሩ ስም፣ የአሜሪካ ግዛት፣ ተፈጻሚ ሕግ፣ የክርክር ቦታና የይፋ እውቂያ መረጃ አልተሰጡም። ከማስጀመር በፊት ይህ ውል በአሜሪካና በኢትዮጵያ ባለሙያ ጠበቆች መገምገም አለበት።"] },
        { heading: "ብቁነትና መለያዎች", paragraphs: ["አሁን መግቢያ በኢሜይል ወይም በGoogle በClerk ይሰራል፤ የስልክ መግቢያ አልነቃም። የመለያዎን የመግቢያ መረጃ ደህንነቱን ይጠብቁ፤ ትክክለኛ የመገለጫ መረጃ ያቅርቡ። የዕድሜ ማረጋገጫና የተፈቀደ ዝቅተኛ ዕድሜ መስፈርት የለም፤ የሕዝብ ምዝገባን ከመክፈት በፊት ኦፕሬተሩ የዕድሜ ደንብ መወሰን አለበት።"] },
        { heading: "ማስታወቂያዎችና የአባላት ባህሪ", paragraphs: ["በዚህ አገልግሎት የበዓልና የባህል ልብስ የሆኑ ባህላዊ የሐበሻ ቀሚሶችን ብቻ ያቅርቡ። ለመስጠት መብት ያለዎትን ቀሚስ ይዘርዝሩ፤ ትክክለኛ ፎቶና ልኬት ይጠቀሙ፤ ሁኔታውንና የሚታወቁ ጉድለቶችን በሐቀኝነት ይግለጹ። የሌላ ሰውን የግል መረጃ፣ የሐሰት የብራንድ ጥያቄዎች፣ ማስጨነቅ፣ ማስፈራራት ወይም አደገኛ ጥያቄዎችን አያቅርቡ።"] },
        { heading: "ልውውጡ እንዴት ይሰራል?", paragraphs: ["መውደድ አንድ የተወሰነ ቀሚስን ለአንድ ሌላ የተወሰነ ቀሚስ ማቅረብ ነው። ሁለቱም አባላት በዚያው ሁለት ቀሚሶች ላይ ተቃራኒ ፍላጎት ሲያሳዩ ብቻ ግጥሚያ ይፈጠራል። ግጥሚያ ልውውጡ ተጠናቋል ማለት አይደለም። አባላት የርክክብ እቅድ ያቀርባሉ፣ እያንዳንዱም የአሁኑን እቅድ ይቀበላል፤ ቀሚሶቹ በእውነት ከተለዋወጡ በኋላ ብቻ እያንዳንዱ መጠናቀቁን ያረጋግጣል።"] },
        { heading: "ገንዘብና ክፍያ የለም", paragraphs: ["የታሰበው ልውውጥ ቀሚስ ለቀሚስ ነው። ውብ ጥበብ አሁን ክፍያ አያስተናግድም፣ የገንዘብ ዋጋ አይወስንም፣ መላኪያ አያደራጅም፣ ቀሚስን አያረጋግጥም፣ አባል ቃሉን እንደሚፈጽም ዋስትና አይሰጥም። በመተግበሪያው በኩል ቅድመ ክፍያ ወይም ገንዘብ አይላኩ።"] },
        { heading: "ርክክብና ደህንነት", paragraphs: ["አባላት ርክክቡን በቀጥታ ያዘጋጃሉ። በቀን በሕዝብ በሚበዛበት ቦታ ይገናኙ፣ ከመለዋወጥዎ በፊት ቀሚሶቹን ያረጋግጡ፣ የቤት ወይም የገንዘብ መረጃ አያጋሩ። ርክክብ በከፊል ከተፈጸመ ወይም የደህንነት ችግር ከተፈጠረ፣ ቀሚሶቹ ተመልሰዋል ብሎ ለማሳየት ስረዛን አይጠቀሙ፤ በመተግበሪያው ሪፖርት ያድርጉ።"] },
        { heading: "ሪፖርትና አስተዳደር", paragraphs: ["አባላት ቀሚስን ወይም ሰውን ሪፖርት ማድረግና ሌላ አባልን ማገድ ይችላሉ። ተቆጣጣሪዎች ሪፖርቶችን መመርመርና በመተግበሪያው የሚደገፉ እርምጃዎችን መውሰድ ይችላሉ፤ ለምሳሌ ማስታወቂያን መደበቅ ወይም የተከራከረ ልውውጥን መዝጋት። ቁጥጥር የአደጋ ጊዜ እርዳታ አይደለም፤ የምላሽ ጊዜን ወይም ውጤትን ዋስትና አንሰጥም።"] },
        { heading: "የአገልግሎት ገደቦችና የሕግ ግምገማ", paragraphs: ["መተግበሪያው በሙከራ ጊዜ እንዳለ ይቀርባል። የመስመር ላይ መቆየት፣ ግጥሚያ፣ ተስማሚነት፣ ሁኔታ፣ ማንነት ወይም የርክክብ ውጤት ዋስትና የለም። የሕግ ገደቦች፣ ተፈጻሚ ሕግ፣ የክርክር ሂደት፣ የዕድሜ ደንብና የሸማቾች መብት ጽሑፍ ከጠበቃ ጋር መጠናቀቅ አለበት። ይህ ረቂቅ በሕግ ሊተው የማይችል መብትን አያስወግድም።"] },
      ],
    },
    safety: {
      title: "በደህንነት ይለዋወጡ",
      intro: "ቀሚስን በአካል ለመለዋወጥ የሚረዱ ተግባራዊ ምክሮች።",
      sections: [
        { heading: "ከመስማማትዎ በፊት", paragraphs: ["ማስታወቂያውን በጥንቃቄ ያንብቡ። ስለ ሁኔታ፣ ተስማሚነት፣ ልኬት፣ ጥገና ወይም እድፍ ይጠይቁ። የሚለዋወጡትን ሁለት ትክክለኛ ቀሚሶች ያረጋግጡ፤ በግጥሚያው ውይይት የአሁኑን የርክክብ እቅድ ይስማሙ። ግጥሚያ ብቻውን ቀሚስ ለማስረከብ ስምምነት አይደለም።"] },
        { heading: "ደህንነቱ የተሻለ ርክክብ ይምረጡ", bullets: ["በቀን በሕዝብ በሚበዛበት ቦታ ይገናኙ፤ በግል ቤት ወይም በብቸኛ ቦታ አይገናኙ።", "የሚሄዱበትን ቦታ ለሚያምኑት ሰው ይንገሩ፤ ከቻሉም አብሮ ይውሰዱ።", "እስኪመችዎ ድረስ ውይይትን በመተግበሪያው ያቆዩ። የቤት አድራሻ፣ የይለፍ ቃል፣ የገንዘብ መረጃ ወይም መታወቂያ አያጋሩ።", "በደህና እንደሚሰማዎትና ከተስማሙ ብቻ ቀሚሱን ይመርምሩ ወይም ይለብሱ። ዝግጁ ካልሆኑ ቀሚስዎን አያስረክቡ።", "ቅድመ ክፍያ አይላኩ፤ ገንዘብም አይቀበሉ። መተግበሪያው ለቀሚስ ልውውጥ ነው፣ ለክፍያ አይደለም።"] },
        { heading: "ማረጋገጥ ወይም ሪፖርት ማድረግ", paragraphs: ["ቀሚሶቹ በእውነት ከተለዋወጡ በኋላ ብቻ መጠናቀቁን ያረጋግጡ። አንድ አባል ርክክብ አረጋግጦ ችግር ከተፈጠረ፣ በመተግበሪያው በደህና መሰረዝ አይቻልም፤ ሪፖርት ያድርጉና ተቆጣጣሪን ያግኙ። ማገድ ግንኙነትን ሊገድብ ይችላል፤ ቀሚስን አያስመልስም፣ የአካባቢ የአደጋ ጊዜ እርዳታንም አይተካም።"] },
        { heading: "ሪፖርትና ማገድን ይጠቀሙ", paragraphs: ["ማጭበርበር፣ ማስጨነቅ፣ አደገኛ ባህሪ ወይም ከባድ የልዩነት ችግር ሲያጋጥም በቀሚስ ወይም በግጥሚያ ላይ ያሉትን የሪፖርትና የማገድ መቆጣጠሪያዎች ይጠቀሙ። አስፈላጊውን ብቻ ያካትቱ፤ የግል አድራሻን ወይም ስሱ መረጃን በሕዝብ ማስታወቂያ ውስጥ አያስገቡ። አገልግሎቱ የአደጋ ጊዜ ምላሽ አይሰጥም። አንድ ሰው አሁን በአደጋ ላይ ከሆነ፣ የአካባቢውን የአደጋ ጊዜ አገልግሎት ያግኙ።"] },
        { heading: "ገደቦች", paragraphs: ["ውብ ጥበብ የአባልን ማንነት ማረጋገጥ፣ ቀሚስን በአካል መመርመር፣ ስብሰባን መቆጣጠር ወይም ልውውጥ እንደሚፈጸም ዋስትና መስጠት አይችልም። የደህንነት መቆጣጠሪያዎች ጉዳይን ለማሳወቅና ግንኙነትን ለመገደብ ይረዳሉ፤ ከመስመር ውጭ አደጋን ሙሉ በሙሉ አያስወግዱም።"] },
      ],
    },
    contact: {
      title: "እውቂያና እርዳታ",
      intro: "ለደህንነት ጉዳዮች በመተግበሪያው ያሉትን መቆጣጠሪያዎች ይጠቀሙ። የኦፕሬተር የይፋ እውቂያ መረጃ ገና አልተዘጋጀም።",
      sections: [
        { heading: "ቀሚስን ወይም አባልን ሪፖርት ያድርጉ", paragraphs: ["ይግቡ፣ ቀሚሱን ወይም የተገጣጠመውን ልውውጥ ይክፈቱና ሪፖርት ይምረጡ። ግንኙነትን ማቆም ካስፈለገ አባሉን ያግዱ። ሪፖርቶች ወደ የመተግበሪያው ቁጥጥር ዝርዝር ይሄዳሉ፤ የአደጋ ጊዜ መልዕክቶች አይደሉም።"] },
        { heading: "የመለያና የግላዊነት ጥያቄዎች", paragraphs: ["አሁን የተረጋገጠ የሕዝብ ድጋፍ/ግላዊነት ኢሜይል፣ የእውቂያ ቅጽ ወይም የመለያ ራስ-ሰር ስረዛ የለም። ስሱ መረጃን በማስታወቂያ ወይም በመልዕክት አይላኩ። ኦፕሬተሩ ከሕዝብ ማስጀመር በፊት የተረጋገጠ እውቂያና የመረጃ ጥያቄ ሂደት ማቅረብ አለበት።"] },
        { heading: "ገና የሚያስፈልጉ የኦፕሬተር መረጃዎች", bullets: ["የተረጋገጠ የድጋፍና የግላዊነት እውቂያ አድራሻ።", "የሕጋዊ ኦፕሬተር ወይም የድርጅት ስምና የአሜሪካ ግዛት።", "የተገመገመ የዕድሜ መስፈርትና የመለያ ስረዛ ሂደት።", "ለሪፖርቶችና ለግላዊነት ጥያቄዎች የምላሽና የማቆያ ደንብ።"] },
        { heading: "አስቸኳይ ደህንነት", paragraphs: ["ውብ ጥበብ የአደጋ ጊዜ አገልግሎት አይደለም። አንድ ሰው አሁን በአደጋ ላይ ከሆነ፣ የአካባቢውን የአደጋ ጊዜ አገልግሎት ያግኙ። አስቸኳይ ላልሆነ የልውውጥ ችግር የመተግበሪያውን ሪፖርት ይጠቀሙ።"] },
      ],
    },
  },
};

export function LegalPage() {
  const { lang } = useI18n();
  const [location] = useLocation();
  const slug = location.replace(/\/+$/, "").split("/").pop() ?? "privacy";
  const page = documents[lang][slug] ?? documents[lang].privacy;
  const reviewNotice = lang === "am"
    ? "የሕግ ምክር አይደለም፤ ከማስጀመር በፊት በአሜሪካና በኢትዮጵያ የሚሰሩ ባለሙያ ጠበቆች ይገምግሙት። የሕጋዊ ኦፕሬተር ስምና ግዛት፣ የተረጋገጠ የድጋፍ ኢሜይል፣ የዕድሜ ደንብ፣ የመረጃ ማቆያና ተፈጻሚ ሕግ ገና መወሰን አለባቸው።"
    : "Not legal advice. Have qualified US and Ethiopian counsel review this before launch. The operator's legal name and state, verified support email, age rule, data-retention policy, and governing law still need to be established.";

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:py-12" data-testid={`legal-page-${slug}`}>
      <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4" data-testid="link-legal-home">
        <ArrowLeft className="h-4 w-4" aria-hidden />{lang === "am" ? "ወደ ዋናው ገጽ" : "Back to Wub Tibeb"}
      </Link>
      <div className="mt-6 rounded-2xl border border-accent bg-secondary/70 p-4 text-sm leading-relaxed text-secondary-foreground" role="note" data-testid="notice-legal-review">
        <div className="mb-1 flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4" aria-hidden />{lang === "am" ? "ለሕግ ግምገማ የተዘጋጀ ረቂቅ" : "Draft for legal review"}</div>
        {reviewNotice}
      </div>
      <header className="mb-8 mt-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-accent-foreground">{lang === "am" ? "ውብ ጥበብ · የአባላት መረጃ" : "Wub Tibeb · Member information"}</p>
        <h1 className="font-display text-3xl font-semibold text-primary sm:text-4xl" lang={lang}>{page.title}</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">{page.intro}</p>
      </header>
      <div className="space-y-7">
        {page.sections.map((section) => (
          <section key={section.heading} className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
            <h2 className="font-display text-xl font-semibold text-primary" lang={lang}>{section.heading}</h2>
            <div className="mt-3 space-y-3 text-sm leading-7 text-foreground/90 sm:text-base">
              {(section.paragraphs ?? []).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              {section.bullets && <ul className="list-disc space-y-2 pl-5">{section.bullets.map((item, index) => <li key={index}>{item}</li>)}</ul>}
            </div>
          </section>
        ))}
      </div>
      {slug === "contact" && (
        <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-accent bg-background p-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm leading-relaxed">{lang === "am" ? "ቀሚስን ወይም አባልን ለሪፖርት ማድረግ ወደ መለያዎ ይግቡ።" : "Sign in to report a listing or member using the in-app safety controls."}</p>
          <Button asChild className="min-h-11">
            <Link href="/sign-in" data-testid="link-contact-signin">{lang === "am" ? "ይግቡ" : "Sign in"}<ExternalLink className="ml-2 h-4 w-4" aria-hidden /></Link>
          </Button>
        </div>
      )}
      <p className="mt-8 text-xs text-muted-foreground">{lang === "am" ? "የገጹ ቋንቋ፦ አማርኛ" : "Page language: English"}</p>
    </article>
  );
}
