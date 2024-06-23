import { Command } from "../types.ts";
import { runShellCommand, title, echo } from "../cli.ts";
import { red, bold } from "https://deno.land/std@0.181.0/fmt/colors.ts";

async function ensureCliDependencies(): Promise<boolean> {
  const checks = [
    await runShellCommand("git", ["--version"], '', `${bold('git')} is not installed or you're not logged in.`),
    await runShellCommand("gh", ["auth", "status"], '', `${bold('gh')} is not installed or you're not logged in.`),
    await runShellCommand("az", ["account", "show"], '', `${bold('az')} is not installed or you're not logged in.`),
  ];

  // Use `Promise.all` to wait for all checks to complete, if any of the checks failed, return false
  const results = await Promise.all(checks);
  if (results.includes(false)) {
    echo(`\n${results}`)
    return false;
  }
  return true;
}
const switchCheckCommand: Command = {
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

export default switchCheckCommand;