import { o as previewPathPrefix } from "./router-imJL6fFZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ids-CO0XehTu.js
function formatBytes(bytes) {
	if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
	if (bytes < 1024) return `${Math.round(bytes)} B`;
	const units = [
		"KB",
		"MB",
		"GB",
		"TB"
	];
	let value = bytes / 1024;
	let unit = 0;
	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit += 1;
	}
	const digits = value >= 10 || unit === 0 ? 0 : 1;
	return `${value.toFixed(digits)} ${units[unit]}`;
}
function formatSpeed(bytesPerSec) {
	if (bytesPerSec == null || !Number.isFinite(bytesPerSec) || bytesPerSec <= 0) return null;
	return `${formatBytes(bytesPerSec)}/s`;
}
function formatEta(seconds) {
	if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return null;
	if (seconds < 5) return "a few seconds left";
	if (seconds < 90) return `about ${Math.max(1, Math.round(seconds))} s left`;
	const minutes = Math.round(seconds / 60);
	if (minutes < 90) return minutes === 1 ? "about 1 min left" : `about ${minutes} min left`;
	const hours = Math.round(minutes / 60);
	return hours === 1 ? "about 1 hour left" : `about ${hours} hours left`;
}
function formatExpiry(iso, now = Date.now()) {
	const ms = new Date(iso).getTime() - now;
	if (!Number.isFinite(ms) || ms <= 0) return "expired";
	const minutes = Math.round(ms / 6e4);
	if (minutes < 2) return "in 1 min";
	if (minutes < 60) return `in ${minutes} min`;
	const hours = Math.round(minutes / 60);
	if (hours < 36) return hours === 1 ? "in 1 hour" : `in ${hours} hours`;
	const days = Math.round(hours / 24);
	return days === 1 ? "in 1 day" : `in ${days} days`;
}
var KIND = {
	pdf: "PDF",
	ppt: "Presentation",
	pptx: "Presentation",
	key: "Presentation",
	doc: "Document",
	docx: "Document",
	txt: "Document",
	md: "Document",
	xls: "Spreadsheet",
	xlsx: "Spreadsheet",
	csv: "Spreadsheet",
	zip: "Archive",
	rar: "Archive",
	"7z": "Archive",
	png: "Image",
	jpg: "Image",
	jpeg: "Image",
	gif: "Image",
	webp: "Image",
	heic: "Image",
	mp4: "Video",
	mov: "Video",
	webm: "Video",
	mp3: "Audio",
	wav: "Audio",
	m4a: "Audio"
};
function fileKind(name, type) {
	if (type.startsWith("image/")) return "Image";
	if (type.startsWith("video/")) return "Video";
	if (type.startsWith("audio/")) return "Audio";
	return KIND[name.split(".").pop()?.toLowerCase() ?? ""] ?? "File";
}
function roomCode(id) {
	return id.split("-")[0]?.toUpperCase() ?? id.toUpperCase();
}
/** Path prefix for path-based previews, or "" on a normal host. */
function previewPrefix() {
	if (typeof window === "undefined") return "";
	return previewPathPrefix(window.location.hostname, window.location.pathname) ?? "";
}
/** Same-origin API path, including the preview prefix when the browser needs it. */
function apiUrl(path) {
	const normalized = path.startsWith("/") ? path : `/${path}`;
	return `${previewPrefix()}${normalized}`;
}
/** Absolute URL suitable for a QR code or the clipboard. */
function shareUrl(path) {
	const normalized = path.startsWith("/") ? path : `/${path}`;
	return `${window.location.origin}${previewPrefix()}${normalized}`;
}
var holds = /* @__PURE__ */ new Map();
function storageKey(id) {
	return `fileember-sender:${id}`;
}
function holdSender(id, hold) {
	holds.set(id, hold);
	try {
		sessionStorage.setItem(storageKey(id), JSON.stringify({
			token: hold.token,
			peerId: hold.peerId,
			senderName: hold.senderName,
			expiresAt: hold.expiresAt
		}));
	} catch {}
}
function peekSender(id) {
	return holds.get(id);
}
function senderMarked(id) {
	if (holds.has(id)) return true;
	try {
		return sessionStorage.getItem(storageKey(id)) != null;
	} catch {
		return false;
	}
}
function readSenderToken(id) {
	const held = holds.get(id);
	if (held) return {
		token: held.token,
		peerId: held.peerId
	};
	try {
		const raw = sessionStorage.getItem(storageKey(id));
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (!parsed.token || !parsed.peerId) return null;
		return {
			token: parsed.token,
			peerId: parsed.peerId
		};
	} catch {
		return null;
	}
}
function forgetSender(id) {
	holds.delete(id);
	try {
		sessionStorage.removeItem(storageKey(id));
	} catch {}
}
var ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
function chunk(length) {
	const bytes = crypto.getRandomValues(new Uint8Array(length));
	let out = "";
	for (const byte of bytes) out += ALPHABET[byte % 31];
	return out;
}
/** Unguessable transfer id, also used as the signaling room. */
function makeTransferId() {
	return `${chunk(4)}-${chunk(4)}`;
}
function makeToken() {
	return [...crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(16))].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function makePeerId(role) {
	return `${role}${chunk(12)}`;
}
//#endregion
export { formatEta as a, holdSender as c, makeTransferId as d, peekSender as f, shareUrl as g, senderMarked as h, formatBytes as i, makePeerId as l, roomCode as m, fileKind as n, formatExpiry as o, readSenderToken as p, forgetSender as r, formatSpeed as s, apiUrl as t, makeToken as u };
