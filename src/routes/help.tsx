import { createFileRoute } from "@tanstack/react-router";
import { Prose, Section } from "@/components/shell";

export const Route = createFileRoute("/help")({
  component: function Help() {
    return (
      <Prose
        title="Help"
        lede="Most transfers are: choose files, share the link, tap download, wait. This page is for when that doesn't happen."
      >
        <Section title="Sending">
          <p>Add files with the button or by dropping them on the dashed box. Give the transfer a name like your class if you want the other person to see who it's from. Create the transfer, then copy the link or show the QR code.</p>
          <p>Leave the tab open and in the foreground. If you reload it, the files are gone from memory and you'll need to start again. Cancel ends the link for everyone still waiting.</p>
        </Section>
        <Section title="Receiving">
          <p>Open the link or scan the code, check the file names, then tap Download. Keep the page open. When a file finishes, the browser saves it. If a download was blocked, use the Save link next to that file.</p>
          <p>Files are not opened or previewed automatically. Open them yourself after they land in your downloads folder.</p>
        </Section>
        <Section title="If it won't connect">
          <p>Ask the sender to confirm their tab is still open. Try the QR code if the link was copied wrong. Switch from school Wi-Fi to a phone hotspot, or the other way around — some school networks block direct browser connections.</p>
          <p>
            A relay server is not included unless the person hosting FileEmber set <span className="text-fg">VITE_TURN_URL</span>, and optionally a username and credential. Without that, two devices that both sit behind strict firewalls may never connect. The app will say so instead of hanging forever.
          </p>
        </Section>
        <Section title="Large files">
          <p>Files are sent in small pieces so the browser doesn't have to hold the whole upload at once on the sender's side. The receiver's browser keeps each file until it can save it, so very large videos can use a lot of memory. Plug in both devices and don't let the screens sleep.</p>
        </Section>
        <Section title="For the person hosting this">
          <p>FileEmber needs the hosted database for signaling only. Deploy over HTTPS — browsers refuse public WebRTC on plain HTTP. No accounts are required. To help strict networks, set a TURN URL in the app environment and restart. Don't point TURN credentials at a shared client if you can avoid it; they are visible to the browser because the connection is made there.</p>
        </Section>
      </Prose>
    );
  },
});
