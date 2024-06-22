import { PluginCommand } from "../domain/types.ts";
import { title, echo, error } from "../utils/cli.ts";

const which = async (command: string): Promise<string> => {
  const whichCommand = Deno.build.os === "windows" ? "where" : "which";

  const cmd = new Deno.Command(whichCommand, {
    args: [command],
    stdout: "piped",
    stderr: "piped",
  });

  const { success, stdout, stderr } = await cmd.output();
  if (!success) {
    const errorMessage = new TextDecoder().decode(stderr);
    throw new Error(`Command not found: ${command}. Error: ${errorMessage}`);
  }

  return new TextDecoder().decode(stdout).trim();
};

const find = async (name: string, command: string): Promise<boolean> => {
  try {
    const path = await which(command);
    if (path) {
      echo(`\n√ ${name}... Found @ ${path}`);
      return true;
    }
  } catch (_) {
    console.log("Command not found");
  }
  error(`\nx ${name} is a required dependency. Please install it manually.`);
  return false;
};

export const switchSetupPlugin: PluginCommand = {
  name: "setup",
  description: "Performs a system check to locate pre-requisite dependencies.",
  execute: async () => {
    title("Checking System Configuration");
    const gitFound = await find('Git CLI', 'git');
    const ghFound = await find('GitHub CLI', 'gh');

    if (gitFound && ghFound) {
      title("👍 Excellent! You are all set - You can 'Switch' now!\n");
    } else {
      title("⚠️ Caution! One or more dependencies were not found, please install them manually!\n");
    }
  },
};
