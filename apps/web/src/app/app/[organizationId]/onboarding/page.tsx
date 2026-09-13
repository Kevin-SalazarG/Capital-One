import { Suspense } from "react";
import { OnboardingSkeleton } from "@/components/page-skeletons";
import { OnboardingPage } from "@/features/onboarding/onboarding-page";

export const metadata = { title: "Primeros pasos" };
export default function Page() {
  return (
    <Suspense fallback={<OnboardingSkeleton />}>
      <OnboardingPage />
    </Suspense>
  );
}
