import * as SecureStore from "expo-secure-store";
import type { RefreshCredentialStore } from "./refresh-credential";

const credentialKey = "mirror.session.refresh.v1";
const secureOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export function createSecureSessionStore(): RefreshCredentialStore {
  return {
    read: () => SecureStore.getItemAsync(credentialKey, secureOptions),
    write: (value) => SecureStore.setItemAsync(credentialKey, value, secureOptions),
    remove: () => SecureStore.deleteItemAsync(credentialKey, secureOptions),
  };
}
