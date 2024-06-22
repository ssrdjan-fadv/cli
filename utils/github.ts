import { join } from "https://deno.land/std@0.181.0/path/mod.ts";
import { stringify } from "https://deno.land/std@0.207.0/yaml/mod.ts";
import { FileError, escape, AppType, EnvironmentType, PromptFunction, SwitchConfig, ArrayKV} from "../types.ts";
import { confirm, echo, numberInput, select, title } from "../cli.ts";
import { listFiles, cloneTemplate, templateFill } from "./fs.ts";
import { basename } from "https://deno.land/std@0.110.0/path/win32.ts";
import path from 'node:path';
import os from 'node:os';

const DEFAULT_TEMPLATE_REPOSITORY = "FA-Switch-Platform/Switch-CICD-Template";
export const DEFAULT_HOME_TEMPLATE_PATH = path.join(os.homedir() || "", ".switch-cli", "templates");
export const DEFAULT_LOCAL_TEMPLATE_PATH = path.join(basename(Deno.cwd()), "templates");

const getTemplatePath = () => Deno.statSync(DEFAULT_HOME_TEMPLATE_PATH).isDirectory ?
                                DEFAULT_HOME_TEMPLATE_PATH : DEFAULT_LOCAL_TEMPLATE_PATH;

// Clone a GitHub repository
export const cloneRepository = async (repo: string, branch = "main", destinationFolder = ""): Promise<string[]> => {
  const command = new Deno.Command("gh", {
    args: ["repo", "clone", repo, destinationFolder, "--", "-b", branch],
    stdout: "piped",
    stderr: "piped",
  });
  const { success } = await command.output();
  if (!success) {
    throw new Error(`Failed to clone repository: ${repo}`);
  }

  await Deno.remove(join(destinationFolder, ".git"), { recursive: true });
  return listFiles(destinationFolder);
};

// Report an issue when template generation fails
export const reportIssue = async (config: SwitchConfig, failedFiles: FileError[]): Promise<void> => {
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
};

// Create an onboarding ticket for a new project
export const createOnboardingTicket = async (config: SwitchConfig): Promise<void> => {
  title(`Creating onboarding ticket...`);
  const appTypeName = config.type === AppType.Function ? "Function App" : 
                      config.type === AppType.StaticWebApp ? "Static Web App" : 
                      "Container App";
  const issueBody = `New ${appTypeName} Onboarding Request
  
| Property | Value |
|----------|-------|
|Name:     | ${config.name} |
|Org:      | ${config.repository} |
|Type:     | ${config.type} |
|Language: | ${config.language || ''} |
|Repository: | ${config.repository || ''} |

Onboarding Tasks Pending`;

  const additionalTasks = config.type === AppType.StaticWebApp ? `
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
};

// Create a GitHub issue
export const createIssue = async (repo: string, title: string, body: string, label: string): Promise<void> => {
  const command = new Deno.Command("gh", {
    args: ["issue", "create", "--repo", repo, "--title", title, "--body", body, "--label", label],
    stdout: "piped",
    stderr: "piped",
  });

  const { success, stdout, stderr } = await command.output();

  if (!success) {
    const errorMessage = new TextDecoder().decode(stderr);
    throw new Error(`Failed to create issue. Error: ${errorMessage}`);
  }

  // If you need to use the stdout (e.g., to get the created issue URL)
  const output = new TextDecoder().decode(stdout);
  console.log(`Issue created successfully: ${output.trim()}`);
};

// Get the list of GitHub organizations
const orgList = async (): Promise<string[]> => {
  const command = new Deno.Command("gh", {
    args: ["org", "list"],
    stdout: "piped",
    stderr: "piped",
  });

  const { stdout } = await command.output();
  return new TextDecoder().decode(stdout).trim().split("\n");
};

export const validateStandardConfig = async (
  inputs: SwitchConfig,
  parsedArgs: Record<string, unknown>,
  currentConfig?: SwitchConfig
): Promise<void> => {
  await collectIfMissing(inputs);
  if (!parsedArgs.githubOrg) {
    const orgs = await orgList();
    //todo: fishy business here ...
    // const orgsTable = orgs.map(value => ({ name: value, value }));
    parsedArgs.githubOrg = inputs.domain === "Other"
      ? await select(`Select the github owner repo`, orgs)
      : `FA-Switch-${inputs.domain}`;
  }
  inputs.repository = `${parsedArgs.githubOrg}/${inputs.name}`;

  const overwriteHooks = !!currentConfig && await confirm(
    `Would you like to overwrite the hooks and re-generate?`
  );
  if (!overwriteHooks && currentConfig) inputs.hooks = currentConfig.hooks;
};

export const pullTemplate = async (
  inputConfig: SwitchConfig,
  base: string,
  branch: string,
  projectFolder: string,
  generate = false
): Promise<void> => {
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
};

export const saveConfig = async (folder: string, config: SwitchConfig): Promise<void> => {
  title(`Saving Switchfile...`);
  echo(`Config: ${config}`);
  await Deno.writeTextFile(join(folder, `Switchfile`), stringify(config));
};

const collectIfMissing = async (
  inputConfig: SwitchConfig,
  target?: Record<string, unknown>,
  ...keys: string[]
): Promise<void> => {
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
};

const fillClonedTemplateFiles = async (
  repo: string,
  clonedFiles: string[],
  inputs: SwitchConfig
): Promise<void> => {
  const failedFiles = await templateFill(clonedFiles, inputs);
  if (failedFiles.length > 0 && repo === DEFAULT_TEMPLATE_REPOSITORY) {
    echo(`\nThe following template files were unable to be processed.\n\n${failedFiles.map((f) => f.file).join("\n")}\n\n${failedFiles.map((f) => `- [ ] ${f.file} - ${escape(f.error)}`).join("\n")}\n\nThe files are available for your manual review\nHowever, you could also report this as an issue to the Switch CI/CD Team to review as well.`);
    const report = await confirm("Would you like to report this issue now?");
    if (report) await reportIssue(inputs, failedFiles);
  }
};

const processLocalTemplates = async (
  projectFolder: string,
  inputConfig: SwitchConfig
): Promise<void> => {
  const localTemplatePath = getTemplatePath();

  if (!inputConfig.environments) inputConfig.environments = [];

  autoRegisterEnv(inputConfig, "dev", EnvironmentType.Development);
  autoRegisterEnv(inputConfig, "ci", EnvironmentType.CI);

  const envTemplatePath = `${localTemplatePath}/env/`;
  for (const environment of inputConfig.environments) {
    const envConfig = { currentEnv: environment, ...inputConfig };
    const excludeFiles = inputConfig.type === AppType.StaticWebApp || environment.type === EnvironmentType.CI
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
  type: EnvironmentType
): void => {
  const envExists = inputConfig.environments?.some((e) => e.type === type);
  if (!envExists) {
    echo(`Auto registering ${type} environment...`);
    inputConfig.environments?.push({ type, name });
  }
};

const prompts: Record<string, PromptFunction> = {
  port: async (config?: SwitchConfig) => config?.type === AppType.ContainerApp
    ? await numberInput(`Please provide the port your service will be running`)
    : undefined,
};