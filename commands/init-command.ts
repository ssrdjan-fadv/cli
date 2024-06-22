import { PluginCommand, SwitchConfig, DefaultSwitchConfig } from "../domain/types.ts";
import { basename } from "https://deno.land/std@0.181.0/path/mod.ts";
import { confirm, echo, title } from "../utils/cli.ts";
import { join } from "https://deno.land/std@0.181.0/path/mod.ts";
import { exists, loadConfig } from "../utils/fs.ts";
import { validateStandardConfig, createOnboardingTicket, pullTemplate, saveConfig } from "../utils/github.ts";

const TEMPLATE_DIRS = ['.github', 'scripts'];
const SONAR_FILE = 'sonar-project.properties';

const copyTemplateFiles = async (projectFolder: string, tmpFolder: string): Promise<void> => {
  for (const dir of TEMPLATE_DIRS) {
    const projectDir = join(projectFolder, dir);
    if (await exists(projectDir)) {
      await Deno.rename(projectDir, join(projectFolder, `.old-${dir}`));
    }
    await Deno.copyFile(join(tmpFolder, dir), projectDir);
  }

  const sonarFile = join(projectFolder, SONAR_FILE);
  if (await exists(sonarFile)) {
    await Deno.rename(sonarFile, join(projectFolder, `old-${SONAR_FILE}`));
  }
  await Deno.copyFile(join(tmpFolder, SONAR_FILE), sonarFile);
};

const showNextSteps = (): void => {
  title("Next Steps:");
  echo(`
    Follow the steps in the getting started page at 
    https://refactored-adventure-qkw91lk.pages.github.io/getting-started/ 

    Step 1: Write Your Build and Unit Test Scripts
    Under the scripts folder, you will find the build.sh and unit-test.sh 
    Be sure to fill those out with your build and test commands.

    Step 2: Review Any Additional Resource Configuration
    If you chose an additional resource such as postgres or eventhub, 
    you will need to go to .github/environments/<env>-parameters.bicepparam files and update the configs.
    You can find more information about the parameters here 
    https://refactored-adventure-qkw91lk.pages.github.io/app-hosting/optional-bicep-parameters/

    Step 3: Push Changes and Switch
    Go ahead and push those changes and give it a switch!
  
    👍 Happy Switching!
  `);
};

const switchInitPlugin: PluginCommand = {
  name: "init",
  description: "Enables your current project(folder) for the Switch Platform.",
  execute: async (args: Record<string, unknown>) => {
    const projectFolder = ".";
    const inputs: SwitchConfig = { ...DefaultSwitchConfig, name: basename(Deno.cwd()) };
    title(`Project: ${inputs.name}`);

    const currentConfig = await loadConfig<SwitchConfig>(join(projectFolder, "Switchfile"));
    if (currentConfig) {
      const overwrite = await confirm("This project/folder is already enabled with Switch. Overwrite configuration?");
      if (!overwrite) throw new Error("Operation cancelled by user.");
    }

    await validateStandardConfig(inputs, args, !!currentConfig, currentConfig);

    const tmpFolder = await Deno.makeTempDir();
    try {
      await pullTemplate(inputs, args.base as string, args.branch as string, tmpFolder);
      await copyTemplateFiles(projectFolder, tmpFolder);
      await saveConfig(projectFolder, inputs);

      if (!args.skipTickets) {
        await createOnboardingTicket(inputs);
      }

      showNextSteps();
    } finally {
      await Deno.remove(tmpFolder, { recursive: true });
    }
  },
};

export default switchInitPlugin;