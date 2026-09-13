"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CompanyForm } from "@/features/settings/company-form";
import {
  PermissionGate,
  DemoNotice,
} from "@/features/workspace/permission-gate";
import { useWorkspace } from "@/features/workspace/workspace";
import { useCommand } from "@/features/workspace/use-command";
import { apiRequest } from "@/lib/api/client";
import { acknowledgmentSchema } from "@/lib/api/contracts";
import { companyPayload, type CompanyFormValues } from "@/lib/form-schemas";
import { errorMessage } from "@/lib/api/errors";

export function CompanyPage() {
  return (
    <PermissionGate permission="organization:read">
      <CompanyContent />
    </PermissionGate>
  );
}
function CompanyContent() {
  const { organization, can, isDemo } = useWorkspace();
  const client = useQueryClient();
  const mutation = useCommand(async (values: CompanyFormValues) => {
    await apiRequest(
      `/organizations/${organization.id}`,
      acknowledgmentSchema,
      { method: "PATCH", body: companyPayload(values) },
    );
    await client.invalidateQueries({ queryKey: ["session"] });
  }, "Empresa actualizada. Genera otra proyección si cambiaste la reserva.");
  return (
    <>
      <h2 className="mb-6 text-xl font-semibold">Datos de tu empresa</h2>
      <DemoNotice />
      <CompanyForm
        values={{
          name: organization.name,
          legalName: organization.legalName ?? "",
          rfc: organization.rfc ?? "",
          currency: organization.currency,
          timeZone: organization.timeZone,
          minimumCashReserve: organization.minimumCashReserve,
          dailyOperatingExpense: organization.dailyOperatingExpense ?? "0.00",
        }}
        readOnly={isDemo || !can("organization:update")}
        pending={mutation.isPending}
        onSave={async (values) => {
          try {
            await mutation.mutateAsync(values);
            return true;
          } catch {
            return false;
          }
        }}
        error={mutation.isError ? errorMessage(mutation.error) : undefined}
      />
    </>
  );
}
