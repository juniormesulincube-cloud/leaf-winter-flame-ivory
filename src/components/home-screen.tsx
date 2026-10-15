import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, FileText, Plus, Shield, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Mascot } from "@/components/mascot";
import { Shell } from "@/components/shell";
import { cn } from "@/lib/cn";
import { fileKind, formatBytes } from "@/lib/format";
import { apiUrl } from "@/lib/public-url";
import { themeById, useTheme } from "@/lib/theme";
import { holdSender } from "@/lib/transfers/hold";
import { makePeerId, makeToken, makeTransferId } from "@/lib/transfers/ids";
import { EXPIRY_OPTIONS } from "@/lib/transfers/types";

const MAX_FILES = 30;

export function HomeScreen() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const mascot = themeById(theme);
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [name, setName] = useState("");
  const [expiresIn, setExpiresIn] = useState<number>(3600);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const prevent = (event: DragEvent) => event.preventDefault();
    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", prevent);
    return () => {
      window.removeEventListener("dragover", prevent);
      window.removeEventListener("drop", prevent);
    };
  }, []);

  function addFiles(list: FileList | File[]) {
    const incoming = [...list];
    if (!incoming.length) return;
    setFiles((current) => {
      const next = [...current, ...incoming].slice(0, MAX_FILES);
      if (current.length + incoming.length > MAX_FILES) {
        setError(`You can send up to ${MAX_FILES} files in one transfer.`);
      } else {
        setError(null);
      }
      return next;
    });
  }

  const total = files.reduce((sum, file) => sum + file.size, 0);

  async function createTransfer() {
    if (!files.length || busy) return;
    setBusy(true);
    setError(null);
    try {
      const meta = files.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
      }));
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const id = makeTransferId();
        const token = makeToken();
        const peerId = makePeerId("s");
        const res = await fetch(apiUrl("/api/transfers"), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            op: "create",
            id,
            token,
            senderPeer: peerId,
            senderName: name.trim(),
            expiresIn,
            files: meta,
          }),
        });
        if (res.status === 409) continue;
        const body = (await res.json().catch(() => ({}))) as { error?: string; expiresAt?: string };
        if (!res.ok || !body.expiresAt) {
          throw new Error(body.error || "Couldn't create the transfer. Try again.");
        }
        holdSender(id, {
          token,
          peerId,
          senderName: name.trim(),
          expiresAt: body.expiresAt,
          files,
          meta,
        });
        await navigate({ to: "/t/$code", params: { code: id } });
        return;
      }
      throw new Error("Couldn't reserve a link. Try again.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the transfer.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-10">
        <section className="pt-2">
          <p className="inline-flex rounded-full border border-border bg-card px-3 py-1 text-sm text-muted">
            Share. Send. Done.
          </p>
          <h1 className="mt-5 max-w-xl text-4xl font-extrabold tracking-tight text-fg sm:text-6xl">
            Send files. Not headaches.
          </h1>
          <p className="mt-4 max-w-md text-base text-muted sm:text-lg">
            Pick a file, share the link or a QR code, and your classmate downloads it straight from your browser. No account needed.
          </p>
          <div
            onDragEnter={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              if (event.dataTransfer.files.length) addFiles(event.dataTransfer.files);
            }}
            className={cn(
              "mt-8 rounded-3xl border border-dashed border-border bg-card p-4 transition-colors sm:p-5",
              dragging && "border-accent bg-raised",
            )}
          >
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div className="mascot-breathe h-36 w-28 shrink-0">
                <Mascot className="h-full w-full" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-accent-ink">Hi, I'm {mascot.mascot}!</p>
                <h2 className="mt-1 text-2xl font-bold text-fg">Drop your files here</h2>
                <p className="mt-1 text-sm text-muted">
                  Documents, PDFs, slides, images, video, audio and ZIPs. Anything your browser can open.
                </p>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-on-accent transition-transform duration-150 ease-out active:scale-[0.96]"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Choose files
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  className="sr-only"
                  onChange={(event) => {
                    if (event.target.files) addFiles(event.target.files);
                    event.target.value = "";
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-bold text-fg">Ready to send</h2>
            <p className="text-sm tabular-nums text-muted">
              {files.length
                ? `${files.length} ${files.length === 1 ? "file" : "files"} · ${formatBytes(total)}`
                : "No files yet"}
            </p>
          </div>
          <ul className="mt-4 space-y-2">
            {files.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted">
                Files you pick show up here. Nothing is uploaded until a classmate connects.
              </li>
            ) : (
              files.map((file, index) => (
                <li
                  key={`${file.name}-${file.size}-${index}`}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-bg px-3 py-2"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-raised text-accent-ink">
                    <FileText className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-fg" title={file.name}>
                      {file.name}
                    </span>
                    <span className="block text-xs text-muted">
                      {fileKind(file.name, file.type)} · {formatBytes(file.size)}
                    </span>
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted hover:text-fg"
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-muted">
              Your name (optional)
              <input
                value={name}
                onChange={(event) => setName(event.target.value.slice(0, 40))}
                placeholder="e.g. Class 4B"
                maxLength={40}
                className="mt-1 h-11 w-full rounded-xl border border-border bg-raised px-3 text-fg outline-none placeholder:text-muted"
              />
            </label>
            <label className="block text-sm text-muted">
              Link expires after
              <select
                value={expiresIn}
                onChange={(event) => setExpiresIn(Number(event.target.value))}
                className="mt-1 h-11 w-full rounded-xl border border-border bg-raised px-3 text-fg outline-none"
              >
                {EXPIRY_OPTIONS.map((option) => (
                  <option key={option.seconds} value={option.seconds}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {error ? (
            <p className="mt-3 text-sm text-accent-ink" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            disabled={!files.length || busy}
            onClick={() => void createTransfer()}
            className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent text-base font-semibold text-on-accent transition-transform duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50 active:not-disabled:scale-[0.96]"
          >
            {busy ? "Creating transfer…" : "Create transfer"}
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
          <p className="mt-3 flex gap-2 text-sm text-muted">
            <Shield className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              Sharing marks or student records? Only send them to people who should see them. Keep this tab open while the transfer runs.
            </span>
          </p>
        </section>
      </div>

      <section id="how" className="scroll-mt-8 pt-16">
        <h2 className="text-3xl font-bold text-fg">How it works</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Choose files", "Pick them or drag them in. Add as many as you like to one transfer."],
            ["Share the link", "Send the link, or let a friend scan the QR code. Nobody needs an account."],
            ["They download", "Their browser connects to yours and the files travel between the two devices."],
          ].map(([title, body], index) => (
            <li key={title} className="rounded-3xl border border-border bg-card p-5">
              <span className="flex size-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-on-accent">
                {index + 1}
              </span>
              <h3 className="mt-4 text-lg font-bold text-fg">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex gap-3 rounded-3xl border border-border bg-card p-5">
          <Shield className="mt-0.5 size-5 shrink-0 text-accent-ink" aria-hidden="true" />
          <div>
            <h3 className="font-bold text-fg">Your files don't pass through our server</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              A small signaling server only helps two browsers find each other. On strict school networks a direct connection can fail unless a relay server is set up. Sending peer to peer can't stop a recipient from saving or sharing what they download.
            </p>
          </div>
        </div>
      </section>
    </Shell>
  );
}
