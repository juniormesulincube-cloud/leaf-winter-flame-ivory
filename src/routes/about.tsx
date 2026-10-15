import { createFileRoute } from "@tanstack/react-router";
import { Prose, Section } from "@/components/shell";
import { THEMES } from "@/lib/theme";

export const Route = createFileRoute("/about")({
  component: function About() {
    return (
      <Prose
        title="About FileEmber"
        lede="A small way to hand a worksheet, a slide deck, or a photo across the room without making anyone create an account."
      >
        <Section title="Made for class">
          <p>
            Email attachments bounce, shared drives want a login, and USB sticks get lost. FileEmber is the short version: pick the file, show the code, they have it. It was shaped for students and teachers who just need the file on the other device.
          </p>
        </Section>
        <Section title="The characters">
          <p>Each colour has its own guide. They share a cape and a gold buckle. Switching colour switches the character everywhere, including the mark next to the name.</p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {THEMES.map((item) => (
              <li key={item.id} className="rounded-2xl border border-border bg-card p-2 text-center">
                <img src={item.src} alt={item.alt} width={576} height={747} className="mx-auto h-24 w-auto object-contain" />
                <p className="mt-1 text-sm font-semibold text-fg">{item.mascot}</p>
                <p className="text-xs text-muted">{item.label}</p>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="The limit">
          <p>
            Peer-to-peer is fast when the network allows it, and honest when it doesn't. FileEmber won't tell you a file arrived if the two devices never connected, and it won't promise that a file, once received, stays private.
          </p>
        </Section>
      </Prose>
    );
  },
});
