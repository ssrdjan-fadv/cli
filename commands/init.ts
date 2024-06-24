import { Command, SwitchConfig, FileError, AppType, EnvironmentType } from "../types.ts";
import { basename, join } from "https://deno.land/std@0.181.0/path/mod.ts";
import { stringify } from "https://deno.land/std@0.207.0/yaml/mod.ts";
import { confirm, echo, title, numberInput, select, runShellCommand, stringInput } from "../cli.ts";
import { exists, loadConfig, listFiles, cloneTemplate, templateFill } from "../utils/fs.ts";
import { bold, green, red } from "https://deno.land/std@0.181.0/fmt/colors.ts";

const TEMPLATE_DIRS = ['.github', 'scripts'];
const SONAR_FILE = 'sonar-project.properties';
const DEFAULT_TEMPLATE_REPOSITORY = "FA-Switch-Platform/Switch-CICD-Template";
const DEFAULT_HOME_TEMPLATE_PATH = Deno.env.get("HOME") ? join(Deno.env.get("HOME") || "", ".switch-cli", "templates") : "";
const DEFAULT_LOCAL_TEMPLATE_PATH = join(basename(Deno.cwd()), "templates");

const getTemplatePath = () => {
  if (DEFAULT_HOME_TEMPLATE_PATH && Deno.statSync(DEFAULT_HOME_TEMPLATE_PATH).isDirectory) {
    return DEFAULT_HOME_TEMPLATE_PATH;
  }
  return DEFAULT_LOCAL_TEMPLATE_PATH;
};

const escape = (s: unknown): string => String(s)
  .replace(/[\\&'"><]/g, char => ({
    '\\': '\\\\',
    '&': '\\x26',
    "'": '\\x27',
    '"': '\\x22',
    '<': '\\x3C',
    '>': '\\x3E'
  }[char] || char));

const getGitOriginUrl = async (): Promise<string | null> => {
  const result = await runShellCommand("git", ["remote", "-v"], '', `Local  ${bold('git remote -v')} error.`);
  const lines = result.value.trim().split("\n");
  if (lines.length > 0) {
    const match = lines[0].match(/origin\s+(.*?)\s+\(fetch\)/);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

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
    If you chose an additional resource such as postgres or EventsHub, 
    you will need to go to .github/environments/<env>-parameters.bicepparam files and update the configs.
    You can find more information about the parameters here 
    https://refactored-adventure-qkw91lk.pages.github.io/app-hosting/optional-bicep-parameters/

    Step 3: Push Changes and Switch
    Go ahead and push those changes and give it a switch!
  
    👍 Happy Switching!
  `);
};

const cloneRepository = async (repo: string, branch = "main", destinationFolder = ""): Promise<string[]> => {
  const result = await runShellCommand('gh', ["repo", "clone", repo, destinationFolder, "--", "-b", branch], `Failed to clone repository: ${repo}`);
  if (result.ok) {
    await Deno.remove(join(destinationFolder, ".git"), { recursive: true });
    return listFiles(destinationFolder);
  }
  return [];
};

const reportIssue = async (config: SwitchConfig, failedFiles: FileError[]): Promise<void> => {
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

const createOnboardingTicket = async (config: SwitchConfig): Promise<void> => {
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

const createIssue = async (repo: string, title: string, body: string, label: string): Promise<void> => {
  await runShellCommand('gh',
    ['issue', "create", "--repo", repo, "--title", title, "--body", body, "--label", label],
    `Issue created successfully`,
    `Failed to create issue in repository: ${repo}`);
};

const orgList = async (): Promise<string[]> => {
  const command = new Deno.Command("gh", {
    args: ["org", "list"],
    stdout: "piped",
    stderr: "piped",
  });

  const { stdout } = await command.output();
  return new TextDecoder().decode(stdout).trim().split("\n");
};

const validateStandardConfig = async (
  inputs: SwitchConfig,
  parsedArgs: Record<string, unknown>,
  currentConfig?: SwitchConfig
): Promise<void> => {
  await collectIfMissing(inputs);
  if (!parsedArgs.githubOrg) {
    const orgs = await orgList();
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

const pullTemplate = async (
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

const saveConfig = async (folder: string, config: SwitchConfig): Promise<void> => {
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
      target[key] === undefined && prompts[key]) {
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

type PromptFunction = (config?: SwitchConfig) => string | number | boolean;
const prompts: Record<string, PromptFunction> = {
  port: (config?: SwitchConfig) => config?.type === AppType.ContainerApp
    ? numberInput(`Please provide the port your service will be running`)
    : undefined,
  skipTickets: () => confirm("Skip creating an onboarding ticket for Cloud Engineering team?"),
  repository: () => stringInput('Enter current repository name'),
};

const showInitHelp = (command: Command) => {
  echo(`Usage: ${command.usage}`);
  echo(command.description);
  echo("\nOptions:");
  command.options?.forEach(option => {
    echo(`  ${option.flags.padEnd(30)} ${option.description}`);
  });
  echo("\nExamples:");
  command.examples?.forEach(example => {
    echo(`  ${example}`);
  });
  echo("\nThis command initializes your current project for the Switch Platform, setting up necessary configurations and files.");
};

const executeInit = async (args: Record<string, unknown>) => {
  if (
    args.help === true ||
    args.h === true ||
    (Array.isArray(args._) && (args._.includes("help") || args._.includes("--help")))
  ) {
    showInitHelp(switchInitCommand);
    return;
  }

  const projectFolder = ".";
  const inputs: SwitchConfig = { name: basename(Deno.cwd()), repository: "", hooks: {} };
  title(`Project: ${inputs.name}`);

  const currentConfig = await loadConfig<SwitchConfig>(join(projectFolder, "Switchfile"));
  if (currentConfig) {
    const overwrite = await confirm("This project/folder is already enabled with Switch. Overwrite configuration?");
    if (!overwrite) {
      echo(red("Operation cancelled by user."));
      Deno.exit(1);
    }
  }

  const tmpFolder = await Deno.makeTempDir();
  try {
    await validateStandardConfig(inputs, args, currentConfig);
    await pullTemplate(inputs, args.base as string, args.branch as string, tmpFolder);
    await copyTemplateFiles(projectFolder, tmpFolder);
    await saveConfig(projectFolder, inputs);

    if (!args.skipTickets) {
      await createOnboardingTicket(inputs);
    }

    showNextSteps();
    echo(green("\n✔ Project successfully initialized for Switch Platform"));
  } catch (error) {
    echo(red(`\n❌ Error initializing project: ${error.message}`));
    Deno.exit(1);
  } finally {
    await Deno.remove(tmpFolder, { recursive: true });
  }
};

const switchInitCommand: Command = {
  name: "init",
  description: "Enables your current project (folder) for the Switch Platform.",
  usage: "switch init [options]",
  options: [
    { flags: "--base <repo>", description: "Base project template repository in GitHub. Format: OWNER-OR-ORG/REPO" },
    { flags: "--branch <branch>", description: "Specific branch/feature/tag to use. Default is 'main'" },
    { flags: "--skip-tickets", description: "Skip creating an onboarding ticket for Cloud Engineering team" },
    { flags: "--github-org <org>", description: "GitHub organization for the repository" },
    { flags: "-h, --help", description: "Show help for this command" },
  ],
  examples: [
    "switch init",
    "switch init --base FA-Switch-Platform/Custom-Template --branch develop",
    "switch init --skip-tickets --github-org MyOrg",
  ],
  execute: executeInit,
};

export default switchInitCommand;