import { error } from "../cli.ts";
import { bold } from "https://deno.land/std@0.181.0/fmt/colors.ts";

async function checkDependency(cmd: string, args: string[]): Promise<boolean> {
  try {
    const process = new Deno.Command(cmd, {
      args: args,
      stdout: "piped",
      stderr: "piped",
    });

    const { code } = await process.output();
    if (code !== 0) {
      error(`${cmd} check failed!`);
      return false;
    }
  } catch (_) {
    error(`${bold(cmd)} is not installed or you're not logged in.`);
    return false;
  }
  return true;
}
export async function ensureCliDependencies(): Promise<boolean> {
  const checks = [
    checkDependency("git", ["--version"]),
    checkDependency("gh", ["auth", "status"]),
    // checkDependency("az", ["account", "show"]),
  ];

  // Use `Promise.all` to wait for all checks to complete
  const results = await Promise.all(checks);

  // If any of the checks failed, return false
  if (results.includes(false)) {
    return false;
  }
  return true;
}
