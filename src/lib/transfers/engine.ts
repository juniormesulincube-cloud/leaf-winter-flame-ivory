/**
 * One-to-few WebRTC file transfer. The signaling server only moves SDP and ICE.
 * Bytes travel on an ordered, reliable data channel with backpressure.
 * The sender is the only peer that creates offers.
 */
import { defaultIceServers } from "@/lib/multiplayer";
import { apiUrl } from "@/lib/public-url";
import type { FileMeta, FileProgress, TransferPhase, TransferSnap } from "./types";

const CHUNK = 16 * 1024;
const HIGH_WATER = 1024 * 1024;
const LOW_WATER = 256 * 1024;
const FAST_POLL_MS = 400;
const IDLE_POLL_MS = 2000;
const SIGNAL_RETRY_MS = [250, 750];

interface ControlMessage {
  t: "hello" | "accept" | "file-start" | "file-done" | "all-done" | "cancel";
  i?: number;
  files?: FileMeta[];
  senderName?: string;
}

interface SignalRow {
  id: number;
  from: string;
  kind: "offer" | "answer" | "ice";
  payload: unknown;
}

interface PollBody {
  peers: { id: string; name: string }[];
  signals: SignalRow[];
}

interface Slot {
  id: string;
  pc: RTCPeerConnection;
  channel?: RTCDataChannel;
  makingOffer: boolean;
  ignoreOffer: boolean;
  pending: RTCIceCandidateInit[];
  candidateType: string | null;
  conn: RTCPeerConnectionState;
  accepted: boolean;
  sending: boolean;
  finished: boolean;
  aborted: boolean;
  bytesOut: number;
  fileIndex: number;
  incoming: BlobPart[];
  incomingBytes: number;
  currentFile: number;
}

const epochs = new Map<string, number>();

function iceServers(): RTCIceServer[] {
  const servers = defaultIceServers();
  const raw = import.meta.env.VITE_TURN_URL as string | undefined;
  if (!raw?.trim()) return servers;
  const urls = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (!urls.length) return servers;
  const username = (import.meta.env.VITE_TURN_USERNAME as string | undefined)?.trim();
  const credential = (import.meta.env.VITE_TURN_CREDENTIAL as string | undefined)?.trim();
  servers.push({
    urls,
    ...(username ? { username } : {}),
    ...(credential ? { credential } : {}),
  });
  return servers;
}

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  return url;
}

export class FileTransfer {
  private readonly room: string;
  private readonly selfId: string;
  private readonly role: "sender" | "receiver";
  private readonly files: File[];
  private readonly senderName: string;
  private readonly onChange: (snap: TransferSnap) => void;
  private readonly epoch: number;
  private readonly slots = new Map<string, Slot>();
  private readonly signalQueues = new Map<string, Promise<void>>();
  private readonly samples: { t: number; bytes: number }[] = [];
  private cursor = 0;
  private closed = false;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private publishTimer: ReturnType<typeof setTimeout> | null = null;
  private wantAccept = false;
  private helloSeen = false;
  private phase: TransferPhase = "signaling";
  private detail = "Connecting…";
  private error: string | null = null;
  private fileStates: FileProgress[] = [];
  private saves: { name: string; url: string }[] = [];
  private bytesIn = 0;
  private lastSampleBytes = 0;
  private terminal = false;
  private readonly pumpQueue: Slot[] = [];
  private pumping = false;
  private readonly retries = new Map<string, number>();
  private readonly giveUp = new Set<string>();

  constructor(opts: {
    room: string;
    selfId: string;
    role: "sender" | "receiver";
    files?: File[];
    senderName?: string;
    meta?: FileMeta[];
    onChange: (snap: TransferSnap) => void;
  }) {
    this.room = opts.room;
    this.selfId = opts.selfId;
    this.role = opts.role;
    this.files = opts.files ?? [];
    this.senderName = opts.senderName ?? "";
    this.onChange = opts.onChange;
    this.epoch = (epochs.get(opts.selfId) ?? 0) + 1;
    epochs.set(opts.selfId, this.epoch);
    const meta = opts.meta ?? this.files.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
    }));
    this.fileStates = meta.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      transferred: 0,
      status: "waiting",
    }));
  }

  start() {
    if (this.closed) return;
    this.detail = this.role === "sender" ? "Waiting for the recipient" : "Looking for the sender";
    this.phase = "waiting";
    this.publish(true);
    void this.poll();
    document.addEventListener("visibilitychange", this.onVisible);
    window.addEventListener("pagehide", this.onPageHide);
  }

  /** Receiver asks the sender to start pushing bytes. */
  accept() {
    this.wantAccept = true;
    this.flushAccept();
    this.publish(true);
  }

  cancel() {
    this.phase = "cancelled";
    this.detail = this.role === "sender" ? "Transfer cancelled" : "Download cancelled";
    for (const slot of this.slots.values()) {
      slot.aborted = true;
      if (slot.channel?.readyState === "open") {
        try {
          slot.channel.send(JSON.stringify({ t: "cancel" }));
        } catch {
          // The channel is already going away.
        }
      }
    }
    this.publish(true);
    this.close({ immediate: true });
  }

  close(opts?: { immediate?: boolean }) {
    if (this.closed) return;
    this.closed = true;
    if (this.pollTimer) clearTimeout(this.pollTimer);
    if (this.publishTimer) clearTimeout(this.publishTimer);
    document.removeEventListener("visibilitychange", this.onVisible);
    window.removeEventListener("pagehide", this.onPageHide);
    for (const slot of this.slots.values()) {
      slot.aborted = true;
      slot.pc.close();
    }
    this.slots.clear();
    const sendLeave = () => {
      if (!opts?.immediate && epochs.get(this.selfId) !== this.epoch) return;
      void fetch(apiUrl("/api/rtc"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ op: "leave", room: this.room, peer: this.selfId }),
        keepalive: true,
      }).catch(() => {});
    };
    if (opts?.immediate) sendLeave();
    else setTimeout(sendLeave, 500);
  }

  private onVisible = () => {
    if (document.visibilityState === "visible" && !this.closed) void this.poll();
  };

  private onPageHide = () => {
    this.close({ immediate: true });
  };

  private totalBytes() {
    return this.fileStates.reduce((sum, file) => sum + file.size, 0);
  }

  private noteProgress(bytes: number) {
    const now = performance.now();
    this.samples.push({ t: now, bytes });
    const cutoff = now - 2500;
    while (this.samples.length && this.samples[0].t < cutoff) this.samples.shift();
    this.lastSampleBytes = bytes;
  }

  private speed(): number | null {
    if (this.samples.length < 2) return null;
    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    const dt = (last.t - first.t) / 1000;
    if (dt < 0.4) return null;
    const delta = last.bytes - first.bytes;
    if (delta <= 0) return null;
    return delta / dt;
  }

  private snapshot(): TransferSnap {
    const active = [...this.slots.values()].filter((slot) => slot.sending && !slot.finished && !slot.aborted);
    const slowest = active.sort((a, b) => a.bytesOut - b.bytesOut)[0];
    const bytesTransferred =
      this.role === "sender" ? (slowest?.bytesOut ?? this.lastSampleBytes) : this.bytesIn;
    const candidate =
      [...this.slots.values()].find((slot) => slot.candidateType)?.candidateType ??
      [...this.slots.values()][0]?.candidateType ??
      null;
    return {
      phase: this.phase,
      detail: this.detail,
      candidateType: candidate,
      bytesTransferred,
      bytesTotal: this.totalBytes(),
      files: this.fileStates.map((file) => ({ ...file })),
      peerCount: [...this.slots.values()].filter((slot) => slot.channel?.readyState === "open").length,
      completedPeers: [...this.slots.values()].filter((slot) => slot.finished).length,
      speedBps: this.phase === "transferring" ? this.speed() : null,
      error: this.error,
      saves: this.saves.map((save) => ({ ...save })),
    };
  }

  private publish(force = false) {
    if (this.closed && !force) return;
    if (force) {
      if (this.publishTimer) clearTimeout(this.publishTimer);
      this.publishTimer = null;
      this.onChange(this.snapshot());
      return;
    }
    if (this.publishTimer) return;
    this.publishTimer = setTimeout(() => {
      this.publishTimer = null;
      if (!this.closed) this.onChange(this.snapshot());
    }, 120);
  }

  private fail(message: string) {
    if (this.terminal) return;
    this.terminal = true;
    this.phase = "failed";
    this.detail = message;
    this.error = message;
    this.publish(true);
    this.close();
  }

  private async poll() {
    if (this.closed || this.terminal) return;
    try {
      await this.pollOnce();
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 404) {
        this.fail("This transfer expired or was cancelled.");
        return;
      }
      if (status === 403) {
        this.fail("This tab is not the original sender.");
        return;
      }
      if (status === 429) {
        this.fail("Too many people are already downloading this transfer.");
        return;
      }
    }
    if (this.closed || this.terminal) return;
    const waiting = [...this.slots.values()].some((slot) => slot.conn !== "connected");
    const delay = this.slots.size === 0 || waiting ? FAST_POLL_MS : IDLE_POLL_MS;
    this.pollTimer = setTimeout(() => void this.poll(), delay);
  }

  private async pollOnce() {
    const params = new URLSearchParams({
      room: this.room,
      peer: this.selfId,
      name: this.role,
      since: String(this.cursor),
    });
    const res = await fetch(`${apiUrl("/api/rtc")}?${params}`);
    if (this.closed) return;
    if (!res.ok) {
      const error = new Error(`poll ${res.status}`) as Error & { status: number };
      error.status = res.status;
      throw error;
    }
    const body = (await res.json()) as PollBody;
    if (this.closed) return;
    this.reconcile(body.peers);
    const alive = new Set(body.peers.map((peer) => peer.id));
    for (const signal of body.signals) {
      this.cursor = Math.max(this.cursor, Number(signal.id));
      await this.onSignal(signal.from, signal.kind, signal.payload, alive);
      if (this.closed) return;
    }
  }

  private reconcile(peers: { id: string; name: string }[]) {
    const alive = new Set(peers.map((peer) => peer.id));
    for (const peer of peers) {
      if (peer.id === this.selfId) continue;
      if (this.role === "sender" && peer.name !== "receiver") continue;
      if (this.role === "receiver" && peer.name !== "sender") continue;
      if (this.giveUp.has(peer.id)) continue;
      if (!this.slots.has(peer.id)) this.connect(peer.id, this.role === "sender");
    }
    for (const [id, slot] of this.slots) {
      if (!alive.has(id)) {
        slot.aborted = true;
        slot.pc.close();
        this.slots.delete(id);
        if (this.role === "receiver" && this.phase === "transferring") {
          this.fail("The sender disconnected before the download finished. Ask them to keep the tab open and try again.");
          return;
        }
      }
    }
    this.refreshPhase();
  }

  private refreshPhase() {
    if (this.terminal || this.phase === "cancelled" || this.phase === "failed") return;
    if (this.role === "receiver") {
      const slot = [...this.slots.values()][0];
      if (!slot) {
        this.phase = "waiting";
        this.detail = "Waiting for the sender. Their tab has to stay open.";
      } else if (slot.channel?.readyState === "open") {
        if (this.phase !== "transferring" && this.phase !== "done") {
          this.phase = "connected";
          this.detail = this.wantAccept ? "Starting the download…" : "Connected. Tap download when you're ready.";
        }
      } else {
        this.phase = "connecting";
        this.detail = "Connecting to the sender…";
      }
      this.publish();
      return;
    }
    const slots = [...this.slots.values()];
    const open = slots.filter((slot) => slot.channel?.readyState === "open");
    const sending = open.filter((slot) => slot.sending && !slot.finished);
    if (sending.length) {
      this.phase = "transferring";
      this.detail = sending.length === 1 ? "Sending" : `Sending to ${sending.length} classmates`;
    } else if (open.some((slot) => !slot.accepted)) {
      this.phase = "connected";
      this.detail = "They're here. Waiting for them to tap download.";
    } else if (open.some((slot) => slot.finished) || slots.some((slot) => slot.finished)) {
      this.phase = "done";
      this.detail = "Delivered. Keep this tab open if someone else still needs the files.";
    } else if (slots.length) {
      this.phase = "connecting";
      this.detail = "Connecting…";
    } else {
      this.phase = "waiting";
      this.detail = "Waiting for the recipient";
    }
    this.publish();
  }

  private connect(peerId: string, initiator: boolean) {
    if (this.closed) return;
    const pc = new RTCPeerConnection({ iceServers: iceServers() });
    const slot: Slot = {
      id: peerId,
      pc,
      makingOffer: false,
      ignoreOffer: false,
      pending: [],
      candidateType: null,
      conn: pc.connectionState,
      accepted: false,
      sending: false,
      finished: false,
      aborted: false,
      bytesOut: 0,
      fileIndex: 0,
      incoming: [],
      incomingBytes: 0,
      currentFile: -1,
    };
    this.slots.set(peerId, slot);
    pc.onicecandidate = (event) => {
      if (event.candidate) void this.sendSignal(peerId, "ice", event.candidate.toJSON());
    };
    pc.onconnectionstatechange = () => {
      slot.conn = pc.connectionState;
      if (pc.connectionState === "connected") void this.readCandidate(slot);
      if (pc.connectionState === "failed") {
        const attempts = (this.retries.get(slot.id) ?? 0) + 1;
        this.retries.set(slot.id, attempts);
        slot.aborted = true;
        slot.pc.close();
        this.slots.delete(slot.id);
        if (attempts >= 3 || this.role === "receiver") {
          if (this.role === "receiver") {
            this.fail(
              "Can't open a direct connection. Try another network, or ask the sender to share the link again. Some school networks block peer-to-peer traffic, and a relay server is not configured.",
            );
            return;
          }
          this.giveUp.add(slot.id);
        }
      }
      this.refreshPhase();
    };
    pc.onnegotiationneeded = async () => {
      if (!initiator) return;
      try {
        slot.makingOffer = true;
        await pc.setLocalDescription();
        if (this.closed || !pc.localDescription) return;
        await this.sendSignal(peerId, "offer", pc.localDescription.toJSON());
      } catch {
        // The next poll or negotiationneeded retries.
      } finally {
        slot.makingOffer = false;
      }
    };
    pc.ondatachannel = (event) => this.bindChannel(slot, event.channel);
    if (initiator) {
      const channel = pc.createDataChannel("files", { ordered: true });
      this.bindChannel(slot, channel);
    }
    this.refreshPhase();
  }

  private bindChannel(slot: Slot, channel: RTCDataChannel) {
    slot.channel = channel;
    channel.binaryType = "arraybuffer";
    channel.bufferedAmountLowThreshold = LOW_WATER;
    channel.onopen = () => {
      if (this.role === "sender") {
        const hello: ControlMessage = {
          t: "hello",
          senderName: this.senderName,
          files: this.files.map((file) => ({
            name: file.name,
            size: file.size,
            type: file.type || "application/octet-stream",
          })),
        };
        channel.send(JSON.stringify(hello));
      }
      this.refreshPhase();
      this.flushAccept();
    };
    channel.onclose = () => {
      if (this.role === "receiver" && this.phase === "transferring") {
        this.fail("The connection closed before the download finished.");
      } else {
        this.refreshPhase();
      }
    };
    channel.onmessage = (event) => {
      if (typeof event.data === "string") this.onControl(slot, event.data);
      else if (event.data instanceof ArrayBuffer) this.onBinary(slot, event.data);
    };
  }

  private flushAccept() {
    if (this.role !== "receiver" || !this.wantAccept || !this.helloSeen) return;
    const slot = [...this.slots.values()][0];
    if (!slot?.channel || slot.channel.readyState !== "open" || slot.accepted) return;
    slot.accepted = true;
    slot.channel.send(JSON.stringify({ t: "accept" }));
    this.phase = "transferring";
    this.detail = "Transferring";
    this.publish(true);
  }

  private onControl(slot: Slot, raw: string) {
    let msg: ControlMessage;
    try {
      msg = JSON.parse(raw) as ControlMessage;
    } catch {
      return;
    }
    if (msg.t === "cancel") {
      this.phase = "cancelled";
      this.detail = this.role === "sender" ? "The recipient cancelled." : "The sender cancelled this transfer.";
      this.terminal = true;
      this.publish(true);
      this.close();
      return;
    }
    if (this.role === "sender") {
      if (msg.t === "accept" && !slot.sending && !slot.finished) {
        slot.accepted = true;
        this.pumpQueue.push(slot);
        void this.drainPumps();
      }
      return;
    }
    if (msg.t === "hello" && msg.files?.length && !this.helloSeen) {
      this.helloSeen = true;
      this.fileStates = msg.files.map((file) => ({
        name: String(file.name).slice(0, 180),
        size: Number(file.size) || 0,
        type: String(file.type || "application/octet-stream").slice(0, 120),
        transferred: 0,
        status: "waiting",
      }));
      this.flushAccept();
      this.publish(true);
      return;
    }
    if (msg.t === "file-start" && typeof msg.i === "number") {
      this.sealIncoming(slot, false);
      slot.currentFile = msg.i;
      slot.incoming = [];
      slot.incomingBytes = 0;
      const file = this.fileStates[msg.i];
      if (file) file.status = "active";
      this.phase = "transferring";
      this.detail = "Transferring";
      this.publish();
      return;
    }
    if (msg.t === "file-done" && typeof msg.i === "number") {
      this.finishFile(slot, msg.i);
      return;
    }
    if (msg.t === "all-done") {
      this.phase = "done";
      this.detail = "Download complete";
      this.terminal = true;
      this.publish(true);
    }
  }

  private onBinary(slot: Slot, data: ArrayBuffer) {
    if (this.role !== "receiver" || slot.currentFile < 0) return;
    const file = this.fileStates[slot.currentFile];
    if (!file) return;
    slot.incoming.push(data);
    slot.incomingBytes += data.byteLength;
    file.transferred = slot.incomingBytes;
    file.status = "active";
    this.bytesIn += data.byteLength;
    this.noteProgress(this.bytesIn);
    this.publish();
  }

  private sealIncoming(slot: Slot, commit: boolean) {
    if (!commit) {
      slot.incoming = [];
      slot.incomingBytes = 0;
    }
  }

  private finishFile(slot: Slot, index: number) {
    const file = this.fileStates[index];
    if (!file) return;
    if (slot.incomingBytes !== file.size) {
      file.status = "error";
      this.fail("A file arrived incomplete. Ask the sender to try again.");
      return;
    }
    const blob = new Blob(slot.incoming, { type: file.type || "application/octet-stream" });
    const url = triggerDownload(blob, safeDownloadName(file.name, index));
    this.saves.push({ name: file.name, url });
    file.transferred = file.size;
    file.status = "done";
    slot.incoming = [];
    slot.incomingBytes = 0;
    slot.currentFile = -1;
    this.publish(true);
  }

  private async drainPumps() {
    if (this.pumping) return;
    this.pumping = true;
    try {
      while (this.pumpQueue.length && !this.closed) {
        const slot = this.pumpQueue.shift();
        if (!slot || slot.aborted || slot.finished || slot.channel?.readyState !== "open") continue;
        await this.pump(slot);
      }
    } finally {
      this.pumping = false;
      if (this.pumpQueue.length && !this.closed) void this.drainPumps();
    }
  }

  private async pump(slot: Slot) {
    const channel = slot.channel;
    if (!channel || slot.sending) return;
    slot.sending = true;
    this.phase = "transferring";
    this.detail = "Sending";
    this.fileStates = this.fileStates.map((file) => ({ ...file, transferred: 0, status: "waiting" }));
    this.publish(true);
    try {
      let sent = 0;
      for (let index = 0; index < this.files.length; index += 1) {
        if (slot.aborted || this.closed || channel.readyState !== "open") {
          throw new Error("interrupted");
        }
        const file = this.files[index];
        const state = this.fileStates[index];
        if (state) state.status = "active";
        slot.fileIndex = index;
        channel.send(JSON.stringify({ t: "file-start", i: index }));
        let offset = 0;
        while (offset < file.size) {
          if (slot.aborted || this.closed || channel.readyState !== "open") {
            throw new Error("interrupted");
          }
          await waitDrain(channel);
          const end = Math.min(offset + CHUNK, file.size);
          const buffer = await file.slice(offset, end).arrayBuffer();
          channel.send(buffer);
          offset += buffer.byteLength;
          sent += buffer.byteLength;
          slot.bytesOut = sent;
          if (state) state.transferred = offset;
          this.noteProgress(sent);
          this.publish();
        }
        if (state) {
          state.transferred = file.size;
          state.status = "done";
        }
        channel.send(JSON.stringify({ t: "file-done", i: index }));
        this.publish(true);
      }
      channel.send(JSON.stringify({ t: "all-done" }));
      slot.finished = true;
      slot.sending = false;
      this.refreshPhase();
      this.publish(true);
    } catch {
      slot.sending = false;
      if (!slot.aborted && !this.closed && this.role === "sender") {
        this.detail = "The recipient disconnected before the files finished.";
        this.phase = "waiting";
        this.publish(true);
      }
    }
  }

  private async flushPending(slot: Slot) {
    while (slot.pending.length) {
      const candidate = slot.pending.shift();
      if (!candidate) return;
      try {
        await slot.pc.addIceCandidate(candidate);
      } catch {
        // A stale candidate is ignored; the next offer can recover.
      }
    }
  }

  private async onSignal(
    from: string,
    kind: SignalRow["kind"],
    payload: unknown,
    alive: Set<string>,
  ) {
    if (this.closed) return;
    if (this.role === "sender" && kind === "offer") return;
    let slot = this.slots.get(from);
    if (!slot) {
      if (!alive.has(from)) return;
      if (this.role === "sender") return;
      this.connect(from, false);
      slot = this.slots.get(from);
      if (!slot) return;
    }
    try {
      if (kind === "offer" || kind === "answer") {
        const description = payload as RTCSessionDescriptionInit;
        const collision = kind === "offer" && (slot.makingOffer || slot.pc.signalingState !== "stable");
        slot.ignoreOffer = this.role === "sender" && collision;
        if (slot.ignoreOffer) return;
        await slot.pc.setRemoteDescription(description);
        if (this.closed) return;
        await this.flushPending(slot);
        if (kind === "offer") {
          await slot.pc.setLocalDescription();
          if (this.closed || !slot.pc.localDescription) return;
          await this.sendSignal(from, "answer", slot.pc.localDescription.toJSON());
        }
      } else if (kind === "ice") {
        const candidate = payload as RTCIceCandidateInit;
        if (!slot.pc.remoteDescription) {
          slot.pending.push(candidate);
          return;
        }
        await slot.pc.addIceCandidate(candidate);
      }
    } catch {
      // Negotiation retries on the next offer.
    }
  }

  private sendSignal(to: string, kind: SignalRow["kind"], payload: unknown) {
    const prev = this.signalQueues.get(to) ?? Promise.resolve();
    const next = prev.then(() => this.postSignal(to, kind, payload));
    this.signalQueues.set(
      to,
      next.catch(() => {}),
    );
    return next;
  }

  private async postSignal(to: string, kind: SignalRow["kind"], payload: unknown) {
    for (let attempt = 0; ; attempt += 1) {
      if (this.closed) return;
      try {
        const res = await fetch(apiUrl("/api/rtc"), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            op: "signal",
            room: this.room,
            from: this.selfId,
            to,
            kind,
            payload,
          }),
        });
        if (res.ok) return;
        throw new Error(String(res.status));
      } catch (err) {
        if (attempt >= SIGNAL_RETRY_MS.length) return;
        await new Promise((resolve) => setTimeout(resolve, SIGNAL_RETRY_MS[attempt]));
        if (err) continue;
      }
    }
  }

  private async readCandidate(slot: Slot) {
    try {
      const stats = await slot.pc.getStats();
      let localId: string | undefined;
      stats.forEach((report) => {
        if (report.type === "candidate-pair" && "nominated" in report && report.nominated) {
          localId = "localCandidateId" in report ? String(report.localCandidateId) : undefined;
        }
      });
      if (!localId) return;
      const local = stats.get(localId) as { candidateType?: string } | undefined;
      slot.candidateType = local?.candidateType ?? null;
      this.publish(true);
    } catch {
      // Diagnostics only.
    }
  }
}

function waitDrain(channel: RTCDataChannel) {
  if (channel.readyState !== "open") return Promise.reject(new Error("closed"));
  if (channel.bufferedAmount <= HIGH_WATER) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const done = () => {
      cleanup();
      resolve();
    };
    const closed = () => {
      cleanup();
      reject(new Error("closed"));
    };
    const cleanup = () => {
      channel.removeEventListener("bufferedamountlow", done);
      channel.removeEventListener("close", closed);
    };
    channel.addEventListener("bufferedamountlow", done);
    channel.addEventListener("close", closed);
  });
}

function safeDownloadName(name: string, index: number) {
  const cleaned = name.replace(/[\\/]/g, "").trim() || `file-${index + 1}`;
  return cleaned;
}
