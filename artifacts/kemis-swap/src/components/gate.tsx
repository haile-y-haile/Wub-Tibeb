import { type ReactNode } from "react";
import { Redirect } from "wouter";
import { Show } from "@clerk/react";
import { useGetProfile, getGetProfileQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/kit";
import { ProfileForm } from "@/components/profile-form";
import { useI18n } from "@/lib/i18n";

function ProfileGate({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const q = useGetProfile({ query: { queryKey: getGetProfileQueryKey(), retry: false, staleTime: 60000 } });
  if (q.isLoading) {
    return <div className="space-y-3 p-4"><Skeleton className="h-10 w-1/2 bg-secondary" /><Skeleton className="h-64 w-full rounded-3xl bg-secondary" /></div>;
  }
  const missing = (q.error && q.error.status === 404) || (q.data && !q.data.name);
  if (missing) {
    return (
      <div className="mx-auto max-w-md px-4 py-6 rise">
        <div className="overflow-hidden rounded-3xl paper">
          <div className="tibeb" />
          <div className="p-5">
            <h1 className="font-display text-2xl font-semibold text-primary">{t("setupTitle")}</h1>
            <p className="mb-5 mt-1 text-sm text-muted-foreground">{t("setupSub")}</p>
            <ProfileForm profile={q.data} />
          </div>
        </div>
      </div>
    );
  }
  if (q.error) return <ErrorState onRetry={() => q.refetch()} />;
  return <>{children}</>;
}

export function Protected({ children }: { children: ReactNode }) {
  return (
    <>
      <Show when="signed-in"><ProfileGate>{children}</ProfileGate></Show>
      <Show when="signed-out"><Redirect to="/" /></Show>
    </>
  );
}
