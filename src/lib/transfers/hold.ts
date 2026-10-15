import type { FileMeta } from "./types";

export interface SenderHold {
  token: string;
  peerId: string;
  senderName: string;
  expiresAt: string;
  files: File[];
  meta: FileMeta[];
}

const holds = new Map<string, SenderHold>();

function storageKey(id: string) {
  return `fileember-sender:${id}`;
}

export function holdSender(id: string, hold: SenderHold) {
  holds.set(id, hold);
  try {
    sessionStorage.setItem(
      storageKey(id),
      JSON.stringify({
        token: hold.token,
        peerId: hold.peerId,
        senderName: hold.senderName,
        expiresAt: hold.expiresAt,
      }),
    );
  } catch {
    // Private mode can block storage; the in-memory hold still covers this tab.
  }
}

export function peekSender(id: string): SenderHold | undefined {
  return holds.get(id);
}

export function senderMarked(id: string): boolean {
  if (holds.has(id)) return true;
  try {
    return sessionStorage.getItem(storageKey(id)) != null;
  } catch {
    return false;
  }
}

export function readSenderToken(id: string): { token: string; peerId: string } | null {
  const held = holds.get(id);
  if (held) return { token: held.token, peerId: held.peerId };
  try {
    const raw = sessionStorage.getItem(storageKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string; peerId?: string };
    if (!parsed.token || !parsed.peerId) return null;
    return { token: parsed.token, peerId: parsed.peerId };
  } catch {
    return null;
  }
}

export function forgetSender(id: string) {
  holds.delete(id);
  try {
    sessionStorage.removeItem(storageKey(id));
  } catch {
    // ignore
  }
}
