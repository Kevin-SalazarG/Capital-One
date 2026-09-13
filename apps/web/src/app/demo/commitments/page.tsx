import { Suspense } from "react";
import { CommitmentsSkeleton } from "@/components/page-skeletons";
import { ObligationsPage } from "@/features/settings/obligations-page";
export const metadata = { title: "Compromisos · Demo" };
export default function Page() {
  return (
    <Suspense fallback={<CommitmentsSkeleton />}>
      <div className="page-container">
        <h1 className="page-title mb-7">Los pagos que sostienen tu obra.</h1>
        <ObligationsPage />
      </div>
    </Suspense>
  );
}
