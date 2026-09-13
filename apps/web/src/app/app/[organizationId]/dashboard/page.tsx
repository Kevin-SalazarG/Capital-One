import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/page-skeletons";
import { TreasuryPage } from "@/features/dashboard/treasury-page";
export const metadata = { title: "Plan de caja" };
export default function Page() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <TreasuryPage />
    </Suspense>
  );
}
