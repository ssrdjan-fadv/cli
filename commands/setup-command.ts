// plugins/switch_setup.ts

import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import { PluginCommand } from "../domain/plugin-interface.ts";
import $ from "https://deno.land/x/dax/mod.ts";
import chalk from "npm:chalk";
import { title, echo, error } from "../utils/cli.ts";

interface CLI {
  which: () => string;
  gh: () => string;
  git: () => string;
}

interface OS {
  find: (name: string, command: keyof CLI) => Promise<boolean>;
}

function createOS(): OS {
  const CLI: CLI = {
    which: () => Deno.build.os === "windows" ? "where" : "which",
    gh: () => Deno.build.os === "windows" ? "GitHub.cli" : "gh",
    git: () => Deno.build.os === "windows" ? "Git.cli" : "git",
  };

  async function invokePackageManager(): Promise<string> {
    if (Deno.build.os === "windows") return `"${await where("winget")}" install --id `;
    if (Deno.build.os === "darwin") return "brew install ";
    return "apt update && apt install ";
  }

  async function where(arg: string): Promise<string> {
    return await run(CLI.which(), arg);
  }

  async function run(cmd: string, arg: string): Promise<string> {
    try {
      return await $`${cmd} ${arg}`.text();
    } catch (_) {
      return "";
    }
  }

  async function find(name: string, command: keyof CLI): Promise<boolean> {
    const pathOfCommand = await where(CLI[command]());
    if (pathOfCommand.includes(CLI[command]())) {
      echo(chalk.green(`\n√ ${name}... Found @ ${pathOfCommand}`));
      return true;
    } else {
      error(`\nx ${name} is a required dependency. You can install it for your platform with the below command.`);
      echo(`${await invokePackageManager()} ${CLI[command]()}`);
      return false;
    }
  }

  return { find };
}

const switchSetupPlugin: PluginCommand = {
  name: "setup",
  description: "Performs a system check to locate pre-requisite dependencies.",
  createCommand: () => {
    const command = new Command()
      .description("Performs a system check to locate pre-requisite dependencies.")
      .example("switch setup", "Checks the system configuration and installs any missing dependencies.");

    const OS = createOS();

    async function run(): Promise<void> {
      title("Checking System Configuration");
      const gitFound = await OS.find('Git CLI', 'git');
      const ghFound = await OS.find('GitHub CLI', 'gh');

      if (gitFound && ghFound) {
        title("👍 Excellent! You are all set - You can 'Switch' now!\n");
      } else {
        title("⚠️ Caution! One or more dependencies were not found, please run the switch installer again!\n");
      }
    }

    command.action(run);
    return command;
  },
};

export default switchSetupPlugin;