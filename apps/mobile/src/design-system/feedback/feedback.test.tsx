import { beforeAll, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import { MirrorApiError } from "@mirror/api-client";
import { Uniwind } from "uniwind";
import { apiErrorMessage } from "../../platform/api/api-error";
import { DesignSystemProvider } from "../design-system-provider";
import { Button } from "../primitives/button";
import { InlineNotice } from "./inline-notice";

describe("foundation feedback controls", () => {
  beforeAll(() => {
    // Jest does not compile Metro CSS. These inert tokens support interaction
    // tests; native builds verify application styling and theme colors.
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

  it("dispatches an enabled button interaction and rejects duplicate presses while busy", async () => {
    const onPress = jest.fn<() => void>();
    const view = await render(
      <DesignSystemProvider>
        <Button label="Reintentar consulta" onPress={onPress} />
      </DesignSystemProvider>,
    );
    await fireEvent.press(view.getByRole("button", { name: "Reintentar consulta" }));
    expect(onPress).toHaveBeenCalledTimes(1);
    await view.rerender(
      <DesignSystemProvider>
        <Button label="Reintentar consulta" onPress={onPress} busy />
      </DesignSystemProvider>,
    );
    await fireEvent.press(view.getByRole("button", { name: "Reintentar consulta" }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(view.getByText("Un momento…")).toBeDefined();
  });

  it("renders a readable API outage message without exposing provider details", async () => {
    const error = new MirrorApiError(
      503,
      "AUTH_UNAVAILABLE",
      "synthetic-request-id",
      "synthetic-sensitive-provider-payload",
    );
    const view = await render(<InlineNotice message={apiErrorMessage(error)} danger />);
    expect(view.getByText("Mirror no está disponible en este momento.")).toBeDefined();
    expect(view.queryByText("synthetic-sensitive-provider-payload")).toBeNull();
  });
});
