import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/nessie.ts", "src/models/*.ts", "src/errors/nessie-errors.ts"],
  format: ["esm", "cjs"],
  target: "node22",
  platform: "node",
  dts: true,
  sourcemap: true,
  splitting: true,
  clean: true,
  treeshake: true,
});
