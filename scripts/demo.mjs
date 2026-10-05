import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const cwd = fileURLToPath(new URL("../", import.meta.url));
const children = [];
let stopping = false;
const env = {
  ...process.env,
  NODE_ENV: "development",
  STUDYQUEST_DEMO: "1",
  STUDYQUEST_FIXTURE_PORT: "54339",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54339",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "local-demo-not-a-real-key",
};

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.pid || child.exitCode !== null) continue;
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
        windowsHide: true,
        stdio: "ignore",
      });
    } else child.kill("SIGTERM");
  }
  process.exitCode = code;
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());

async function available(port) {
  await new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", () =>
      reject(
        new Error(
          `A porta ${port} está ocupada. Encerre a demonstração anterior antes de iniciar outra.`,
        ),
      ),
    );
    probe.listen(port, "127.0.0.1", () => probe.close(resolve));
  });
}
function start(args) {
  const child = spawn(process.execPath, args, {
    cwd,
    env,
    stdio: "inherit",
    windowsHide: true,
  });
  children.push(child);
  child.on("error", (error) => {
    console.error(error.message);
    stop(1);
  });
  child.on("exit", (code) => {
    if (!stopping) stop(code ?? 1);
  });
  return child;
}

try {
  await available(3001);
  await available(54339);
  const backend = start(["tests/supabase-fixture.mjs"]);
  let ready = false;
  for (let attempt = 0; attempt < 100 && !stopping; attempt++) {
    try {
      const response = await fetch("http://127.0.0.1:54339/health", {
        signal: AbortSignal.timeout(1000),
      });
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      /* Wait for the local database to finish loading. */
    }
    if (backend.exitCode !== null) break;
    await delay(200);
  }
  if (!ready)
    throw new Error("Não foi possível iniciar o banco da demonstração.");
  start([
    "node_modules/next/dist/bin/next",
    "dev",
    "--port",
    "3001",
    "--hostname",
    "127.0.0.1",
  ]);
  console.log(
    "\nDemonstração: http://127.0.0.1:3001/login\nClique em Explorar demonstração. Ctrl+C encerra e apaga os dados fictícios.\nSeu .env.local não foi alterado.\n",
  );
} catch (error) {
  console.error(error.message);
  stop(1);
}
