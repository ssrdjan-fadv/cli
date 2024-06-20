import { basename } from "https://deno.land/std@0.110.0/path/win32.ts";
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

export const arrayToTable = (options: string[]): ArrayKV =>
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

export const AbortError = (message: string) => new Error(message);