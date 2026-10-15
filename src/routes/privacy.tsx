import { createFileRoute } from "@tanstack/react-router";
import { Prose, Section } from "@/components/shell";

export const Route = createFileRoute("/privacy")({
  component: function Privacy() {
    return (
      <Prose
        title="Privacy"
        lede="FileEmber is built so the file itself stays between the two people sharing it. A few small details have to pass through the server so the browsers can find each other."
      >
        <Section title="Stored until the link expires">
          <p>The transfer id, an optional nickname (like "Class 4B"), each file's name, size and type, when the link expires, and whether the sender cancelled it.</p>
          <p>Anyone with the link can see that list. The link is unguessable. Don't post it somewhere public if the file names themselves are sensitive.</p>
        </Section>
        <Section title="Not stored">
          <p>File contents, accounts, email addresses, and a history of who downloaded what. The signaling notes that help the browsers connect are deleted within about a minute. Expired transfers are removed the day after they end.</p>
        </Section>
        <Section title="What the other person can learn">
          <p>
            WebRTC shows each browser the other's network address while the transfer is running. That is how a direct connection works. FileEmber does not add an account on top of it, and it cannot prevent the recipient from saving the file.
          </p>
        </Section>
        <Section title="School work">
          <p>
            Don't use a transfer for passwords, medical notes, or a full gradebook unless you trust the person on the other side and you trust the network you're on. Close the sender tab when you're done, or cancel the link.
          </p>
        </Section>
        <Section title="Your colour theme">
          <p>The colour and light or dark mode stay on this device only. They are not sent to the server. The QR code stays black on white so it still scans.</p>
        </Section>
      </Prose>
    );
  },
});
