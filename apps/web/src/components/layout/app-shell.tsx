"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  Building2,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  FileText,
  Landmark,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Settings2,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useResource, useWorkspace } from "@/features/workspace/workspace";
import { apiRequest, waitForSessionRefresh } from "@/lib/api/client";
import { acknowledgmentSchema } from "@/lib/api/contracts";
import { treasurySchema } from "@colchon/treasury/treasury-contract";
import { cn } from "@/lib/class-names";
import { errorMessage } from "@/lib/api/errors";
import { formatDate, ROLE_LABELS } from "@/lib/formatters";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { organization, organizations, email, basePath, isDemo, can } =
    useWorkspace();
  const pathname = usePathname();
  const router = useRouter();
  const client = useQueryClient();
  const mainRef = useRef<HTMLElement>(null);
  const previousPath = useRef(pathname);
  const [signingOut, setSigningOut] = useState(false);
  const navigation = [
    {
      label: "Plan de caja",
      path: "dashboard",
      icon: ChartNoAxesCombined,
      visible: true,
    },
    {
      label: "Pagos protegidos",
      path: "commitments",
      icon: ShieldCheck,
      visible: can("forecast:configure"),
    },
    {
      label: "Facturas",
      path: "invoices",
      icon: FileText,
      visible: can("cfdi:read"),
    },
    {
      label: "Banco",
      path: "bank",
      icon: Landmark,
      visible: can("bank-account:read"),
    },
  ].filter((item) => item.visible);
  const settingsVisible =
    can("organization:update") ||
    can("connection:read") ||
    can("member:read") ||
    can("forecast:configure");
  const isCurrentSection = (path: string) =>
    pathname === `${basePath}/${path}` ||
    pathname.startsWith(`${basePath}/${path}/`);
  const isDashboard = isCurrentSection("dashboard");
  const canSyncDashboard = isDashboard && can("bank-account:read");
  const treasuryQuery = useResource(
    "treasury",
    treasurySchema,
    canSyncDashboard,
  );
  const [syncRequested, setSyncRequested] = useState(false);
  const syncing = syncRequested || treasuryQuery.isFetching;

  useEffect(() => {
    if (previousPath.current !== pathname) {
      mainRef.current?.focus({ preventScroll: true });
      previousPath.current = pathname;
    }
  }, [pathname]);

  async function signOut() {
    setSigningOut(true);
    try {
      await waitForSessionRefresh();
      await apiRequest("/auth/sign-out", acknowledgmentSchema, {
        method: "POST",
      });
      await client.cancelQueries();
      client.clear();
      router.replace("/auth/sign-in");
    } catch (error) {
      toast.error(errorMessage(error));
      setSigningOut(false);
    }
  }

  async function syncData() {
    setSyncRequested(true);
    try {
      await treasuryQuery.refetch();
    } finally {
      window.setTimeout(() => setSyncRequested(false), 550);
    }
  }

  const currentPage = pathname.includes("settings")
    ? "Configuración"
    : pathname.includes("onboarding")
      ? "Primeros pasos"
      : (navigation.find((item) => isCurrentSection(item.path))?.label ??
        "Plan de caja");
  const companyMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Cambiar empresa: ${organization.name}`}
          className="group flex min-h-11 max-w-[230px] items-center gap-2 rounded-full border bg-card px-2.5 py-2 text-left transition-[background-color,border-color,box-shadow] duration-200 hover:border-primary/30 hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:bg-secondary data-[state=open]:bg-secondary/70"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
            <Building2 aria-hidden="true" className="size-3.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.65rem] leading-3 text-muted-foreground">
              Empresa activa
            </span>
            <span className="block truncate text-xs font-semibold leading-5">
              {organization.name}
            </span>
          </span>
          <span className="shrink-0 transition-transform duration-200 ease-out group-data-[state=open]:rotate-180 motion-reduce:transition-none">
            <ChevronDown aria-hidden="true" className="size-3.5" />
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="w-64 max-w-[calc(100vw-2rem)] rounded-lg p-1.5"
      >
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            className={cn(
              "min-h-11 gap-3 rounded-md px-2.5 py-2",
              org.id === organization.id && "bg-secondary/70",
            )}
            onSelect={() => {
              if (!isDemo) {
                void client.cancelQueries({ queryKey: ["organization"] });
                client.removeQueries({ queryKey: ["organization"] });
                router.push(`/app/${org.id}/dashboard`);
              }
            }}
          >
            <Building2 aria-hidden="true" className="size-4" />
            <span className="min-w-0 flex-1 wrap-anywhere leading-5">
              {org.name}
            </span>
            {org.id === organization.id && (
              <>
                <Check aria-hidden="true" className="size-4 text-primary" />
                <span className="sr-only">Empresa actual</span>
              </>
            )}
          </DropdownMenuItem>
        ))}
        {!isDemo && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="min-h-11 rounded-md px-2.5">
              <Link href="/app/new">
                <Plus aria-hidden="true" className="size-4" />
                Agregar empresa
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="app-frame">
      <a href="#main-content" className="skip-link">
        Saltar al contenido
      </a>
      <div className="app-workspace">
        <header className="app-topbar">
          <div className="app-topbar-inner">
            <Link
              href={`${basePath}/dashboard`}
              className="shrink-0"
              aria-label="Colchón, ir al plan de caja"
            >
              <Brand />
            </Link>
            {!isDashboard && (
              <span className="hidden flex-1 items-center border-l pl-4 text-sm font-semibold text-muted-foreground lg:flex">
                {currentPage}
              </span>
            )}
            <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
              {!isDemo && (
                <span className="hidden items-center gap-2 rounded-full border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground sm:inline-flex">
                  <span className="size-1.5 rounded-full bg-success" />
                  {organization.currency}
                </span>
              )}
              {canSyncDashboard && treasuryQuery.data && (
                <span className="app-dashboard-cutoff">
                  <span className="app-dashboard-cutoff-label">Corte</span>
                  <span>
                    {formatDate(treasuryQuery.data.input.asOf, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </span>
              )}
              <div className="hidden md:block">{companyMenu}</div>
              {canSyncDashboard && (
                <button
                  type="button"
                  title={syncing ? "Sincronizando datos" : "Sincronizar datos"}
                  aria-label={
                    syncing ? "Sincronizando datos" : "Sincronizar datos"
                  }
                  aria-busy={syncing}
                  disabled={syncing || !treasuryQuery.data}
                  onClick={() => void syncData()}
                  className="app-sync-button"
                  data-syncing={syncing}
                >
                  <RefreshCw
                    aria-hidden="true"
                    className={cn("size-4", syncing && "animate-spin")}
                  />
                </button>
              )}
              {isDemo && (
                <Link
                  href="/auth/sign-in"
                  className="hidden items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-foreground xl:inline-flex"
                >
                  Usar mi empresa
                  <ArrowUpRight aria-hidden="true" className="size-3.5" />
                </Link>
              )}
              <span className="hidden items-center gap-2 xl:flex">
                <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">
                  {isDemo ? "MV" : (email?.slice(0, 2).toUpperCase() ?? "TU")}
                </span>
                <span className="hidden min-w-0 max-w-28 lg:block">
                  <span className="block truncate text-xs font-semibold">
                    {isDemo ? "María Vega" : email}
                  </span>
                  <span className="block truncate text-[0.65rem] text-muted-foreground">
                    {ROLE_LABELS[organization.role]}
                  </span>
                </span>
              </span>
              <div className="lg:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Abrir menú de empresa"
                    >
                      <Menu />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-72 max-w-[calc(100vw-2rem)] rounded-2xl p-2"
                  >
                    {organizations.map((org) => (
                      <DropdownMenuItem
                        key={org.id}
                        className="min-h-11 rounded-xl"
                        onSelect={() => {
                          if (!isDemo) {
                            void client.cancelQueries({
                              queryKey: ["organization"],
                            });
                            client.removeQueries({
                              queryKey: ["organization"],
                            });
                            router.push(`/app/${org.id}/dashboard`);
                          }
                        }}
                      >
                        <Building2 aria-hidden="true" />
                        <span className="min-w-0 flex-1 wrap-anywhere">
                          {org.name}
                        </span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="min-h-11 rounded-xl">
                      <Link
                        href={
                          isDemo
                            ? `${basePath}/dashboard`
                            : `${basePath}/onboarding`
                        }
                      >
                        <ArrowUpRight aria-hidden="true" />
                        Primeros pasos
                      </Link>
                    </DropdownMenuItem>
                    {!isDemo && (
                      <>
                        <DropdownMenuItem
                          asChild
                          className="min-h-11 rounded-xl"
                        >
                          <Link href="/app/new">
                            <Plus aria-hidden="true" />
                            Agregar empresa
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={signingOut}
                          className="min-h-11 rounded-xl"
                          onSelect={() => void signOut()}
                        >
                          <X aria-hidden="true" />
                          Cerrar sesión
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>
        <div className="flex min-h-0 flex-1">
          <aside
            className="app-rail hidden lg:flex"
            aria-label="Accesos rápidos"
          >
            <div className="app-rail-group">
              {navigation.map(({ label, path, icon: Icon }) => (
                <Link
                  key={path}
                  href={`${basePath}/${path}`}
                  aria-label={label}
                  title={label}
                  aria-current={isCurrentSection(path) ? "page" : undefined}
                  className={cn(
                    "app-rail-link",
                    isCurrentSection(path) && "app-rail-link-active",
                  )}
                >
                  <Icon aria-hidden="true" className="size-[19px]" />
                </Link>
              ))}
            </div>
            {!isDemo && (
              <div className="app-rail-group">
                {settingsVisible && (
                  <Link
                    href={`${basePath}/settings/company`}
                    aria-label="Configuración"
                    title="Configuración"
                    aria-current={
                      pathname.includes("settings") ? "page" : undefined
                    }
                    className={cn(
                      "app-rail-link",
                      pathname.includes("settings") && "app-rail-link-active",
                    )}
                  >
                    <Settings2 aria-hidden="true" className="size-[19px]" />
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={signingOut}
                  onClick={() => void signOut()}
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                  className="app-rail-link"
                >
                  <LogOut aria-hidden="true" className="size-4" />
                </Button>
              </div>
            )}
          </aside>
          <div className="min-w-0 flex-1">
            {!isDashboard && (
              <div className="border-b px-5 py-3 lg:hidden">
                <span className="text-sm font-medium text-muted-foreground">
                  {currentPage}
                </span>
              </div>
            )}
            <motion.main
              key={pathname}
              id="main-content"
              ref={mainRef}
              tabIndex={-1}
              className="min-w-0 pb-24 outline-none lg:pb-8"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.36,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {children}
            </motion.main>
          </div>
        </div>
        <nav
          aria-label="Navegación móvil"
          className="safe-bottom fixed inset-x-0 bottom-0 z-30 flex justify-around border-t bg-card/95 px-2 pt-2 backdrop-blur-xl lg:hidden"
        >
          {navigation.map(({ label, path, icon: Icon }) => (
            <Link
              key={path}
              href={`${basePath}/${path}`}
              aria-current={isCurrentSection(path) ? "page" : undefined}
              className={cn(
                "flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition-[background-color,color] duration-200",
                isCurrentSection(path)
                  ? "bg-secondary text-primary"
                  : "text-muted-foreground",
              )}
            >
              <Icon aria-hidden="true" className="size-5" />
              {label}
            </Link>
          ))}
          {settingsVisible && !isDemo && (
            <Link
              href={`${basePath}/settings/company`}
              aria-current={
                pathname.includes("/settings/") ? "page" : undefined
              }
              className={cn(
                "flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[11px] transition-[background-color,color] duration-200",
                pathname.includes("/settings/")
                  ? "bg-secondary text-primary"
                  : "text-muted-foreground",
              )}
            >
              <Settings2 aria-hidden="true" className="size-5" />
              Ajustes
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
