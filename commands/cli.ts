import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import { Number } from "https://deno.land/x/cliffy@v1.0.0-rc.3/prompt/number.ts";
import { Input } from "https://deno.land/x/cliffy@v1.0.0-rc.3/prompt/input.ts";
import { Confirm } from "https://deno.land/x/cliffy@v1.0.0-rc.3/prompt/confirm.ts";
import { Select } from "https://deno.land/x/cliffy@v1.0.0-rc.3/prompt/select.ts";
import { Checkbox } from "https://deno.land/x/cliffy@v1.0.0-rc.3/prompt/checkbox.ts";
import chalk from "npm:chalk";
import { ArrayKV, StringArray } from "../domain/types.ts";

// Assuming VERSION is defined elsewhere in your project
declare const VERSION: string;

export const Cli = new Command()
  .name("switch")
  .description("The Command Line Shell for Switch Applications")
  .version(VERSION)
  .alias("sc")
  .globalOption("-X", "Optional. Enables debug mode.", {
    action: () => {
      Deno.env.set("DEBUG", "true");
      console.log("Debug mode enabled.");
    },
  });

export function displayBanner(version: string): void {
  const banner = chalk.green(`
   _____      ___________________ __   _______   ____
  / __/ | /| / /  _/_  __/ ___/ // /  / ___/ /  /  _/
 _\\ \\ | |/ |/ // /  / / / /__/ _  /  / /__/ /___/ /
/___/ |__/|__/___/ /_/  \\___/_//_/   \\___/____/___/
`);

  const footer = `
_____________________________________________________
First Advantage                        -- Ship Faster
${chalk.bgBlue(chalk.white(` v${version}-${Deno.build.os}-${Deno.build.arch} `))}
`;
  console.log(banner + footer);
}

export const title = (message: string): void => console.log(chalk.cyanBright(chalk.bold(`\n${message}\n`)));
export const echo = (message: string): void => console.log(chalk.white(message));
export const error = (message: string): void => console.log(chalk.red(message));
export const confirm = async (message: string): Promise<boolean> => await Confirm.prompt(chalk.yellow(message));
export const select = async (message: string, options: ArrayKV) => await Select.prompt({ message, options });
export const numberInput = async (message: string) => await Number.prompt({ message });

function safeStringify(obj: unknown, indent = 2): string {
  const cache = new Set();
  return JSON.stringify(
    obj,
    (_, value) => {
      if (typeof value === "object" && value !== null) {
        if (cache.has(value)) {
          return undefined; // Duplicate reference found, discard key
        }
        cache.add(value);
      }
      return value;
    },
    indent
  );
}

export function debug(...data: unknown[]): void {
  if (Deno.env.get("DEBUG") === "true") {
    const content = data.map((d) => {
      if (typeof d === "object" && d !== null) {
        if (d instanceof Error) {
          return `${d.message}\n${d.stack}`;
        }
        return safeStringify(d);
      }
      return String(d);
    });
    console.log("[DEBUG] -", ...content.map(c => chalk.gray(c)));
  }
}

export const multiSelect = async (message: string, options: ArrayKV) => await Checkbox.prompt({ message, options });

export const textInput = async (message: string, mandatory = false) => 
  await Input.prompt({
    message,
    list: false,
    info: false,
    validate: (value: string) => !mandatory || !!value,
  });

export const suggestUntil = async (message: string, suggestions: StringArray) => 
  await Input.prompt({
    message,
    list: true,
    info: true,
    suggestions,
    validate: (value: string) => !!value,
  });