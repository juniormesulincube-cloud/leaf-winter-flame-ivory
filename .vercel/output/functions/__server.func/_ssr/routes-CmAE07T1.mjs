import { o as __toESM } from "../_runtime.mjs";
import { J as require_react, S as require_jsx_runtime, b as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Plus, i as Shield, s as FileText, t as X, u as ArrowRight } from "../_libs/lucide-react.mjs";
import { a as useTheme, i as themeById } from "./router-imJL6fFZ.mjs";
import { a as cn, i as Shell, t as Mascot } from "./shell-DWfeCawa.mjs";
import { c as holdSender, d as makeTransferId, i as formatBytes, l as makePeerId, n as fileKind, t as apiUrl, u as makeToken } from "./ids-CO0XehTu.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CmAE07T1.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var EXPIRY_OPTIONS = [
	{
		seconds: 900,
		label: "15 minutes"
	},
	{
		seconds: 3600,
		label: "1 hour"
	},
	{
		seconds: 14400,
		label: "4 hours"
	},
	{
		seconds: 86400,
		label: "24 hours"
	}
];
var MAX_FILES = 30;
function HomeScreen() {
	const navigate = useNavigate();
	const { theme } = useTheme();
	const mascot = themeById(theme);
	const inputRef = (0, import_react.useRef)(null);
	const [files, setFiles] = (0, import_react.useState)([]);
	const [name, setName] = (0, import_react.useState)("");
	const [expiresIn, setExpiresIn] = (0, import_react.useState)(3600);
	const [dragging, setDragging] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const prevent = (event) => event.preventDefault();
		window.addEventListener("dragover", prevent);
		window.addEventListener("drop", prevent);
		return () => {
			window.removeEventListener("dragover", prevent);
			window.removeEventListener("drop", prevent);
		};
	}, []);
	function addFiles(list) {
		const incoming = [...list];
		if (!incoming.length) return;
		setFiles((current) => {
			const next = [...current, ...incoming].slice(0, MAX_FILES);
			if (current.length + incoming.length > MAX_FILES) setError(`You can send up to ${MAX_FILES} files in one transfer.`);
			else setError(null);
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
				type: file.type || "application/octet-stream"
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
						files: meta
					})
				});
				if (res.status === 409) continue;
				const body = await res.json().catch(() => ({}));
				if (!res.ok || !body.expiresAt) throw new Error(body.error || "Couldn't create the transfer. Try again.");
				holdSender(id, {
					token,
					peerId,
					senderName: name.trim(),
					expiresAt: body.expiresAt,
					files,
					meta
				});
				await navigate({
					to: "/t/$code",
					params: { code: id }
				});
				return;
			}
			throw new Error("Couldn't reserve a link. Try again.");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Couldn't create the transfer.");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid items-start gap-8 lg:grid-cols-2 lg:gap-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "pt-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "inline-flex rounded-full border border-border bg-card px-3 py-1 text-sm text-muted",
					children: "Share. Send. Done."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-5 max-w-xl text-4xl font-extrabold tracking-tight text-fg sm:text-6xl",
					children: "Send files. Not headaches."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 max-w-md text-base text-muted sm:text-lg",
					children: "Pick a file, share the link or a QR code, and your classmate downloads it straight from your browser. No account needed."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					onDragEnter: (event) => {
						event.preventDefault();
						setDragging(true);
					},
					onDragOver: (event) => {
						event.preventDefault();
						setDragging(true);
					},
					onDragLeave: () => setDragging(false),
					onDrop: (event) => {
						event.preventDefault();
						setDragging(false);
						if (event.dataTransfer.files.length) addFiles(event.dataTransfer.files);
					},
					className: cn("mt-8 rounded-3xl border border-dashed border-border bg-card p-4 transition-colors sm:p-5", dragging && "border-accent bg-raised"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col items-start gap-4 sm:flex-row sm:items-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mascot-breathe h-36 w-28 shrink-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mascot, { className: "h-full w-full" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm font-semibold text-accent-ink",
									children: [
										"Hi, I'm ",
										mascot.mascot,
										"!"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mt-1 text-2xl font-bold text-fg",
									children: "Drop your files here"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted",
									children: "Documents, PDFs, slides, images, video, audio and ZIPs. Anything your browser can open."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => inputRef.current?.click(),
									className: "mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-on-accent transition-transform duration-150 ease-out active:scale-[0.96]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
										className: "size-4",
										"aria-hidden": "true"
									}), "Choose files"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									ref: inputRef,
									type: "file",
									multiple: true,
									className: "sr-only",
									onChange: (event) => {
										if (event.target.files) addFiles(event.target.files);
										event.target.value = "";
									}
								})
							]
						})]
					})
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "rounded-3xl border border-border bg-card p-5 sm:p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-baseline justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg font-bold text-fg",
						children: "Ready to send"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm tabular-nums text-muted",
						children: files.length ? `${files.length} ${files.length === 1 ? "file" : "files"} · ${formatBytes(total)}` : "No files yet"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 space-y-2",
					children: files.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted",
						children: "Files you pick show up here. Nothing is uploaded until a classmate connects."
					}) : files.map((file, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-3 rounded-2xl border border-border bg-bg px-3 py-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex size-10 shrink-0 items-center justify-center rounded-xl bg-raised text-accent-ink",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, {
									className: "size-5",
									"aria-hidden": "true"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate text-sm font-medium text-fg",
									title: file.name,
									children: file.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "block text-xs text-muted",
									children: [
										fileKind(file.name, file.type),
										" · ",
										formatBytes(file.size)
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": `Remove ${file.name}`,
								onClick: () => setFiles((current) => current.filter((_, i) => i !== index)),
								className: "flex size-11 shrink-0 items-center justify-center rounded-xl text-muted hover:text-fg",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
							})
						]
					}, `${file.name}-${file.size}-${index}`))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 grid gap-3 sm:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-sm text-muted",
						children: ["Your name (optional)", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: name,
							onChange: (event) => setName(event.target.value.slice(0, 40)),
							placeholder: "e.g. Class 4B",
							maxLength: 40,
							className: "mt-1 h-11 w-full rounded-xl border border-border bg-raised px-3 text-fg outline-none placeholder:text-muted"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-sm text-muted",
						children: ["Link expires after", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							value: expiresIn,
							onChange: (event) => setExpiresIn(Number(event.target.value)),
							className: "mt-1 h-11 w-full rounded-xl border border-border bg-raised px-3 text-fg outline-none",
							children: EXPIRY_OPTIONS.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: option.seconds,
								children: option.label
							}, option.seconds))
						})]
					})]
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-accent-ink",
					role: "alert",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					disabled: !files.length || busy,
					onClick: () => void createTransfer(),
					className: "mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent text-base font-semibold text-on-accent transition-transform duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50 active:not-disabled:scale-[0.96]",
					children: [busy ? "Creating transfer…" : "Create transfer", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
						className: "size-4",
						"aria-hidden": "true"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 flex gap-2 text-sm text-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, {
						className: "mt-0.5 size-4 shrink-0",
						"aria-hidden": "true"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Sharing marks or student records? Only send them to people who should see them. Keep this tab open while the transfer runs." })]
				})
			]
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "how",
		className: "scroll-mt-8 pt-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-3xl font-bold text-fg",
				children: "How it works"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "mt-6 grid gap-4 md:grid-cols-3",
				children: [
					["Choose files", "Pick them or drag them in. Add as many as you like to one transfer."],
					["Share the link", "Send the link, or let a friend scan the QR code. Nobody needs an account."],
					["They download", "Their browser connects to yours and the files travel between the two devices."]
				].map(([title, body], index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-3xl border border-border bg-card p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex size-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-on-accent",
							children: index + 1
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mt-4 text-lg font-bold text-fg",
							children: title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-relaxed text-muted",
							children: body
						})
					]
				}, title))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex gap-3 rounded-3xl border border-border bg-card p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, {
					className: "mt-0.5 size-5 shrink-0 text-accent-ink",
					"aria-hidden": "true"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-bold text-fg",
					children: "Your files don't pass through our server"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm leading-relaxed text-muted",
					children: "A small signaling server only helps two browsers find each other. On strict school networks a direct connection can fail unless a relay server is set up. Sending peer to peer can't stop a recipient from saving or sharing what they download."
				})] })]
			})
		]
	})] });
}
var SplitComponent = HomeScreen;
//#endregion
export { SplitComponent as component };
