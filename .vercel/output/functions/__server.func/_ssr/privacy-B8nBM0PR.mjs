import { S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as Prose, r as Section } from "./shell-DWfeCawa.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/privacy-B8nBM0PR.js
var import_jsx_runtime = require_jsx_runtime();
var SplitComponent = function Privacy() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Prose, {
		title: "Privacy",
		lede: "FileEmber is built so the file itself stays between the two people sharing it. A few small details have to pass through the server so the browsers can find each other.",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
				title: "Stored until the link expires",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "The transfer id, an optional nickname (like \"Class 4B\"), each file's name, size and type, when the link expires, and whether the sender cancelled it." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Anyone with the link can see that list. The link is unguessable. Don't post it somewhere public if the file names themselves are sensitive." })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "Not stored",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "File contents, accounts, email addresses, and a history of who downloaded what. The signaling notes that help the browsers connect are deleted within about a minute. Expired transfers are removed the day after they end." })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "What the other person can learn",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "WebRTC shows each browser the other's network address while the transfer is running. That is how a direct connection works. FileEmber does not add an account on top of it, and it cannot prevent the recipient from saving the file." })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "School work",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Don't use a transfer for passwords, medical notes, or a full gradebook unless you trust the person on the other side and you trust the network you're on. Close the sender tab when you're done, or cancel the link." })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "Your colour theme",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "The colour and light or dark mode stay on this device only. They are not sent to the server. The QR code stays black on white so it still scans." })
			})
		]
	});
};
//#endregion
export { SplitComponent as component };
