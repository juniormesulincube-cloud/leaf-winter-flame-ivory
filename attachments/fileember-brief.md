# PROJECT: FILEEMBER — INSTANT SCHOOL FILE SHARING

Act as a senior full-stack developer, UI/UX designer, and networking engineer. Build a complete, functional, lightweight peer-to-peer file-sharing web application inspired by FilePizza, customized for a school environment.

## 1. Main goal

Create a website that allows students and teachers to transfer files directly between devices as quickly and simply as possible.

The core experience must be:

**Choose file → Create transfer → Share link or QR code → Recipient downloads file.**

Prioritize speed, simplicity, low data consumption, mobile compatibility, and a polished interface.

## 2. Design and branding

Product name: FileEmber

Tagline: "Share. Send. Done."

Mascots: every colour theme has its own character. They are small elemental creatures that share a look: a big head made of the theme's element, round pale eyes, a short cape, and a belt with a gold buckle. Always use the artwork as supplied (transparent background, 576 x 747 canvas, same proportions). Do not recolor, distort, or mix characters between themes.

| Theme | Character | Look |
|---|---|---|
| Ember orange (default) | Ember | Flame head, red cape. This is the supplied artwork, used as-is (transparent PNG). |
| Ocean blue | Drip | Water-drop head with a highlight and two bubbles, blue cape. |
| Forest green | Sprout | Leafy bush head with a seedling on top, brown cape. |
| Violet | Prism | Faceted amethyst crystal head with two sparkles, indigo cape. |
| Rose pink | Petal | Pink blossom head with a lighter face, berry cape. |

Drip, Sprout, Prism, and Petal are first-draft vector illustrations (SVG) made to match Ember. Replace them with finished artwork in Ember's style if wanted, keeping the same canvas size and one file per theme (for example mascot-ember.png, mascot-ocean.svg).

When the student switches colour, the mascot changes to that theme's character everywhere it appears. Use the same position and size for every character so nothing on the page jumps, and preload all five images so the swap is instant. Show the character's name in the greeting above the upload zone (for example "Hi, I'm Drip!") and in the image description.

Mascot usage:
- The logo mark next to the "FileEmber" wordmark (the current theme's character), with "Ember" set in the theme's accent colour. The wordmark itself never changes.
- The upload zone ("Drop your files here"), as a friendly guide.
- The "Transfer ready" screen, waiting beside the link.
- The recipient's progress screen, inside a circular progress ring that fills as the transfer advances.
- Friendly empty, waiting, and error states.
- Keep animation minimal and respect reduced-motion settings. Give the mascot useful alt text where it carries meaning, and an empty alt where it is decorative.

Design style:
- Modern, clean, minimal interface.
- Apple-inspired glass effects used subtly.
- Smooth animations and responsive interactions.
- Light and dark modes, combined with the colour themes below. Dark is the primary design; light modes use a pale tinted background with dark text and the theme's accent.
- Colour themes students can choose from (see "Colour themes" below). The default is "Ember orange", which matches the mascot.
- Typography: Bricolage Grotesque for headings and Figtree for body text.
- Large buttons (at least 44px touch targets), clear progress indicators, and readable typography.
- No clutter, excessive gradients, or unnecessary dashboards.

The homepage should immediately show the upload area without requiring users to scroll.

### Colour themes

Students can pick their own colour. Offer a row of colour swatches in the header, shown on every page, with the current theme's name next to it (for example "Colour: Ocean blue"). The swatches must be real buttons, at least 44px to tap, with a visible selected state that does not rely on colour alone (a ring plus the name), and an accessible label such as "Use Ocean blue colours".

Remember each student's choice on their own device (localStorage), apply it before the first paint so the page never flashes the wrong colour, and fall back to Ember orange if nothing is stored. The choice is personal to each browser and is not sent to the signaling server. The QR code always stays black on white so it scans reliably.

Build the themes as a small set of design tokens (CSS variables), so adding a theme later means adding one block of values. Dark palettes:

| Theme | Background | Card | Raised card | Border | Text | Muted text | Accent (buttons, progress) | Highlight | Text on accent |
|---|---|---|---|---|---|---|---|---|---|
| Ember orange (default) | #140E0D | #1F1613 | #2A1D18 | #3B2A23 | #FFF3E6 | #BCA697 | #FFA928 | #FFC94A | #1A0E08 |
| Ocean blue | #0B1220 | #121C30 | #1A2842 | #2A3B5C | #EAF2FF | #A9B8D4 | #4C9BFF | #8CC2FF | #07101F |
| Forest green | #0C1511 | #14201A | #1C2D24 | #2B4337 | #EAFBF1 | #A8C0B3 | #46D68C | #9BF0C0 | #06140C |
| Violet | #120D1C | #1C1430 | #281C42 | #3B2B5E | #F3EEFF | #BDB0DA | #A78BFA | #D0BFFF | #130A26 |
| Rose pink | #1A0D13 | #261520 | #351C2B | #4D2A3D | #FFEEF4 | #D8B0C2 | #FF6FA5 | #FFA8C9 | #1F0510 |

Every theme needs a light version as well: a pale tinted background, dark text, and the same accent colour (darkened if needed). Check that body text meets at least 4.5:1 contrast and large text at least 3:1 in every theme, in both light and dark mode, and that text on the accent colour stays readable.

## 3. Core features

### A. Send files
- Allow users to select files or drag and drop them.
- Support documents, PDFs, presentations, images, videos, audio, ZIP archives, and other browser-supported file types.
- Display file name, size, and type before sharing.
- Support multiple files in one transfer.
- Generate a unique transfer link and a QR code.
- Provide a one-click copy-link button.
- Show transfer progress, speed when measurable, and estimated time remaining when reliable.
- Provide a cancel-transfer button.

### B. Receive files
- Allow recipients to open a shared link without creating an account.
- Display the sender's chosen display name, file names, total size, and file count.
- Let recipients download the files with a clear download button.
- Display waiting, connecting, transferring, completed, and failed states.
- Provide useful retry instructions if a connection fails.

### C. Real peer-to-peer transfers
Use WebRTC DataChannels for direct browser-to-browser file transfers whenever possible.

Use a lightweight signaling server, such as Node.js with WebSockets, to establish connections between the sender and recipient.

Important:
- Do not upload the entire file to the signaling server.
- The signaling server should exchange connection information only.
- Implement STUN configuration and support TURN servers for networks where direct connections fail.
- Clearly explain that large transfers may fail if both devices cannot establish a compatible connection.
- Keep the sender's browser open during transfers.
- Do not claim that transfers work offline or that every connection will be direct.

### D. School-friendly experience
- No mandatory registration or login.
- No student database required for the basic version.
- Optional sender nickname.
- Simple room codes for identifying transfers.
- Optional transfer expiry.
- Clear privacy information explaining that the signaling server coordinates connections but should not store file contents.
- Display a warning before users share sensitive school documents.

### E. Fast and data-efficient
- Keep the initial website bundle small.
- Avoid unnecessary libraries and large background videos.
- Split large files into manageable chunks for WebRTC transmission.
- Apply backpressure handling to prevent browser memory overload.
- Support large-file streaming where browser APIs permit.
- Show clear connection and transfer status.
- Avoid automatically compressing files or reducing their quality.
- Provide graceful error handling for interrupted transfers.

### F. QR code sharing
Generate a QR code containing the transfer URL so another student can scan it with a phone.

Include a copy-link option for devices that cannot scan QR codes.

### G. Interface layout

Homepage:
1. FileEmber logo (mascot mark and wordmark).
2. Short heading: "Send files. Not headaches."
3. Drag-and-drop upload zone with the mascot.
4. "Choose files" button.
5. Selected file list.
6. "Create transfer" button.
7. Transfer link and QR code after connection setup.
8. A small explanation of how it works.
9. The colour picker in the header (also on the transfer page).

Transfer page:
1. Transfer status.
2. Sender nickname.
3. File list and total size.
4. Connection status.
5. Download button for recipients.
6. Progress bar (and the mascot progress ring on the recipient's phone), transfer speed, and remaining-time estimate when available.
7. Cancel and retry actions.

Footer:
- How it works.
- Privacy.
- Help.
- About FileEmber.

## 4. Technical stack

Use:
- React and TypeScript.
- Vite.
- Tailwind CSS.
- Lucide icons.
- Framer Motion or a lightweight alternative for animations.
- WebRTC DataChannels for peer-to-peer file transmission.
- Node.js and WebSockets for signaling.
- A small QR code generation library.

Keep the architecture simple and easy to maintain.

## 5. Security and reliability

- Validate file metadata and connection messages.
- Use HTTPS and secure WebSocket connections in production.
- Do not execute or preview downloaded files automatically.
- Sanitize user-provided display names.
- Generate unpredictable transfer identifiers.
- Add rate limits and basic abuse protection to the signaling service.
- Do not log file contents or unnecessary personal information.
- Make it clear that peer-to-peer transfer does not guarantee that the receiver cannot save or redistribute a file.
- Handle disconnections, timeouts, browser refreshes, and expired transfers gracefully.

## 6. Important deployment requirements

Do not build a fake demo where the share link only works on the same screen.

Implement actual sender-to-recipient transfers between separate browsers and devices.

Ensure the signaling service works across different networks when possible, with appropriate TURN infrastructure for restrictive networks.

If a production TURN server or other service credentials are unavailable, explain what remains to be configured instead of pretending it is operational.

Test:
- Two different browser sessions.
- A laptop sending to a phone.
- Multiple files.
- Connection failures.
- Large-file transfers.
- Link expiration.
- Mobile responsiveness.

## 7. Final deliverable

Deliver a working, responsive school file-sharing website with a clean interface, genuine WebRTC transfers, setup instructions, deployment instructions, and clear documentation.

Build the functional MVP first. Prioritize reliable file transfers over decorative animations or unnecessary features.

The final product should feel as effortless as FilePizza, with FileEmber's own identity, led by Ember the mascot, and its school-focused experience.
