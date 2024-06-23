// export type Command = {
//   name: string;
//   description: string;
//   execute: (args: Record<string, unknown>) => Promise<void>;
// };

export type Command = {
  name: string;
  description: string;
  // execute: (args: string[]) => Promise<void>;
  execute: (args: Record<string, unknown>) => Promise<void>;
  usage?: string;
  options?: Array<{ flags: string; description: string }>;
  examples?: string[];
};

export type Result<T> = { ok: boolean; value: T };

export type SwitchConfig = {
  domain?: "TX" | "AX" | "FX" | "OX" | "SharedServices" | "AI" | "Platform" | "Other";
  name: string;
  type?: "fa" | "swa" | "aca";
  language?: "java" | "node" | "c#" | "python";
  repository: string;
  hooks: Hooks;
  environments?: EnvironmentConfig[];
  resources?: ResourceType[];
  port?: number;
};

type HookConfig = {
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
export enum AppType {
  Function = "fa",
  StaticWebApp = "swa",
  ContainerApp = "aca",
}
export enum EnvironmentType {
  Development = "dev",
  CI = "ci",
  QA = "qa",
  UAT = "uat",
  CustomerTest = "ct",
  Production = "prod",
}
export type FileError = { file: string; error: Error };

export type EnvironmentConfig = {
  type: EnvironmentType;
  name?: string;
  region?: "eastus2" | "francecentral" | "both";
  enabled?: boolean;
};

export type ResourceType = "postgres" | "eventhub" | "storage" | "cosmosdb" | "eventgrid";
export type ResourceActionType = "add" | "remove";
export type EnvActionType = "add" | "remove" | "enable" | "disable";