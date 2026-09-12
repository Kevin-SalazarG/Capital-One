import { spawn } from "node:child_process";

const children = [
  spawn("pnpm", ["--filter", "@colchon/api", "start:dev"], {
    stdio: "inherit",
  }),
  spawn("pnpm", ["--filter", "@colchon/web", "dev"], { stdio: "inherit" }),
];
let stopping = false;
function stop(signal = "SIGTERM") {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (child.exitCode === null) child.kill(signal);
}
process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop());
for (const child of children) {
  child.on("error", (error) => {
    console.error(error.message);
    process.exitCode = 1;
    stop();
  });
  child.on("exit", (code) => {
    if (!stopping) {
      process.exitCode = code ?? 1;
      stop();
    }
  });
}
