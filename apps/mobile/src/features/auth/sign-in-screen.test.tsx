import { beforeAll, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import type { ReactElement, ReactNode } from "react";
import { MirrorApiError, MirrorClient } from "@mirror/api-client";
import { Uniwind } from "uniwind";
import { DesignSystemProvider } from "../../design-system/design-system-provider";
import { RuntimeProvider } from "../../platform/api/mirror-client";
import { createQueryClient } from "../../platform/query/query-client";
import type { RefreshCredentialStore } from "../../platform/session/refresh-credential";
import { createSessionController } from "../../platform/session/session-controller";
import { SessionProvider } from "../../platform/session/session-provider";
import { SignInScreen } from "./sign-in-screen";

jest.mock("../../platform/session/secure-session-store", () => ({
  createSecureSessionStore: (): never => {
    throw new Error("Form tests provide an isolated session store.");
  },
}));

// The form test uses real inputs, RHF, validation, and session coordination;
// device keyboard and safe-area behavior are verified by the native journey.
jest.mock("../../design-system/layout/auth-screen", () => {
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    AuthScreen: ({ children }: { readonly children: ReactNode }): ReactElement => (
      <View>{children}</View>
    ),
  };
});

interface SignInHarness {
  readonly login: ReturnType<typeof jest.fn<MirrorClient["login"]>>;
  readonly tree: ReactElement;
}

function pendingRequest(): {
  readonly promise: Promise<void>;
  readonly complete: () => void;
} {
  let release: (() => void) | undefined;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return {
    promise,
    complete: () => {
      if (!release) throw new Error("Pending request was not initialized.");
      release();
    },
  };
}

function signInHarness(loginGate?: Promise<void>): SignInHarness {
  const now = 1_800_000_000_000;
  const expiresAt = now / 1_000 + 3_600;
  const login = jest.fn<MirrorClient["login"]>().mockImplementation(async () => {
    await loginGate;
    return {
      accessToken: "synthetic-access",
      refreshToken: "synthetic-refresh",
      expiresAt,
      identity: { userId: "synthetic-user", sessionId: "synthetic-session", expiresAt },
    };
  });
  const store: RefreshCredentialStore = {
    read: jest.fn<RefreshCredentialStore["read"]>().mockResolvedValue(null),
    write: jest.fn<RefreshCredentialStore["write"]>().mockResolvedValue(undefined),
    remove: jest.fn<RefreshCredentialStore["remove"]>().mockResolvedValue(undefined),
  };
  const apiUrl = "https://mirror.example.invalid";
  const controller = createSessionController({
    client: {
      login,
      refreshSession: jest.fn<MirrorClient["refreshSession"]>(),
      logout: jest.fn<MirrorClient["logout"]>().mockResolvedValue({ success: true }),
    },
    store,
    environmentId: apiUrl,
    now: () => now,
    onIdentityChange: async () => undefined,
  });
  return {
    login,
    tree: (
      <RuntimeProvider
        runtime={{
          client: new MirrorClient({ baseUrl: apiUrl }),
          session: controller,
          queries: createQueryClient(),
          config: { apiUrl, localDevelopment: false },
        }}
      >
        <SessionProvider controller={controller}>
          <DesignSystemProvider>
            <SignInScreen />
          </DesignSystemProvider>
        </SessionProvider>
      </RuntimeProvider>
    ),
  };
}

describe("sign-in form", () => {
  beforeAll(() => {
    // Jest bypasses Metro's CSS transform; these inert interaction tokens do
    // not establish native styling or theme correctness.
    const interactionTokens = {
      "--theme": "default",
      "--color-accent-hover": "#000000",
      "--color-default-hover": "#000000",
      "--color-danger-hover": "#000000",
      "--color-danger-soft-hover": "#000000",
      "--auth-muted": "#000000",
      "--auth-action-foreground": "#000000",
      "--auth-action-pressed": "#000000",
    };
    Uniwind.updateCSSVariables("light", interactionTokens);
    Uniwind.updateCSSVariables("dark", interactionTokens);
  });

  it.each(["button", "keyboard"])(
    "rejects invalid submission from the %s and updates errors as fields change",
    async (submissionSource) => {
      const { login, tree } = signInHarness();
      const view = await render(tree);
      if (submissionSource === "button") {
        await fireEvent.press(view.getByRole("button", { name: "Entrar" }));
      } else {
        await fireEvent(view.getByLabelText("Contraseña"), "submitEditing");
      }
      expect(view.getByText("Escribe un correo válido.")).toBeDefined();
      expect(view.getByText("Escribe al menos 8 caracteres.")).toBeDefined();
      expect(login).not.toHaveBeenCalled();

      await fireEvent.changeText(view.getByLabelText("Correo electrónico"), "ana@example.invalid");
      await waitFor(() => expect(view.queryByText("Escribe un correo válido.")).toBeNull());
      expect(view.getByText("Escribe al menos 8 caracteres.")).toBeDefined();
      await fireEvent.changeText(view.getByLabelText("Contraseña"), "short");
      await fireEvent.press(view.getByRole("button", { name: "Entrar" }));
      expect(login).not.toHaveBeenCalled();

      await fireEvent.changeText(view.getByLabelText("Contraseña"), "synthetic-password");
      await waitFor(() => expect(view.queryByText("Escribe al menos 8 caracteres.")).toBeNull());
    },
  );

  it("waits for blur before showing field errors and clears them as values are corrected", async () => {
    const { login, tree } = signInHarness();
    const view = await render(tree);
    await fireEvent.changeText(view.getByLabelText("Correo electrónico"), "ana");
    await fireEvent.changeText(view.getByLabelText("Contraseña"), "short");
    expect(view.queryByText("Escribe un correo válido.")).toBeNull();
    expect(view.queryByText("Escribe al menos 8 caracteres.")).toBeNull();

    await fireEvent(view.getByLabelText("Correo electrónico"), "blur");
    expect(await view.findByText("Escribe un correo válido.")).toHaveProp(
      "accessibilityLiveRegion",
      "polite",
    );
    expect(view.queryByText("Escribe al menos 8 caracteres.")).toBeNull();
    await fireEvent(view.getByLabelText("Contraseña"), "blur");
    expect(await view.findByText("Escribe al menos 8 caracteres.")).toHaveProp(
      "accessibilityLiveRegion",
      "polite",
    );

    await fireEvent.changeText(view.getByLabelText("Correo electrónico"), "ana@example.invalid");
    await fireEvent.changeText(view.getByLabelText("Contraseña"), "synthetic-password");
    await waitFor(() => {
      expect(view.queryByText("Escribe un correo válido.")).toBeNull();
      expect(view.queryByText("Escribe al menos 8 caracteres.")).toBeNull();
    });
    expect(login).not.toHaveBeenCalled();
  });

  it("starts with a hidden password and preserves its value when visibility changes", async () => {
    const { tree } = signInHarness();
    const view = await render(tree);
    expect(view.getByLabelText("Contraseña")).toHaveProp("secureTextEntry", true);
    await fireEvent.changeText(view.getByLabelText("Contraseña"), "synthetic-password");

    await fireEvent.press(view.getByRole("button", { name: "Mostrar contraseña" }));
    expect(view.getByLabelText("Contraseña")).toHaveProp("secureTextEntry", false);
    expect(view.getByLabelText("Contraseña")).toHaveDisplayValue("synthetic-password");
    await fireEvent.press(view.getByRole("button", { name: "Ocultar contraseña" }));
    expect(view.getByLabelText("Contraseña")).toHaveProp("secureTextEntry", true);
    expect(view.getByLabelText("Contraseña")).toHaveDisplayValue("synthetic-password");
  });

  it("configures email continuation and password submission without submitting from email", async () => {
    const { login, tree } = signInHarness();
    const view = await render(tree);
    expect(view.getByLabelText("Correo electrónico")).toHaveProp("returnKeyType", "next");
    expect(view.getByLabelText("Correo electrónico")).toHaveProp("submitBehavior", "submit");
    expect(view.getByLabelText("Contraseña")).toHaveProp("returnKeyType", "go");
    expect(view.getByLabelText("Contraseña")).toHaveProp("submitBehavior", "blurAndSubmit");

    await fireEvent.changeText(view.getByLabelText("Correo electrónico"), "ana@example.invalid");
    await fireEvent.changeText(view.getByLabelText("Contraseña"), "synthetic-password");
    await fireEvent(view.getByLabelText("Correo electrónico"), "submitEditing");
    expect(login).not.toHaveBeenCalled();
    expect(view.getByLabelText("Contraseña")).toHaveDisplayValue("synthetic-password");
  });

  it.each(["button", "keyboard"])(
    "submits exact values once from the %s and prevents additional pending requests",
    async (submissionSource) => {
      const request = pendingRequest();
      const { login, tree } = signInHarness(request.promise);
      const view = await render(tree);
      await fireEvent.changeText(view.getByLabelText("Correo electrónico"), "ana@example.invalid");
      await fireEvent.changeText(view.getByLabelText("Contraseña"), "synthetic-password");
      if (submissionSource === "button") {
        await fireEvent.press(view.getByRole("button", { name: "Entrar" }));
      } else {
        await fireEvent(view.getByLabelText("Contraseña"), "submitEditing");
      }
      await waitFor(() => expect(login).toHaveBeenCalledTimes(1));
      expect(login.mock.calls[0]?.[0]).toEqual({
        email: "ana@example.invalid",
        password: "synthetic-password",
      });
      expect(view.getByText("Entrando…")).toBeDefined();
      expect(view.getByRole("button", { name: "Entrar", busy: true })).toBeDisabled();
      expect(view.getByLabelText("Contraseña")).toHaveDisplayValue("synthetic-password");

      await fireEvent.press(view.getByRole("button", { name: "Entrar" }));
      await fireEvent(view.getByLabelText("Contraseña"), "submitEditing");
      await fireEvent.press(view.getByRole("button", { name: "Entrar" }));
      expect(login).toHaveBeenCalledTimes(1);

      await act(async () => {
        request.complete();
        await request.promise;
      });
      await waitFor(() => expect(view.getByLabelText("Contraseña")).toHaveDisplayValue(""));
      expect(view.getByLabelText("Correo electrónico")).toHaveDisplayValue("ana@example.invalid");
      expect(view.getByRole("button", { name: "Entrar", busy: false })).toBeEnabled();
      expect(view.queryByText("Entrando…")).toBeNull();
      expect(login).toHaveBeenCalledTimes(1);
    },
  );

  it("shows rejected access safely and clears the password for a fresh attempt", async () => {
    const { login, tree } = signInHarness();
    login.mockRejectedValue(
      new MirrorApiError(401, "UNAUTHORIZED", "synthetic-request", "sensitive-provider-response"),
    );
    const view = await render(tree);
    await fireEvent.changeText(view.getByLabelText("Correo electrónico"), "ana@example.invalid");
    await fireEvent.changeText(view.getByLabelText("Contraseña"), "synthetic-password");
    await fireEvent.press(view.getByRole("button", { name: "Entrar" }));
    expect(await view.findByText("Revisa tu correo y contraseña.")).toBeDefined();
    expect(view.queryByText("sensitive-provider-response")).toBeNull();
    expect(view.getByLabelText("Contraseña")).toHaveDisplayValue("");
  });
});
