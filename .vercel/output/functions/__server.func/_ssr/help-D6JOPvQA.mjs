import { S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as Prose, r as Section } from "./shell-DWfeCawa.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/help-D6JOPvQA.js
var import_jsx_runtime = require_jsx_runtime();
var SplitComponent = function Help() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Prose, {
		title: "Help",
		lede: "Most transfers are: choose files, share the link, tap download, wait. This page is for when that doesn't happen.",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
				title: "Sending",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Add files with the button or by dropping them on the dashed box. Give the transfer a name like your class if you want the other person to see who it's from. Create the transfer, then copy the link or show the QR code." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Leave the tab open and in the foreground. If you reload it, the files are gone from memory and you'll need to start again. Cancel ends the link for everyone still waiting." })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
				title: "Receiving",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Open the link or scan the code, check the file names, then tap Download. Keep the page open. When a file finishes, the browser saves it. If a download was blocked, use the Save link next to that file." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Files are not opened or previewed automatically. Open them yourself after they land in your downloads folder." })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
				title: "If it won't connect",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Ask the sender to confirm their tab is still open. Try the QR code if the link was copied wrong. Switch from school Wi-Fi to a phone hotspot, or the other way around — some school networks block direct browser connections." }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					"A relay server is not included unless the person hosting FileEmber set ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-fg",
						children: "VITE_TURN_URL"
					}),
					", and optionally a username and credential. Without that, two devices that both sit behind strict firewalls may never connect. The app will say so instead of hanging forever."
				] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "Large files",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Files are sent in small pieces so the browser doesn't have to hold the whole upload at once on the sender's side. The receiver's browser keeps each file until it can save it, so very large videos can use a lot of memory. Plug in both devices and don't let the screens sleep." })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "For the person hosting this",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "FileEmber needs the hosted database for signaling only. Deploy over HTTPS — browsers refuse public WebRTC on plain HTTP. No accounts are required. To help strict networks, set a TURN URL in the app environment and restart. Don't point TURN credentials at a shared client if you can avoid it; they are visible to the browser because the connection is made there." })
			})
		]
	});
};
//#endregion
export { SplitComponent as component };
