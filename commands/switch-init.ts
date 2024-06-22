// plugins/switch_init.ts

import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import { PluginCommand } from "../domain/plugin-interface.ts";
import { DefaultSwitchConfig, SwitchConfig } from "../domain/types.ts";
import { basename } from "https://deno.land/std@0.201.0/path/basename.ts";
import { confirm, echo, title } from "../commands/cli.ts";
import { join } from "https://deno.land/std@0.207.0/path/join.ts";
import { exists, recursiveCopyFiles } from "../utils/fs.ts";
import { createSwitchCommand, createOnboardingTicket } from "../utils/github.ts";
import chalk from "npm:chalk";

const TEMPLATE_DIRS = ['.github', 'scripts'];
const SONAR_FILE = 'sonar-project.properties';

async function copyTemplateFiles(projectFolder: string, tmpFolder: string): Promise<void> {
  for (const dir of TEMPLATE_DIRS) {
    const projectDir = join(projectFolder, dir);
    if (await exists(projectDir)) {
      await Deno.rename(projectDir, join(projectFolder, `.old-${dir}`));
    }
    await recursiveCopyFiles(join(tmpFolder, dir), projectFolder);
  }

  const sonarFile = join(projectFolder, SONAR_FILE);
  if (await exists(sonarFile)) {
    await Deno.rename(sonarFile, join(projectFolder, `old-${SONAR_FILE}`));
  }
  await recursiveCopyFiles(join(tmpFolder, SONAR_FILE), projectFolder);
}

function showNextSteps(): void {
  title("Next Steps:");
  echo(`
    Follow the steps in the getting started page at 
    https://refactored-adventure-qkw91lk.pages.github.io/getting-started/ 

    ${chalk.yellow("Step 1: Write Your Build and Unit Test Scripts")}
    Under the scripts folder, you will find the build.sh and unit-test.sh 
    Be sure to fill those out with your build and test commands.

    ${chalk.yellow("Step 2: Review Any Additional Resource Configuration")}
    If you chose an additional resource such as postgres or eventhub, 
    you will need to go to .github/environments/<env>-parameters.bicepparam files and update the configs.
    You can find more information about the parameters here 
    https://refactored-adventure-qkw91lk.pages.github.io/app-hosting/optional-bicep-parameters/

    ${chalk.yellow("Step 3: Push Changes and Switch")}
    Go ahead and push those changes and give it a switch!
  
    👍 Happy Switching!
  `);
}

const switchInitPlugin: PluginCommand = {
  name: "init",
  description: "Enables your current project(folder) for the Switch Platform.",
  createCommand: () => {
    const command = createSwitchCommand("init", "Enables your current project(folder) for the Switch Platform.");
    command.alias("i");
    command.enableStandardOptions();
    
    command
      .example("switch init", "Initializes Switch CI/CD on the project in the current folder and prompts for all necessary input.")
      .example("switch init --type=swa", "Initializes Switch CI/CD as a Static Web App on the project in the current folder and prompts for all necessary input.")
      .example("switch init --type=fa --language=node", "Initializes Switch CI/CD as a Function App on the project in the current folder and prompts for all necessary input.")
      .example("switch init --type=ca --language=c#", "Initializes Switch CI/CD as a Container App on the project in the current folder and prompts for all necessary input.");

    async function run(options: Command.IParseResult["options"]): Promise<void> {
      const projectFolder = ".";
      const inputs: SwitchConfig = { ...DefaultSwitchConfig, name: basename(Deno.cwd()) };
      title(`Project: ${inputs.name}`);

      const currentConfig = await command.loadConfig(projectFolder);
      if (currentConfig) {
        const overwrite = await confirm("This project/folder is already enabled with Switch. Overwrite configuration?");
        if (!overwrite) throw new Error("Operation cancelled by user.");
      }

      await command.validateStandardConfig(inputs, options, !!currentConfig, currentConfig);

      const tmpFolder = await Deno.makeTempDir();
      try {
        await command.pullTemplate(inputs, options.base as string, options.branch as string, tmpFolder);
        await copyTemplateFiles(projectFolder, tmpFolder);
        await command.saveConfig(projectFolder, inputs);

        if (!options.skipTickets) {
          await createOnboardingTicket(inputs);
        }

        showNextSteps();
      } finally {
        await Deno.remove(tmpFolder, { recursive: true });
      }
    }

    command.action(run);
    return command.command;
  },
};

export default switchInitPlugin;