/**
 * WebRTC signaling over the app database (Neon deployed, PGLite in preview).
 * Only rendezvous traffic passes through here — roster + SDP/ICE. File bytes
 * move on a direct data channel. Mounted at /api/rtc.
 *
 * FileEmber rooms are transfer ids. The sender seat is the peer id stored on
 * the transfer row, so someone who only has the link cannot impersonate the
 * sender. Receivers are capped so one link cannot fill the roster.
 */
import { z } from "zod";
import { getSql, type Sql } from "@/lib/db";
import type { PeerRow, RtcPollResponse, SignalRow } from "./p2p";

const ID = z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/);
const signalSchema = z.object({
  op: z.literal("signal"),
  room: ID,
  from: ID,
  to: ID,
  kind: z.enum(["offer", "answer", "ice"]),
  payload: z.unknown().refine((v) => v !== undefined && JSON.stringify(v).length <= 32_768, {
    message: "payload too large",
  }),
});
const leaveSchema = z.object({ op: z.literal("leave"), room: ID, peer: ID });
const postSchema = z.discriminatedUnion("op", [signalSchema, leaveSchema]);

const PEER_TTL_SECONDS = 30;
const SIGNAL_TTL_SECONDS = 60;
const MAX_RECEIVERS = 6;

const globalRef = globalThis as typeof globalThis & {
  __rtcSchemaPromise__?: Promise<void>;
};

function ensureSchema(sql: Sql): Promise<void> {
  globalRef.__rtcSchemaPromise__ ??= (async () => {
    await sql.query(
      `CREATE TABLE IF NOT EXISTS webrtc_peers (
         room TEXT NOT NULL,
         peer_id TEXT NOT NULL,
         name TEXT NOT NULL DEFAULT '',
         last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
         PRIMARY KEY (room, peer_id)
       )`,
    );
    await sql.query(
      `CREATE TABLE IF NOT EXISTS webrtc_signals (
         id BIGSERIAL PRIMARY KEY,
         room TEXT NOT NULL,
         to_peer TEXT NOT NULL,
         from_peer TEXT NOT NULL,
         kind TEXT NOT NULL,
         payload JSONB NOT NULL,
         created_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )`,
    );
    await sql.query(
      `CREATE INDEX IF NOT EXISTS webrtc_signals_inbox
         ON webrtc_signals (room, to_peer, id)`,
    );
    await sql.query(
      `CREATE TABLE IF NOT EXISTS file_transfers (
         id TEXT PRIMARY KEY,
         sender_token TEXT NOT NULL,
         sender_peer TEXT NOT NULL,
         sender_name TEXT NOT NULL DEFAULT '',
         files JSONB NOT NULL,
         expires_at TIMESTAMPTZ NOT NULL,
         created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
         cancelled BOOLEAN NOT NULL DEFAULT false
       )`,
    );
    await sql.query(
      `CREATE INDEX IF NOT EXISTS file_transfers_created ON file_transfers (created_at)`,
    );
  })().catch((err) => {
    globalRef.__rtcSchemaPromise__ = undefined;
    throw err;
  });
  return globalRef.__rtcSchemaPromise__;
}

async function roster(sql: Sql, room: string): Promise<PeerRow[]> {
  const rows = await sql.query<{ peer_id: string; name: string }>(
    `SELECT peer_id, name FROM webrtc_peers
     WHERE room = $1 AND last_seen > now() - make_interval(secs => $2)
     ORDER BY peer_id LIMIT 32`,
    [room, PEER_TTL_SECONDS],
  );
  return rows.map((r) => ({ id: r.peer_id, name: r.name }));
}

async function touchPeer(sql: Sql, room: string, peer: string, name: string) {
  await sql.query(
    `INSERT INTO webrtc_peers (room, peer_id, name, last_seen)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (room, peer_id)
     DO UPDATE SET last_seen = now(), name = EXCLUDED.name`,
    [room, peer, name],
  );
}

async function prune(sql: Sql) {
  await Promise.all([
    sql.query(`DELETE FROM webrtc_signals WHERE created_at < now() - make_interval(secs => $1)`, [
      SIGNAL_TTL_SECONDS,
    ]),
    sql.query(`DELETE FROM webrtc_peers WHERE last_seen < now() - make_interval(secs => $1)`, [
      PEER_TTL_SECONDS,
    ]),
    sql.query(
      `DELETE FROM file_transfers WHERE expires_at < now() - make_interval(secs => 86400)`,
    ),
  ]);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

async function authorizePeer(
  sql: Sql,
  room: string,
  peer: string,
  name: string,
): Promise<Response | null> {
  if (name !== "sender" && name !== "receiver") {
    return json({ error: "unknown role" }, 400);
  }
  const rows = await sql.query<{ sender_peer: string }>(
    `SELECT sender_peer FROM file_transfers
     WHERE id = $1 AND cancelled = false AND expires_at > now()`,
    [room],
  );
  const transfer = rows[0];
  if (!transfer) return json({ error: "transfer unavailable" }, 404);
  if (name === "sender") {
    if (transfer.sender_peer !== peer) return json({ error: "not the sender" }, 403);
    return null;
  }
  const existing = await sql.query<{ peer_id: string }>(
    `SELECT peer_id FROM webrtc_peers
     WHERE room = $1 AND peer_id = $2 AND last_seen > now() - make_interval(secs => $3)`,
    [room, peer, PEER_TTL_SECONDS],
  );
  if (existing[0]) return null;
  const counted = await sql.query<{ n: number }>(
    `SELECT count(*)::int AS n FROM webrtc_peers
     WHERE room = $1 AND name = 'receiver' AND last_seen > now() - make_interval(secs => $2)`,
    [room, PEER_TTL_SECONDS],
  );
  if ((counted[0]?.n ?? 0) >= MAX_RECEIVERS) return json({ error: "room full" }, 429);
  return null;
}

/** GET /api/rtc?room&peer&name&since — join (since=0), heartbeat, and inbox. */
async function handleGet(url: URL): Promise<Response> {
  const parsed = z
    .object({
      room: ID,
      peer: ID,
      name: z.string().max(64).default(""),
      since: z.coerce.number().int().min(0).default(0),
    })
    .safeParse({
      room: url.searchParams.get("room"),
      peer: url.searchParams.get("peer"),
      name: url.searchParams.get("name") ?? "",
      since: url.searchParams.get("since") ?? 0,
    });
  if (!parsed.success) return json({ error: "invalid query" }, 400);
  const { room, peer, name, since } = parsed.data;

  const sql = await getSql();
  await ensureSchema(sql);
  const denied = await authorizePeer(sql, room, peer, name);
  if (denied) return denied;
  if (since === 0 || Math.random() < 0.02) await prune(sql);
  await touchPeer(sql, room, peer, name);
  const rows = await sql.query<{
    id: number;
    from_peer: string;
    kind: SignalRow["kind"];
    payload: unknown;
  }>(
    `SELECT id, from_peer, kind, payload FROM webrtc_signals
     WHERE room = $1 AND to_peer = $2 AND id > $3
     ORDER BY id LIMIT 200`,
    [room, peer, since],
  );
  const body: RtcPollResponse = {
    peers: await roster(sql, room),
    signals: rows.map((r) => ({
      id: Number(r.id),
      from: r.from_peer,
      kind: r.kind,
      payload: typeof r.payload === "string" ? (JSON.parse(r.payload) as unknown) : r.payload,
    })),
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
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return json({ error: "invalid request" }, 400);
  const msg = parsed.data;
  const sql = await getSql();
  await ensureSchema(sql);

  if (msg.op === "signal") {
    await sql.query(
      `INSERT INTO webrtc_signals (room, to_peer, from_peer, kind, payload)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [msg.room, msg.to, msg.from, msg.kind, JSON.stringify(msg.payload)],
    );
  } else {
    await sql.query(`DELETE FROM webrtc_peers WHERE room = $1 AND peer_id = $2`, [
      msg.room,
      msg.peer,
    ]);
  }
  return json({ ok: true });
}

/** Request entrypoint for the /api/rtc route (GET poll, POST signal/leave). */
export async function handleSignaling(request: Request): Promise<Response> {
  try {
    if (request.method === "GET") return await handleGet(new URL(request.url));
    if (request.method === "POST") return await handlePost(request);
    return json({ error: "method not allowed" }, 405);
  } catch (error) {
    console.error("[rtc] signaling error:", error instanceof Error ? error.message : "unknown");
    return json({ error: "signaling failed" }, 500);
  }
}
