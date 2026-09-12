import { Suspense } from "react";
import { LoadingView } from "@/components/feedback";
import { ConnectionsPage } from "@/features/connections/connections-page";

export const metadata = { title: "Conexiones" };
export default function Page() {
  return (
    <Suspense fallback={<LoadingView />}>
      <ConnectionsPage />
    </Suspense>
  );
}
