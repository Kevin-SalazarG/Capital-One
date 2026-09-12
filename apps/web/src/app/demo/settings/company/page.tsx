import { Suspense } from "react";
import { LoadingView } from "@/components/feedback";
import { CompanyPage } from "@/features/settings/company-page";

export const metadata = { title: "Empresa" };
export default function Page() {
  return (
    <Suspense fallback={<LoadingView />}>
      <CompanyPage />
    </Suspense>
  );
}
