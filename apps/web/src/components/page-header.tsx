import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="page-title">{title}</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {action && (
        <div className="shrink-0 self-start sm:self-auto">{action}</div>
      )}
    </header>
  );
}
