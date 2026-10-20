import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function MoreButton({q,earlier=false,label}:{q:{hasNextPage?:boolean;isFetchingNextPage:boolean;fetchNextPage:()=>unknown};earlier?:boolean;label?:string}) {
  const {t}=useI18n();
  if(!q.hasNextPage)return null;
  return <div className="p-4 text-center"><Button variant="outline" disabled={q.isFetchingNextPage} onClick={()=>void q.fetchNextPage()} data-testid={earlier?"button-earlier-messages":"button-show-more"}>{q.isFetchingNextPage?t("loading"):label??(earlier?t("olderMessages"):t("more"))}</Button></div>;
}
