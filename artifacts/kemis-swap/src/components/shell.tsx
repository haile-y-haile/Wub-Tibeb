import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Show, useClerk } from "@clerk/react";
import { Bell, Compass, Download, HeartHandshake, LogOut, Shield, Shirt, UserRound, WifiOff } from "lucide-react";
import { useGetNotifications, useGetProfile, useSaveProfile, getGetNotificationsQueryKey, getGetProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useI18n, type Lang } from "@/lib/i18n";
import { basePath } from "@/lib/kemis";
import { cn } from "@/lib/utils";

type BIPEvent = Event & { prompt: () => Promise<void> };

function useInstall() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);
  return evt ? async () => { await evt.prompt(); setEvt(null); } : null;
}

function useOnline() {
  const [on, setOn] = useState(navigator.onLine);
  useEffect(() => {
    const a = () => setOn(true), b = () => setOn(false);
    window.addEventListener("online", a); window.addEventListener("offline", b);
    return () => { window.removeEventListener("online", a); window.removeEventListener("offline", b); };
  }, []);
  return on;
}

export function LangToggle() {
  const { lang, setLang, t } = useI18n();
  const qc = useQueryClient();
  const save = useSaveProfile();
  const { data: profile } = useGetProfile({ query: { queryKey: getGetProfileQueryKey(), retry: false, enabled: false } });
  const pick = (l: Lang) => {
    setLang(l);
    if (profile?.name) {
      save.mutate({ data: { name: profile.name, neighborhood: profile.neighborhood, language: l, measurements: profile.measurements } }, {
        onSuccess: (p) => qc.setQueryData(getGetProfileQueryKey(), p),
      });
    }
  };
  return (
    <div role="group" aria-label={t("language")} className="flex rounded-full border border-border bg-card p-0.5 text-xs font-semibold">
      {(["en", "am"] as const).map((l) => (
        <button key={l} type="button" onClick={() => pick(l)} aria-pressed={lang === l} data-testid={`button-lang-${l}`}
          className={cn("min-h-8 rounded-full px-3 transition-colors", lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
          {l === "en" ? t("englishShort") : <span lang="am">አማ</span>}
        </button>
      ))}
    </div>
  );
}

function SignedInExtras() {
  const { data: notes } = useGetNotifications({unread:true},{ query: { queryKey: getGetNotificationsQueryKey({unread:true}), refetchInterval: 20000 } });
  const unread = notes?.filter((n) => !n.read).length ?? 0;
  const { t } = useI18n();
  return (
    <Link href="/notifications" className="relative grid h-10 w-10 place-items-center rounded-full border border-border bg-card" aria-label={`${t("alerts")} ${unread}`} data-testid="link-notifications">
      <Bell className="h-[18px] w-[18px] text-primary" />
      {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground" data-testid="text-unread-count">{unread>=100?"99+":unread}</span>}
    </Link>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { t, lang } = useI18n();
  const [loc] = useLocation();
  const install = useInstall();
  const online = useOnline();
  const { signOut } = useClerk();
  const { data: profile } = useGetProfile({ query: { queryKey: getGetProfileQueryKey(), retry: false, enabled: false } });
  const isAdmin = profile?.role === "admin";

  const nav = [
    { href: "/discover", label: t("discover"), icon: Compass },
    { href: "/wardrobe", label: t("wardrobe"), icon: Shirt },
    { href: "/matches", label: t("matches"), icon: HeartHandshake },
    { href: "/profile", label: t("profile"), icon: UserRound },
    ...(isAdmin ? [{ href: "/moderation", label: t("moderation"), icon: Shield }] : []),
  ];
  const active = (h: string) => loc === h || loc.startsWith(h + "/");

  return (
    <div className="min-h-[100dvh]">
      {!online && (
        <div className="flex items-center justify-center gap-2 bg-destructive px-3 py-1.5 text-xs text-destructive-foreground" role="status">
          <WifiOff className="h-3.5 w-3.5" /> {t("offline")}
        </div>
      )}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4">
          <Link href="/" className="flex items-center gap-2" data-testid="link-home" aria-label={t("appName")}>
            <img src={`${basePath}/logo.svg`} alt="" className="h-8 w-8" />
            <span className="flex flex-col">
              <span className="wordmark text-[17px] text-primary">{t("appName")}</span>
              {lang==="en" && <span lang="am" className="wordmark-am text-xs text-muted-foreground">ውብ ጥበብ</span>}
            </span>
          </Link>
          <Show when="signed-in">
            <nav className="ml-6 hidden gap-1 md:flex" aria-label={t("mainNavigation")}>
              {nav.map((n) => (
                <Link key={n.href} href={n.href} data-testid={`link-nav-${n.href.slice(1)}`}
                  className={cn("rounded-full px-3 py-1.5 text-sm font-medium", active(n.href) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                  {n.label}
                </Link>
              ))}
            </nav>
          </Show>
          <div className="ml-auto flex items-center gap-2">
            {install && (
              <button type="button" onClick={install} className="grid h-10 w-10 place-items-center rounded-full border border-accent bg-card text-primary" aria-label={t("install")} title={t("install")} data-testid="button-install">
                <Download className="h-4 w-4" />
              </button>
            )}
            <LangToggle />
            <Show when="signed-in">
              <SignedInExtras />
              <button type="button" onClick={() => signOut({ redirectUrl: basePath || "/" })} className="hidden h-10 w-10 place-items-center rounded-full border border-border bg-card md:grid" aria-label={t("signOut")} data-testid="button-signout">
                <LogOut className="h-4 w-4 text-muted-foreground" />
              </button>
            </Show>
            <Show when="signed-out">
              <Link href="/sign-in" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" data-testid="link-signin">{t("signIn")}</Link>
            </Show>
          </div>
        </div>
      </header>
      <Show when="signed-in"><main className="mx-auto max-w-5xl safe-bottom md:pb-10">{children}</main></Show>
      <Show when="signed-out"><main className="mx-auto max-w-5xl pb-10">{children}</main></Show>
      <footer className="mx-auto hidden max-w-5xl items-center justify-between gap-4 border-t border-border/70 px-4 py-6 text-xs text-muted-foreground md:flex" data-testid="footer-brand">
        <span className="flex items-center gap-2"><img src={`${basePath}/logo.svg`} alt="" className="h-5 w-5" /><span className="wordmark text-sm text-primary">{t("appName")}</span>{lang==="en" && <span lang="am" className="wordmark-am">ውብ ጥበብ</span>}</span>
        <span className="font-display italic">{t("tagline")}</span>
      </footer>
      <Show when="signed-in">
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur md:hidden" aria-label={t("mainNavigation")} style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="tibeb-thin" aria-hidden />
          <div className="flex">
            {nav.map((n) => {
              const I = n.icon; const a = active(n.href);
              return (
                <Link key={n.href} href={n.href} aria-current={a ? "page" : undefined} data-testid={`link-tab-${n.href.slice(1)}`}
                  className={cn("flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium", a ? "text-primary" : "text-muted-foreground")}>
                  <span className={cn("grid h-7 w-12 place-items-center rounded-full transition-colors", a && "bg-secondary")}><I className="h-5 w-5" /></span>
                  {n.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </Show>
    </div>
  );
}
