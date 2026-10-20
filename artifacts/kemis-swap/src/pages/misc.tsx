import { useClerk } from "@clerk/react";
import { Bell, EyeOff, LogOut, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetNotifications, useGetProfile, useReadNotifications, useGetModeration, useModerateReport,
  getGetNotificationsQueryKey, getGetProfileQueryKey, getGetModerationQueryKey, getGetListingsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState, PageHeader, SafetyNote } from "@/components/kit";
import { ProfileForm } from "@/components/profile-form";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { basePath, errMsg } from "@/lib/kemis";
import { cn } from "@/lib/utils";

export function ProfilePage() {
  const { t } = useI18n();
  const { signOut } = useClerk();
  const { data } = useGetProfile({ query: { queryKey: getGetProfileQueryKey(), retry: false } });
  return (
    <div className="mx-auto max-w-lg">
      <PageHeader kicker={data?.neighborhood} title={data?.name ?? t("profile")} />
      <div className="mx-4 rounded-3xl paper p-5">{data && <ProfileForm profile={data} />}</div>
      <div className="mx-4 mt-4 space-y-3">
        <SafetyNote />
        <Button variant="outline" className="h-12 w-full" onClick={() => signOut({ redirectUrl: basePath || "/" })} data-testid="button-profile-signout"><LogOut className="mr-2 h-4 w-4" />{t("signOut")}</Button>
      </div>
    </div>
  );
}

export function NotificationsPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const q = useGetNotifications({ query: { queryKey: getGetNotificationsQueryKey(), refetchInterval: 20000 } });
  const read = useReadNotifications();
  const unread = q.data?.some((n) => !n.read);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t("alerts")} action={unread && (
        <Button variant="outline" size="sm" disabled={read.isPending} onClick={() => read.mutate(undefined, { onSuccess: () => qc.invalidateQueries({ queryKey: getGetNotificationsQueryKey() }) })} data-testid="button-mark-read">{t("markAllRead")}</Button>
      )} />
      {q.isLoading ? <div className="space-y-2 px-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-xl bg-secondary" />)}</div>
        : q.error ? <ErrorState onRetry={() => q.refetch()} />
        : !q.data?.length ? <EmptyState title={t("notificationsEmpty")} />
        : (
          <ul className="space-y-2 px-4">
            {q.data.map((n) => (
              <li key={n.id} className={cn("flex gap-3 rounded-xl p-3", n.read ? "bg-card/60" : "paper tibeb-edge")} data-testid={`notification-${n.id}`}>
                <Bell className={cn("mt-0.5 h-4 w-4 shrink-0", n.read ? "text-muted-foreground" : "text-accent")} />
                <div><p className={cn("text-sm", !n.read && "font-semibold")}>{n.text}</p>
                  <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p></div>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}

export function ModerationPage() {
  const { t, e } = useI18n();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: me } = useGetProfile({ query: { queryKey: getGetProfileQueryKey(), retry: false } });
  const isAdmin = me?.role === "admin";
  const q = useGetModeration({ query: { queryKey: getGetModerationQueryKey(), enabled: isAdmin } });
  const mod = useModerateReport();
  if (!isAdmin) return <EmptyState title={t("adminOnly")} />;
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader kicker={t("moderation")} title={t("reports")} />
      {q.isLoading ? <Skeleton className="mx-4 h-24 rounded-xl bg-secondary" /> : q.error ? <ErrorState onRetry={() => q.refetch()} />
        : !q.data?.length ? <EmptyState title={t("notificationsEmpty")} />
        : (
          <ul className="space-y-3 px-4">
            {q.data.map((r) => (
              <li key={r.id} className="rounded-2xl paper p-4" data-testid={`report-${r.id}`}>
                <div className="flex items-center justify-between">
                  <Link href={`/dress/${r.listingId}`} className="text-sm font-semibold text-primary underline underline-offset-4">{r.listingId.slice(0, 8)}</Link>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold">{e(r.status)}</span>
                </div>
                <p className="mt-2 text-sm">{r.reason}</p>
                {!["dismissed", "hidden", "resolved", "closed"].includes(r.status) ? (
                  <div className="mt-3 flex gap-2">
                    {(["dismiss", "hide"] as const).map((a) => (
                      <Button key={a} variant={a === "hide" ? "destructive" : "outline"} size="sm" disabled={mod.isPending} data-testid={`button-${a}-${r.id}`}
                        onClick={() => mod.mutate({ data: { reportId: r.id, action: a } }, {
                          onSuccess: () => { qc.invalidateQueries({ queryKey: getGetModerationQueryKey() }); qc.invalidateQueries({ queryKey: getGetListingsQueryKey() }); toast({ title: t("saved") }); },
                          onError: (err) => toast({ title: errMsg(err, t("error")), variant: "destructive" }),
                        })}>
                        {a === "hide" ? <EyeOff className="mr-1 h-4 w-4" /> : <X className="mr-1 h-4 w-4" />}{t(a)}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}
