import { Command } from "../types.ts";
import { title, echo, error } from "../cli.ts";
import { bold, red } from "https://deno.land/std@0.181.0/fmt/colors.ts";

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

async function ensureCliDependencies(): Promise<boolean> {
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

const switchSetupPlugin: Command = {
  name: "check",
  description: "Performs a system check to locate required dependencies",
  execute: async (args: Record<string, unknown>) => {
    if (args.help) {
      echo("Usage: switch check");
      echo("Performs a system check to locate required dependencies.");
      echo("This command does not take any additional options.");
      return;
    }

    title("Checking System Configuration");
    const allDependenciesInstalled = await ensureCliDependencies();
    if (allDependenciesInstalled) {
      echo("\n👍 Excellent! All required CLIs are installed and configured.");
    } else {
      echo(red("\n⚠️  Critical dependencies are missing. Please install them, make sure you can login and try again.\n"));
      throw new Error();
    }
  }
};

export default switchSetupPlugin;