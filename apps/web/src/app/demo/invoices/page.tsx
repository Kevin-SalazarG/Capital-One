import { Suspense } from "react";
import { InvoicesSkeleton } from "@/components/page-skeletons";
import { InvoicesPage } from "@/features/invoices/invoices-page";

export const metadata = { title: "Facturas" };
export default function Page() {
  return (
    <Suspense fallback={<InvoicesSkeleton />}>
      <InvoicesPage />
    </Suspense>
  );
}
