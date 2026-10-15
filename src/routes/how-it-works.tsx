import { createFileRoute, Link } from "@tanstack/react-router";
import { Prose, Section } from "@/components/shell";

export const Route = createFileRoute("/how-it-works")({
  component: function HowItWorks() {
    return (
      <Prose
        title="How it works"
        lede="FileEmber is a meeting point, not a cloud drive. Your browser sends the file straight to your classmate's browser."
      >
        <Section title="Three steps">
          <p>1. Choose the files and, if you want, a class name. Pick how long the link should last.</p>
          <p>2. Share the link or let someone scan the QR code. The short room code is the first part of the link, easy to read aloud.</p>
          <p>3. They tap Download. The two browsers connect and the files move between them. Keep the sender's tab open until it finishes.</p>
        </Section>
        <Section title="What the server actually does">
          <p>
            A small signaling service introduces the two browsers. It stores the file names, sizes, types, the optional nickname, and the expiry — never the file itself. Once the browsers connect, the bytes travel on a WebRTC data channel and do not pass through FileEmber.
          </p>
          <p>
            Direct connections usually work on home Wi-Fi and many phone networks. Some school networks block them. When that happens the download stops with a clear error instead of pretending the file arrived. A relay (TURN) server can be added by whoever hosts FileEmber; it is not switched on unless they configure one.
          </p>
        </Section>
        <Section title="What it does not do">
          <p>It does not need an account. It does not keep a student database. It does not work offline, and it cannot stop someone who received a file from saving or forwarding it.</p>
          <p>
            Read the <Link to="/privacy" className="font-semibold text-accent-ink">privacy notes</Link> before sending anything sensitive.
          </p>
        </Section>
      </Prose>
    );
  },
});
