import { o as __toESM } from "../_runtime.mjs";
import { J as require_react, S as require_jsx_runtime, _ as createFileRoute, d as Scripts, f as HeadContent, g as lazyRouteComponent, h as Outlet, m as createRouter, v as createRootRoute, x as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TriangleAlert } from "../_libs/lucide-react.mjs";
import { a as number, c as union, i as literal, l as unknown, n as _enum, o as object, r as discriminatedUnion, s as string, t as number$1 } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-imJL6fFZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: errorMessage(error)
			})
		]
	});
}
/**
* Path-based preview hosts serve the dev server under `/{port_id}/` and strip
* that prefix before forwarding, so SSR sees `/` while the browser URL keeps the
* prefix. TanStack Start resets `basepath` on hydration, so a `rewrite` keeps
* client routing and generated links aligned with the public URL.
*/
var PATH_BASED_PREVIEW_HOSTS = /* @__PURE__ */ new Set([
	"preview.grok.genai.mil",
	"preview.grok.mil",
	"preview.grokgsac.com"
]);
var PORT_ID_PREFIX = /^\/hds-[a-z0-9]+-\d+-[a-z0-9]+(?=\/|$)/i;
function previewPathPrefix(hostname, pathname) {
	if (!PATH_BASED_PREVIEW_HOSTS.has(hostname.toLowerCase())) return void 0;
	return PORT_ID_PREFIX.exec(pathname)?.[0];
}
function prefixRewrite(prefix) {
	return {
		input: ({ url }) => {
			if (url.pathname === prefix) url.pathname = "/";
			else if (url.pathname.startsWith(`${prefix}/`)) url.pathname = url.pathname.slice(prefix.length);
			return url;
		},
		output: ({ url }) => {
			url.pathname = `${prefix}${url.pathname}`;
			return url;
		}
	};
}
function previewPathRewrite() {
	if (typeof window === "undefined") return void 0;
	const prefix = previewPathPrefix(window.location.hostname, window.location.pathname);
	return prefix ? prefixRewrite(prefix) : void 0;
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var THEMES = [
	{
		id: "ember",
		label: "Ember orange",
		mascot: "Ember",
		alt: "Ember, a small flame mascot with a red cape",
		src: "/mascots/mascot-ember.png",
		swatch: "bg-swatch-ember"
	},
	{
		id: "ocean",
		label: "Ocean blue",
		mascot: "Drip",
		alt: "Drip, a water-drop mascot with a blue cape",
		src: "/mascots/mascot-ocean.png",
		swatch: "bg-swatch-ocean"
	},
	{
		id: "forest",
		label: "Forest green",
		mascot: "Sprout",
		alt: "Sprout, a leafy mascot with a brown cape",
		src: "/mascots/mascot-forest.png",
		swatch: "bg-swatch-forest"
	},
	{
		id: "violet",
		label: "Violet",
		mascot: "Prism",
		alt: "Prism, a crystal mascot with an indigo cape",
		src: "/mascots/mascot-violet.png",
		swatch: "bg-swatch-violet"
	},
	{
		id: "rose",
		label: "Rose pink",
		mascot: "Petal",
		alt: "Petal, a blossom mascot with a berry cape",
		src: "/mascots/mascot-rose.png",
		swatch: "bg-swatch-rose"
	}
];
var STORAGE_THEME = "fileember-theme";
var STORAGE_MODE = "fileember-mode";
function isTheme(value) {
	return THEMES.some((theme) => theme.id === value);
}
function apply(theme, mode) {
	document.documentElement.dataset.theme = theme;
	document.documentElement.dataset.mode = mode;
	try {
		localStorage.setItem(STORAGE_THEME, theme);
		localStorage.setItem(STORAGE_MODE, mode);
	} catch {}
}
var ThemeContext = (0, import_react.createContext)(null);
function ThemeProvider({ children }) {
	const [theme, setThemeState] = (0, import_react.useState)("ember");
	const [mode, setModeState] = (0, import_react.useState)("dark");
	(0, import_react.useEffect)(() => {
		let nextTheme = "ember";
		let nextMode = "dark";
		try {
			const storedTheme = localStorage.getItem(STORAGE_THEME);
			const storedMode = localStorage.getItem(STORAGE_MODE);
			if (isTheme(storedTheme)) nextTheme = storedTheme;
			if (storedMode === "light" || storedMode === "dark") nextMode = storedMode;
		} catch {}
		setThemeState(nextTheme);
		setModeState(nextMode);
		apply(nextTheme, nextMode);
		for (const item of THEMES) {
			const image = new Image();
			image.src = item.src;
		}
	}, []);
	const setTheme = (next) => {
		setThemeState(next);
		apply(next, mode);
	};
	const setMode = (next) => {
		setModeState(next);
		apply(theme, next);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeContext.Provider, {
		value: {
			theme,
			mode,
			setTheme,
			setMode,
			toggleMode: () => setMode(mode === "dark" ? "light" : "dark")
		},
		children
	});
}
function useTheme() {
	const value = (0, import_react.useContext)(ThemeContext);
	if (!value) throw new Error("useTheme must be used inside ThemeProvider");
	return value;
}
function themeById(id) {
	return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}
var THEME_BOOT = `(function(){try{var t=localStorage.getItem("${STORAGE_THEME}");var m=localStorage.getItem("${STORAGE_MODE}");var ok={ember:1,ocean:1,forest:1,violet:1,rose:1};if(!ok[t])t="ember";if(m!=="light"&&m!=="dark")m="dark";var d=document.documentElement;d.dataset.theme=t;d.dataset.mode=m;}catch(e){}})();`;
var styles_default = "/assets/styles-YpAN5HPs.css";
var APP_NAME = "FileEmber";
var Route$8 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "Send school files straight from your browser. Share a link or QR code. No account. Files travel peer to peer."
			},
			{
				name: "theme-color",
				content: "#140E0D"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Figtree:wght@400;500;600;700&display=swap"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "preload",
				as: "image",
				href: "/mascots/mascot-ember.png"
			},
			{
				rel: "preload",
				as: "image",
				href: "/mascots/mascot-ocean.png"
			},
			{
				rel: "preload",
				as: "image",
				href: "/mascots/mascot-forest.png"
			},
			{
				rel: "preload",
				as: "image",
				href: "/mascots/mascot-violet.png"
			},
			{
				rel: "preload",
				as: "image",
				href: "/mascots/mascot-rose.png"
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("head", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", { dangerouslySetInnerHTML: { __html: THEME_BOOT } }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
		] })]
	})
});
var $$splitComponentImporter$5 = () => import("./routes-CmAE07T1.mjs");
var Route$7 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
var $$splitComponentImporter$4 = () => import("./about-Djo_3BFl.mjs");
var Route$6 = createFileRoute("/about")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./help-D6JOPvQA.mjs");
var Route$5 = createFileRoute("/help")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./how-it-works-eO_juQR3.mjs");
var Route$4 = createFileRoute("/how-it-works")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./privacy-B8nBM0PR.mjs");
var Route$3 = createFileRoute("/privacy")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var _0002_fileember_default = "-- Signaling rendezvous plus transfer metadata. File bytes never land here.\nCREATE TABLE IF NOT EXISTS webrtc_peers (\n  room TEXT NOT NULL,\n  peer_id TEXT NOT NULL,\n  name TEXT NOT NULL DEFAULT '',\n  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),\n  PRIMARY KEY (room, peer_id)\n);\n\nCREATE TABLE IF NOT EXISTS webrtc_signals (\n  id BIGSERIAL PRIMARY KEY,\n  room TEXT NOT NULL,\n  to_peer TEXT NOT NULL,\n  from_peer TEXT NOT NULL,\n  kind TEXT NOT NULL,\n  payload JSONB NOT NULL,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE INDEX IF NOT EXISTS webrtc_signals_inbox\n  ON webrtc_signals (room, to_peer, id);\n\nCREATE TABLE IF NOT EXISTS file_transfers (\n  id TEXT PRIMARY KEY,\n  sender_token TEXT NOT NULL,\n  sender_peer TEXT NOT NULL,\n  sender_name TEXT NOT NULL DEFAULT '',\n  files JSONB NOT NULL,\n  expires_at TIMESTAMPTZ NOT NULL,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  cancelled BOOLEAN NOT NULL DEFAULT false\n);\n\nCREATE INDEX IF NOT EXISTS file_transfers_created\n  ON file_transfers (created_at);\n";
/**
* Migration bookkeeping shared by the two appliers — `scripts/migrate.mjs`
* (deploy, `readdir`) and `src/lib/db.ts` (PGLite preview, `import.meta.glob`).
*
* Applied files are keyed by BASENAME, so the same file applies once no matter
* which directory it is globbed from. That is what makes the auth schema safe to
* copy from `migrations/auth/` into `migrations/` when an app turns sign-in on:
* a database that already has `0001_auth.sql` will not re-run it.
*
* Neither applier descends into subdirectories, so `migrations/auth/*.sql` is
* out of scope for both until it is copied up.
*/
/**
* The `_migrations` key for a migration path (or bare filename).
* @param {string} path
* @returns {string}
*/
function migrationName(path) {
	return path.split("/").pop() ?? path;
}
/**
* @param {string} path
* @returns {boolean}
*/
function isMigrationFile(path) {
	return path.endsWith(".sql");
}
/**
* Migrations in `paths` that are not yet in `applied`, in apply order.
* Non-`.sql` entries (a `readdir` also yields `migrations/auth/`) are dropped.
* @param {Iterable<string>} paths
* @param {Iterable<string>} applied
* @returns {Array<{ name: string, path: string }>}
*/
function pendingMigrations(paths, applied) {
	const done = new Set(applied);
	return [...paths].filter(isMigrationFile).map((path) => ({
		name: migrationName(path),
		path
	})).sort((a, b) => a.name.localeCompare(b.name)).filter(({ name }) => !done.has(name));
}
var rawDatabaseUrl = typeof process !== "undefined" ? process.env.DATABASE_URL : void 0;
var databaseUrl = rawDatabaseUrl && rawDatabaseUrl.trim() ? rawDatabaseUrl : void 0;
/**
* Active backend: real **Neon** when `DATABASE_URL` is set (deployed / configured
* sandbox), otherwise a local embedded **PGLite** (Postgres compiled to WASM) so
* the app has a working database even with nothing configured — the live preview
* included. Swap in Neon later by just setting `DATABASE_URL`; no code changes.
*/
var dbSource = databaseUrl ? "neon" : "pglite";
/**
* Init state lives on globalThis as promises: dev HMR creates new instances of
* this module, and two instances racing module-level state would open a second
* pool or run two concurrent PGLite migration passes (whose duplicate
* `_migrations` insert rejects — and would get memoized, poisoning every later
* `getSql()`). A failed init clears its slot so the next call retries.
*/
var globalRef$1 = globalThis;
/**
* Result-type parity: Postgres sends every value as text plus a type OID — the
* JS value is the DRIVER's parsing choice, and pg and PGLite disagree (pg:
* int8 -> string, date -> local-midnight Date; PGLite: int8 -> BigInt, which
* JSON.stringify rejects, date -> UTC Date). Normalize both so preview and
* production return identical, JSON-safe shapes:
*   int8/bigint (incl. count(*)) -> number (past 2^53 loses precision — cast
*                                   `::text` if you ever need huge integers)
*   date                         -> 'YYYY-MM-DD' string
*   interval                     -> Postgres interval text
* numeric already comes back as a string on both (arbitrary precision).
*/
var OID_INT8 = 20;
var OID_DATE = 1082;
var OID_INTERVAL = 1186;
var identity = (v) => v;
/** Wrap a query runner in the tagged-template + `.query()` `Sql` surface. */
function toSql(run) {
	const sql = (async (strings, ...values) => {
		let text = strings[0];
		for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
		return run(text, values);
	});
	sql.query = (text, params = []) => run(text, params);
	return sql;
}
function createNeonSql() {
	globalRef$1.__pgSqlPromise__ ??= (async () => {
		const { Pool, types } = await import("../_libs/pg.mjs").then((n) => n.t);
		types.setTypeParser(OID_INT8, Number);
		types.setTypeParser(OID_DATE, identity);
		types.setTypeParser(OID_INTERVAL, identity);
		const pool = new Pool({ connectionString: databaseUrl });
		return toSql(async (text, params) => {
			return (await pool.query(text, params)).rows;
		});
	})().catch((err) => {
		globalRef$1.__pgSqlPromise__ = void 0;
		throw err;
	});
	return globalRef$1.__pgSqlPromise__;
}
async function createPgliteSql() {
	globalRef$1.__pgliteInstance__ ??= (async () => {
		const { PGlite } = await import("../_libs/electric-sql__pglite.mjs").then((n) => n.t);
		const pg = new PGlite({ parsers: {
			[OID_INT8]: Number,
			[OID_DATE]: identity,
			[OID_INTERVAL]: identity
		} });
		await pg.waitReady;
		await pg.exec("create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())");
		return pg;
	})().catch((err) => {
		globalRef$1.__pgliteInstance__ = void 0;
		throw err;
	});
	const pg = await globalRef$1.__pgliteInstance__;
	const migrate = async () => {
		const migrations = /* #__PURE__ */ Object.assign({ "/migrations/0002_fileember.sql": _0002_fileember_default });
		const done = (await pg.query("select name from _migrations")).rows.map((r) => r.name);
		for (const { name, path } of pendingMigrations(Object.keys(migrations), done)) await pg.transaction(async (tx) => {
			await tx.exec(migrations[path]);
			await tx.query("insert into _migrations (name) values ($1)", [name]);
		});
	};
	const pass = (globalRef$1.__pgliteMigrateChain__ ?? Promise.resolve()).catch(() => void 0).then(migrate);
	globalRef$1.__pgliteMigrateChain__ = pass;
	await pass;
	return toSql(async (text, params) => {
		return (await pg.query(text, params)).rows;
	});
}
var sqlPromise = null;
async function createSql() {
	if (typeof window !== "undefined") throw new Error("@/lib/db is server-only — call getSql() from a createServerFn handler or a server route loader, never from client code.");
	return dbSource === "neon" ? createNeonSql() : createPgliteSql();
}
/**
* Get the shared, **server-only** SQL client. Neon when `DATABASE_URL` is set,
* otherwise the local PGLite fallback. Memoized — safe to call per request.
*
* Schema comes from `migrations/*.sql`, auto-applied before the first query on
* both backends — define tables there, never inline in server functions.
*/
function getSql() {
	sqlPromise ??= createSql().catch((err) => {
		sqlPromise = null;
		throw err;
	});
	return sqlPromise;
}
/**
* Finish DB bootstrap before the server handles traffic.
*
* - **PGLite** (preview / no `DATABASE_URL`): open the in-memory DB and apply
*   `migrations/*.sql`. Idempotent — concurrent callers share one promise.
* - **Neon**: no-op (pool is created lazily on first query).
*
* Vite `configureServer` awaits this at dev startup; production imports of this
* module kick it off immediately (see bottom of file).
*/
function ensureDbReady() {
	if (dbSource !== "pglite") return Promise.resolve();
	return getSql().then(() => void 0);
}
var globalBoot = globalThis;
if (typeof window === "undefined" && dbSource === "pglite") globalBoot.__pgBootstrapPromise__ ??= ensureDbReady().catch((err) => {
	globalBoot.__pgBootstrapPromise__ = void 0;
	console.error("[db] PGLite bootstrap failed:", err);
	throw err;
});
/**
* WebRTC signaling over the app database (Neon deployed, PGLite in preview).
* Only rendezvous traffic passes through here — roster + SDP/ICE. File bytes
* move on a direct data channel. Mounted at /api/rtc.
*
* FileEmber rooms are transfer ids. The sender seat is the peer id stored on
* the transfer row, so someone who only has the link cannot impersonate the
* sender. Receivers are capped so one link cannot fill the roster.
*/
var ID = string().regex(/^[a-zA-Z0-9_-]{1,64}$/);
var signalSchema = object({
	op: literal("signal"),
	room: ID,
	from: ID,
	to: ID,
	kind: _enum([
		"offer",
		"answer",
		"ice"
	]),
	payload: unknown().refine((v) => v !== void 0 && JSON.stringify(v).length <= 32768, { message: "payload too large" })
});
var leaveSchema = object({
	op: literal("leave"),
	room: ID,
	peer: ID
});
var postSchema = discriminatedUnion("op", [signalSchema, leaveSchema]);
var PEER_TTL_SECONDS = 30;
var SIGNAL_TTL_SECONDS = 60;
var MAX_RECEIVERS = 6;
var globalRef = globalThis;
function ensureSchema(sql) {
	globalRef.__rtcSchemaPromise__ ??= (async () => {
		await sql.query(`CREATE TABLE IF NOT EXISTS webrtc_peers (
         room TEXT NOT NULL,
         peer_id TEXT NOT NULL,
         name TEXT NOT NULL DEFAULT '',
         last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
         PRIMARY KEY (room, peer_id)
       )`);
		await sql.query(`CREATE TABLE IF NOT EXISTS webrtc_signals (
         id BIGSERIAL PRIMARY KEY,
         room TEXT NOT NULL,
         to_peer TEXT NOT NULL,
         from_peer TEXT NOT NULL,
         kind TEXT NOT NULL,
         payload JSONB NOT NULL,
         created_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )`);
		await sql.query(`CREATE INDEX IF NOT EXISTS webrtc_signals_inbox
         ON webrtc_signals (room, to_peer, id)`);
		await sql.query(`CREATE TABLE IF NOT EXISTS file_transfers (
         id TEXT PRIMARY KEY,
         sender_token TEXT NOT NULL,
         sender_peer TEXT NOT NULL,
         sender_name TEXT NOT NULL DEFAULT '',
         files JSONB NOT NULL,
         expires_at TIMESTAMPTZ NOT NULL,
         created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
         cancelled BOOLEAN NOT NULL DEFAULT false
       )`);
		await sql.query(`CREATE INDEX IF NOT EXISTS file_transfers_created ON file_transfers (created_at)`);
	})().catch((err) => {
		globalRef.__rtcSchemaPromise__ = void 0;
		throw err;
	});
	return globalRef.__rtcSchemaPromise__;
}
async function roster(sql, room) {
	return (await sql.query(`SELECT peer_id, name FROM webrtc_peers
     WHERE room = $1 AND last_seen > now() - make_interval(secs => $2)
     ORDER BY peer_id LIMIT 32`, [room, PEER_TTL_SECONDS])).map((r) => ({
		id: r.peer_id,
		name: r.name
	}));
}
async function touchPeer(sql, room, peer, name) {
	await sql.query(`INSERT INTO webrtc_peers (room, peer_id, name, last_seen)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (room, peer_id)
     DO UPDATE SET last_seen = now(), name = EXCLUDED.name`, [
		room,
		peer,
		name
	]);
}
async function prune(sql) {
	await Promise.all([
		sql.query(`DELETE FROM webrtc_signals WHERE created_at < now() - make_interval(secs => $1)`, [SIGNAL_TTL_SECONDS]),
		sql.query(`DELETE FROM webrtc_peers WHERE last_seen < now() - make_interval(secs => $1)`, [PEER_TTL_SECONDS]),
		sql.query(`DELETE FROM file_transfers WHERE expires_at < now() - make_interval(secs => 86400)`)
	]);
}
function json$1(body, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"content-type": "application/json",
			"cache-control": "no-store"
		}
	});
}
async function authorizePeer(sql, room, peer, name) {
	if (name !== "sender" && name !== "receiver") return json$1({ error: "unknown role" }, 400);
	const transfer = (await sql.query(`SELECT sender_peer FROM file_transfers
     WHERE id = $1 AND cancelled = false AND expires_at > now()`, [room]))[0];
	if (!transfer) return json$1({ error: "transfer unavailable" }, 404);
	if (name === "sender") {
		if (transfer.sender_peer !== peer) return json$1({ error: "not the sender" }, 403);
		return null;
	}
	if ((await sql.query(`SELECT peer_id FROM webrtc_peers
     WHERE room = $1 AND peer_id = $2 AND last_seen > now() - make_interval(secs => $3)`, [
		room,
		peer,
		PEER_TTL_SECONDS
	]))[0]) return null;
	if (((await sql.query(`SELECT count(*)::int AS n FROM webrtc_peers
     WHERE room = $1 AND name = 'receiver' AND last_seen > now() - make_interval(secs => $2)`, [room, PEER_TTL_SECONDS]))[0]?.n ?? 0) >= MAX_RECEIVERS) return json$1({ error: "room full" }, 429);
	return null;
}
/** GET /api/rtc?room&peer&name&since — join (since=0), heartbeat, and inbox. */
async function handleGet$1(url) {
	const parsed = object({
		room: ID,
		peer: ID,
		name: string().max(64).default(""),
		since: number$1().int().min(0).default(0)
	}).safeParse({
		room: url.searchParams.get("room"),
		peer: url.searchParams.get("peer"),
		name: url.searchParams.get("name") ?? "",
		since: url.searchParams.get("since") ?? 0
	});
	if (!parsed.success) return json$1({ error: "invalid query" }, 400);
	const { room, peer, name, since } = parsed.data;
	const sql = await getSql();
	await ensureSchema(sql);
	const denied = await authorizePeer(sql, room, peer, name);
	if (denied) return denied;
	if (since === 0 || Math.random() < .02) await prune(sql);
	await touchPeer(sql, room, peer, name);
	const rows = await sql.query(`SELECT id, from_peer, kind, payload FROM webrtc_signals
     WHERE room = $1 AND to_peer = $2 AND id > $3
     ORDER BY id LIMIT 200`, [
		room,
		peer,
		since
	]);
	return json$1({
		peers: await roster(sql, room),
		signals: rows.map((r) => ({
			id: Number(r.id),
			from: r.from_peer,
			kind: r.kind,
			payload: typeof r.payload === "string" ? JSON.parse(r.payload) : r.payload
		}))
	});
}
async function handlePost$1(request) {
	let body;
	try {
		body = await request.json();
	} catch {
		return json$1({ error: "invalid JSON" }, 400);
	}
	const parsed = postSchema.safeParse(body);
	if (!parsed.success) return json$1({ error: "invalid request" }, 400);
	const msg = parsed.data;
	const sql = await getSql();
	await ensureSchema(sql);
	if (msg.op === "signal") await sql.query(`INSERT INTO webrtc_signals (room, to_peer, from_peer, kind, payload)
       VALUES ($1, $2, $3, $4, $5::jsonb)`, [
		msg.room,
		msg.to,
		msg.from,
		msg.kind,
		JSON.stringify(msg.payload)
	]);
	else await sql.query(`DELETE FROM webrtc_peers WHERE room = $1 AND peer_id = $2`, [msg.room, msg.peer]);
	return json$1({ ok: true });
}
/** Request entrypoint for the /api/rtc route (GET poll, POST signal/leave). */
async function handleSignaling(request) {
	try {
		if (request.method === "GET") return await handleGet$1(new URL(request.url));
		if (request.method === "POST") return await handlePost$1(request);
		return json$1({ error: "method not allowed" }, 405);
	} catch (error) {
		console.error("[rtc] signaling error:", error instanceof Error ? error.message : "unknown");
		return json$1({ error: "signaling failed" }, 500);
	}
}
var handle$1 = ({ request }) => handleSignaling(request);
var Route$2 = createFileRoute("/api/rtc")({ server: { handlers: {
	GET: handle$1,
	POST: handle$1
} } });
/**
* Transfer metadata only: names, sizes, types, optional nickname, expiry.
* File contents are never accepted here.
*/
var ID_RE = /^[a-z0-9]{4}-[a-z0-9]{4}$/;
var TOKEN_RE = /^[a-f0-9]{32}$/;
var PEER_RE = /^s[a-z0-9]{8,24}$/;
var EXPIRY = /* @__PURE__ */ new Set([
	900,
	3600,
	14400,
	86400
]);
var MAX_FILES = 30;
var MAX_FILE_BYTES = 8589934592;
var CREATE_LIMIT_PER_MINUTE = 80;
function json(body, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"content-type": "application/json",
			"cache-control": "no-store"
		}
	});
}
function cleanLabel(value, max) {
	if (typeof value !== "string") return "";
	return value.replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, max);
}
function cleanFileName(value) {
	if (typeof value !== "string") return "";
	return (value.split(/[/\\]/).pop() ?? "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 180);
}
function asIso(value) {
	if (value instanceof Date) return value.toISOString();
	const date = new Date(String(value));
	return Number.isNaN(date.getTime()) ? (/* @__PURE__ */ new Date(0)).toISOString() : date.toISOString();
}
function asFiles(value) {
	const raw = typeof value === "string" ? JSON.parse(value) : value;
	if (!Array.isArray(raw)) return [];
	const files = [];
	for (const item of raw) {
		if (!item || typeof item !== "object") continue;
		const row = item;
		const name = cleanFileName(row.name);
		const size = Number(row.size);
		const type = cleanLabel(row.type, 120) || "application/octet-stream";
		if (!name || !Number.isFinite(size) || size < 0) continue;
		files.push({
			name,
			size,
			type
		});
	}
	return files;
}
function parseFiles(value) {
	if (!Array.isArray(value) || value.length < 1 || value.length > MAX_FILES) return null;
	const files = [];
	for (const item of value) {
		if (!item || typeof item !== "object") return null;
		const row = item;
		const name = cleanFileName(row.name);
		const size = row.size;
		const type = cleanLabel(row.type, 120) || "application/octet-stream";
		if (!name) return null;
		if (typeof size !== "number" || !Number.isSafeInteger(size) || size < 0 || size > MAX_FILE_BYTES) return null;
		files.push({
			name,
			size,
			type
		});
	}
	return files;
}
async function handleTransfers(request) {
	try {
		if (request.method === "GET") return await handleGet(new URL(request.url));
		if (request.method === "POST") return await handlePost(request);
		return json({ error: "method not allowed" }, 405);
	} catch (error) {
		console.error("[transfers] error:", error instanceof Error ? error.message : "unknown");
		return json({ error: "transfer request failed" }, 500);
	}
}
async function handleGet(url) {
	const id = url.searchParams.get("id") ?? "";
	if (!ID_RE.test(id)) return json({ error: "invalid id" }, 400);
	const row = (await (await getSql()).query(`SELECT id, sender_name, files, expires_at, cancelled
     FROM file_transfers WHERE id = $1`, [id]))[0];
	if (!row) return json({ error: "not found" }, 404);
	const expiresAt = asIso(row.expires_at);
	return json({
		id: row.id,
		senderName: row.sender_name,
		files: asFiles(row.files),
		expiresAt,
		cancelled: Boolean(row.cancelled),
		expired: new Date(expiresAt).getTime() <= Date.now()
	});
}
async function handlePost(request) {
	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: "invalid JSON" }, 400);
	}
	if (!body || typeof body !== "object") return json({ error: "invalid request" }, 400);
	const msg = body;
	if (msg.op === "cancel") return cancel(msg);
	if (msg.op === "create") return create(msg);
	return json({ error: "invalid request" }, 400);
}
async function create(msg) {
	const id = typeof msg.id === "string" ? msg.id : "";
	const token = typeof msg.token === "string" ? msg.token : "";
	const senderPeer = typeof msg.senderPeer === "string" ? msg.senderPeer : "";
	const expiresIn = msg.expiresIn;
	const senderName = cleanLabel(msg.senderName, 40);
	const files = parseFiles(msg.files);
	if (!ID_RE.test(id) || !TOKEN_RE.test(token) || !PEER_RE.test(senderPeer)) return json({ error: "invalid transfer" }, 400);
	if (typeof expiresIn !== "number" || !EXPIRY.has(expiresIn) || !files) return json({ error: "invalid transfer" }, 400);
	const sql = await getSql();
	if (((await sql.query(`SELECT count(*)::int AS n FROM file_transfers
     WHERE created_at > now() - make_interval(secs => 60)`))[0]?.n ?? 0) >= CREATE_LIMIT_PER_MINUTE) return json({ error: "too many transfers, try again in a minute" }, 429);
	const inserted = await sql.query(`INSERT INTO file_transfers (id, sender_token, sender_peer, sender_name, files, expires_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, now() + make_interval(secs => $6))
     ON CONFLICT (id) DO NOTHING
     RETURNING expires_at`, [
		id,
		token,
		senderPeer,
		senderName,
		JSON.stringify(files),
		expiresIn
	]);
	if (!inserted[0]) return json({ error: "transfer id already used" }, 409);
	return json({
		id,
		expiresAt: asIso(inserted[0].expires_at)
	});
}
async function cancel(msg) {
	const id = typeof msg.id === "string" ? msg.id : "";
	const token = typeof msg.token === "string" ? msg.token : "";
	if (!ID_RE.test(id) || !TOKEN_RE.test(token)) return json({ error: "invalid transfer" }, 400);
	if (!(await (await getSql()).query(`UPDATE file_transfers SET cancelled = true
     WHERE id = $1 AND sender_token = $2
     RETURNING id`, [id, token]))[0]) return json({ error: "not found" }, 404);
	return json({ ok: true });
}
var handle = ({ request }) => handleTransfers(request);
var Route$1 = createFileRoute("/api/transfers")({ server: { handlers: {
	GET: handle,
	POST: handle
} } });
var $$splitComponentImporter = () => import("./t._code-B6I-IZnt.mjs");
var Route = createFileRoute("/t/$code")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var rootRouteChildren = {
	IndexRoute: Route$7.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$8
	}),
	AboutRoute: Route$6.update({
		id: "/about",
		path: "/about",
		getParentRoute: () => Route$8
	}),
	HelpRoute: Route$5.update({
		id: "/help",
		path: "/help",
		getParentRoute: () => Route$8
	}),
	HowItWorksRoute: Route$4.update({
		id: "/how-it-works",
		path: "/how-it-works",
		getParentRoute: () => Route$8
	}),
	PrivacyRoute: Route$3.update({
		id: "/privacy",
		path: "/privacy",
		getParentRoute: () => Route$8
	}),
	ApiRtcRoute: Route$2.update({
		id: "/api/rtc",
		path: "/api/rtc",
		getParentRoute: () => Route$8
	}),
	ApiTransfersRoute: Route$1.update({
		id: "/api/transfers",
		path: "/api/transfers",
		getParentRoute: () => Route$8
	}),
	TCodeRoute: Route.update({
		id: "/t/$code",
		path: "/t/$code",
		getParentRoute: () => Route$8
	})
};
var routeTree = Route$8._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		rewrite: previewPathRewrite(),
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { useTheme as a, themeById as i, Route as n, previewPathPrefix as o, THEMES as r, router_exports as t };
