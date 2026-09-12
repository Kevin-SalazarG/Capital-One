import { Suspense } from "react";
import { SessionBoundary } from "@/features/auth/session";
import { LoadingView } from "@/components/feedback";
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingView />}>
      <SessionBoundary>{children}</SessionBoundary>
    </Suspense>
  );
}
