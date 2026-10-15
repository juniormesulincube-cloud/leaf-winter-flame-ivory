import { S as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as Prose, r as Section } from "./shell-DWfeCawa.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/how-it-works-eO_juQR3.js
var import_jsx_runtime = require_jsx_runtime();
var SplitComponent = function HowItWorks() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Prose, {
		title: "How it works",
		lede: "FileEmber is a meeting point, not a cloud drive. Your browser sends the file straight to your classmate's browser.",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
				title: "Three steps",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "1. Choose the files and, if you want, a class name. Pick how long the link should last." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "2. Share the link or let someone scan the QR code. The short room code is the first part of the link, easy to read aloud." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "3. They tap Download. The two browsers connect and the files move between them. Keep the sender's tab open until it finishes." })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
				title: "What the server actually does",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "A small signaling service introduces the two browsers. It stores the file names, sizes, types, the optional nickname, and the expiry — never the file itself. Once the browsers connect, the bytes travel on a WebRTC data channel and do not pass through FileEmber." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Direct connections usually work on home Wi-Fi and many phone networks. Some school networks block them. When that happens the download stops with a clear error instead of pretending the file arrived. A relay (TURN) server can be added by whoever hosts FileEmber; it is not switched on unless they configure one." })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
				title: "What it does not do",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "It does not need an account. It does not keep a student database. It does not work offline, and it cannot stop someone who received a file from saving or forwarding it." }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					"Read the ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/privacy",
						className: "font-semibold text-accent-ink",
						children: "privacy notes"
					}),
					" before sending anything sensitive."
				] })]
			})
		]
	});
};
//#endregion
export { SplitComponent as component };
