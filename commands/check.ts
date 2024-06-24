import { Command } from "../types.ts";
import { runShellCommand, title, echo } from "../cli.ts";
import { red, bold, green } from "https://deno.land/std@0.181.0/fmt/colors.ts";

const ensureCliDependencies = async (): Promise<boolean> => {
  const checks = [
    () => runShellCommand("git", ["--version"], '', `${bold('git')} is not installed or you're not logged in.`),
    () => runShellCommand("gh", ["auth", "status"], '', `${bold('gh')} is not installed or you're not logged in.`),
    // () => runShellCommand("az", ["account", "show"], '', `${bold('az')} is not installed or you're not logged in.`),
  ];

  for (const check of checks) {
    const result = await check();
    if (!result.ok) {
      return false;
    }
  }
  return true;
};

const showCheckHelp = () => {
  echo(`Usage: switch check`);
  echo("Performs a system check to locate required dependencies");
  echo("\nOptions:");
  echo("  -h, --help".padEnd(20) + "Show help for this command");
  echo("\nExamples:");
  echo("  switch check");
  echo("\nThis command checks for the following dependencies:");
  echo("  - git: Version control system");
  echo("  - gh: GitHub CLI tool");
  echo("  - az: Azure CLI tool");
};

const switchCheckCommand: Command = {
  name: "check",
  description: "Performs a system check to locate required dependencies",
  usage: "switch check",
  options: [
    { flags: "-h, --help", description: "Show help for this command" },
  ],
  examples: [
    "switch check",
  ],
  execute: async (args: Record<string, unknown>) => {
    if (
      args.help === true ||
      args.h === true ||
      (Array.isArray(args._) && (args._.includes("help") || args._.includes("--help")))
    ) {
      showCheckHelp();
      return;
    }

    title("Checking System Configuration");
    const allDependenciesInstalled = await ensureCliDependencies();
    if (allDependenciesInstalled) {
      echo(green("\n👍 Excellent! All required Switch CLI dependencies are installed and configured."));
    } else {
      echo(red("\n⚠️  Critical dependencies are missing. Please install them, make sure you can login and try again.\n"));
      Deno.exit(1);
    }
  }
};

export default switchCheckCommand;