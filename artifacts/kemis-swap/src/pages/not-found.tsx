import { Link } from "wouter";
import { EmptyState } from "@/components/kit";
import { useI18n } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <EmptyState title={t("notFound")} action={<Link href="/" className="inline-flex h-11 items-center rounded-full bg-primary px-5 font-semibold text-primary-foreground" data-testid="link-404-home">{t("back")}</Link>} />
  );
}
