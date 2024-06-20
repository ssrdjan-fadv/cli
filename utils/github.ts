import { join } from "https://deno.land/std@0.207.0/path/posix.ts";

import {ArrayToTable, ArrayKV, StringArray, DEFAULT_TEMPLATE_REPOSITORY, FileError, escape} from "../domain/types.ts";
import {shell, title} from './cli.ts';
import {listFiles} from "./fs.ts";
import {SwitchConfig} from "../domain/switch-config.ts";

/// This async function looks up a list of GitHub Orgs via the `gh org list` command
/// @returns StringArray
export const orgs = async (): Promise<StringArray> =>
    (await shell`gh org list`.text()).split("\n")

export const orgList = async (): Promise<ArrayKV> => ArrayToTable(await orgs())

export const cloneRepository = async (repo: string, branch = "main", destinationFolder = "")=> {
    title(`Cloning repository...`);
    await shell`gh repo clone ${repo} ${destinationFolder} -- -b ${branch}`
    await Deno.remove(join(destinationFolder, ".git"), {
        recursive: true,
    });

    // code to take list of all files in the destinationFolder and add to array
    return await listFiles(destinationFolder)
}

export const reportIssue = async ( config : SwitchConfig, failedFiles : FileError[] ) =>
    await createIssue(DEFAULT_TEMPLATE_REPOSITORY,
        `Switch CLI Template Generation Failed - Project ${config.name}`,
        `Failed to generate certain files, probable template issue?

  | Property | Value |
  |----------|-------|
  |Name:     | ${config.name} |
  |Org: | ${config.repository} |
  |Type: |${config.type} |
  |Language: |${config.language || ''} |
  |Repository: | ${config.repository || ''} |

##    Failed Files:

${failedFiles.map((f) => `- [ ] ${f.file} - ${escape(f.error)}`).join("\n")}`,
        'defect')



export const gitInit = (folder = '.') => shell`git init ${folder}`
export const createRepository = async (owner: string, repo: string) =>
    await shell`gh repo create ${owner}/${repo} --internal`

export const createOnboardingTicket = async (config: SwitchConfig) => {
    title(`Creating onboarding ticket...`);
    const AppTypeName = config.type === "fa" ? "Function App" : config.type === "swa" ? "Static Web App": "Container App";
    const issueBody = `New ${AppTypeName} Onboarding Request
  
  | Property | Value |
  |----------|-------|
  |Name:     | ${config.name} |
  |Org: | ${config.repository} |
  |Type: |${config.type} |
  |Language: |${config.language || ''} |
  |Repository: | ${config.repository || ''} |
  
  Onboarding Tasks Pending`;
    const issueBodySWA = `
  - [ ] Enable private endpoint for swa
  - [ ] Register swa to App Gateway in Hub
  - [ ] Register subdomain/endpoint in Front Door(FD)
  - [ ] Enable custom domain SSL/CERTS in FD`;

    const issueBodyNotSwa = ``;

    const fullIssueBody = config.type === "swa" ? issueBody.concat(issueBodySWA.toString()) : issueBody.concat(issueBodyNotSwa.toString());
    const repo = `FA-Switch-Platform/CICD`;
    await createIssue(
        repo,
        `Onboard ${config.name} to Switch CI/CD`,
        fullIssueBody,
        `Onboarding`,
    );
};

export const createIssue = async (repo: string, title: string, body: string, label: string, ) =>
    await shell`gh issue create -R ${repo} --title ${title} --body ${body} --label ${label} `
