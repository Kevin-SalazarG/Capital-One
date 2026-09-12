import { focusManager, onlineManager } from "@tanstack/react-query";
import { AppState } from "react-native";
import * as Network from "expo-network";
import { useEffect } from "react";

export function useAppLifecycle(): void {
  useEffect(() => {
    let active = true;
    let receivedEvent = false;
    const connection = Network.addNetworkStateListener((state) => {
      receivedEvent = true;
      onlineManager.setOnline(state.isConnected !== false && state.isInternetReachable !== false);
    });
    void Network.getNetworkStateAsync()
      .then((state) => {
        if (active && !receivedEvent)
          onlineManager.setOnline(
            state.isConnected !== false && state.isInternetReachable !== false,
          );
      })
      .catch(() => {
        /* Requests remain authoritative when connectivity cannot be read. */
      });
    focusManager.setFocused(AppState.currentState === "active");
    const foreground = AppState.addEventListener("change", (state) =>
      focusManager.setFocused(state === "active"),
    );
    return () => {
      active = false;
      connection.remove();
      foreground.remove();
    };
  }, []);
}
