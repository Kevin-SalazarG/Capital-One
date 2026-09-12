import { Suspense } from "react";
import { LoadingView } from "@/components/feedback";
import { TeamPage } from "@/features/settings/team-page";

export const metadata = { title: "Equipo" };
export default function Page() {
  return (
    <Suspense fallback={<LoadingView />}>
      <TeamPage />
    </Suspense>
  );
}
