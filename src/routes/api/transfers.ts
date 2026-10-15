import { createFileRoute } from "@tanstack/react-router";
import { handleTransfers } from "@/lib/transfers/transfers.server";

const handle = ({ request }: { request: Request }) => handleTransfers(request);

export const Route = createFileRoute("/api/transfers")({
  server: { handlers: { GET: handle, POST: handle } },
});
