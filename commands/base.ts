import { Command, EnumType } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import { join } from "https://deno.land/std@0.207.0/path/mod.ts";
import { stringify } from "https://deno.land/std@0.yaml/mod.ts";
import chalk from "npm:chalk";

import {
  DEFAULT_TEMPLATE_REPOSITORY,
  enumValues,
  escape,
  FileError,
  PromptFunction,
  Value,
  isPrimitive,
  AbortError,
  getTemplatePath,
} from "../domain/types.ts";
import {
  SwitchConfig,
  AppType,
  EnvironmentType,
} from "../domain/switch-config.ts";
import {
  title,
  multiSelect,
  select,
  confirm,
  echo,
  suggestUntil,
  numberInput,
  error,
  debug,
} from "../utils/cli.ts";
import { cloneRepository, orgList, reportIssue } from "../utils/github.ts";
import { loadYaml, templateFill, cloneTemplate } from "../utils/fs.ts";

const createSwitchCommand = (name: string, description: string) => {
  const command = new Command()
    .name(name)
    .description(description);

  const prompts: Record<string, PromptFunction> = {};
  const arguments: string[] = [];

  const addArgument = (name: string, typeName: string, type: Value, required = true) => {
    if (!isPrimitive(type)) {
      command.type(typeName, new EnumType(enumValues(type)));
    }
    arguments.push(`${required ? "<" : "["}${name}:${typeName}${required ? ">" : "]"}`);
    command.arguments(arguments.join(" "));
    return command;
  };

  const enableStandardOptions = () => {
    command
      .option(`-d, --domain <domain:domainType>`, `The github organization for this app.`)
      .option(`-t, --type <type:appType>`, `The Switch application type.`)
      .option(`-l, --language <language:languageType>`, `The language / framework used.`)
      .option(`-o, --github-org <owner-or-org-name>`, `Optional. Creates a github repository in the specified organization.`)
      .option(`--base <base>`, `Optional, Base project template repository in github. Format OWNER-OR-ORG/REPO.`)
      .option(`--branch <branch>`, `Optional, A specific branch/feature/tag. Default will be 'main'.`)
      .option(`--resource <resource:resourceType>`, `Optional, Add external resources to the project.`, { collect: true })
      .option(`-p, --port <port:number>`, `Optional, A specific port for incoming traffic. Required only for container apps.`)
      .option(`--skip-tickets`, `Skip creating an onboarding ticket for Cloud Engineering team.`);

    prompts["port"] = async (config?: SwitchConfig) =>
      config?.type === AppType["Container App"]
        ? await numberInput(`Please provide the port your service will be running`)
        : undefined;

    return command;
  };

  const pullTemplate = async (
    inputConfig: SwitchConfig,
    base: string,
    branch: string,
    projectFolder: string,
    generate = false,
  ) => {
    const repo = base || DEFAULT_TEMPLATE_REPOSITORY;
    let newBranch = inputConfig.type as string;
    if (generate && inputConfig.type === AppType.Function && inputConfig.language === "node" && repo === DEFAULT_TEMPLATE_REPOSITORY) {
      newBranch = "fa-typescript";
    }
    branch = branch || newBranch;
    const clonedFiles = await cloneRepository(repo, branch, projectFolder);

    await fillClonedTemplateFiles(repo, clonedFiles, inputConfig);
    await processLocalTemplates(projectFolder, inputConfig);
  };

  const fillClonedTemplateFiles = async (
    repo: string,
    clonedFiles: string[],
    inputs: SwitchConfig,
  ) => {
    const failedFiles = await templateFill(clonedFiles, inputs);
    if (failedFiles.length > 0 && repo === DEFAULT_TEMPLATE_REPOSITORY) {
      echo(`\nThe following template files were unable to be processed.\n\n${chalk.red(failedFiles.map((fileError: FileError) => fileError.file).join("\n"))}\n\n${failedFiles.map((f) => `- [ ] ${f.file} - ${f.error}`).join("\n")}\n${failedFiles.map((f) => `- [ ] ${f.file} - ${escape(f.error)}`).join("\n")}\n\nThe files are available for your manual review\nHowever, you could also report this as an issue to the Switch CI/CD Team to review as well.`);
      const report = await confirm("Would you like to report this issue now?");
      if (report) await reportIssue(inputs, failedFiles);
    }
  };

  const processLocalTemplates = async (
    projectFolder: string,
    inputConfig: SwitchConfig,
  ) => {
    const localTemplatePath = getTemplatePath();

    if (!inputConfig.environments) inputConfig.environments = [];

    autoRegisterEnv(inputConfig, "dev", EnvironmentType.Development);
    autoRegisterEnv(inputConfig, "ci", EnvironmentType.CI);

    const envTemplatePath = `${localTemplatePath}/env/`;
    for (const environment of inputConfig.environments) {
      const envConfig = { currentEnv: environment, ...inputConfig };
      const excludeFiles = inputConfig.type === AppType["Static Web App"] || environment.type === EnvironmentType["CI"]
        ? [".github/environment/[env]-parameters-api.bicepparam"]
        : [];
      await cloneTemplate(envTemplatePath, projectFolder, { env: environment.name }, envConfig, excludeFiles);
    }

    const sonarTemplatePath = `${localTemplatePath}/sonar/`;
    if (inputConfig.language !== 'c#' && inputConfig.language !== 'java') {
      await cloneTemplate(sonarTemplatePath, projectFolder, {}, inputConfig);
    }
  };

  const autoRegisterEnv = (
    inputConfig: SwitchConfig,
    name: string,
    type: EnvironmentType,
  ) => {
    const envExists = inputConfig?.environments?.filter((e) => e.type === type);
    if (!envExists || envExists.length === 0) {
      echo(`Auto registering ${type} environment...`);
      console.log("*** Adding", type);
      inputConfig?.environments?.push({ type, name });
    }
  };

  const validateStandardConfig = async (
    inputs: SwitchConfig,
    otherInputs: { githubOrg: Value },
    overwrite = false,
    currentConfig?: SwitchConfig,
  ) => {
    await collectIfMissing(inputs);
    if (!otherInputs.githubOrg) {
      otherInputs.githubOrg = inputs.domain === "Other"
        ? await select(`Select the github owner repo`, await orgList())
        : `FA-Switch-${inputs.domain}`;
    }
    inputs.repository = `${otherInputs.githubOrg}/${inputs.name}`;

    const overwriteHooks = overwrite && await confirm(
      `Would you like to overwrite the hooks and re-generate?`,
    );
    if (!overwriteHooks && currentConfig) inputs.hooks = currentConfig.hooks;
  };

  const collectIfMissing = async (
    inputConfig: SwitchConfig,
    target?: Record<string, unknown>,
    ...keys: string[]
  ) => {
    if (!target) target = inputConfig;
    if (keys.length === 0) keys = Object.keys(target);
    for (const key of keys) {
      if (
        key in target &&
        target[key] === undefined &&
        prompts[key]
      ) {
        const value = await prompts[key](inputConfig);
        Object.assign(target, { [key]: value });
      }
    }
  };

  const loadConfig = async (folder: string): Promise<SwitchConfig> => {
    return await loadYaml<SwitchConfig>(join(folder, `Switchfile`));
  };

  const saveConfig = async (folder: string, config: SwitchConfig) => {
    title(`Saving Switchfile...`);
    debug(`Config: `, config);
    await Deno.writeTextFile(join(folder, `Switchfile`), stringify(config));
  };

  return {
    command,
    addArgument,
    enableStandardOptions,
    pullTemplate,
    validateStandardConfig,
    loadConfig,
    saveConfig,
  };
};

export { createSwitchCommand };