import { Suspense } from "react";
import { CommitmentsSkeleton } from "@/components/page-skeletons";
import { ObligationsPage } from "@/features/settings/obligations-page";
export const metadata = { title: "Compromisos · Demo" };
export default function Page() {
  return (
    <Suspense fallback={<CommitmentsSkeleton />}>
      <div className="page-container dashboard-page commitments-page space-y-7 pb-14">
        <ObligationsPage />
      </div>
    </Suspense>
  );
}
