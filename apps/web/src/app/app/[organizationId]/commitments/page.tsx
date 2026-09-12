import { ObligationsPage } from "@/features/settings/obligations-page";
export const metadata = { title: "Compromisos" };
export default function Page() {
  return (
    <div className="page-container">
      <h1 className="page-title mb-7">Los pagos que importan.</h1>
      <ObligationsPage />
    </div>
  );
}
