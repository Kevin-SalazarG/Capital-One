import { LiveWorkspace } from "@/features/workspace/workspace";
export default async function OrganizationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  return (
    <LiveWorkspace organizationId={organizationId}>{children}</LiveWorkspace>
  );
}
