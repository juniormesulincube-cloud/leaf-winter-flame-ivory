import { S as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as Moon, r as Sun } from "../_libs/lucide-react.mjs";
import { a as useTheme, i as themeById, r as THEMES } from "./router-imJL6fFZ.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/shell-DWfeCawa.js
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function Mascot({ className, decorative = false }) {
	const { theme } = useTheme();
	const info = themeById(theme);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: info.src,
		alt: decorative ? "" : info.alt,
		width: 576,
		height: 747,
		draggable: false,
		className: cn("pointer-events-none object-contain object-bottom select-none", className)
	});
}
var NAV = [
	{
		to: "/",
		hash: "how",
		label: "How it works"
	},
	{
		to: "/privacy",
		hash: void 0,
		label: "Privacy"
	},
	{
		to: "/help",
		hash: void 0,
		label: "Help"
	}
];
function Wordmark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: "/",
		className: "inline-flex items-center gap-2 rounded-lg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block h-10 w-8",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mascot, {
				decorative: true,
				className: "h-full w-full"
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "font-display text-lg font-bold tracking-tight text-fg",
			children: ["File", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-accent-ink",
				children: "Ember"
			})]
		})]
	});
}
function Shell({ children, width = "wide" }) {
	const { theme, mode, setTheme, toggleMode } = useTheme();
	const current = themeById(theme);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: "#content",
				className: "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2",
				children: "Skip to content"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-4 sm:px-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wordmark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-x-2 gap-y-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "flex items-center",
						"aria-label": "Primary",
						children: NAV.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: item.to,
							hash: item.hash,
							className: "inline-flex min-h-11 items-center rounded-lg px-2.5 text-sm text-muted hover:text-fg",
							children: item.label
						}, item.label))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "pr-1 text-sm text-muted",
								children: ["Colour: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-fg",
									children: current.label
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex items-center",
								role: "group",
								"aria-label": "Colour theme",
								children: THEMES.map((item) => {
									const selected = item.id === theme;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-pressed": selected,
										"aria-label": `Use ${item.label} colours`,
										onClick: () => setTheme(item.id),
										className: cn("flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-150 ease-out active:not-disabled:scale-[0.96]", selected && "ring-2 ring-fg ring-offset-2 ring-offset-bg"),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("h-5 w-5 rounded-full ring-1 ring-fg/20", item.swatch) })
									}, item.id);
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: toggleMode,
								"aria-label": mode === "dark" ? "Switch to light mode" : "Switch to dark mode",
								className: "flex h-11 w-11 items-center justify-center rounded-full text-fg transition-transform duration-150 ease-out hover:bg-card active:not-disabled:scale-[0.96]",
								children: mode === "dark" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "size-5" })
							})
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				id: "content",
				className: cn("mx-auto w-full flex-1 px-4 pb-16 sm:px-6", width === "wide" ? "max-w-6xl" : "max-w-lg"),
				children
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
				className: "mt-auto border-t border-border",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 sm:px-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wordmark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
						className: "flex flex-wrap items-center",
						"aria-label": "Footer",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/",
								hash: "how",
								className: "inline-flex min-h-11 items-center px-2.5 text-sm text-muted hover:text-fg",
								children: "How it works"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/privacy",
								className: "inline-flex min-h-11 items-center px-2.5 text-sm text-muted hover:text-fg",
								children: "Privacy"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/help",
								className: "inline-flex min-h-11 items-center px-2.5 text-sm text-muted hover:text-fg",
								children: "Help"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/about",
								className: "inline-flex min-h-11 items-center px-2.5 text-sm text-muted hover:text-fg",
								children: "About FileEmber"
							})
						]
					})]
				})
			})
		]
	});
}
function Prose({ title, lede, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "mx-auto max-w-3xl pt-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-4xl font-extrabold tracking-tight text-fg sm:text-5xl",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-lg text-muted",
				children: lede
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-10 space-y-10 text-base leading-relaxed text-fg",
				children
			})
		]
	}) });
}
function Section({ title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "space-y-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-2xl font-bold text-fg",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-3 text-muted",
			children
		})]
	});
}
//#endregion
export { cn as a, Shell as i, Prose as n, Section as r, Mascot as t };
