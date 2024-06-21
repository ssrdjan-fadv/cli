import { join } from "https://deno.land/std@0.207.0/path/posix.ts";
import { $ as shell } from "https://deno.land/x/dax@0.35.0/mod.ts";
import { Command, EnumType } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import { 
  ArrayToTable, ArrayKV, StringArray, DEFAULT_TEMPLATE_REPOSITORY, FileError, escape, 
  AppType, EnvironmentType, PromptFunction, Value, enumValues, getTemplatePath, isPrimitive,
  SwitchConfig
} from "../domain/types.ts";
import { confirm, debug, echo, numberInput, select, title } from "../commands/cli.ts";
import { listFiles } from "./fs.ts";
import { loadYaml, stringify } from "./yaml.ts"; // Assuming these functions exist in a yaml.ts file
import { cloneTemplate, templateFill } from "./template.ts"; // Assuming these functions exist in a template.ts file

export async function orgs(): Promise<StringArray> {
  return (await shell`gh org list`.text()).split("\n");
}

export async function orgList(): Promise<ArrayKV> {
  return ArrayToTable(await orgs());
}

export async function cloneRepository(repo: string, branch = "main", destinationFolder = ""): Promise<string[]> {
  await shell`gh repo clone ${repo} ${destinationFolder} -- -b ${branch}`;
  await Deno.remove(join(destinationFolder, ".git"), { recursive: true });
  return listFiles(destinationFolder);
}

export async function reportIssue(config: SwitchConfig, failedFiles: FileError[]): Promise<void> {
  const title = `Switch CLI Template Generation Failed - Project ${config.name}`;
  const body = `Failed to generate certain files, probable template issue?

| Property | Value |
|----------|-------|
|Name:     | ${config.name} |
|Org:      | ${config.repository} |
|Type:     | ${config.type} |
|Language: | ${config.language || ''} |
|Repository: | ${config.repository || ''} |

##    Failed Files:

${failedFiles.map((f) => `- [ ] ${f.file} - ${escape(f.error)}`).join("\n")}`;

  await createIssue(DEFAULT_TEMPLATE_REPOSITORY, title, body, 'defect');
}

export const gitInit = (folder = '.') => shell`git init ${folder}`;
export const createRepository = async (owner: string, repo: string) => 
  await shell`gh repo create ${owner}/${repo} --internal`;

export async function createOnboardingTicket(config: SwitchConfig): Promise<void> {
  title(`Creating onboarding ticket...`);
  const appTypeName = config.type === "fa" ? "Function App" : config.type === "swa" ? "Static Web App" : "Container App";
  const issueBody = `New ${appTypeName} Onboarding Request
  
| Property | Value |
|----------|-------|
|Name:     | ${config.name} |
|Org:      | ${config.repository} |
|Type:     | ${config.type} |
|Language: | ${config.language || ''} |
|Repository: | ${config.repository || ''} |

Onboarding Tasks Pending`;

  const additionalTasks = config.type === "swa" ? `
- [ ] Enable private endpoint for swa
- [ ] Register swa to App Gateway in Hub
- [ ] Register subdomain/endpoint in Front Door(FD)
- [ ] Enable custom domain SSL/CERTS in FD` : '';

  const fullIssueBody = issueBody + additionalTasks;
  await createIssue(
    `FA-Switch-Platform/CICD`,
    `Onboard ${config.name} to Switch CI/CD`,
    fullIssueBody,
    `Onboarding`
  );
}

export async function createIssue(repo: string, title: string, body: string, label: string): Promise<void> {
  await shell`gh issue create -R ${repo} --title ${title} --body ${body} --label ${label}`;
}

export function createSwitchCommand(name: string, description: string) {
  const command = new Command().name(name).description(description);
  const prompts: Record<string, PromptFunction> = {};
  const arguments: string[] = [];

  function addArgument(name: string, typeName: string, type: Value, required = true) {
    if (!isPrimitive(type)) {
      command.type(typeName, new EnumType(enumValues(type)));
    }
    arguments.push(`${required ? "<" : "["}${name}:${typeName}${required ? ">" : "]"}`);
    command.arguments(arguments.join(" "));
    return command;
  }

  function enableStandardOptions() {
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

    prompts["port"] = async (config?: SwitchConfig) => config?.type === AppType["Container App"]
      ? await numberInput(`Please provide the port your service will be running`)
      : undefined;

    return command;
  }

  async function pullTemplate(
    inputConfig: SwitchConfig,
    base: string,
    branch: string,
    projectFolder: string,
    generate = false
  ) {
    const repo = base || DEFAULT_TEMPLATE_REPOSITORY;
    let newBranch = inputConfig.type as string;
    if (generate && inputConfig.type === AppType.Function && inputConfig.language === "node" && repo === DEFAULT_TEMPLATE_REPOSITORY) {
      newBranch = "fa-typescript";
    }
    branch = branch || newBranch;

    title(`Cloning repository...`);
    const clonedFiles = await cloneRepository(repo, branch, projectFolder);

    await fillClonedTemplateFiles(repo, clonedFiles, inputConfig);
    await processLocalTemplates(projectFolder, inputConfig);
  }

  async function fillClonedTemplateFiles(
    repo: string,
    clonedFiles: string[],
    inputs: SwitchConfig
  ) {
    const failedFiles = await templateFill(clonedFiles, inputs);
    if (failedFiles.length > 0 && repo === DEFAULT_TEMPLATE_REPOSITORY) {
      echo(`\nThe following template files were unable to be processed.\n\n${failedFiles.map((f) => f.file).join("\n")}\n\n${failedFiles.map((f) => `- [ ] ${f.file} - ${escape(f.error)}`).join("\n")}\n\nThe files are available for your manual review\nHowever, you could also report this as an issue to the Switch CI/CD Team to review as well.`);
      const report = await confirm("Would you like to report this issue now?");
      if (report) await reportIssue(inputs, failedFiles);
    }
  }

  async function processLocalTemplates(
    projectFolder: string,
    inputConfig: SwitchConfig
  ) {
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
  }

  function autoRegisterEnv(
    inputConfig: SwitchConfig,
    name: string,
    type: EnvironmentType
  ) {
    const envExists = inputConfig?.environments?.filter((e) => e.type === type);
    if (!envExists || envExists.length === 0) {
      echo(`Auto registering ${type} environment...`);
      console.log("*** Adding", type);
      inputConfig?.environments?.push({ type, name });
    }
  }

  async function validateStandardConfig(
    inputs: SwitchConfig,
    otherInputs: { githubOrg: Value; },
    overwrite = false,
    currentConfig?: SwitchConfig
  ) {
    await collectIfMissing(inputs);
    if (!otherInputs.githubOrg) {
      otherInputs.githubOrg = inputs.domain === "Other"
        ? await select(`Select the github owner repo`, await orgList())
        : `FA-Switch-${inputs.domain}`;
    }
    inputs.repository = `${otherInputs.githubOrg}/${inputs.name}`;

    const overwriteHooks = overwrite && await confirm(
      `Would you like to overwrite the hooks and re-generate?`
    );
    if (!overwriteHooks && currentConfig) inputs.hooks = currentConfig.hooks;
  }

  async function collectIfMissing(
    inputConfig: SwitchConfig,
    target?: Record<string, unknown>,
    ...keys: string[]
  ) {
    if (!target) target = inputConfig;
    if (keys.length === 0) keys = Object.keys(target);
    for (const key of keys) {
      if (key in target &&
        target[key] === undefined &&
        prompts[key]) {
        const value = await prompts[key](inputConfig);
        Object.assign(target, { [key]: value });
      }
    }
  }

  async function loadConfig(folder: string): Promise<SwitchConfig> {
    return await loadYaml<SwitchConfig>(join(folder, `Switchfile`));
  }

  async function saveConfig(folder: string, config: SwitchConfig) {
    title(`Saving Switchfile...`);
    debug(`Config: `, config);
    await Deno.writeTextFile(join(folder, `Switchfile`), stringify(config));
  }

  return {
    command,
    addArgument,
    enableStandardOptions,
    pullTemplate,
    validateStandardConfig,
    loadConfig,
    saveConfig,
  };
}