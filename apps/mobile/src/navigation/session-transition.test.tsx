import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { useState, type ReactElement } from "react";
import { Text, TextInput, View } from "react-native";
import { hide } from "expo-splash-screen";
import { MirrorApiError } from "@mirror/api-client";
import type { LoginResult, MirrorClient } from "@mirror/api-client";
import type { BrandTransitionProps } from "../design-system/feedback/brand-transition";
import {
  encodeRefreshCredential,
  type RefreshCredentialStore,
} from "../platform/session/refresh-credential";
import {
  createSessionController,
  type SessionController,
} from "../platform/session/session-controller";
import { SessionProvider, useSession } from "../platform/session/session-provider";
import { SessionTransition } from "./session-transition";

const mockTransitions: BrandTransitionProps[] = [];

// Control only completion of the visual boundary. Native animation timing,
// motion preference, and rendering remain separate device checks.
jest.mock("../design-system/feedback/brand-transition", () => {
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    BrandTransition: (props: BrandTransitionProps): ReactElement => {
      mockTransitions.push(props);
      return <View testID="brand-transition" />;
    },
  };
});

jest.mock("expo-splash-screen", () => ({ hide: jest.fn<() => void>() }));

const environmentId = "https://mirror.example.invalid";
const now = 1_800_000_000_000;

interface SyntheticStore extends RefreshCredentialStore {
  value: string | null;
}

interface TransitionHarness {
  readonly controller: SessionController;
  readonly login: ReturnType<typeof jest.fn<MirrorClient["login"]>>;
  readonly refreshSession: ReturnType<typeof jest.fn<MirrorClient["refreshSession"]>>;
  readonly tree: ReactElement;
}

function deferred<Value>(): {
  readonly promise: Promise<Value>;
  readonly resolve: (value: Value) => void;
  readonly reject: (error: Error) => void;
} {
  let fulfill: ((value: Value) => void) | undefined;
  let fail: ((error: Error) => void) | undefined;
  const promise = new Promise<Value>((resolve, reject) => {
    fulfill = resolve;
    fail = reject;
  });
  return {
    promise,
    resolve: (value) => {
      if (!fulfill) throw new Error("Deferred response was not initialized.");
      fulfill(value);
    },
    reject: (error) => {
      if (!fail) throw new Error("Deferred failure was not initialized.");
      fail(error);
    },
  };
}

function sessionResult(sessionId = "synthetic-session"): LoginResult {
  const expiresAt = now / 1_000 + 3_600;
  return {
    accessToken: `synthetic-access-${sessionId}`,
    refreshToken: `synthetic-refresh-${sessionId}`,
    expiresAt,
    identity: { userId: "synthetic-user", sessionId, expiresAt },
  };
}

function LoginDraft(): ReactElement {
  const [value, setValue] = useState("");
  return <TextInput accessibilityLabel="Email draft" value={value} onChangeText={setValue} />;
}

function SessionContent(): ReactElement {
  const { session } = useSession();
  return (
    <View testID="session-content">
      {session.status === "authenticated" ? (
        <Text accessibilityRole="header">Authorized workspace</Text>
      ) : (
        <LoginDraft />
      )}
    </View>
  );
}

function transitionHarness(initialCredential: string | null = null): TransitionHarness {
  const login = jest.fn<MirrorClient["login"]>().mockResolvedValue(sessionResult());
  const refreshSession = jest
    .fn<MirrorClient["refreshSession"]>()
    .mockResolvedValue(sessionResult());
  const store: SyntheticStore = {
    value: initialCredential,
    read: async () => store.value,
    write: async (value) => {
      store.value = value;
    },
    remove: async () => {
      store.value = null;
    },
  };
  const controller = createSessionController({
    client: {
      login,
      refreshSession,
      logout: jest.fn<MirrorClient["logout"]>().mockResolvedValue({ success: true }),
    },
    store,
    environmentId,
    now: () => now,
    onIdentityChange: async () => undefined,
  });
  return {
    controller,
    login,
    refreshSession,
    tree: (
      <SessionProvider controller={controller}>
        <SessionTransition>
          <SessionContent />
        </SessionTransition>
      </SessionProvider>
    ),
  };
}

function latestTransition(): BrandTransitionProps {
  const transition = mockTransitions.at(-1);
  if (!transition) throw new Error("No transition has rendered.");
  return transition;
}

async function revealCurrentDestination(): Promise<void> {
  const { destination, ready, onRevealed } = latestTransition();
  if (!ready || destination === null) throw new Error("The destination is not ready to reveal.");
  await act(() => onRevealed(destination));
}

describe("session transition", () => {
  beforeEach(() => {
    mockTransitions.length = 0;
  });

  it("waits for layout, actual credential restoration, and transition completion before exposing content", async () => {
    const response = deferred<LoginResult>();
    const harness = transitionHarness(
      encodeRefreshCredential(environmentId, "synthetic-stored-refresh"),
    );
    harness.refreshSession.mockReturnValue(response.promise);
    const view = await render(harness.tree);
    expect(hide).not.toHaveBeenCalled();
    expect(view.queryByLabelText("Email draft")).toBeNull();
    expect(latestTransition()).toMatchObject({
      destination: null,
      ready: false,
      signingIn: false,
      minimumDuration: 1600,
    });

    await fireEvent(view.getByTestId("session-content", { includeHiddenElements: true }), "layout");
    expect(hide).toHaveBeenCalledTimes(1);
    await fireEvent(view.getByTestId("session-content", { includeHiddenElements: true }), "layout");
    expect(hide).toHaveBeenCalledTimes(1);
    expect(latestTransition().ready).toBe(false);
    await waitFor(() => expect(harness.refreshSession).toHaveBeenCalledTimes(1));

    await act(async () => {
      response.resolve(sessionResult());
      await harness.controller.restore();
    });
    expect(harness.controller.getSnapshot().status).toBe("authenticated");
    expect(latestTransition().ready).toBe(true);
    expect(view.queryByRole("header", { name: "Authorized workspace" })).toBeNull();
    expect(
      view.getByRole("header", { name: "Authorized workspace", includeHiddenElements: true }),
    ).not.toBeVisible();

    await revealCurrentDestination();
    expect(view.getByRole("header", { name: "Authorized workspace" })).toBeVisible();
    expect(view.queryByTestId("brand-transition")).toBeNull();
  });

  it("keeps an already restored destination hidden until native layout and reveal complete", async () => {
    const harness = transitionHarness();
    const view = await render(harness.tree);
    expect(harness.controller.getSnapshot().status).toBe("signed-out");
    expect(latestTransition()).toMatchObject({ destination: "sign-in", ready: false });
    expect(hide).not.toHaveBeenCalled();
    expect(view.queryByLabelText("Email draft")).toBeNull();

    await fireEvent(view.getByTestId("session-content", { includeHiddenElements: true }), "layout");
    expect(hide).toHaveBeenCalledTimes(1);
    expect(latestTransition().ready).toBe(true);
    expect(view.queryByLabelText("Email draft")).toBeNull();
    await revealCurrentDestination();
    expect(view.getByLabelText("Email draft")).toBeVisible();
  });

  it("preserves the mounted login draft through a pending request and rejected access", async () => {
    const response = deferred<LoginResult>();
    const harness = transitionHarness();
    harness.login.mockReturnValue(response.promise);
    const view = await render(harness.tree);
    await fireEvent(view.getByTestId("session-content", { includeHiddenElements: true }), "layout");
    await revealCurrentDestination();
    await fireEvent.changeText(view.getByLabelText("Email draft"), "ana@example.invalid");
    let signingIn = Promise.resolve();
    await act(() => {
      signingIn = harness.controller.signIn("ana@example.invalid", "synthetic-password");
    });
    expect(latestTransition()).toMatchObject({
      ready: false,
      signingIn: true,
      minimumDuration: 650,
    });
    expect(view.queryByLabelText("Email draft")).toBeNull();
    expect(view.getByLabelText("Email draft", { includeHiddenElements: true })).toHaveDisplayValue(
      "ana@example.invalid",
    );

    await act(async () => {
      response.reject(new MirrorApiError(401, "UNAUTHORIZED", "synthetic-request", "Rejected"));
      await signingIn;
    });
    expect(harness.controller.getSnapshot()).toMatchObject({
      status: "signed-out",
      reason: "invalid",
    });
    expect(view.getByLabelText("Email draft")).toHaveDisplayValue("ana@example.invalid");
    expect(view.queryByRole("header", { name: "Authorized workspace" })).toBeNull();
    expect(view.queryByTestId("brand-transition")).toBeNull();
  });

  it("does not reveal authenticated content when a resolved sign-in contains an invalid session", async () => {
    const harness = transitionHarness();
    harness.login.mockResolvedValue({ ...sessionResult(), accessToken: "" });
    const view = await render(harness.tree);
    await fireEvent(view.getByTestId("session-content", { includeHiddenElements: true }), "layout");
    await revealCurrentDestination();
    await act(async () => {
      await harness.controller.signIn("ana@example.invalid", "synthetic-password");
    });
    expect(harness.controller.getSnapshot()).toMatchObject({
      status: "unavailable",
      reason: "response-invalid",
    });
    expect(view.getByLabelText("Email draft")).toBeVisible();
    expect(view.queryByRole("header", { name: "Authorized workspace" })).toBeNull();
  });

  it("covers a newly authenticated scope until its matching transition completes", async () => {
    const harness = transitionHarness();
    const view = await render(harness.tree);
    await fireEvent(view.getByTestId("session-content", { includeHiddenElements: true }), "layout");
    await revealCurrentDestination();
    await act(async () => {
      await harness.controller.signIn("ana@example.invalid", "synthetic-password");
    });
    const session = harness.controller.getSnapshot();
    if (session.status !== "authenticated")
      throw new Error("Expected a verified synthetic session.");
    expect(latestTransition()).toMatchObject({
      destination: session.scopeKey,
      ready: true,
      signingIn: false,
      minimumDuration: 650,
    });
    expect(view.queryByRole("header", { name: "Authorized workspace" })).toBeNull();
    await revealCurrentDestination();
    expect(view.getByRole("header", { name: "Authorized workspace" })).toBeVisible();
    expect(view.queryByLabelText("Email draft", { includeHiddenElements: true })).toBeNull();
  });

  it("ignores an old authenticated reveal after logout changes the destination", async () => {
    const harness = transitionHarness();
    const view = await render(harness.tree);
    await fireEvent(view.getByTestId("session-content", { includeHiddenElements: true }), "layout");
    await revealCurrentDestination();
    await act(async () => {
      await harness.controller.signIn("ana@example.invalid", "synthetic-password");
    });
    const oldTransition = latestTransition();
    if (oldTransition.destination === null)
      throw new Error("Expected an authenticated destination.");
    const oldDestination = oldTransition.destination;
    await act(async () => {
      await harness.controller.signOut();
      oldTransition.onRevealed(oldDestination);
    });
    expect(view.getByLabelText("Email draft")).toBeVisible();
    expect(view.queryByRole("header", { name: "Authorized workspace" })).toBeNull();
    expect(view.queryByTestId("brand-transition")).toBeNull();
  });

  it("ignores an initial reveal while a new login is pending and still waits for its destination", async () => {
    const response = deferred<LoginResult>();
    const harness = transitionHarness();
    harness.login.mockReturnValue(response.promise);
    const view = await render(harness.tree);
    await fireEvent(view.getByTestId("session-content", { includeHiddenElements: true }), "layout");
    const oldTransition = latestTransition();
    let signingIn = Promise.resolve();
    await act(() => {
      signingIn = harness.controller.signIn("ana@example.invalid", "synthetic-password");
      oldTransition.onRevealed("sign-in");
    });
    expect(view.queryByLabelText("Email draft")).toBeNull();
    expect(latestTransition()).toMatchObject({
      ready: false,
      signingIn: true,
      minimumDuration: 1600,
    });
    await act(async () => {
      response.resolve(sessionResult("new-session"));
      await signingIn;
    });
    expect(latestTransition()).toMatchObject({ ready: true, minimumDuration: 1600 });
    expect(view.queryByRole("header", { name: "Authorized workspace" })).toBeNull();
    await revealCurrentDestination();
    expect(view.getByRole("header", { name: "Authorized workspace" })).toBeVisible();
  });

  it("keeps the revealed workspace available throughout a refresh of the same scope", async () => {
    const response = deferred<LoginResult>();
    const harness = transitionHarness();
    await harness.controller.signIn("ana@example.invalid", "synthetic-password");
    const view = await render(harness.tree);
    await fireEvent(view.getByTestId("session-content", { includeHiddenElements: true }), "layout");
    await revealCurrentDestination();
    harness.refreshSession.mockReturnValue(response.promise);
    let refreshing = Promise.resolve();
    await act(() => {
      refreshing = harness.controller.refresh();
    });
    await waitFor(() => expect(harness.refreshSession).toHaveBeenCalledTimes(1));
    expect(view.getByRole("header", { name: "Authorized workspace" })).toBeVisible();
    expect(view.queryByTestId("brand-transition")).toBeNull();
    await act(async () => {
      response.resolve(sessionResult());
      await refreshing;
    });
    expect(view.getByRole("header", { name: "Authorized workspace" })).toBeVisible();
    expect(view.queryByTestId("brand-transition")).toBeNull();
    expect(hide).toHaveBeenCalledTimes(1);
  });
});
