import { Suspense } from "react";
import { LoadingView } from "@/components/feedback";
import { InvoicesPage } from "@/features/invoices/invoices-page";

export const metadata = { title: "Facturas" };
export default function Page() {
  return (
    <Suspense fallback={<LoadingView />}>
      <InvoicesPage />
    </Suspense>
  );
}
