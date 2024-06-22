import { Command } from "../types.ts";
import { title, echo } from "../cli.ts";
import { red } from "https://deno.land/std@0.181.0/fmt/colors.ts";
import { ensureCliDependencies } from "../utils/ensure-dependencies.ts";

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