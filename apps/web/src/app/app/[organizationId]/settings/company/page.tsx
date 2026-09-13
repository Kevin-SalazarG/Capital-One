import { Suspense } from "react";
import { CompanySkeleton } from "@/components/page-skeletons";
import { CompanyPage } from "@/features/settings/company-page";

export const metadata = { title: "Empresa" };
export default function Page() {
  return (
    <Suspense fallback={<CompanySkeleton />}>
      <CompanyPage />
    </Suspense>
  );
}
