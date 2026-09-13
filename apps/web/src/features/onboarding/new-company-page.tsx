"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Brand } from "@/components/brand";
import { PageHeader } from "@/components/page-header";
import { CompanyForm } from "@/features/settings/company-form";
import { useSession } from "@/features/auth/session";
import { apiRequest } from "@/lib/api/client";
import { organizationSchema } from "@/lib/api/contracts";
import { companyPayload, type CompanyFormValues } from "@/lib/form-schemas";
import { errorMessage } from "@/lib/api/errors";

export function NewCompanyPage() {
  const session = useSession();
  const router = useRouter();
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: (values: CompanyFormValues) =>
      apiRequest("/organizations", organizationSchema, {
        method: "POST",
        body: companyPayload(values),
      }),
    onSuccess: async (organization) => {
      await client.invalidateQueries({ queryKey: ["session"] });
      toast.success("Empresa creada");
      router.replace(`/app/${organization.id}/onboarding`);
    },
  });
  return (
    <main className="mx-auto min-h-dvh max-w-4xl px-5 py-8 md:px-10 md:py-12">
      <div className="mb-12 flex items-center justify-between gap-5">
        <Brand />
        {session.organizations.length > 0 && (
          <Link
            className="flex min-h-11 items-center text-sm text-primary underline-offset-4 hover:underline"
            href="/app"
          >
            Volver a mi empresa
          </Link>
        )}
      </div>
      <PageHeader
        title="Dale espacio a tu próxima obra."
        description="Empieza con lo esencial. Después conectarás tu cuenta, estimaciones y pagos de materiales."
      />
      <CompanyForm
        creating
        values={{
          name: "",
          legalName: "",
          rfc: "",
          currency: "MXN",
          timeZone: "America/Monterrey",
          minimumCashReserve: "0.00",
          dailyOperatingExpense: "0.00",
        }}
        onSave={async (values) => {
          try {
            await mutation.mutateAsync(values);
            return true;
          } catch {
            return false;
          }
        }}
        pending={mutation.isPending}
        error={mutation.isError ? errorMessage(mutation.error) : undefined}
      />
    </main>
  );
}
