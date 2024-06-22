import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import { Number } from "https://deno.land/x/cliffy@v1.0.0-rc.3/prompt/number.ts";
import { Input } from "https://deno.land/x/cliffy@v1.0.0-rc.3/prompt/input.ts";
import { Confirm } from "https://deno.land/x/cliffy@v1.0.0-rc.3/prompt/confirm.ts";
import { Select } from "https://deno.land/x/cliffy@v1.0.0-rc.3/prompt/select.ts";
import { Checkbox } from "https://deno.land/x/cliffy@v1.0.0-rc.3/prompt/checkbox.ts";
import chalk from "npm:chalk";
import { ArrayKV, StringArray } from "../domain/types.ts";

const VERSION = "1.2.2";

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

const banner = chalk.green(`
   _____      ___________________ __   _______   ____
  / __/ | /| / /  _/_  __/ ___/ // /  / ___/ /  /  _/
 _\\ \\ | |/ |/ // /  / / / /__/ _  /  / /__/ /___/ /
/___/ |__/|__/___/ /_/  \\___/_//_/   \\___/____/___/
`);

const footer = `
_____________________________________________________
First Advantage                        -- Ship Faster
${chalk.bgBlue(chalk.white(` v${VERSION}-${Deno.build.os}-${Deno.build.arch} `))}
`;

console.log(banner + footer);

// Utility functions for CLI output and interaction
export const title = (message: string): void => console.log(chalk.cyanBright(chalk.bold(`\n${message}\n`)));
export const echo = (message: string): void => console.log(chalk.white(message));
export const error = (message: string): void => console.log(chalk.red(message));
export const confirm = async (message: string): Promise<boolean> => await Confirm.prompt(chalk.yellow(message));
export const select = async (message: string, options: ArrayKV) => await Select.prompt({ message, options });
export const numberInput = async (message: string) => await Number.prompt({ message });
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

// Debug function for logging when DEBUG environment variable is set to 'true'
export function debug(...data: unknown[]): void {
  if (Deno.env.get("DEBUG") === "true") {
    const content = data.map((d) => {
      if (typeof d === "object" && d !== null) {
        if (d instanceof Error) {
          return `${d.message}\n${d.stack}`;
        }
        return JSON.stringify(d, null, 2);
      }
      return String(d);
    });
    console.log("[DEBUG] -", ...content.map(c => chalk.gray(c)));
  }
}