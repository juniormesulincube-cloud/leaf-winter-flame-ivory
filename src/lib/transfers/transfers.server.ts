/**
 * Transfer metadata only: names, sizes, types, optional nickname, expiry.
 * File contents are never accepted here.
 */
import { getSql } from "@/lib/db";
import type { FileMeta, TransferMeta } from "./types";

const ID_RE = /^[a-z0-9]{4}-[a-z0-9]{4}$/;
const TOKEN_RE = /^[a-f0-9]{32}$/;
const PEER_RE = /^s[a-z0-9]{8,24}$/;
const EXPIRY = new Set([900, 3600, 14400, 86400]);
const MAX_FILES = 30;
const MAX_FILE_BYTES = 8 * 1024 * 1024 * 1024;
const CREATE_LIMIT_PER_MINUTE = 80;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function cleanLabel(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, max);
}

function cleanFileName(value: unknown): string {
  if (typeof value !== "string") return "";
  const base = value.split(/[/\\]/).pop() ?? "";
  return base.replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 180);
}

function asIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}

function asFiles(value: unknown): FileMeta[] {
  const raw = typeof value === "string" ? (JSON.parse(value) as unknown) : value;
  if (!Array.isArray(raw)) return [];
  const files: FileMeta[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const name = cleanFileName(row.name);
    const size = Number(row.size);
    const type = cleanLabel(row.type, 120) || "application/octet-stream";
    if (!name || !Number.isFinite(size) || size < 0) continue;
    files.push({ name, size, type });
  }
  return files;
}

function parseFiles(value: unknown): FileMeta[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_FILES) return null;
  const files: FileMeta[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const row = item as Record<string, unknown>;
    const name = cleanFileName(row.name);
    const size = row.size;
    const type = cleanLabel(row.type, 120) || "application/octet-stream";
    if (!name) return null;
    if (typeof size !== "number" || !Number.isSafeInteger(size) || size < 0 || size > MAX_FILE_BYTES) {
      return null;
    }
    files.push({ name, size, type });
  }
  return files;
}

export async function handleTransfers(request: Request): Promise<Response> {
  try {
    if (request.method === "GET") return await handleGet(new URL(request.url));
    if (request.method === "POST") return await handlePost(request);
    return json({ error: "method not allowed" }, 405);
  } catch (error) {
    console.error("[transfers] error:", error instanceof Error ? error.message : "unknown");
    return json({ error: "transfer request failed" }, 500);
  }
}

async function handleGet(url: URL): Promise<Response> {
  const id = url.searchParams.get("id") ?? "";
  if (!ID_RE.test(id)) return json({ error: "invalid id" }, 400);
  const sql = await getSql();
  const rows = await sql.query<{
    id: string;
    sender_name: string;
    files: unknown;
    expires_at: unknown;
    cancelled: boolean;
  }>(
    `SELECT id, sender_name, files, expires_at, cancelled
     FROM file_transfers WHERE id = $1`,
    [id],
  );
  const row = rows[0];
  if (!row) return json({ error: "not found" }, 404);
  const expiresAt = asIso(row.expires_at);
  const body: TransferMeta = {
    id: row.id,
    senderName: row.sender_name,
    files: asFiles(row.files),
    expiresAt,
    cancelled: Boolean(row.cancelled),
    expired: new Date(expiresAt).getTime() <= Date.now(),
  };
  return json(body);
}

async function handlePost(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid JSON" }, 400);
  }
  if (!body || typeof body !== "object") return json({ error: "invalid request" }, 400);
  const msg = body as Record<string, unknown>;
  if (msg.op === "cancel") return cancel(msg);
  if (msg.op === "create") return create(msg);
  return json({ error: "invalid request" }, 400);
}

async function create(msg: Record<string, unknown>): Promise<Response> {
  const id = typeof msg.id === "string" ? msg.id : "";
  const token = typeof msg.token === "string" ? msg.token : "";
  const senderPeer = typeof msg.senderPeer === "string" ? msg.senderPeer : "";
  const expiresIn = msg.expiresIn;
  const senderName = cleanLabel(msg.senderName, 40);
  const files = parseFiles(msg.files);
  if (!ID_RE.test(id) || !TOKEN_RE.test(token) || !PEER_RE.test(senderPeer)) {
    return json({ error: "invalid transfer" }, 400);
  }
  if (typeof expiresIn !== "number" || !EXPIRY.has(expiresIn) || !files) {
    return json({ error: "invalid transfer" }, 400);
  }

  const sql = await getSql();
  const recent = await sql.query<{ n: number }>(
    `SELECT count(*)::int AS n FROM file_transfers
     WHERE created_at > now() - make_interval(secs => 60)`,
  );
  if ((recent[0]?.n ?? 0) >= CREATE_LIMIT_PER_MINUTE) {
    return json({ error: "too many transfers, try again in a minute" }, 429);
  }

  const inserted = await sql.query<{ expires_at: unknown }>(
    `INSERT INTO file_transfers (id, sender_token, sender_peer, sender_name, files, expires_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, now() + make_interval(secs => $6))
     ON CONFLICT (id) DO NOTHING
     RETURNING expires_at`,
    [id, token, senderPeer, senderName, JSON.stringify(files), expiresIn],
  );
  if (!inserted[0]) return json({ error: "transfer id already used" }, 409);
  return json({ id, expiresAt: asIso(inserted[0].expires_at) });
}

async function cancel(msg: Record<string, unknown>): Promise<Response> {
  const id = typeof msg.id === "string" ? msg.id : "";
  const token = typeof msg.token === "string" ? msg.token : "";
  if (!ID_RE.test(id) || !TOKEN_RE.test(token)) return json({ error: "invalid transfer" }, 400);
  const sql = await getSql();
  const rows = await sql.query<{ id: string }>(
    `UPDATE file_transfers SET cancelled = true
     WHERE id = $1 AND sender_token = $2
     RETURNING id`,
    [id, token],
  );
  if (!rows[0]) return json({ error: "not found" }, 404);
  return json({ ok: true });
}
