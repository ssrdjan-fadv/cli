import { basename } from "https://deno.land/std@0.110.0/path/win32.ts";
import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";

export interface PluginCommand {
  name: string;
  description: string;
  createCommand: () => Command;
}

import path from 'node:path';
import os from 'node:os';

export const DEFAULT_TEMPLATE_REPOSITORY = "FA-Switch-Platform/Switch-CICD-Template";
export const DEFAULT_HOME_TEMPLATE_PATH = path.join(os.homedir() || "", ".switch-cli", "templates");
export const DEFAULT_LOCAL_TEMPLATE_PATH = path.join(basename(Deno.cwd()), "templates");

export const getTemplatePath = () => 
  (Deno.statSync(DEFAULT_HOME_TEMPLATE_PATH).isDirectory) ? DEFAULT_HOME_TEMPLATE_PATH : DEFAULT_LOCAL_TEMPLATE_PATH;

export type Primitive = string | number | boolean;
export type ObjectType = Record<string, unknown>;
export type Value = Primitive | ObjectType | Array<Primitive | ObjectType>;
export type StringArray = string[];
export type Arguments = Record<string, unknown>[];

export const isPrimitive = (value: unknown): boolean => 
  value === null || (typeof value !== "object" && typeof value !== "function");

export type Fn = (...args: any[]) => any;
export type FunctionMap = Record<string, Fn>;

export type ArrayKV = Array<{ name: string; value: Value }>;

export const enumValues = (T: Value): string[] =>
  Object.values(T) as string[];

export const enumAsTable = (T: Value): ArrayKV =>
  Object.entries(T).map(([key, value]) => ({ name: key, value }));

export const ArrayToTable = (options: string[]): ArrayKV =>
  options.map(value => ({ name: value, value }));

export type FileError = { file: string; error: Error };
export type PromptFunction = (config?: SwitchConfig) => Promise<Value>;

export const escape = (s: unknown): string => String(s)
  .replace(/[\\&'"><]/g, char => ({
    '\\': '\\\\',
    '&': '\\x26',
    "'": '\\x27',
    '"': '\\x22',
    '<': '\\x3C',
    '>': '\\x3E'
  }[char] || char));

export type SwitchConfig = {
  domain?: DomainType;
  name: string;
  type?: AppType;
  language?: LanguageType;
  repository: string;
  hooks: Hooks;
  environments?: EnvironmentConfig[];
  resources?: ResourceType[];
  port?: number;
};

export const DefaultSwitchConfig: SwitchConfig = {
  name: "untitled",
  repository: "",
  hooks: {},
};

export enum DomainType {
  TalentExperience = "TX",
  ApplicantExperience = "AX",
  FulfillmentExperience = "FX",
  OnboardingExperience = "OX",
  SharedServices = "SharedServices",
  AIPlatform = "AI",
  SwitchPlatform = "Platform",
  Other = "Other",
}

export enum AppType {
  Function = "fa",
  StaticWebApp = "swa",
  ContainerApp = "aca",
}

export enum LanguageType {
  Java = "java",
  Node = "node",
  CSharp = "c#",
  Python = "python",
}

export type HookConfig = {
  command?: string;
  type?: string;
};

export type Hooks = {
  build?: HookConfig;
  "unit-tests"?: HookConfig;
  "integration-tests"?: HookConfig;
  "db-migration"?: HookConfig;
  env?: HookConfig;
};

export enum DBMigrationType {
  Flyway = "flyway",
  None = "none",
}

export type EnvironmentConfig = {
  type: EnvironmentType;
  name?: string;
  region?: RegionType;
  enabled?: boolean;
};

export enum EnvironmentType {
  Development = "dev",
  CI = "ci",
  QA = "qa",
  UAT = "uat",
  CustomerTest = "ct",
  Production = "prod",
}

export enum RegionType {
  NA = "eastus2",
  EU = "francecentral",
  BOTH = "both",
}

export enum ResourceType {
  Postgres = "postgres",
  EventHub = "eventhub",
  Storage = "storage",
  CosmosDB = "cosmosdb",
  EventGrid = "eventgrid",
}

export enum ResourceActionType {
  Add = "add",
  Remove = "remove",
}

export enum EnvActionType {
  Add = "add",
  Remove = "remove",
  Enable = "enable",
  Disable = "disable",
}