import { useEffect, useRef, type ReactNode } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Redirect, Route, Switch, useLocation, Router as WouterRouter } from "wouter";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Shell } from "@/components/shell";
import { Protected } from "@/components/gate";
import { I18nProvider, useI18n } from "@/lib/i18n";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Discover from "@/pages/discover";
import Dress from "@/pages/dress";
import Wardrobe from "@/pages/wardrobe";
import Matches from "@/pages/matches";
import MatchDetail from "@/pages/match-detail";
import { ModerationPage, NotificationsPage, ProfilePage } from "@/pages/misc";

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 15000, refetchOnWindowFocus: true, retry: 1 } } });

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#1f4a36",
    colorForeground: "#173a2b",
    colorMutedForeground: "#4f5f56",
    colorDanger: "#b0392b",
    colorBackground: "#fcf8ef",
    colorInput: "#fffdf7",
    colorInputForeground: "#173a2b",
    colorNeutral: "#5c5340",
    fontFamily: "'Figtree', 'Noto Sans Ethiopic', system-ui, sans-serif",
    borderRadius: "0.85rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#fcf8ef] rounded-3xl w-[440px] max-w-full overflow-hidden border border-[#e2d6bd] shadow-[0_20px_50px_-24px_rgba(31,74,54,.45)]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "font-serif text-2xl text-[#1f4a36]",
    headerSubtitle: "text-[#4f5f56]",
    socialButtonsBlockButtonText: "text-[#173a2b] font-medium",
    formFieldLabel: "text-[#173a2b] font-medium",
    footerActionLink: "text-[#1f4a36] font-semibold underline",
    footerActionText: "text-[#4f5f56]",
    dividerText: "text-[#4f5f56]",
    identityPreviewEditButton: "text-[#1f4a36]",
    formFieldSuccessText: "text-[#1f4a36]",
    alertText: "text-[#173a2b]",
    logoBox: "justify-center",
    logoImage: "h-12 w-12",
    socialButtonsBlockButton: "bg-[#fffdf7] border border-[#d9ccb0] min-h-11",
    formButtonPrimary: "bg-[#1f4a36] text-[#f6efe0] min-h-11 hover:bg-[#173a2b]",
    formFieldInput: "bg-[#fffdf7] border-[#cbbd9c] min-h-11 text-[#173a2b]",
    footerAction: "bg-transparent",
    dividerLine: "bg-[#e2d6bd]",
    alert: "bg-[#f3e6c8] border border-[#c9a14a]",
    otpCodeFieldInput: "border-[#cbbd9c] text-[#173a2b]",
    formFieldRow: "gap-2",
    main: "gap-5",
  },
};

function AuthFrame({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background px-4 py-8">
      <div className="tibeb w-40 rounded-full" aria-hidden />
      <p className="max-w-xs text-center font-display text-lg text-primary">{t("heroLine")}</p>
      {children}
    </div>
  );
}

function SignInPage() {
  return <AuthFrame><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></AuthFrame>;
}

function SignUpPage() {
  return <AuthFrame><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></AuthFrame>;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);
  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in"><Redirect to="/discover" /></Show>
      <Show when="signed-out"><Home /></Show>
    </>
  );
}

const P = (C: () => ReactNode) => () => <Protected><C /></Protected>;
const DiscoverP = P(Discover), WardrobeP = P(Wardrobe), MatchesP = P(Matches), MatchP = P(MatchDetail),
  ProfileP = P(ProfilePage), NotesP = P(NotificationsPage), ModP = P(ModerationPage);

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function AppRoutes() {
  const [location] = useLocation();
  const { t } = useI18n();
  const labels: Record<string, string> = {
    "/": "Habesha Kemis Swap", "/discover": t("discover"), "/wardrobe": t("yourDress"),
    "/matches": t("matches"), "/profile": t("profile"), "/notifications": t("alerts"),
    "/moderation": t("moderation"), "/sign-in": t("signIn"), "/sign-up": t("getStarted"),
  };
  const title = labels[location] ?? (location.startsWith("/dress/") ? t("viewDetails") : location.startsWith("/matches/") ? t("matches") : "Habesha Kemis Swap");
  useEffect(() => {
    document.title = title === "Habesha Kemis Swap" ? title : `${title} · Habesha Kemis Swap`;
    const description = `${title} — Habesha kemis-to-kemis exchanges in Ethiopia.`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", document.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
  }, [title]);
  return (
    <Switch>
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route>
        <Shell>
          <RoutedErrorBoundary>
            <Switch>
              <Route path="/" component={HomeRedirect} />
              <Route path="/discover" component={DiscoverP} />
              <Route path="/dress/:id" component={Dress} />
              <Route path="/wardrobe" component={WardrobeP} />
              <Route path="/matches" component={MatchesP} />
              <Route path="/matches/:id" component={MatchP} />
              <Route path="/profile" component={ProfileP} />
              <Route path="/notifications" component={NotesP} />
              <Route path="/moderation" component={ModP} />
              <Route component={NotFound} />
            </Switch>
          </RoutedErrorBoundary>
        </Shell>
      </Route>
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  const { lang } = useI18n();
  const am = lang === "am";
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: am ? "እንኳን ደህና መጡ" : "Welcome back", subtitle: am ? "ወደ ቀሚስ ስዋፕ ይግቡ" : "Sign in to keep swapping kemis" } },
        signUp: { start: { title: am ? "መለያ ይፍጠሩ" : "Join Kemis Swap", subtitle: am ? "ቀሚስ ለቀሚስ መለዋወጥ ይጀምሩ" : "A dress for a dress, among neighbors" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <AppRoutes />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <I18nProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
    </I18nProvider>
  );
}

export default App;
