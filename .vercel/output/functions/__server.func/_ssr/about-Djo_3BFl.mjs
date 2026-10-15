import { S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as THEMES } from "./router-imJL6fFZ.mjs";
import { n as Prose, r as Section } from "./shell-DWfeCawa.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/about-Djo_3BFl.js
var import_jsx_runtime = require_jsx_runtime();
var SplitComponent = function About() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Prose, {
		title: "About FileEmber",
		lede: "A small way to hand a worksheet, a slide deck, or a photo across the room without making anyone create an account.",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "Made for class",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Email attachments bounce, shared drives want a login, and USB sticks get lost. FileEmber is the short version: pick the file, show the code, they have it. It was shaped for students and teachers who just need the file on the other device." })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
				title: "The characters",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Each colour has its own guide. They share a cape and a gold buckle. Switching colour switches the character everywhere, including the mark next to the name." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "grid grid-cols-2 gap-3 sm:grid-cols-5",
					children: THEMES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-2xl border border-border bg-card p-2 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: item.src,
								alt: item.alt,
								width: 576,
								height: 747,
								className: "mx-auto h-24 w-auto object-contain"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm font-semibold text-fg",
								children: item.mascot
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted",
								children: item.label
							})
						]
					}, item.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "The limit",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Peer-to-peer is fast when the network allows it, and honest when it doesn't. FileEmber won't tell you a file arrived if the two devices never connected, and it won't promise that a file, once received, stays private." })
			})
		]
	});
};
//#endregion
export { SplitComponent as component };
