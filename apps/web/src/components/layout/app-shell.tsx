"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
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
import { useWorkspace } from "@/features/workspace/workspace";
import { apiRequest, waitForSessionRefresh } from "@/lib/api/client";
import { acknowledgmentSchema } from "@/lib/api/contracts";
import { cn } from "@/lib/class-names";
import { errorMessage } from "@/lib/api/errors";
import { ROLE_LABELS } from "@/lib/formatters";

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
      label: "Compromisos",
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
          className="group grid w-full gap-1.5 rounded-lg border bg-muted/40 px-3 py-3 text-left transition-colors duration-150 hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:bg-secondary data-[state=open]:bg-secondary/70"
        >
          <span className="flex items-center gap-2 text-xs leading-4 text-muted-foreground">
            <Building2 aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="flex-1">Empresa</span>
            <span className="shrink-0 transition-transform duration-150 ease-out group-data-[state=open]:rotate-180 motion-reduce:transition-none">
              <ChevronDown aria-hidden="true" className="size-3.5" />
            </span>
          </span>
          <span className="min-w-0 wrap-anywhere text-sm font-semibold leading-5">
            {organization.name}
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
    <div className="min-h-dvh">
      <a href="#main-content" className="skip-link">
        Saltar al contenido
      </a>
      <aside className="floating-header fixed inset-y-0 left-0 z-30 hidden w-[244px] flex-col border-r bg-card/80 px-5 py-8 backdrop-blur-xl lg:flex">
        <Link
          href={`${basePath}/dashboard`}
          className="mb-9 self-start px-2"
          aria-label="Colchón, ir al plan de caja"
        >
          <Brand />
        </Link>
        {companyMenu}
        <nav aria-label="Navegación principal" className="mt-8 space-y-1.5">
          {navigation.map(({ label, path, icon: Icon }) => (
            <Link
              key={path}
              href={`${basePath}/${path}`}
              aria-current={isCurrentSection(path) ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-muted",
                isCurrentSection(path)
                  ? "bg-secondary text-primary"
                  : "text-muted-foreground",
              )}
            >
              <Icon className="size-[19px]" />
              {label}
              {pathname.endsWith(path) && (
                <span
                  aria-hidden="true"
                  className="ml-auto size-1.5 rounded-full bg-primary"
                />
              )}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-2">
          {settingsVisible && !isDemo && (
            <Link
              href={`${basePath}/settings/company`}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors hover:bg-muted",
                pathname.includes("settings")
                  ? "bg-secondary text-primary"
                  : "text-muted-foreground",
              )}
            >
              <Settings2 className="size-[19px]" />
              Configuración
            </Link>
          )}
          <Link
            href={`${basePath}/dashboard#assumptions`}
            className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
          >
            <ShieldCheck className="size-[19px]" />
            Cómo funciona
          </Link>
          <div className="mt-5 border-t pt-5">
            <div className="flex items-center gap-3 px-2">
              <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                {isDemo ? "MV" : (email?.slice(0, 2).toUpperCase() ?? "TU")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">
                  {isDemo ? "María Vega" : email}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {ROLE_LABELS[organization.role]}
                </p>
              </div>
              {!isDemo && (
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={signingOut}
                  onClick={() => void signOut()}
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </aside>
      <div className="lg:pl-[244px]">
        <header className="floating-header sticky top-0 z-20 border-b bg-background/95 backdrop-blur-md">
          <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between gap-3 px-5 md:px-9 xl:px-12">
            <div className="flex items-center gap-3">
              <span className="lg:hidden">
                <Brand compact />
              </span>
              <span className="text-sm text-muted-foreground">
                {currentPage}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {isDemo ? (
                <>
                  <span className="rounded-md border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground">
                    Demo interactiva
                  </span>
                  <Link
                    href="/auth/sign-in"
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary"
                  >
                    Usar mi empresa
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </>
              ) : (
                <span className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
                  <span className="size-1.5 rounded-full bg-primary" />
                  {organization.currency}
                </span>
              )}
              <div className="lg:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Abrir menú de empresa"
                    >
                      <Menu />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-64 max-w-[calc(100vw-2rem)]"
                  >
                    {organizations.map((org) => (
                      <DropdownMenuItem
                        key={org.id}
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
                        <Building2 />
                        <span className="min-w-0 flex-1 wrap-anywhere">
                          {org.name}
                        </span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="min-h-11">
                      <Link
                        href={
                          isDemo
                            ? `${basePath}/dashboard`
                            : `${basePath}/onboarding`
                        }
                      >
                        <ArrowUpRight />
                        Primeros pasos
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="min-h-11">
                      <Link href={`${basePath}/dashboard#assumptions`}>
                        <ShieldCheck />
                        Cómo funciona
                      </Link>
                    </DropdownMenuItem>
                    {!isDemo && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/app/new">
                            <Plus />
                            Agregar empresa
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={signingOut}
                          onSelect={() => void signOut()}
                        >
                          <X />
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
        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          className="min-w-0 pb-24 outline-none lg:pb-8"
        >
          {children}
        </main>
        <nav
          aria-label="Navegación móvil"
          className="safe-bottom fixed inset-x-0 bottom-0 z-30 flex justify-around border-t bg-card px-2 pt-2 lg:hidden"
        >
          {navigation.map(({ label, path, icon: Icon }) => (
            <Link
              key={path}
              href={`${basePath}/${path}`}
              aria-current={isCurrentSection(path) ? "page" : undefined}
              className={cn(
                "flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium",
                isCurrentSection(path)
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" />
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
                "flex min-h-12 flex-1 flex-col items-center justify-center gap-1 text-[11px]",
                pathname.includes("/settings/")
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
            >
              <Settings2 className="size-5" />
              Ajustes
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
