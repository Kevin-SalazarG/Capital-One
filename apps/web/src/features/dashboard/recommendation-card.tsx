"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleCheck,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BusyIcon } from "@/components/feedback";
import { useWorkspace } from "@/features/workspace/workspace";
import { apiRequest } from "@/lib/api/client";
import {
  acknowledgmentSchema,
  type Dashboard,
  type RecommendationStatus,
} from "@/lib/api/contracts";
import { errorMessage } from "@/lib/api/errors";
import { formatDate, formatMoney } from "@/lib/formatters";
import { recommendationTitle } from "@/features/dashboard/recommendation-copy";

const STATUS_LABELS: Record<RecommendationStatus, string> = {
  open: "Acción sugerida",
  accepted: "En seguimiento",
  completed: "Completada",
  dismissed: "Descartada",
};

export function RecommendationCard({ data }: { data: Dashboard }) {
  const recommendation = data.recommendation;
  const { organization, can, isDemo } = useWorkspace();
  const client = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const reducedMotion = useReducedMotion();
  const mutation = useMutation({
    mutationFn: async (status: RecommendationStatus) => {
      if (!recommendation) return;
      if (!isDemo)
        await apiRequest(
          `/organizations/${organization.id}/recommendations/${recommendation.id}`,
          acknowledgmentSchema,
          { method: "PATCH", body: { status } },
        );
      return status;
    },
    onSuccess: async (status) => {
      if (!status) return;
      if (isDemo)
        client.setQueryData<Dashboard>(
          ["organization", organization.id, "demo", "dashboard"],
          (current) =>
            current?.recommendation
              ? {
                  ...current,
                  recommendation: { ...current.recommendation, status },
                }
              : current,
        );
      else
        await client.invalidateQueries({
          queryKey: ["organization", organization.id],
        });
      toast.success(
        isDemo
          ? "Estado actualizado en el ejemplo"
          : "Recomendación actualizada",
      );
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  if (!recommendation)
    return (
      <section className="panel flex h-full flex-col justify-center gap-4 p-7">
        <CircleCheck className="size-8 text-primary" />
        <h2 className="font-editorial text-2xl">Espacio para seguir.</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          No hay una acción sugerida para esta proyección.
        </p>
      </section>
    );
  const actionDate =
    typeof recommendation.evidence.gapDate === "string"
      ? recommendation.evidence.gapDate
      : null;
  const sourceDate =
    typeof recommendation.evidence.sourceDate === "string"
      ? recommendation.evidence.sourceDate
      : null;
  return (
    <section
      className="panel flex h-full flex-col"
      aria-labelledby="recommendation-title"
    >
      <div className="flex items-center justify-between px-6 pt-6">
        <span className="flex items-center gap-2 text-xs font-medium text-primary">
          <span className="flex size-6 items-center justify-center rounded-full bg-secondary">
            {recommendation.status === "completed" ? (
              <Check className="size-3.5" />
            ) : (
              <ArrowUpRight className="size-3.5" />
            )}
          </span>
          {STATUS_LABELS[recommendation.status]}
        </span>
        {can("recommendation:update") && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Más acciones de recomendación"
                disabled={mutation.isPending}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() =>
                  mutation.mutate(
                    recommendation.status === "dismissed" ||
                      recommendation.status === "completed"
                      ? "open"
                      : "dismissed",
                  )
                }
              >
                {recommendation.status === "dismissed" ||
                recommendation.status === "completed"
                  ? "Reabrir recomendación"
                  : "Descartar recomendación"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="flex flex-1 flex-col px-6 pb-6 pt-4">
        <h2
          id="recommendation-title"
          className="font-editorial text-[28px] leading-[1.17] tracking-[-0.02em]"
        >
          {recommendationTitle(recommendation)}
        </h2>
        {actionDate && (
          <p className="mt-3 text-sm text-muted-foreground">
            Antes del{" "}
            {formatDate(actionDate, { day: "numeric", month: "long" })}
          </p>
        )}
        <div className="my-7 border-y py-5">
          <p className="text-xs text-muted-foreground">Impacto estimado</p>
          <p className="numeric mt-2 text-[30px] font-semibold tracking-[-0.04em]">
            {formatMoney(recommendation.amount, organization.currency)}
            <span className="ml-2 text-xs font-normal tracking-normal text-muted-foreground">
              {organization.currency}
            </span>
          </p>
        </div>
        <Button
          variant="ghost"
          className="mb-3 justify-between px-0 hover:bg-transparent"
          aria-expanded={expanded}
          aria-controls="recommendation-evidence"
          onClick={() => setExpanded(!expanded)}
        >
          Por qué esta acción
          <ChevronDown
            className={
              expanded
                ? "rotate-180 transition-transform"
                : "transition-transform"
            }
          />
        </Button>
        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.div
              id="recommendation-evidence"
              initial={{ opacity: 0, y: reducedMotion ? 0 : -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.18 }}
              className="mb-5 rounded-lg bg-muted p-4 text-sm leading-relaxed text-muted-foreground"
            >
              <p>
                {data.gap
                  ? `El faltante previsto es de ${formatMoney(data.gap.deficit, organization.currency)}.`
                  : "La sugerencia usa la información de la última proyección."}
              </p>
              {sourceDate ? (
                <p className="mt-2">
                  Fecha del compromiso:{" "}
                  {formatDate(sourceDate, { day: "numeric", month: "long" })}.
                </p>
              ) : null}
              <p className="mt-2 text-xs">
                Registrar esta acción no mueve dinero ni modifica tus facturas.
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
        {can("recommendation:update") &&
          (recommendation.status === "open" ||
            recommendation.status === "accepted") && (
            <Button
              className="mt-auto w-full"
              disabled={mutation.isPending}
              onClick={() =>
                mutation.mutate(
                  recommendation.status === "accepted"
                    ? "completed"
                    : "accepted",
                )
              }
            >
              {mutation.isPending ? <BusyIcon /> : <Check />}
              {recommendation.status === "accepted"
                ? "Marcar como completada"
                : "Dar seguimiento"}
            </Button>
          )}
        {recommendation.status === "completed" && (
          <p className="mt-auto flex items-center gap-2 text-sm text-primary">
            <CircleCheck className="size-4" />
            Marcada como completada
          </p>
        )}
      </div>
    </section>
  );
}
