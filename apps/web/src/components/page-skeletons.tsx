import { Skeleton } from "@/components/ui/skeleton";

function LoadingFrame({
  label,
  className,
  children,
}: {
  label: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="status"
      aria-label={label}
      aria-busy="true"
      className={className}
    >
      {children}
      <span className="sr-only">Cargando información…</span>
    </div>
  );
}

function PageHeaderSkeleton({ withAction = true }: { withAction?: boolean }) {
  return (
    <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-3">
        <Skeleton className="h-10 w-3/4 max-w-[27rem] rounded-xl" />
        <Skeleton className="h-5 w-full max-w-[34rem]" />
      </div>
      {withAction && <Skeleton className="h-12 w-40 rounded-xl" />}
    </div>
  );
}

function NoticeSkeleton() {
  return <Skeleton className="mb-6 h-12 w-full rounded-xl" />;
}

function ListControlsSkeleton({
  filterWidth = "w-28",
}: {
  filterWidth?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end gap-3">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
      <Skeleton className={`h-12 ${filterWidth} rounded-xl`} />
    </div>
  );
}

function TableSkeleton({
  columnCount = 4,
  rowCount = 5,
}: {
  columnCount?: number;
  rowCount?: number;
}) {
  const widths =
    columnCount === 5
      ? ["w-36", "w-20", "w-24", "w-20", "ml-auto w-24"]
      : ["w-36", "w-20", "w-20", "ml-auto w-24"];
  const rowKeys = ["one", "two", "three", "four", "five"].slice(0, rowCount);

  return (
    <div className="panel overflow-hidden">
      <div className="hidden md:block">
        <div className="flex gap-5 border-b bg-muted/40 px-5 py-3">
          {widths.map((width, index) => (
            <Skeleton
              key={`head-${width}`}
              className={`${width} ${index === widths.length - 1 ? "ml-auto" : ""} h-3`}
            />
          ))}
        </div>
        <div className="divide-y">
          {rowKeys.map((rowKey) => (
            <div
              key={`row-${rowKey}`}
              className="flex items-center gap-5 px-5 py-5"
            >
              {widths.map((width, columnIndex) => (
                <div
                  key={`cell-${rowKey}-${width}`}
                  className={`min-w-0 flex-1 ${columnIndex === widths.length - 1 ? "flex justify-end" : ""}`}
                >
                  <Skeleton
                    className={`${width.replace("ml-auto ", "")} h-4`}
                  />
                  {columnIndex === 0 && <Skeleton className="mt-2 h-3 w-24" />}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="divide-y md:hidden">
        {rowKeys.map((rowKey) => (
          <div key={`mobile-row-${rowKey}`} className="space-y-3 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="size-4 rounded-full" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>
      <div className="border-t px-5 py-3">
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

function AccountCardSkeleton() {
  return (
    <section className="panel p-6">
      <div className="mb-5 flex items-start gap-3">
        <Skeleton className="size-5 rounded-md" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <Skeleton className="h-9 w-44" />
      <Skeleton className="mt-3 h-3 w-40" />
    </section>
  );
}

export function DashboardSkeleton() {
  const metricKeys = ["available", "minimum", "reserve", "days"];
  const planKeys = ["first", "second", "third"];
  return (
    <LoadingFrame
      label="Cargando plan de caja"
      className="page-container dashboard-page space-y-7 pb-14"
    >
      <div className="dashboard-toolbar">
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-12 w-36 rounded-full" />
      </div>
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy space-y-4">
          <Skeleton className="h-8 w-40 rounded-full" />
          <Skeleton className="h-24 w-full max-w-[34rem] rounded-xl" />
          <Skeleton className="h-14 w-full max-w-[40rem]" />
          <div className="flex gap-2">
            <Skeleton className="h-11 w-40 rounded-full" />
            <Skeleton className="h-11 w-36 rounded-full" />
          </div>
        </div>
        <div className="dashboard-payroll-card">
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 rounded-2xl bg-white/10" />
            <Skeleton className="h-3 w-28 bg-white/10" />
          </div>
          <Skeleton className="relative mt-8 h-4 w-36 bg-white/10" />
          <Skeleton className="relative mt-2 h-12 w-52 max-w-full bg-white/10" />
          <Skeleton className="relative mt-3 h-4 w-64 max-w-full bg-white/10" />
          <Skeleton className="relative mt-7 h-12 w-full border-t border-white/10 bg-white/10" />
        </div>
      </section>
      <section className="dashboard-signal-grid">
        {metricKeys.map((metricKey) => (
          <div key={metricKey} className="dashboard-metric">
            <div className="flex items-center gap-2">
              <Skeleton className="size-8 rounded-xl" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="mt-4 h-8 w-32" />
            <Skeleton className="mt-2 h-3 w-28" />
          </div>
        ))}
      </section>
      <section className="dashboard-alert-card">
        <div className="dashboard-alert-header">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-5 w-52" />
            </div>
          </div>
          <Skeleton className="h-9 w-40 rounded-full" />
        </div>
        <div className="dashboard-alert-body">
          <div className="dashboard-alert-main space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-14 w-full max-w-[30rem]" />
            <Skeleton className="h-12 w-full max-w-[42rem]" />
            <div className="dashboard-alert-stats">
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
            </div>
          </div>
          <Skeleton className="h-full min-h-52 rounded-2xl" />
        </div>
      </section>
      <div className="dashboard-workbench">
        <section className="dashboard-chart-panel space-y-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72 max-w-full" />
          <Skeleton className="h-[320px] w-full rounded-2xl" />
        </section>
        <section className="dashboard-plans-panel space-y-3">
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-12 w-full" />
          {planKeys.map((planKey) => (
            <Skeleton key={planKey} className="h-36 w-full rounded-2xl" />
          ))}
        </section>
      </div>
      <AnnualHistorySkeleton nested />
    </LoadingFrame>
  );
}

export function AnnualChartSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-11 w-28 rounded-xl" />
      </div>
      <Skeleton className="h-[300px] w-full rounded-2xl" />
      <Skeleton className="h-3 w-80 max-w-full" />
    </div>
  );
}

export function AnnualHistorySkeleton({
  nested = false,
}: {
  nested?: boolean;
}) {
  return (
    <section
      className="dashboard-annual-card"
      {...(nested
        ? {}
        : {
            "aria-label": "Cargando tendencia anual",
            "aria-busy": true,
            role: "status",
          })}
    >
      <header className="dashboard-annual-header">
        <div className="min-w-0 space-y-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-72 max-w-full rounded-xl" />
          <Skeleton className="h-4 w-[34rem] max-w-full" />
        </div>
        <Skeleton className="h-9 w-28 rounded-full" />
      </header>
      <div className="dashboard-annual-body">
        <div className="dashboard-annual-summary">
          <div className="dashboard-annual-summary-item">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-3 h-8 w-40" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
          <div className="dashboard-annual-summary-item">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="mt-3 h-8 w-32" />
            <Skeleton className="mt-2 h-3 w-28" />
          </div>
        </div>
        <AnnualChartSkeleton />
      </div>
    </section>
  );
}

export function InvoicesSkeleton() {
  return (
    <LoadingFrame label="Cargando facturas" className="page-container">
      <PageHeaderSkeleton />
      <NoticeSkeleton />
      <ListControlsSkeleton />
      <TableSkeleton columnCount={5} />
    </LoadingFrame>
  );
}

export function InvoicesTableSkeleton() {
  return <TableSkeleton columnCount={5} />;
}

export function BankSkeleton() {
  return (
    <LoadingFrame
      label="Cargando movimientos bancarios"
      className="page-container dashboard-page bank-page space-y-7 pb-14"
    >
      <section className="dashboard-hero bank-hero">
        <div className="dashboard-hero-copy space-y-4">
          <Skeleton className="h-8 w-40 rounded-full" />
          <Skeleton className="h-16 w-full max-w-[28rem] rounded-xl" />
          <Skeleton className="h-14 w-full max-w-[38rem]" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-11 w-36 rounded-full" />
            <Skeleton className="h-11 w-32 rounded-full" />
          </div>
        </div>
        <div className="dashboard-payroll-card bank-balance-card">
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 rounded-2xl bg-white/10" />
            <Skeleton className="h-3 w-28 bg-white/10" />
          </div>
          <Skeleton className="relative mt-8 h-4 w-32 bg-white/10" />
          <Skeleton className="relative mt-2 h-12 w-52 max-w-full bg-white/10" />
          <Skeleton className="relative mt-3 h-4 w-40 max-w-full bg-white/10" />
          <Skeleton className="relative mt-7 h-12 w-full border-t border-white/10 bg-white/10" />
        </div>
      </section>
      <section className="dashboard-panel bank-movements-panel">
        <header className="bank-movements-header">
          <div className="space-y-3">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-8 w-64 max-w-full rounded-xl" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <Skeleton className="h-9 w-28 rounded-full" />
        </header>
        <Skeleton className="mx-5 my-5 h-12 rounded-2xl sm:mx-7" />
        <div className="bank-movements-content">
          <ListControlsSkeleton />
          <TableSkeleton />
        </div>
      </section>
    </LoadingFrame>
  );
}

export function BankAccountsSkeleton() {
  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2">
      <AccountCardSkeleton />
    </div>
  );
}

export function BankTransactionsSkeleton() {
  return <TableSkeleton />;
}

function ObligationRowsSkeleton() {
  const rowKeys = ["taxes", "rent", "payroll"];
  return (
    <div className="commitments-list">
      {rowKeys.map((rowKey) => (
        <div key={rowKey} className="commitments-row">
          <Skeleton className="size-14 rounded-2xl" />
          <div className="commitments-row-content space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <Skeleton className="h-4 w-48 max-w-full" />
              <Skeleton className="h-7 w-28 rounded-full" />
            </div>
            <Skeleton className="h-3 w-56 max-w-full" />
          </div>
          <div className="commitments-row-amount-wrap space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="ml-auto h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CommitmentsSkeleton() {
  return (
    <LoadingFrame
      label="Cargando pagos protegidos"
      className="page-container dashboard-page commitments-page space-y-7 pb-14"
    >
      <section className="dashboard-hero commitments-hero">
        <div className="dashboard-hero-copy space-y-4">
          <Skeleton className="h-8 w-40 rounded-full" />
          <Skeleton className="h-24 w-full max-w-[34rem] rounded-xl" />
          <Skeleton className="h-14 w-full max-w-[40rem]" />
          <div className="flex gap-2">
            <Skeleton className="h-11 w-36 rounded-full" />
            <Skeleton className="h-11 w-40 rounded-full" />
          </div>
        </div>
        <div className="dashboard-payroll-card commitments-summary-card">
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 rounded-2xl bg-white/10" />
            <Skeleton className="h-3 w-28 bg-white/10" />
          </div>
          <Skeleton className="relative mt-8 h-4 w-40 bg-white/10" />
          <Skeleton className="relative mt-2 h-12 w-52 max-w-full bg-white/10" />
          <Skeleton className="relative mt-3 h-4 w-64 max-w-full bg-white/10" />
          <Skeleton className="relative mt-7 h-12 w-full border-t border-white/10 bg-white/10" />
        </div>
      </section>
      <section className="dashboard-panel commitments-list-panel">
        <header className="commitments-list-header">
          <div className="space-y-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-64 max-w-full rounded-xl" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <Skeleton className="h-11 w-32 rounded-md" />
        </header>
        <div className="commitments-board-summary">
          {["payments", "amount", "protected"].map((key) => (
            <div key={key} className="commitments-board-stat">
              <Skeleton className="size-8 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="mx-5 my-5 h-12 rounded-2xl sm:mx-7" />
        <ObligationRowsSkeleton />
        <div className="flex gap-2 border-t px-5 py-4 sm:px-7">
          <Skeleton className="mt-1 size-3.5 rounded-full" />
          <Skeleton className="h-4 w-full max-w-[42rem]" />
        </div>
      </section>
    </LoadingFrame>
  );
}

export function CommitmentsListSkeleton() {
  return <ObligationRowsSkeleton />;
}

export function ConnectionsSkeleton() {
  return (
    <LoadingFrame label="Cargando conexiones" className="space-y-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-12 w-40 rounded-xl" />
      </div>
      <Skeleton className="mb-6 h-12 w-full rounded-xl" />
      <ConnectionsListSkeleton />
    </LoadingFrame>
  );
}

export function ConnectionsListSkeleton() {
  const connectionKeys = ["bank", "invoices"];
  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-12 w-40 rounded-xl" />
      </div>
      <Skeleton className="mb-6 h-12 w-full rounded-xl" />
      <div className="panel divide-y">
        {connectionKeys.map((connectionKey) => (
          <div
            key={connectionKey}
            className="flex items-start gap-4 p-5 md:p-6"
          >
            <Skeleton className="size-11 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-3">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
            <Skeleton className="size-11 rounded-xl" />
          </div>
        ))}
      </div>
    </>
  );
}

export function CompanySkeleton() {
  const fieldKeys = ["name", "legal-name", "rfc", "currency", "timezone"];
  return (
    <LoadingFrame label="Cargando datos de la empresa" className="space-y-6">
      <Skeleton className="mb-6 h-7 w-52" />
      <Skeleton className="mb-6 h-12 w-full rounded-xl" />
      <div className="panel max-w-3xl space-y-6 p-5 md:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          {fieldKeys.map((fieldKey) => (
            <div key={fieldKey} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <Skeleton className="h-12 w-full border-t" />
      </div>
    </LoadingFrame>
  );
}

export function OnboardingSkeleton() {
  const stepKeys = ["bank", "invoices", "forecast"];
  return (
    <LoadingFrame label="Cargando primeros pasos" className="page-container">
      <PageHeaderSkeleton />
      <NoticeSkeleton />
      <div className="max-w-4xl space-y-4">
        {stepKeys.map((stepKey) => (
          <section
            key={stepKey}
            className="panel flex gap-4 p-5 md:gap-6 md:p-7"
          >
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-3">
              <Skeleton className="h-6 w-72 max-w-full" />
              <Skeleton className="h-10 w-full max-w-[36rem]" />
              <Skeleton className="h-11 w-40 rounded-xl" />
            </div>
          </section>
        ))}
      </div>
    </LoadingFrame>
  );
}

export function OnboardingStepsSkeleton() {
  const stepKeys = ["bank", "invoices", "forecast"];
  return (
    <div className="max-w-4xl space-y-4">
      {stepKeys.map((stepKey) => (
        <section key={stepKey} className="panel flex gap-4 p-5 md:gap-6 md:p-7">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-3">
            <Skeleton className="h-6 w-72 max-w-full" />
            <Skeleton className="h-10 w-full max-w-[36rem]" />
            <Skeleton className="h-11 w-40 rounded-xl" />
          </div>
        </section>
      ))}
    </div>
  );
}

export function InvoiceDetailSkeleton() {
  return (
    <LoadingFrame
      label="Cargando detalle de factura"
      className="page-container max-w-6xl"
    >
      <div className="space-y-3 border-b pb-8">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-12 w-72 max-w-full rounded-xl" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>
      <Skeleton className="mt-6 h-40 rounded-[22px]" />
      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,.6fr)]">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <Skeleton className="mt-4 h-72 rounded-xl" />
    </LoadingFrame>
  );
}
