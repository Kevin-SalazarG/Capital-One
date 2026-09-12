import { Suspense } from "react";
import { LoadingView } from "@/components/feedback";
import { ObligationsPage } from "@/features/settings/obligations-page";

export const metadata = { title: "Pagos recurrentes" };
export default function Page() {
  return (
    <Suspense fallback={<LoadingView />}>
      <ObligationsPage />
    </Suspense>
  );
}
