import { Suspense } from "react";
import { WorkspaceProvider } from "@/features/workspace/workspace";
import { DEMO_DATA, DEMO_ORGANIZATION } from "@/demo/fixtures";
import { LoadingView } from "@/components/feedback";
export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LoadingView />}>
      <WorkspaceProvider
        value={{
          organization: DEMO_ORGANIZATION,
          organizations: [DEMO_ORGANIZATION],
          email: "maria@example.com",
          userId: "example-user",
          basePath: "/demo",
          demoData: DEMO_DATA,
        }}
      >
        {children}
      </WorkspaceProvider>
    </Suspense>
  );
}
