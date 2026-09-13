"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Eye,
  EyeOff,
  Mail,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BusyIcon, FieldError } from "@/components/feedback";
import { apiRequest } from "@/lib/api/client";
import { authSchema } from "@/lib/api/contracts";
import { errorMessage } from "@/lib/api/errors";

const credentialsSchema = z.object({
  email: z.email("Ingresa un correo válido.").max(320),
  password: z
    .string()
    .min(8, "Usa al menos 8 caracteres.")
    .max(72, "Usa como máximo 72 caracteres."),
});

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const isSignUp = mode === "sign-up";
  const router = useRouter();
  const client = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof credentialsSchema>>({
    resolver: zodResolver(credentialsSchema),
    mode: "onBlur",
    defaultValues: { email: "", password: "" },
  });

  async function submit(values: z.infer<typeof credentialsSchema>) {
    setError(null);
    try {
      const result = await apiRequest(`/auth/${mode}`, authSchema, {
        method: "POST",
        body: values,
      });
      if (result.requiresEmailConfirmation) {
        setConfirmation(true);
        return;
      }
      await client.cancelQueries();
      client.clear();
      router.replace("/app");
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <section className="flex min-h-dvh flex-col bg-card px-6 py-8 sm:px-12 lg:px-16">
        <Link href="/auth/sign-in" className="self-start" aria-label="Colchón">
          <Brand />
        </Link>
        <div className="mx-auto my-auto w-full max-w-sm py-16">
          {confirmation ? (
            <div className="space-y-5">
              <Mail className="size-9 text-primary" />
              <h1 className="page-title">Revisa tu correo</h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Confirma tu cuenta desde el enlace que te enviamos. Después
                podrás iniciar sesión.
              </p>
              <Button asChild className="w-full">
                <Link href="/auth/sign-in">Ir a iniciar sesión</Link>
              </Button>
            </div>
          ) : (
            <>
              <h1 className="page-title">
                {isSignUp ? "Dale espacio a tu negocio." : "Qué bueno verte."}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {isSignUp
                  ? "Crea tu cuenta y empieza a ver hacia adelante."
                  : "Entra para ver cómo viene tu caja."}
              </p>
              <form
                onSubmit={form.handleSubmit(submit)}
                className="mt-9 space-y-5"
                noValidate
              >
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="tu@empresa.com"
                    aria-invalid={Boolean(form.formState.errors.email)}
                    aria-describedby="email-error"
                    {...form.register("email")}
                  />
                  <FieldError
                    id="email-error"
                    message={form.formState.errors.email?.message}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={
                        isSignUp ? "new-password" : "current-password"
                      }
                      placeholder={
                        isSignUp ? "Al menos 8 caracteres" : "Tu contraseña"
                      }
                      className="pr-12"
                      aria-invalid={Boolean(form.formState.errors.password)}
                      aria-describedby="password-error"
                      {...form.register("password")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </Button>
                  </div>
                  <FieldError
                    id="password-error"
                    message={form.formState.errors.password?.message}
                  />
                </div>
                {error && (
                  <p
                    role="alert"
                    className="rounded-lg bg-destructive/5 p-3 text-sm text-destructive"
                  >
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="mt-2 w-full"
                >
                  {form.formState.isSubmitting ? <BusyIcon /> : null}
                  {isSignUp ? "Crear cuenta" : "Iniciar sesión"}
                  <ArrowRight />
                </Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                {isSignUp ? "¿Ya tienes cuenta? " : "¿Es tu primera vez? "}
                <Link
                  className="font-semibold text-primary hover:underline"
                  href={isSignUp ? "/auth/sign-in" : "/auth/sign-up"}
                >
                  {isSignUp ? "Inicia sesión" : "Crea una cuenta"}
                </Link>
              </p>
              <div className="mt-8 border-t pt-6 text-center">
                <Link
                  href="/demo/dashboard"
                  className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Explorar un ejemplo
                  <ArrowUpRight className="size-4" />
                </Link>
              </div>
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Un poco de claridad. Un mejor mañana.
        </p>
      </section>
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#e9efe7] p-14 lg:flex">
        <div className="flex items-center gap-2 text-sm text-primary">
          <span className="size-2 rounded-full bg-primary" />
          Más tranquilidad para lo que viene
        </div>
        <div>
          <h2 className="max-w-lg font-editorial text-6xl leading-[1.06] tracking-[-0.035em]">
            Tu obra avanza.
            <br />
            Tu caja también
            <br />
            puede anticiparse.
          </h2>
          <p className="mt-7 max-w-xs text-sm leading-7 text-muted-foreground">
            Conoce tu saldo, anticipa el cobro de tus estimaciones y protege la
            nómina de tu cuadrilla.
          </p>
          <div className="mt-10 max-w-sm rounded-xl border border-white/70 bg-white/65 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Check className="size-4" />
              Lo importante, a la vista
            </div>
            <div className="mt-6 flex h-24 items-end gap-2" aria-hidden="true">
              {[38, 49, 45, 62, 51, 66, 77, 70, 83, 95, 87, 100].map(
                (height, index) => (
                  <span
                    key={height}
                    className="flex-1 rounded-t bg-primary/65"
                    style={{
                      height: `${height}%`,
                      opacity: 0.35 + index * 0.055,
                    }}
                  />
                ),
              )}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Una visión de los próximos 30 días.
            </p>
          </div>
        </div>
        <p className="text-xs text-primary/65">
          Hecho para constructoras pequeñas que no pueden improvisar la nómina.
        </p>
      </aside>
    </main>
  );
}
