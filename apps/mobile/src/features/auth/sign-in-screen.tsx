import { useRef, useState, type ReactElement } from "react";
import { Text, View, type TextInput } from "react-native";
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import * as v from "valibot";
import { loginRequestSchema } from "@mirror/api-client";
import { useSession } from "../../platform/session/session-provider";
import { AuthScreen } from "../../design-system/layout/auth-screen";
import { Button } from "../../design-system/primitives/button";
import { TextField } from "../../design-system/forms/text-field";
import { InlineNotice } from "../../design-system/feedback/inline-notice";
import { useMobileRuntime } from "../../platform/api/mirror-client";

const signInSchema = v.object({
  ...loginRequestSchema.entries,
  email: v.pipe(loginRequestSchema.entries.email, v.email("Escribe un correo válido.")),
  password: v.pipe(v.string(), v.minLength(8, "Escribe al menos 8 caracteres."), v.maxLength(128)),
});
type SignInForm = v.InferOutput<typeof signInSchema>;

export function SignInScreen(): ReactElement {
  const { controller, session } = useSession();
  const { config } = useMobileRuntime();
  const [submitting, setSubmitting] = useState(false);
  const submissionPending = useRef(false);
  const passwordInput = useRef<TextInput | null>(null);
  // Message leaves subscribe to validation updates while RHF retains its
  // error objects and their loosely typed native references.
  const {
    register,
    watch,
    setValue,
    trigger,
    handleSubmit,
    resetField,
    formState: {
      errors: { email: { message: emailError } = {}, password: { message: passwordError } = {} },
    },
  } = useForm<SignInForm, unknown, SignInForm>({
    resolver: valibotResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });
  const email = watch("email");
  const password = watch("password");
  const { ref: emailRef } = register("email");
  const { ref: passwordRef } = register("password");
  const submit = handleSubmit(async ({ email, password }) => {
    if (submissionPending.current) return;
    submissionPending.current = true;
    setSubmitting(true);
    try {
      await controller.signIn(email, password);
    } finally {
      resetField("password");
      submissionPending.current = false;
      setSubmitting(false);
    }
  });
  return (
    <AuthScreen localDevelopment={config.localDevelopment}>
      <Text
        accessibilityRole="header"
        className="mb-7 text-[32px] leading-[39px] font-semibold tracking-tight text-auth-foreground"
      >
        Inicia sesión
      </Text>
      <View className="gap-6">
        <TextField
          label="Correo electrónico"
          email
          appearance="brand"
          value={email}
          onChangeText={(text) =>
            setValue("email", text, { shouldDirty: true, shouldValidate: Boolean(emailError) })
          }
          onBlur={() => {
            void trigger("email");
          }}
          inputRef={emailRef}
          returnKeyType="next"
          onSubmitEditing={() => passwordInput.current?.focus()}
          {...(emailError ? { error: emailError } : {})}
          disabled={submitting}
        />
        <TextField
          label="Contraseña"
          secure
          appearance="brand"
          value={password}
          onChangeText={(text) =>
            setValue("password", text, {
              shouldDirty: true,
              shouldValidate: Boolean(passwordError),
            })
          }
          onBlur={() => {
            void trigger("password");
          }}
          inputRef={(input) => {
            passwordRef(input);
            passwordInput.current = input;
          }}
          returnKeyType="go"
          onSubmitEditing={() => {
            void submit();
          }}
          {...(passwordError ? { error: passwordError } : {})}
          disabled={submitting}
        />
        {session.status === "unavailable" ? (
          <InlineNotice message={session.message} danger />
        ) : null}
        {session.status === "signed-out" && session.reason === "invalid" ? (
          <InlineNotice message="Revisa tu correo y contraseña." danger />
        ) : null}
        {session.status === "signed-out" &&
        (session.credentialCleared === null || session.revocation === "pending") ? (
          <InlineNotice message="Cerrando sesión…" />
        ) : null}
        {session.status === "signed-out" && session.credentialCleared === false ? (
          <>
            <InlineNotice
              message="No se pudo cerrar la sesión local. Desbloquea el dispositivo y reintenta."
              danger
            />
            <Button
              label="Reintentar cierre"
              variant="outline"
              disabled={session.revocation === "pending"}
              onPress={() => {
                void controller.signOut();
              }}
            />
          </>
        ) : null}
        {session.status === "signed-out" && session.revocation === "unconfirmed" ? (
          <InlineNotice message="Sesión cerrada aquí. No se pudo confirmar el cierre remoto." />
        ) : null}
        <Button
          label="Entrar"
          appearance="brand"
          busyLabel="Entrando…"
          busy={submitting || session.status === "signing-in"}
          onPress={() => {
            void submit();
          }}
        />
        {session.status === "unavailable" && !session.requiresSignIn ? (
          <Button
            label="Reintentar conexión"
            variant="outline"
            onPress={() => {
              void controller.restore();
            }}
          />
        ) : null}
      </View>
    </AuthScreen>
  );
}
