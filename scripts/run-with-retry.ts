/**
 * CI-only retry wrapper for flaky network-bound e2e tests.
 *
 * Re-runs the child command up to N times when it exits non-zero AND its
 * combined output matches a transient-error pattern (timeouts, fetch failures,
 * DNS, 5xx). Real assertion failures (`✗ ...`, `assertion(s) failed`) are
 * never retried so we don't hide regressions.
 *
 * Usage:  bun run scripts/run-with-retry.ts -- bun run scripts/<test>.ts
 */
import { spawn } from "node:child_process";

const MAX_ATTEMPTS = Number(process.env.CI_RETRY_ATTEMPTS ?? 3);
const RETRY_DELAY_MS = Number(process.env.CI_RETRY_DELAY_MS ?? 5_000);

const TRANSIENT = [
  /ETIMEDOUT/i,
  /ECONNRESET/i,
  /ENETUNREACH/i,
  /EAI_AGAIN/i,
  /fetch failed/i,
  /socket hang up/i,
  /Network request failed/i,
  /\b5\d\d\b/, // 5xx status code in output
];
const HARD_FAIL = [/✗ /, /assertion\(s\) failed/i, /AssertionError/];

const sep = process.argv.indexOf("--");
const cmd = sep >= 0 ? process.argv.slice(sep + 1) : process.argv.slice(2);
if (cmd.length === 0) {
  console.error("usage: run-with-retry.ts -- <command> [args...]");
  process.exit(2);
}

const run = (): Promise<{ code: number; output: string }> =>
  new Promise((resolve) => {
    const child = spawn(cmd[0], cmd.slice(1), { stdio: ["inherit", "pipe", "pipe"] });
    let output = "";
    const pipe = (chunk: Buffer) => {
      const s = chunk.toString();
      output += s;
      process.stdout.write(s);
    };
    child.stdout.on("data", pipe);
    child.stderr.on("data", pipe);
    child.on("close", (code) => resolve({ code: code ?? 1, output }));
  });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  console.log(`\n▶ attempt ${attempt}/${MAX_ATTEMPTS}: ${cmd.join(" ")}`);
  const { code, output } = await run();
  if (code === 0) process.exit(0);

  const hard = HARD_FAIL.some((re) => re.test(output));
  const transient = TRANSIENT.some((re) => re.test(output));
  if (hard || !transient || attempt === MAX_ATTEMPTS) {
    console.error(
      `\n✗ failing (attempt ${attempt}/${MAX_ATTEMPTS}). hard_fail=${hard} transient=${transient}`,
    );
    process.exit(code);
  }
  console.warn(
    `\n↻ transient failure detected (attempt ${attempt}). Retrying in ${RETRY_DELAY_MS}ms…`,
  );
  await sleep(RETRY_DELAY_MS);
}
