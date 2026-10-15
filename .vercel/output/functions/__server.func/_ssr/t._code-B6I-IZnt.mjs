import { o as __toESM } from "../_runtime.mjs";
import { J as require_react, S as require_jsx_runtime, b as useNavigate, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as Copy, i as Shield, l as Check, s as FileText } from "../_libs/lucide-react.mjs";
import { n as Route } from "./router-imJL6fFZ.mjs";
import { i as Shell, t as Mascot } from "./shell-DWfeCawa.mjs";
import { a as formatEta, f as peekSender, g as shareUrl, h as senderMarked, i as formatBytes, l as makePeerId, m as roomCode, n as fileKind, o as formatExpiry, p as readSenderToken, r as forgetSender, s as formatSpeed, t as apiUrl } from "./ids-CO0XehTu.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/t._code-B6I-IZnt.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function QrCode({ value }) {
	const [svg, setSvg] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		import("../_libs/qrcode.mjs").then((n) => /* @__PURE__ */ __toESM(n.t())).then((mod) => mod.toString(value, {
			type: "svg",
			margin: 1,
			errorCorrectionLevel: "M",
			color: {
				dark: "#000000",
				light: "#ffffff"
			}
		})).then((markup) => {
			if (!cancelled && markup.trim().startsWith("<svg")) setSvg(markup);
		}).catch(() => {
			if (!cancelled) setSvg("");
		});
		return () => {
			cancelled = true;
		};
	}, [value]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-2xl bg-white p-3",
		children: svg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "qr-frame",
			dangerouslySetInnerHTML: { __html: svg }
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "aspect-square w-full animate-pulse bg-neutral-200",
			"aria-hidden": "true"
		})
	});
}
function defaultIceServers() {
	return [{ urls: ["stun:stun.l.google.com:19302", "stun:stun.cloudflare.com:3478"] }];
}
/**
* One-to-few WebRTC file transfer. The signaling server only moves SDP and ICE.
* Bytes travel on an ordered, reliable data channel with backpressure.
* The sender is the only peer that creates offers.
*/
var CHUNK = 16384;
var HIGH_WATER = 1048576;
var LOW_WATER = 262144;
var FAST_POLL_MS = 400;
var IDLE_POLL_MS = 2e3;
var SIGNAL_RETRY_MS = [250, 750];
var epochs = /* @__PURE__ */ new Map();
function iceServers() {
	return defaultIceServers();
}
function triggerDownload(blob, name) {
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
var FileTransfer = class {
	room;
	selfId;
	role;
	files;
	senderName;
	onChange;
	epoch;
	slots = /* @__PURE__ */ new Map();
	signalQueues = /* @__PURE__ */ new Map();
	samples = [];
	cursor = 0;
	closed = false;
	pollTimer = null;
	publishTimer = null;
	wantAccept = false;
	helloSeen = false;
	phase = "signaling";
	detail = "Connecting…";
	error = null;
	fileStates = [];
	saves = [];
	bytesIn = 0;
	lastSampleBytes = 0;
	terminal = false;
	pumpQueue = [];
	pumping = false;
	retries = /* @__PURE__ */ new Map();
	giveUp = /* @__PURE__ */ new Set();
	constructor(opts) {
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
			type: file.type || "application/octet-stream"
		}));
		this.fileStates = meta.map((file) => ({
			name: file.name,
			size: file.size,
			type: file.type,
			transferred: 0,
			status: "waiting"
		}));
	}
	start() {
		if (this.closed) return;
		this.detail = this.role === "sender" ? "Waiting for the recipient" : "Looking for the sender";
		this.phase = "waiting";
		this.publish(true);
		this.poll();
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
			if (slot.channel?.readyState === "open") try {
				slot.channel.send(JSON.stringify({ t: "cancel" }));
			} catch {}
		}
		this.publish(true);
		this.close({ immediate: true });
	}
	close(opts) {
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
			fetch(apiUrl("/api/rtc"), {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					op: "leave",
					room: this.room,
					peer: this.selfId
				}),
				keepalive: true
			}).catch(() => {});
		};
		if (opts?.immediate) sendLeave();
		else setTimeout(sendLeave, 500);
	}
	onVisible = () => {
		if (document.visibilityState === "visible" && !this.closed) this.poll();
	};
	onPageHide = () => {
		this.close({ immediate: true });
	};
	totalBytes() {
		return this.fileStates.reduce((sum, file) => sum + file.size, 0);
	}
	noteProgress(bytes) {
		const now = performance.now();
		this.samples.push({
			t: now,
			bytes
		});
		const cutoff = now - 2500;
		while (this.samples.length && this.samples[0].t < cutoff) this.samples.shift();
		this.lastSampleBytes = bytes;
	}
	speed() {
		if (this.samples.length < 2) return null;
		const first = this.samples[0];
		const last = this.samples[this.samples.length - 1];
		const dt = (last.t - first.t) / 1e3;
		if (dt < .4) return null;
		const delta = last.bytes - first.bytes;
		if (delta <= 0) return null;
		return delta / dt;
	}
	snapshot() {
		const slowest = [...this.slots.values()].filter((slot) => slot.sending && !slot.finished && !slot.aborted).sort((a, b) => a.bytesOut - b.bytesOut)[0];
		const bytesTransferred = this.role === "sender" ? slowest?.bytesOut ?? this.lastSampleBytes : this.bytesIn;
		const candidate = [...this.slots.values()].find((slot) => slot.candidateType)?.candidateType ?? [...this.slots.values()][0]?.candidateType ?? null;
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
			saves: this.saves.map((save) => ({ ...save }))
		};
	}
	publish(force = false) {
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
	fail(message) {
		if (this.terminal) return;
		this.terminal = true;
		this.phase = "failed";
		this.detail = message;
		this.error = message;
		this.publish(true);
		this.close();
	}
	async poll() {
		if (this.closed || this.terminal) return;
		try {
			await this.pollOnce();
		} catch (err) {
			const status = err.status;
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
	async pollOnce() {
		const params = new URLSearchParams({
			room: this.room,
			peer: this.selfId,
			name: this.role,
			since: String(this.cursor)
		});
		const res = await fetch(`${apiUrl("/api/rtc")}?${params}`);
		if (this.closed) return;
		if (!res.ok) {
			const error = /* @__PURE__ */ new Error(`poll ${res.status}`);
			error.status = res.status;
			throw error;
		}
		const body = await res.json();
		if (this.closed) return;
		this.reconcile(body.peers);
		const alive = new Set(body.peers.map((peer) => peer.id));
		for (const signal of body.signals) {
			this.cursor = Math.max(this.cursor, Number(signal.id));
			await this.onSignal(signal.from, signal.kind, signal.payload, alive);
			if (this.closed) return;
		}
	}
	reconcile(peers) {
		const alive = new Set(peers.map((peer) => peer.id));
		for (const peer of peers) {
			if (peer.id === this.selfId) continue;
			if (this.role === "sender" && peer.name !== "receiver") continue;
			if (this.role === "receiver" && peer.name !== "sender") continue;
			if (this.giveUp.has(peer.id)) continue;
			if (!this.slots.has(peer.id)) this.connect(peer.id, this.role === "sender");
		}
		for (const [id, slot] of this.slots) if (!alive.has(id)) {
			slot.aborted = true;
			slot.pc.close();
			this.slots.delete(id);
			if (this.role === "receiver" && this.phase === "transferring") {
				this.fail("The sender disconnected before the download finished. Ask them to keep the tab open and try again.");
				return;
			}
		}
		this.refreshPhase();
	}
	refreshPhase() {
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
	connect(peerId, initiator) {
		if (this.closed) return;
		const pc = new RTCPeerConnection({ iceServers: iceServers() });
		const slot = {
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
			currentFile: -1
		};
		this.slots.set(peerId, slot);
		pc.onicecandidate = (event) => {
			if (event.candidate) this.sendSignal(peerId, "ice", event.candidate.toJSON());
		};
		pc.onconnectionstatechange = () => {
			slot.conn = pc.connectionState;
			if (pc.connectionState === "connected") this.readCandidate(slot);
			if (pc.connectionState === "failed") {
				const attempts = (this.retries.get(slot.id) ?? 0) + 1;
				this.retries.set(slot.id, attempts);
				slot.aborted = true;
				slot.pc.close();
				this.slots.delete(slot.id);
				if (attempts >= 3 || this.role === "receiver") {
					if (this.role === "receiver") {
						this.fail("Can't open a direct connection. Try another network, or ask the sender to share the link again. Some school networks block peer-to-peer traffic, and a relay server is not configured.");
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
			} catch {} finally {
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
	bindChannel(slot, channel) {
		slot.channel = channel;
		channel.binaryType = "arraybuffer";
		channel.bufferedAmountLowThreshold = LOW_WATER;
		channel.onopen = () => {
			if (this.role === "sender") {
				const hello = {
					t: "hello",
					senderName: this.senderName,
					files: this.files.map((file) => ({
						name: file.name,
						size: file.size,
						type: file.type || "application/octet-stream"
					}))
				};
				channel.send(JSON.stringify(hello));
			}
			this.refreshPhase();
			this.flushAccept();
		};
		channel.onclose = () => {
			if (this.role === "receiver" && this.phase === "transferring") this.fail("The connection closed before the download finished.");
			else this.refreshPhase();
		};
		channel.onmessage = (event) => {
			if (typeof event.data === "string") this.onControl(slot, event.data);
			else if (event.data instanceof ArrayBuffer) this.onBinary(slot, event.data);
		};
	}
	flushAccept() {
		if (this.role !== "receiver" || !this.wantAccept || !this.helloSeen) return;
		const slot = [...this.slots.values()][0];
		if (!slot?.channel || slot.channel.readyState !== "open" || slot.accepted) return;
		slot.accepted = true;
		slot.channel.send(JSON.stringify({ t: "accept" }));
		this.phase = "transferring";
		this.detail = "Transferring";
		this.publish(true);
	}
	onControl(slot, raw) {
		let msg;
		try {
			msg = JSON.parse(raw);
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
				this.drainPumps();
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
				status: "waiting"
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
	onBinary(slot, data) {
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
	sealIncoming(slot, commit) {
		if (!commit) {
			slot.incoming = [];
			slot.incomingBytes = 0;
		}
	}
	finishFile(slot, index) {
		const file = this.fileStates[index];
		if (!file) return;
		if (slot.incomingBytes !== file.size) {
			file.status = "error";
			this.fail("A file arrived incomplete. Ask the sender to try again.");
			return;
		}
		const url = triggerDownload(new Blob(slot.incoming, { type: file.type || "application/octet-stream" }), safeDownloadName(file.name, index));
		this.saves.push({
			name: file.name,
			url
		});
		file.transferred = file.size;
		file.status = "done";
		slot.incoming = [];
		slot.incomingBytes = 0;
		slot.currentFile = -1;
		this.publish(true);
	}
	async drainPumps() {
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
			if (this.pumpQueue.length && !this.closed) this.drainPumps();
		}
	}
	async pump(slot) {
		const channel = slot.channel;
		if (!channel || slot.sending) return;
		slot.sending = true;
		this.phase = "transferring";
		this.detail = "Sending";
		this.fileStates = this.fileStates.map((file) => ({
			...file,
			transferred: 0,
			status: "waiting"
		}));
		this.publish(true);
		try {
			let sent = 0;
			for (let index = 0; index < this.files.length; index += 1) {
				if (slot.aborted || this.closed || channel.readyState !== "open") throw new Error("interrupted");
				const file = this.files[index];
				const state = this.fileStates[index];
				if (state) state.status = "active";
				slot.fileIndex = index;
				channel.send(JSON.stringify({
					t: "file-start",
					i: index
				}));
				let offset = 0;
				while (offset < file.size) {
					if (slot.aborted || this.closed || channel.readyState !== "open") throw new Error("interrupted");
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
				channel.send(JSON.stringify({
					t: "file-done",
					i: index
				}));
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
	async flushPending(slot) {
		while (slot.pending.length) {
			const candidate = slot.pending.shift();
			if (!candidate) return;
			try {
				await slot.pc.addIceCandidate(candidate);
			} catch {}
		}
	}
	async onSignal(from, kind, payload, alive) {
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
				const description = payload;
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
				const candidate = payload;
				if (!slot.pc.remoteDescription) {
					slot.pending.push(candidate);
					return;
				}
				await slot.pc.addIceCandidate(candidate);
			}
		} catch {}
	}
	sendSignal(to, kind, payload) {
		const next = (this.signalQueues.get(to) ?? Promise.resolve()).then(() => this.postSignal(to, kind, payload));
		this.signalQueues.set(to, next.catch(() => {}));
		return next;
	}
	async postSignal(to, kind, payload) {
		for (let attempt = 0;; attempt += 1) {
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
						payload
					})
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
	async readCandidate(slot) {
		try {
			const stats = await slot.pc.getStats();
			let localId;
			stats.forEach((report) => {
				if (report.type === "candidate-pair" && "nominated" in report && report.nominated) localId = "localCandidateId" in report ? String(report.localCandidateId) : void 0;
			});
			if (!localId) return;
			slot.candidateType = stats.get(localId)?.candidateType ?? null;
			this.publish(true);
		} catch {}
	}
};
function waitDrain(channel) {
	if (channel.readyState !== "open") return Promise.reject(/* @__PURE__ */ new Error("closed"));
	if (channel.bufferedAmount <= HIGH_WATER) return Promise.resolve();
	return new Promise((resolve, reject) => {
		const done = () => {
			cleanup();
			resolve();
		};
		const closed = () => {
			cleanup();
			reject(/* @__PURE__ */ new Error("closed"));
		};
		const cleanup = () => {
			channel.removeEventListener("bufferedamountlow", done);
			channel.removeEventListener("close", closed);
		};
		channel.addEventListener("bufferedamountlow", done);
		channel.addEventListener("close", closed);
	});
}
function safeDownloadName(name, index) {
	return name.replace(/[\\/]/g, "").trim() || `file-${index + 1}`;
}
function percent(transferred, total) {
	if (!total) return 0;
	return Math.max(0, Math.min(100, Math.round(transferred / total * 100)));
}
function pathLabel(type, receiver) {
	if (type === "relay") return "Connected through a relay";
	if (type === "host" || type === "srflx" || type === "prflx") return receiver ? "Direct connection to the sender" : "Direct connection";
	return receiver ? "Connected to the sender" : "Connected";
}
function TransferScreen({ code }) {
	const [ready, setReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => setReady(true), []);
	if (!ready) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, {
		width: "narrow",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "pt-16 text-center text-muted",
			children: "Opening transfer…"
		})
	});
	const held = peekSender(code);
	if (held?.files.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SenderView, {
		code,
		hold: held
	});
	if (senderMarked(code)) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SenderLost, { code });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReceiverView, { code });
}
function SenderLost({ code }) {
	const navigate = useNavigate();
	async function cancel() {
		const creds = readSenderToken(code);
		if (creds) await fetch(apiUrl("/api/transfers"), {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				op: "cancel",
				id: code,
				token: creds.token
			})
		}).catch(() => {});
		forgetSender(code);
		await navigate({ to: "/" });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, {
		width: "narrow",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "pt-8 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto h-36 w-28",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mascot, { className: "h-full w-full" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-4 text-3xl font-extrabold text-fg",
					children: "The files left with the reload"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-muted",
					children: "FileEmber keeps the files in this tab only. Reloading cleared them, so this link can't send anymore. Start a new transfer."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-col gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex h-12 items-center justify-center rounded-full bg-accent font-semibold text-on-accent",
						children: "Start a new transfer"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => void cancel(),
						className: "inline-flex h-12 items-center justify-center rounded-full border border-border font-semibold text-fg",
						children: "Cancel this link"
					})]
				})
			]
		})
	});
}
function SenderView({ code, hold }) {
	const navigate = useNavigate();
	const [snap, setSnap] = (0, import_react.useState)(null);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const [preview, setPreview] = (0, import_react.useState)(false);
	const [now, setNow] = (0, import_react.useState)(() => Date.now());
	const engineRef = (0, import_react.useRef)(null);
	const link = shareUrl(`/t/${code}`);
	(0, import_react.useEffect)(() => {
		const engine = new FileTransfer({
			room: code,
			selfId: hold.peerId,
			role: "sender",
			files: hold.files,
			senderName: hold.senderName,
			meta: hold.meta,
			onChange: setSnap
		});
		engineRef.current = engine;
		engine.start();
		const clock = setInterval(() => setNow(Date.now()), 3e4);
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
			setTimeout(() => setCopied(false), 2e3);
		} catch {
			setCopied(false);
		}
	}
	async function cancel() {
		engineRef.current?.cancel();
		await fetch(apiUrl("/api/transfers"), {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				op: "cancel",
				id: code,
				token: hold.token
			})
		}).catch(() => {});
		forgetSender(code);
		await navigate({ to: "/" });
	}
	const phase = snap?.phase ?? "waiting";
	const pct = percent(snap?.bytesTransferred ?? 0, snap?.bytesTotal ?? 1);
	const waiting = phase === "waiting" || phase === "signaling" || phase === "connecting";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "rounded-3xl border border-border bg-card p-5 sm:p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "inline-flex items-center gap-2 rounded-full bg-bg px-3 py-1 text-sm text-muted",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "size-2 rounded-full bg-highlight",
									"aria-hidden": "true"
								}), snap?.detail ?? "Waiting for the recipient"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "mt-4 text-3xl font-extrabold tracking-tight text-fg sm:text-4xl",
								children: phase === "transferring" ? "Sending the files" : phase === "done" ? "Your transfer went through" : phase === "failed" ? "The connection didn't hold" : "Your transfer is ready"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-muted",
								children: "Share the link or the QR code. Keep this tab open until the download finishes."
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "hidden h-28 w-20 shrink-0 sm:block",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mascot, {
							decorative: true,
							className: "h-full w-full"
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex flex-col gap-2 sm:flex-row",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						readOnly: true,
						value: link,
						"aria-label": "Transfer link",
						onFocus: (event) => event.target.select(),
						className: "h-12 min-w-0 flex-1 rounded-xl border border-border bg-bg px-3 text-sm text-fg"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => void copyLink(),
						className: "inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-4 font-semibold text-on-accent transition-transform duration-150 ease-out active:scale-[0.96]",
						children: [copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" }), copied ? "Copied" : "Copy link"]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
					className: "mt-4 grid gap-3 sm:grid-cols-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl bg-bg px-4 py-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-xs text-muted",
								children: "Room code"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "mt-1 font-display text-2xl font-bold tracking-widest text-fg",
								children: roomCode(code)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl bg-bg px-4 py-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-xs text-muted",
								children: "Sending as"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "mt-1 truncate text-lg font-semibold text-fg",
								children: hold.senderName || "Anonymous"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl bg-bg px-4 py-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-xs text-muted",
								children: "Link expires"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "mt-1 text-lg font-semibold text-fg",
								children: formatExpiry(hold.expiresAt, now)
							})]
						})
					]
				}),
				phase === "transferring" || phase === "done" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-2 flex justify-between text-sm tabular-nums text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: phase === "done" ? "Sent" : `${pct}%` }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatSpeed(snap?.speedBps ?? null) ?? "" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-2 overflow-hidden rounded-full bg-bg",
						role: "progressbar",
						"aria-valuenow": pct,
						"aria-valuemin": 0,
						"aria-valuemax": 100,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-full rounded-full bg-accent transition-[width] duration-200",
							style: { width: `${pct}%` }
						})
					})]
				}) : null,
				snap?.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-accent-ink",
					children: snap.error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-4 text-sm text-muted",
					children: [
						hold.meta.length,
						" ",
						hold.meta.length === 1 ? "file" : "files",
						" · ",
						formatBytes(hold.meta.reduce((sum, file) => sum + file.size, 0))
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-2 divide-y divide-border",
					children: hold.meta.map((file) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center justify-between gap-3 py-2 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "truncate text-fg",
							children: file.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "shrink-0 tabular-nums text-muted",
							children: formatBytes(file.size)
						})]
					}, `${file.name}-${file.size}`))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-wrap items-center gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => void cancel(),
						className: "inline-flex h-11 items-center rounded-full border border-border px-4 text-sm font-semibold text-fg",
						children: "Cancel transfer"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setPreview((value) => !value),
						className: "inline-flex h-11 items-center text-sm font-semibold text-accent-ink",
						children: preview ? "Hide preview" : "Preview what your friend sees →"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-muted",
					children: waiting ? "Can't connect? Send the link again, or try the QR code. Some school networks block direct connections." : "Leave this tab in the foreground until every download says it finished."
				}),
				preview ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewCard, { hold }) : null
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "rounded-3xl border border-border bg-card p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-bold text-fg",
					children: "Scan to open"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrCode, { value: link })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-center text-sm text-muted",
					children: "Point a phone camera at the code. No app and no account needed."
				})
			]
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "sr-only",
		"aria-live": "polite",
		children: snap?.detail ?? "Waiting for the recipient"
	})] });
}
function PreviewCard({ hold }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 rounded-2xl border border-border bg-bg p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-semibold uppercase tracking-wide text-muted",
				children: "Preview only"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: "This is the screen your friend sees. It does not open a second connection."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "mt-4 text-xl font-bold text-fg",
				children: hold.senderName ? `Files from ${hold.senderName}` : "Files for you"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 space-y-2",
				children: hold.meta.map((file) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex justify-between gap-3 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "truncate",
						children: file.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "tabular-nums text-muted",
						children: formatBytes(file.size)
					})]
				}, `${file.name}-${file.size}`))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-accent font-semibold text-on-accent",
				children: "Download"
			})
		]
	});
}
function ReceiverView({ code }) {
	const [meta, setMeta] = (0, import_react.useState)(null);
	const [missing, setMissing] = (0, import_react.useState)(false);
	const [loadError, setLoadError] = (0, import_react.useState)(null);
	const [attempt, setAttempt] = (0, import_react.useState)(0);
	const [started, setStarted] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
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
				const body = await res.json();
				setMeta(body);
				setLoadError(null);
			} catch {
				if (!stop) setLoadError("Couldn't reach FileEmber. Check your connection and try again.");
			}
		}
		load();
		const timer = setInterval(() => void load(), 4e3);
		return () => {
			stop = true;
			clearInterval(timer);
		};
	}, [code]);
	if (missing) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, {
		width: "narrow",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusCard, {
			title: "This link doesn't work",
			body: "It may have expired, been cancelled, or been typed wrong. Ask the sender for a new one."
		})
	});
	if (!meta && loadError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, {
		width: "narrow",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusCard, {
			title: "Can't reach the transfer",
			body: loadError
		})
	});
	if (!meta) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, {
		width: "narrow",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "pt-16 text-center text-muted",
			children: "Loading transfer…"
		})
	});
	if (meta.cancelled) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, {
		width: "narrow",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusCard, {
			title: "The sender cancelled this transfer",
			body: "Ask them to create a new link if you still need the files."
		})
	});
	if (meta.expired) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, {
		width: "narrow",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusCard, {
			title: "This link has expired",
			body: "Links close on their own so old files aren't left waiting. Ask the sender for a fresh one."
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, {
		width: "narrow",
		children: started ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReceiverSession, {
			code,
			meta,
			onRetry: () => {
				setStarted(false);
				setAttempt((value) => value + 1);
			}
		}, attempt) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReceiveOffer, {
			meta,
			onDownload: () => setStarted(true)
		})
	});
}
function StatusCard({ title, body }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pt-8 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto h-36 w-28",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mascot, { className: "h-full w-full" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-4 text-3xl font-extrabold text-fg",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-muted",
				children: body
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "mt-6 inline-flex h-12 items-center justify-center rounded-full bg-accent px-5 font-semibold text-on-accent",
				children: "Send your own files"
			})
		]
	});
}
function ReceiveOffer({ meta, onDownload }) {
	const total = meta.files.reduce((sum, file) => sum + file.size, 0);
	const from = meta.senderName ? ` from ${meta.senderName}` : "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pt-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto h-36 w-28",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mascot, { className: "mx-auto h-full w-full" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
				className: "mt-2 text-center text-3xl font-extrabold text-fg",
				children: ["Files", from]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-center text-sm text-muted",
				children: [
					meta.files.length,
					" ",
					meta.files.length === 1 ? "file" : "files",
					" · ",
					formatBytes(total),
					" · expires ",
					formatExpiry(meta.expiresAt)
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-6 space-y-2",
				children: meta.files.map((file) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, {
						className: "size-5 shrink-0 text-accent-ink",
						"aria-hidden": "true"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block truncate text-sm font-medium",
							children: file.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xs text-muted",
							children: [
								fileKind(file.name, file.type),
								" · ",
								formatBytes(file.size)
							]
						})]
					})]
				}, `${file.name}-${file.size}`))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: onDownload,
				className: "mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-accent font-semibold text-on-accent transition-transform duration-150 ease-out active:scale-[0.96]",
				children: "Download"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 flex gap-2 text-sm text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, {
					className: "mt-0.5 size-4 shrink-0",
					"aria-hidden": "true"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "The files come straight from the sender's browser. FileEmber does not scan them. Only download what you expect, and keep this page open until it finishes." })]
			})
		]
	});
}
function ReceiverSession({ code, meta, onRetry }) {
	const peerId = (0, import_react.useRef)(makePeerId("r"));
	const engineRef = (0, import_react.useRef)(null);
	const metaRef = (0, import_react.useRef)(meta);
	const [snap, setSnap] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const current = metaRef.current;
		const engine = new FileTransfer({
			room: code,
			selfId: peerId.current,
			role: "receiver",
			senderName: current.senderName,
			meta: current.files,
			onChange: setSnap
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
		status: "waiting"
	}));
	const total = files.reduce((sum, file) => sum + file.size, 0);
	const got = snap?.bytesTransferred ?? 0;
	const pct = percent(got, total);
	const phase = snap?.phase ?? "connecting";
	const from = meta.senderName || "your classmate";
	const speed = formatSpeed(snap?.speedBps ?? null);
	const eta = formatEta(snap?.speedBps && total > got ? (total - got) / snap.speedBps : null);
	const connected = phase === "connected" || phase === "transferring" || phase === "done";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pt-4 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProgressRing, {
				progress: phase === "done" ? 1 : pct / 100,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-20 w-16",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mascot, {
						decorative: true,
						className: "h-full w-full"
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-4 text-3xl font-extrabold text-fg",
				children: phase === "done" ? "Download complete" : phase === "failed" ? "Transfer stopped" : phase === "cancelled" ? "Transfer cancelled" : `Receiving from ${from}`
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 font-semibold text-accent-ink",
				children: phase === "transferring" ? `Transferring · ${pct}%` : snap?.detail ?? "Connecting…"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 h-2 overflow-hidden rounded-full bg-card",
				role: "progressbar",
				"aria-valuenow": pct,
				"aria-valuemin": 0,
				"aria-valuemax": 100,
				"aria-label": "Download progress",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-full rounded-full bg-accent transition-[width] duration-200",
					style: { width: `${phase === "done" ? 100 : pct}%` }
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex justify-between text-sm tabular-nums text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: speed ?? "—" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: phase === "done" ? "Finished" : eta ?? "" })]
			}),
			connected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-sm text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
					className: "size-4 text-accent-ink",
					"aria-hidden": "true"
				}), pathLabel(snap?.candidateType ?? null, true)]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 space-y-2 text-left",
				children: files.map((file) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileRow, {
					file,
					saves: snap?.saves ?? []
				}, `${file.name}-${file.size}`))
			}),
			phase === "failed" || phase === "cancelled" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: onRetry,
				className: "mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-accent font-semibold text-on-accent",
				children: "Try again"
			}) : phase === "done" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-sm text-muted",
				children: "If a file didn't land in your downloads, use Save next to its name. You can close this page now."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => engineRef.current?.cancel(),
				className: "mt-6 inline-flex h-12 w-full items-center justify-center rounded-full border border-border font-semibold text-fg",
				children: "Cancel"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-muted",
				children: "Keep this page open until it finishes."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "sr-only",
				"aria-live": "polite",
				children: [
					snap?.detail,
					" ",
					pct,
					"%"
				]
			})
		]
	});
}
function FileRow({ file, saves }) {
	const save = saves.find((item) => item.name === file.name);
	const pct = file.size ? Math.round(file.transferred / file.size * 100) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, {
				className: "size-5 shrink-0 text-muted",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "min-w-0 flex-1 truncate text-sm font-medium",
				children: file.name
			}),
			file.status === "done" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "flex items-center gap-2 text-sm text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
						className: "size-4 text-accent-ink",
						"aria-hidden": "true"
					}),
					"Done",
					save ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: save.url,
						download: file.name,
						className: "font-semibold text-accent-ink",
						children: "Save"
					}) : null
				]
			}) : file.status === "active" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "text-sm tabular-nums text-muted",
				children: [pct, "%"]
			}) : file.status === "error" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm text-accent-ink",
				children: "Failed"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm text-muted",
				children: "Waiting"
			})
		]
	});
}
function ProgressRing({ progress, children }) {
	const radius = 52;
	const circ = 2 * Math.PI * radius;
	const offset = circ * (1 - Math.max(0, Math.min(1, progress)));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative mx-auto h-40 w-40",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: "0 0 120 120",
			className: "h-full w-full -rotate-90",
			"aria-hidden": "true",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "60",
				cy: "60",
				r: radius,
				fill: "none",
				strokeWidth: "8",
				className: "stroke-border"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "60",
				cy: "60",
				r: radius,
				fill: "none",
				strokeWidth: "8",
				strokeLinecap: "round",
				className: "stroke-accent",
				strokeDasharray: circ,
				strokeDashoffset: offset
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-0 flex items-center justify-center",
			children
		})]
	});
}
var SplitComponent = function TransferRoute() {
	const { code } = Route.useParams();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TransferScreen, { code });
};
//#endregion
export { SplitComponent as component };
