import { Suspense } from "react";
import { LoadingView } from "@/components/feedback";
import { HelpPage } from "@/features/help/help-page";

export const metadata = { title: "Cómo funciona" };
export default function Page() {
  return (
    <Suspense fallback={<LoadingView />}>
      <HelpPage />
    </Suspense>
  );
}
