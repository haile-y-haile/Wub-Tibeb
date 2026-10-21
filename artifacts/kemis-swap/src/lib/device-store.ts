// Account-scoped device storage (IndexedDB). Values never leave this device.
// Every key is prefixed with the signed-in account id so a different account on
// the same phone can never read another person's drafts, photos or outbox.
const DB = "wub-tibeb-device";
const STORE = "kv";
let dbp: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (dbp) return dbp;
  const p = new Promise<IDBDatabase>((res, rej) => {
    if (typeof indexedDB === "undefined") return rej(new Error("device-storage-unavailable"));
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error ?? new Error("device-storage-open-failed"));
    r.onblocked = () => rej(new Error("device-storage-blocked"));
  });
  p.catch(() => { if (dbp === p) dbp = null; });
  dbp = p;
  return p;
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest | void): Promise<T | undefined> {
  return open().then((db) => new Promise<T | undefined>((res, rej) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => res(req ? (req.result as T) : undefined);
    tx.onerror = () => rej(tx.error ?? new Error("device-storage-failed"));
    tx.onabort = () => rej(tx.error ?? new Error("device-storage-aborted"));
  }));
}

export function scopedKey(uid: string, ...parts: string[]) {
  if (!uid) throw new Error("device-storage-needs-account");
  return ["acct", uid, ...parts].join("::");
}
export const getItem = <T>(key: string) => run<T>("readonly", (s) => s.get(key));
export const setItem = (key: string, value: unknown) => run<void>("readwrite", (s) => s.put(value, key));
export const delItem = (key: string) => run<void>("readwrite", (s) => s.delete(key));

export function newRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
