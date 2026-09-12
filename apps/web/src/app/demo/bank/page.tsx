import { Suspense } from "react";
import { LoadingView } from "@/components/feedback";
import { BankPage } from "@/features/bank/bank-page";

export const metadata = { title: "Banco" };
export default function Page() {
  return (
    <Suspense fallback={<LoadingView />}>
      <BankPage />
    </Suspense>
  );
}
