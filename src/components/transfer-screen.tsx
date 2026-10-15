import { Link, useNavigate } from "@tanstack/react-router";
import { Check, Copy, FileText, Shield } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Mascot } from "@/components/mascot";
import { QrCode } from "@/components/qr-code";
import { Shell } from "@/components/shell";
import { fileKind, formatBytes, formatEta, formatExpiry, formatSpeed, roomCode } from "@/lib/format";
import { apiUrl, shareUrl } from "@/lib/public-url";
import { FileTransfer } from "@/lib/transfers/engine";
import { forgetSender, peekSender, readSenderToken, senderMarked, type SenderHold } from "@/lib/transfers/hold";
import { makePeerId } from "@/lib/transfers/ids";
import type { FileProgress, TransferMeta, TransferSnap } from "@/lib/transfers/types";

function percent(transferred: number, total: number) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((transferred / total) * 100)));
}

function pathLabel(type: string | null, receiver: boolean) {
  if (type === "relay") return "Connected through a relay";
  if (type === "host" || type === "srflx" || type === "prflx") {
    return receiver ? "Direct connection to the sender" : "Direct connection";
  }
  return receiver ? "Connected to the sender" : "Connected";
}

export function TransferScreen({ code }: { code: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) {
    return (
      <Shell width="narrow">
        <p className="pt-16 text-center text-muted">Opening transfer…</p>
      </Shell>
    );
  }
  const held = peekSender(code);
  if (held?.files.length) return <SenderView code={code} hold={held} />;
  if (senderMarked(code)) return <SenderLost code={code} />;
  return <ReceiverView code={code} />;
}

function SenderLost({ code }: { code: string }) {
  const navigate = useNavigate();
  async function cancel() {
    const creds = readSenderToken(code);
    if (creds) {
      await fetch(apiUrl("/api/transfers"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ op: "cancel", id: code, token: creds.token }),
      }).catch(() => {});
    }
    forgetSender(code);
    await navigate({ to: "/" });
  }
  return (
    <Shell width="narrow">
      <div className="pt-8 text-center">
        <div className="mx-auto h-36 w-28">
          <Mascot className="h-full w-full" />
        </div>
        <h1 className="mt-4 text-3xl font-extrabold text-fg">The files left with the reload</h1>
        <p className="mt-3 text-muted">
          FileEmber keeps the files in this tab only. Reloading cleared them, so this link can't send anymore. Start a new transfer.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            to="/"
            className="inline-flex h-12 items-center justify-center rounded-full bg-accent font-semibold text-on-accent"
          >
            Start a new transfer
          </Link>
          <button
            type="button"
            onClick={() => void cancel()}
            className="inline-flex h-12 items-center justify-center rounded-full border border-border font-semibold text-fg"
          >
            Cancel this link
          </button>
        </div>
      </div>
    </Shell>
  );
}

function SenderView({ code, hold }: { code: string; hold: SenderHold }) {
  const navigate = useNavigate();
  const [snap, setSnap] = useState<TransferSnap | null>(null);
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const engineRef = useRef<FileTransfer | null>(null);
  const link = shareUrl(`/t/${code}`);

  useEffect(() => {
    const engine = new FileTransfer({
      room: code,
      selfId: hold.peerId,
      role: "sender",
      files: hold.files,
      senderName: hold.senderName,
      meta: hold.meta,
      onChange: setSnap,
    });
    engineRef.current = engine;
    engine.start();
    const clock = setInterval(() => setNow(Date.now()), 30000);
    return () => {
      clearInterval(clock);
      engine.close();
      engineRef.current = null;
    };
  }, [code, hold]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function cancel() {
    engineRef.current?.cancel();
    await fetch(apiUrl("/api/transfers"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ op: "cancel", id: code, token: hold.token }),
    }).catch(() => {});
    forgetSender(code);
    await navigate({ to: "/" });
  }

  const phase = snap?.phase ?? "waiting";
  const pct = percent(snap?.bytesTransferred ?? 0, snap?.bytesTotal ?? 1);
  const waiting = phase === "waiting" || phase === "signaling" || phase === "connecting";

  return (
    <Shell>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-full bg-bg px-3 py-1 text-sm text-muted">
                <span className="size-2 rounded-full bg-highlight" aria-hidden="true" />
                {snap?.detail ?? "Waiting for the recipient"}
              </p>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
                {phase === "transferring"
                  ? "Sending the files"
                  : phase === "done"
                    ? "Your transfer went through"
                    : phase === "failed"
                      ? "The connection didn't hold"
                      : "Your transfer is ready"}
              </h1>
              <p className="mt-2 text-muted">
                Share the link or the QR code. Keep this tab open until the download finishes.
              </p>
            </div>
            <div className="hidden h-28 w-20 shrink-0 sm:block">
              <Mascot decorative className="h-full w-full" />
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={link}
              aria-label="Transfer link"
              onFocus={(event) => event.target.select()}
              className="h-12 min-w-0 flex-1 rounded-xl border border-border bg-bg px-3 text-sm text-fg"
            />
            <button
              type="button"
              onClick={() => void copyLink()}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-4 font-semibold text-on-accent transition-transform duration-150 ease-out active:scale-[0.96]"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>

          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-bg px-4 py-3">
              <dt className="text-xs text-muted">Room code</dt>
              <dd className="mt-1 font-display text-2xl font-bold tracking-widest text-fg">{roomCode(code)}</dd>
            </div>
            <div className="rounded-2xl bg-bg px-4 py-3">
              <dt className="text-xs text-muted">Sending as</dt>
              <dd className="mt-1 truncate text-lg font-semibold text-fg">{hold.senderName || "Anonymous"}</dd>
            </div>
            <div className="rounded-2xl bg-bg px-4 py-3">
              <dt className="text-xs text-muted">Link expires</dt>
              <dd className="mt-1 text-lg font-semibold text-fg">{formatExpiry(hold.expiresAt, now)}</dd>
            </div>
          </dl>

          {phase === "transferring" || phase === "done" ? (
            <div className="mt-4">
              <div className="mb-2 flex justify-between text-sm tabular-nums text-muted">
                <span>{phase === "done" ? "Sent" : `${pct}%`}</span>
                <span>{formatSpeed(snap?.speedBps ?? null) ?? ""}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-bg" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${pct}%` }} />
              </div>
            </div>
          ) : null}

          {snap?.error ? <p className="mt-3 text-sm text-accent-ink">{snap.error}</p> : null}

          <p className="mt-4 text-sm text-muted">
            {hold.meta.length} {hold.meta.length === 1 ? "file" : "files"} · {formatBytes(hold.meta.reduce((sum, file) => sum + file.size, 0))}
          </p>
          <ul className="mt-2 divide-y divide-border">
            {hold.meta.map((file) => (
              <li key={`${file.name}-${file.size}`} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="truncate text-fg">{file.name}</span>
                <span className="shrink-0 tabular-nums text-muted">{formatBytes(file.size)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => void cancel()}
              className="inline-flex h-11 items-center rounded-full border border-border px-4 text-sm font-semibold text-fg"
            >
              Cancel transfer
            </button>
            <button
              type="button"
              onClick={() => setPreview((value) => !value)}
              className="inline-flex h-11 items-center text-sm font-semibold text-accent-ink"
            >
              {preview ? "Hide preview" : "Preview what your friend sees →"}
            </button>
          </div>
          <p className="mt-4 text-sm text-muted">
            {waiting
              ? "Can't connect? Send the link again, or try the QR code. Some school networks block direct connections."
              : "Leave this tab in the foreground until every download says it finished."}
          </p>
          {preview ? <PreviewCard hold={hold} /> : null}
        </section>

        <aside className="rounded-3xl border border-border bg-card p-5">
          <h2 className="text-lg font-bold text-fg">Scan to open</h2>
          <div className="mt-4">
            <QrCode value={link} />
          </div>
          <p className="mt-3 text-center text-sm text-muted">
            Point a phone camera at the code. No app and no account needed.
          </p>
        </aside>
      </div>
      <p className="sr-only" aria-live="polite">
        {snap?.detail ?? "Waiting for the recipient"}
      </p>
    </Shell>
  );
}

function PreviewCard({ hold }: { hold: SenderHold }) {
  return (
    <div className="mt-4 rounded-2xl border border-border bg-bg p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Preview only</p>
      <p className="mt-1 text-sm text-muted">This is the screen your friend sees. It does not open a second connection.</p>
      <h3 className="mt-4 text-xl font-bold text-fg">
        {hold.senderName ? `Files from ${hold.senderName}` : "Files for you"}
      </h3>
      <ul className="mt-3 space-y-2">
        {hold.meta.map((file) => (
          <li key={`${file.name}-${file.size}`} className="flex justify-between gap-3 text-sm">
            <span className="truncate">{file.name}</span>
            <span className="tabular-nums text-muted">{formatBytes(file.size)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-accent font-semibold text-on-accent">
        Download
      </p>
    </div>
  );
}

function ReceiverView({ code }: { code: string }) {
  const [meta, setMeta] = useState<TransferMeta | null>(null);
  const [missing, setMissing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    let stop = false;
    async function load() {
      try {
        const res = await fetch(apiUrl(`/api/transfers?id=${encodeURIComponent(code)}`));
        if (stop) return;
        if (res.status === 404) {
          setMissing(true);
          return;
        }
        if (!res.ok) {
          setLoadError("Couldn't load this transfer.");
          return;
        }
        const body = (await res.json()) as TransferMeta;
        setMeta(body);
        setLoadError(null);
      } catch {
        if (!stop) setLoadError("Couldn't reach FileEmber. Check your connection and try again.");
      }
    }
    void load();
    const timer = setInterval(() => void load(), 4000);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, [code]);

  if (missing) {
    return (
      <Shell width="narrow">
        <StatusCard
          title="This link doesn't work"
          body="It may have expired, been cancelled, or been typed wrong. Ask the sender for a new one."
        />
      </Shell>
    );
  }
  if (!meta && loadError) {
    return (
      <Shell width="narrow">
        <StatusCard title="Can't reach the transfer" body={loadError} />
      </Shell>
    );
  }
  if (!meta) {
    return (
      <Shell width="narrow">
        <p className="pt-16 text-center text-muted">Loading transfer…</p>
      </Shell>
    );
  }
  if (meta.cancelled) {
    return (
      <Shell width="narrow">
        <StatusCard title="The sender cancelled this transfer" body="Ask them to create a new link if you still need the files." />
      </Shell>
    );
  }
  if (meta.expired) {
    return (
      <Shell width="narrow">
        <StatusCard title="This link has expired" body="Links close on their own so old files aren't left waiting. Ask the sender for a fresh one." />
      </Shell>
    );
  }

  return (
    <Shell width="narrow">
      {started ? (
        <ReceiverSession
          key={attempt}
          code={code}
          meta={meta}
          onRetry={() => {
            setStarted(false);
            setAttempt((value) => value + 1);
          }}
        />
      ) : (
        <ReceiveOffer meta={meta} onDownload={() => setStarted(true)} />
      )}
    </Shell>
  );
}

function StatusCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="pt-8 text-center">
      <div className="mx-auto h-36 w-28">
        <Mascot className="h-full w-full" />
      </div>
      <h1 className="mt-4 text-3xl font-extrabold text-fg">{title}</h1>
      <p className="mt-3 text-muted">{body}</p>
      <Link
        to="/"
        className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-accent px-5 font-semibold text-on-accent"
      >
        Send your own files
      </Link>
    </div>
  );
}

function ReceiveOffer({ meta, onDownload }: { meta: TransferMeta; onDownload: () => void }) {
  const total = meta.files.reduce((sum, file) => sum + file.size, 0);
  const from = meta.senderName ? ` from ${meta.senderName}` : "";
  return (
    <div className="pt-6">
      <div className="mx-auto h-36 w-28">
        <Mascot className="mx-auto h-full w-full" />
      </div>
      <h1 className="mt-2 text-center text-3xl font-extrabold text-fg">Files{from}</h1>
      <p className="mt-2 text-center text-sm text-muted">
        {meta.files.length} {meta.files.length === 1 ? "file" : "files"} · {formatBytes(total)} · expires {formatExpiry(meta.expiresAt)}
      </p>
      <ul className="mt-6 space-y-2">
        {meta.files.map((file) => (
          <li key={`${file.name}-${file.size}`} className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3">
            <FileText className="size-5 shrink-0 text-accent-ink" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{file.name}</span>
              <span className="text-xs text-muted">
                {fileKind(file.name, file.type)} · {formatBytes(file.size)}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onDownload}
        className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-accent font-semibold text-on-accent transition-transform duration-150 ease-out active:scale-[0.96]"
      >
        Download
      </button>
      <p className="mt-3 flex gap-2 text-sm text-muted">
        <Shield className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          The files come straight from the sender's browser. FileEmber does not scan them. Only download what you expect, and keep this page open until it finishes.
        </span>
      </p>
    </div>
  );
}

function ReceiverSession({
  code,
  meta,
  onRetry,
}: {
  code: string;
  meta: TransferMeta;
  onRetry: () => void;
}) {
  const peerId = useRef(makePeerId("r"));
  const engineRef = useRef<FileTransfer | null>(null);
  const metaRef = useRef(meta);
  const [snap, setSnap] = useState<TransferSnap | null>(null);

  useEffect(() => {
    const current = metaRef.current;
    const engine = new FileTransfer({
      room: code,
      selfId: peerId.current,
      role: "receiver",
      senderName: current.senderName,
      meta: current.files,
      onChange: setSnap,
    });
    engineRef.current = engine;
    engine.start();
    engine.accept();
    return () => {
      engine.close();
      engineRef.current = null;
    };
  }, [code]);

  const files = snap?.files?.length ? snap.files : meta.files.map((file) => ({
    ...file,
    transferred: 0,
    status: "waiting" as const,
  }));
  const total = files.reduce((sum, file) => sum + file.size, 0);
  const got = snap?.bytesTransferred ?? 0;
  const pct = percent(got, total);
  const phase = snap?.phase ?? "connecting";
  const from = meta.senderName || "your classmate";
  const speed = formatSpeed(snap?.speedBps ?? null);
  const eta = formatEta(snap?.speedBps && total > got ? (total - got) / snap.speedBps : null);
  const connected = phase === "connected" || phase === "transferring" || phase === "done";

  return (
    <div className="pt-4 text-center">
      <ProgressRing progress={phase === "done" ? 1 : pct / 100}>
        <div className="h-20 w-16">
          <Mascot decorative className="h-full w-full" />
        </div>
      </ProgressRing>
      <h1 className="mt-4 text-3xl font-extrabold text-fg">
        {phase === "done" ? "Download complete" : phase === "failed" ? "Transfer stopped" : phase === "cancelled" ? "Transfer cancelled" : `Receiving from ${from}`}
      </h1>
      <p className="mt-1 font-semibold text-accent-ink">
        {phase === "transferring" ? `Transferring · ${pct}%` : snap?.detail ?? "Connecting…"}
      </p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-card" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Download progress">
        <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${phase === "done" ? 100 : pct}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-sm tabular-nums text-muted">
        <span>{speed ?? "—"}</span>
        <span>{phase === "done" ? "Finished" : eta ?? ""}</span>
      </div>
      {connected ? (
        <p className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-sm text-muted">
          <Check className="size-4 text-accent-ink" aria-hidden="true" />
          {pathLabel(snap?.candidateType ?? null, true)}
        </p>
      ) : null}
      <ul className="mt-4 space-y-2 text-left">
        {files.map((file) => (
          <FileRow key={`${file.name}-${file.size}`} file={file} saves={snap?.saves ?? []} />
        ))}
      </ul>
      {phase === "failed" || phase === "cancelled" ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-accent font-semibold text-on-accent"
        >
          Try again
        </button>
      ) : phase === "done" ? (
        <p className="mt-6 text-sm text-muted">
          If a file didn't land in your downloads, use Save next to its name. You can close this page now.
        </p>
      ) : (
        <button
          type="button"
          onClick={() => engineRef.current?.cancel()}
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full border border-border font-semibold text-fg"
        >
          Cancel
        </button>
      )}
      <p className="mt-3 text-sm text-muted">Keep this page open until it finishes.</p>
      <p className="sr-only" aria-live="polite">
        {snap?.detail} {pct}%
      </p>
    </div>
  );
}

function FileRow({ file, saves }: { file: FileProgress; saves: { name: string; url: string }[] }) {
  const save = saves.find((item) => item.name === file.name);
  const pct = file.size ? Math.round((file.transferred / file.size) * 100) : 0;
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3">
      <FileText className="size-5 shrink-0 text-muted" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{file.name}</span>
      {file.status === "done" ? (
        <span className="flex items-center gap-2 text-sm text-muted">
          <Check className="size-4 text-accent-ink" aria-hidden="true" />
          Done
          {save ? (
            <a href={save.url} download={file.name} className="font-semibold text-accent-ink">
              Save
            </a>
          ) : null}
        </span>
      ) : file.status === "active" ? (
        <span className="text-sm tabular-nums text-muted">{pct}%</span>
      ) : file.status === "error" ? (
        <span className="text-sm text-accent-ink">Failed</span>
      ) : (
        <span className="text-sm text-muted">Waiting</span>
      )}
    </li>
  );
}

function ProgressRing({ progress, children }: { progress: number; children: ReactNode }) {
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - Math.max(0, Math.min(1, progress)));
  return (
    <div className="relative mx-auto h-40 w-40">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="8" className="stroke-border" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className="stroke-accent"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
