import { readMobileConfig } from "./mobile-config";

describe("public API configuration", () => {
  it("allows loopback only in development and rejects embedded secrets and route prefixes", () => {
    expect(readMobileConfig("http://127.0.0.1:3000", true).localDevelopment).toBe(true);
    for (const value of [
      "http://127.0.0.1:3000",
      "https://api.example/v1",
      "https://secret@api.example",
      "https://api.example?key=secret",
    ]) {
      expect(() => readMobileConfig(value, false)).toThrow();
    }
    expect(readMobileConfig("https://api.example/", false).apiUrl).toBe("https://api.example");
  });
});
