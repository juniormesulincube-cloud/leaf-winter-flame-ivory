import { createFileRoute } from "@tanstack/react-router";
import { TransferScreen } from "@/components/transfer-screen";

export const Route = createFileRoute("/t/$code")({
  component: function TransferRoute() {
    const { code } = Route.useParams();
    return <TransferScreen code={code} />;
  },
});
