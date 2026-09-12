import { Suspense } from "react";
import { LoadingView } from "@/components/feedback";
import { OnboardingPage } from "@/features/onboarding/onboarding-page";

export const metadata = { title: "Primeros pasos" };
export default function Page() {
  return (
    <Suspense fallback={<LoadingView />}>
      <OnboardingPage />
    </Suspense>
  );
}
