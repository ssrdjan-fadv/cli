import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import $ from "https://deno.land/x/dax/mod.ts";
import chalk from "npm:chalk";
import { title, echo, error } from "./cli.ts";

const createOS = () => {
  const CLI = {
    which: () => Deno.build.os === "windows" ? "where" : "which",
    gh: () => Deno.build.os === "windows" ? "GitHub.cli" : "gh",
    git: () => Deno.build.os === "windows" ? "Git.cli" : "git",
  };

  const invokePackageManager = async () => {
    if (Deno.build.os === "windows") return `"${await where("winget")}" install --id `;
    if (Deno.build.os === "darwin") return "brew install ";
    return "apt update && apt install ";
  };

  const where = async (arg: string) => await run(CLI.which(), arg);

  const run = async (cmd: string, arg: string): Promise<string> => {
    try {
      return await $`${cmd} ${arg}`.text();
    } catch (_) {
      return "";
    }
  };

  const find = async (name: string, command: string) => {
    const pathOfCommand = await where(command);
    if (pathOfCommand.match(command)) {
      echo(chalk.green(`\n√ ${name}... Found @ ${pathOfCommand}`));
      return true;
    } else {
      error(`\nx ${name} is a required dependency. You can install it for your platform with the below command.`);
      echo(`${await invokePackageManager()} ${CLI[command]()}`);
      return false;
    }
  };

  return { find };
};

export const createSwitchSetup = () => {
  const command = new Command()
    .name("setup")
    .description("Performs a system check to locate pre-requisite dependencies.")
    .example("switch setup", "Checks the system configuration and installs any missing dependencies.");

  const OS = createOS();

  const run = async () => {
    title(`Checking System Configuration`);
    let allFound = await OS.find('Git CLI', 'git');
    allFound = (await OS.find('GitHub CLI', 'gh')) && allFound;

    if (allFound) {
      title(`👍 Excellent! You are all set - You can "Switch" now !\n`);
    } else {
      title(`⚠️ Caution! one or more dependencies were not found, please run the switch installer again!\n`);
    }
  };

  command.action(run);
  return command;
};
