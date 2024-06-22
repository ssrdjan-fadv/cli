export type Command = {
  name: string;
  description: string;
  execute: (args: Record<string, unknown>) => Promise<void>;
};

export type Primitive = string | number | boolean;
export type ObjectType = Record<string, unknown>;
export type Value = Primitive | ObjectType | Array<Primitive | ObjectType>;
export type StringArray = string[];
export type Arguments = Record<string, unknown>[];

export type ArrayKV = Array<{ name: string; value: Value }>;

export const isPrimitive = (value: unknown): boolean => 
  value === null || (typeof value !== "object" && typeof value !== "function");

export type Fn = (...args: any[]) => any;
export type FunctionMap = Record<string, Fn>;

export const enumValues = (T: Value): string[] =>
  Object.values(T) as string[];

export const enumAsTable = (T: Value): ArrayKV =>
  Object.entries(T).map(([key, value]) => ({ name: key, value }));

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