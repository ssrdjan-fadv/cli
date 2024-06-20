import { CommandOptions } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import { DefaultSwitchConfig, SwitchConfig } from "../domain/switch-config.ts";
import { basename } from "https://deno.land/std@0.201.0/path/basename.ts";
import { confirm, echo, title } from "../utils/cli.ts";
import { exists, recursiveCopyFiles } from "../utils/fs.ts";
import { createOnboardingTicket } from "../utils/github.ts";
import chalk from "npm:chalk";
import { AbortError } from "../domain/types.ts";
import { join } from "https://deno.land/std@0.207.0/path/join.ts";
import { AbstractSwitchCommand } from "./base.ts";

const createSwitchInit = () => {
  const command = new AbstractSwitchCommand("init", "Enables your current project(folder) for the Switch Platform.");
  command.alias("i");

  command.enableStandardOptions();

  command
    .example("switch init", "Initializes Switch CI/CD on the project in the current folder and prompts for all necessary input.")
    .example("switch init --type=swa", "Initializes Switch CI/CD as a Static Web App on the project in the current folder and prompts for all necessary input.")
    .example("switch init --type=fa --language=node", "Initializes Switch CI/CD as a Function App on the project in the current folder and prompts for all necessary input.")
    .example("switch init --type=ca --language=c#", "Initializes Switch CI/CD as a Container App on the project in the current folder and prompts for all necessary input.");

  const run = async (options: CommandOptions) => {
    const projectFolder = ".";
    const inputs: SwitchConfig = { ...DefaultSwitchConfig, name: basename(Deno.cwd()) };
    title(`Project: ${inputs.name}`);

    const currentConfig = await command.loadConfig(projectFolder);
    const overwrite = currentConfig
      ? await confirm(`This project/folder is already enabled with Switch. Overwrite configuration?`)
      : false;
    if (currentConfig && !overwrite) throw new AbortError();

    await command.validateStandardConfig(inputs, options, overwrite, currentConfig);

    const tmpFolder = await Deno.makeTempDir();
    await command.pullTemplate(inputs, options.base as string, options.branch as string, tmpFolder);

    await copyTemplateFiles(projectFolder, tmpFolder);

    await Deno.remove(tmpFolder, { recursive: true });

    await command.saveConfig(projectFolder, inputs);

    if (!options.skipTickets) await createOnboardingTicket(inputs);

    showNextSteps();

  };

  const copyTemplateFiles = async (projectFolder: string, tmpFolder: string) => {
    for (const dir of ['.github', 'scripts']) {
      if (await exists(join(projectFolder, dir))) {
        await Deno.rename(join(projectFolder, dir), join(projectFolder, `.old-${dir}`));
      }
      await recursiveCopyFiles(join(tmpFolder, dir), projectFolder);
    }

    if (await exists(join(projectFolder, 'sonar-project.properties'))) {
      await Deno.rename(join(projectFolder, 'sonar-project.properties'), join(projectFolder, 'old-sonar-project.properties'));
    }
    await recursiveCopyFiles(join(tmpFolder, 'sonar-project.properties'), projectFolder);
  };

  const showNextSteps = () => {
    title(`Next Steps:`);
    echo(`\t follow the steps in the getting started page at 
    https://refactored-adventure-qkw91lk.pages.github.io/getting-started/ 

${chalk.yellow("Step 1: Write Your Build and Unit Test Scripts")}
  Under the scripts folder, you will find the build.sh and unit-test.sh 
  Be sure to fill those out with your build and test commands. 
  you can find out more about 

${chalk.yellow("Step 2: Review Any Additional Resource Configuration")}
  If you chose an additional resource such as postgres of eventhub, 
  you will need to go to .github/environments/<env>-parameters.bicepparam files and update the configs.
  You can find more information about the paramters here 
  https://refactored-adventure-qkw91lk.pages.github.io/app-hosting/optional-bicep-parameters/

${chalk.yellow("Step 3: ")}

  Go ahead and push those changes and give it a switch!
  
👍 Happy Switching !
`);
  };

  command.action(run);

  return command;
};

export { createSwitchInit };