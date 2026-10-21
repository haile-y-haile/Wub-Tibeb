import { useCallback, useEffect, useRef, useState } from "react";
import { delItem, getItem, newRequestId, scopedKey, setItem } from "@/lib/device-store";

// Per account + match: unsent composer text and outgoing messages with stable ids.
// Nothing here is ever sent automatically; retries are explicit and reuse id + text.
export type OutItem = { id: string; text: string; state: "sending" | "failed"; createdAt: string };
type Box = { composer: string; items: OutItem[] };

export function useOutbox(uid: string | null | undefined, matchId: string) {
  const key = uid && matchId ? scopedKey(uid, "outbox", matchId) : null;
  const [box, setBox] = useState<Box>({ composer: "", items: [] });
  const [ready, setReady] = useState(false);
  const [storeFailed, setStoreFailed] = useState(false);
  const boxRef = useRef(box);

  useEffect(() => {
    let cancelled = false;
    setReady(false); setBox({ composer: "", items: [] });
    if (!key) return;
    getItem<Box>(key).then((b) => {
      if (cancelled) return;
      // An item still "sending" after reload is unconfirmed: show it as failed with explicit retry.
      const v = b ? { composer: b.composer ?? "", items: (b.items ?? []).map((i) => ({ ...i, state: "failed" as const })) } : { composer: "", items: [] };
      boxRef.current = v; setBox(v); setReady(true);
    }).catch(() => { if (!cancelled) { setStoreFailed(true); setReady(true); } });
    return () => { cancelled = true; };
  }, [key]);

  const write = useCallback((next: Box) => {
    boxRef.current = next; setBox(next);
    if (!key) return;
    const p = !next.composer && !next.items.length ? delItem(key) : setItem(key, next);
    p.then(() => setStoreFailed(false)).catch(() => setStoreFailed(true));
  }, [key]);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setComposer = useCallback((text: string) => {
    const next = { ...boxRef.current, composer: text };
    boxRef.current = next; setBox(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => write(boxRef.current), 400);
  }, [write]);
  useEffect(() => () => { if (timer.current) { clearTimeout(timer.current); write(boxRef.current); } }, [write]);

  const enqueue = useCallback((text: string): OutItem => {
    const item: OutItem = { id: newRequestId(), text, state: "sending", createdAt: new Date().toISOString() };
    write({ composer: "", items: [...boxRef.current.items, item] });
    return item;
  }, [write]);
  const setState = useCallback((id: string, state: OutItem["state"]) => write({ ...boxRef.current, items: boxRef.current.items.map((i) => (i.id === id ? { ...i, state } : i)) }), [write]);
  const remove = useCallback((ids: string[]) => {
    if (!ids.length || !boxRef.current.items.some((i) => ids.includes(i.id))) return;
    write({ ...boxRef.current, items: boxRef.current.items.filter((i) => !ids.includes(i.id)) });
  }, [write]);

  return { ready, composer: box.composer, items: box.items, setComposer, enqueue, setState, remove, storeFailed };
}
