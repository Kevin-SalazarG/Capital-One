import { Suspense } from "react";
import { LoadingView } from "@/components/feedback";
import { InvoiceDetailPage } from "@/features/invoices/invoice-detail-page";

export const metadata = { title: "Detalle de factura" };

export default async function Page({
  params,
}: {
  params: Promise<{ organizationId: string; invoiceId: string }>;
}) {
  const { invoiceId } = await params;
  return (
    <Suspense fallback={<LoadingView />}>
      <InvoiceDetailPage invoiceId={invoiceId} />
    </Suspense>
  );
}
