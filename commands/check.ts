import { Command } from "../types.ts";
import { title, echo, error } from "../cli.ts";

const which = async (name: string, command: string): Promise<boolean> => {
  const whichCommand = Deno.build.os === "windows" ? "where" : "which";

  const cmd = new Deno.Command(whichCommand, {
    args: [command],
    stdout: "piped",
    stderr: "piped",
  });

  const { success, stdout, stderr } = await cmd.output();
  if (success) {
    echo(`\n√ ${name}... Found @ ${new TextDecoder().decode(stdout).trim()}`);
    return true;
  }
  error(`\nx Command ${name} not found. Error: ${new TextDecoder().decode(stderr)}`);
  return false;
};

const switchSetupPlugin: Command = {
  name: "check",
  description: "Performs a system check to locate required dependencies.",
  execute: async (args: Record<string, unknown>) => {
    if (args.help) {
      echo("Usage: switch check");
      echo("Performs a system check to locate required dependencies.");
      echo("This command does not take any additional options.");
      return;
    }

    title("Checking System Configuration");
    const gitFound = await which('Git CLI', 'git');
    const ghFound = await which('GitHub CLI', 'gh');

    if (gitFound && ghFound) {
      title("👍 Excellent! You are all set - You can start onboarding to 'Switch' now!\n");
    } else {
      title(`⚠️ Caution! One or all dependencies were not found, please install them before continuing!\n`);
    }
  }
};

export default switchSetupPlugin;