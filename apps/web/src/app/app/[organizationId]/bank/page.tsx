import { Suspense } from "react";
import { BankSkeleton } from "@/components/page-skeletons";
import { BankPage } from "@/features/bank/bank-page";

export const metadata = { title: "Banco" };
export default function Page() {
  return (
    <Suspense fallback={<BankSkeleton />}>
      <BankPage />
    </Suspense>
  );
}
