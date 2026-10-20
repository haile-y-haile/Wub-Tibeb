import { useInfiniteQuery } from "@tanstack/react-query";
import {
  getListings,getMatches,getMessages,getNotifications,getModeration,
  getGetListingsQueryKey,getGetMatchesQueryKey,getGetMessagesQueryKey,getGetNotificationsQueryKey,getGetModerationQueryKey,
  type GetListingsParams,
} from "@workspace/api-client-react";

function usePages<T extends {id:string}>(key:readonly unknown[],fetchPage:(before?:string)=>Promise<T[]>,size:number,options:{enabled?:boolean;refetchInterval?:number}={},oldestFirst=false) {
  const q=useInfiniteQuery({
    queryKey:[...key,"pages"],initialPageParam:undefined as string|undefined,
    queryFn:({pageParam})=>fetchPage(pageParam),
    getNextPageParam:(page)=>page.length===size?(oldestFirst?page[0]?.id:page.at(-1)?.id):undefined,
    ...options,
  });
  const flat=q.data?.pages.flat();
  return {...q,data:flat?[...new Map(flat.map(item=>[item.id,item])).values()]:undefined};
}
export function useListingPages(params?:GetListingsParams) {
  return usePages(getGetListingsQueryKey(params),before=>getListings({...params,before}),100);
}
export function useMatchPages() {
  return usePages(getGetMatchesQueryKey(),before=>getMatches({before}),100,{refetchInterval:15000});
}
export function useMessagePages(id:string) {
  const q=usePages(getGetMessagesQueryKey(id),before=>getMessages(id,{before}),200,{enabled:!!id,refetchInterval:10000},true);
  return {...q,data:q.data?.sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id))};
}
export function useNotificationPages() {
  return usePages(getGetNotificationsQueryKey(),before=>getNotifications({before}),100,{refetchInterval:20000});
}
export function useReportPages(enabled:boolean) {
  return usePages(getGetModerationQueryKey(),before=>getModeration({before}),200,{enabled});
}
