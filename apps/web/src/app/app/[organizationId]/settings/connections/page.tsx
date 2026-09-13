import { Suspense } from "react";
import { ConnectionsSkeleton } from "@/components/page-skeletons";
import { ConnectionsPage } from "@/features/connections/connections-page";

export const metadata = { title: "Conexiones" };
export default function Page() {
  return (
    <Suspense fallback={<ConnectionsSkeleton />}>
      <ConnectionsPage />
    </Suspense>
  );
}
