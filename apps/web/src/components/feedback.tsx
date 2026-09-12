"use client";

import { AlertCircle, ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, errorMessage } from "@/lib/api/errors";

export function LoadingView() {
  return (
    <div
      role="status"
      aria-label="Cargando información"
      className="space-y-7 p-6 md:p-10"
    >
      <Skeleton className="h-9 w-48" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-80 w-full" />
      <span className="sr-only">Cargando información…</span>
    </div>
  );
}

export function ErrorView({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card p-8 text-center"
    >
      <AlertCircle className="size-7 text-muted-foreground" />
      <h2 className="text-lg font-semibold">No pudimos cargar esta vista</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {errorMessage(error)}
      </p>
      {retry && (
        <Button variant="outline" onClick={retry}>
          Intentar de nuevo
        </Button>
      )}
      {error instanceof ApiError && error.requestId && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer">Referencia de soporte</summary>
          <p className="mt-2 select-all">{error.requestId}</p>
        </details>
      )}
    </div>
  );
}

export function EmptyView({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-10 text-center">
      <span className="mb-1 flex size-11 items-center justify-center rounded-full bg-secondary">
        <ArrowRight className="size-5" />
      </span>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

export function BusyIcon() {
  return (
    <LoaderCircle
      aria-hidden="true"
      className="size-4 motion-safe:animate-spin"
    />
  );
}

export function FieldError({ message, id }: { message?: string; id?: string }) {
  return message ? (
    <p id={id} role="alert" className="text-sm text-destructive">
      {message}
    </p>
  ) : null;
}
