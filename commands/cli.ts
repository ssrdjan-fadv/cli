import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import chalk from "npm:chalk";
import { Number } from "https://deno.land/x/cliffy@v1.0.0-rc.3/prompt/number.ts";
import { ArrayKV, StringArray } from "../domain/types.ts";

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

export const displayBanner = (version: string) => {
    const banner = chalk.green(
`   _____      ___________________ __   _______   ____
  / __/ | /| / /  _/_  __/ ___/ // /  / ___/ /  /  _/
 _\\ \\ | |/ |/ // /  / / / /__/ _  /  / /__/ /___/ /
/___/ |__/|__/___/ /_/  \\___/_//_/   \\___/____/___/
`,
    )

    const footer = `_____________________________________________________
First Advantage                        -- Ship Faster
${chalk.bgBlue(chalk.white(` v${version}-${Deno.build.os}-${Deno.build.arch} `))}
  `
    console.log(banner + footer)
}

export const title = (message: string) => console.log(chalk.cyanBright(chalk.bold(`\n${message}\n`)));
export const echo = (message: string) => console.log(chalk.white(message));
export const error = (message: string) => console.log(chalk.red(message));export const confirm = async (message: string): Promise<boolean> => await Confirm.prompt(chalk.yellow(message));
export const select = async (message: string, options: ArrayKV) => await Select.prompt({ message, options });
export const numberInput = async (message: string) => await Number.prompt({ message });

// safely handles circular references
// deno-lint-ignore no-explicit-any
const safeStringify = (obj: any, indent = 2) => {
    let cache: (typeof obj)[] | null = [];
    const retVal = JSON.stringify(
        obj,
        (_, value) => typeof value === "object" && value !== null
            ? cache?.includes(value)
                ? undefined // Duplicate reference found, discard key
                : cache?.push(value) && value // Store value in our collection
            : value,
        indent
    );
    cache = null;
    return retVal;
};

// deno-lint-ignore no-explicit-any
export const debug = (...data: any[]) => {
    if (Deno.env.get("DEBUG") === "true") {
        data.unshift("[DEBUG] -");
        const content = data.map((d) => {
            const type = typeof d;
            let value = d;
            if (type === "object" && d !== null) {
                if (d instanceof Error) {
                    const errorObject = d as Error;
                    value = `${errorObject.message}\n${errorObject.stack}`;
                } else {
                    value = safeStringify(d);
                }
            }
            return `\x1b[90m${value}\x1b[0m`;
        });
        console.log(content.join(' '));
    }
};

export const multiSelect = async (message: string, options: ArrayKV) => await Checkbox.prompt({ message, options });

export const textInput = async (message: string, mandatory = false) => await Input.prompt({
    message, list: false, info: false,
    validate: !mandatory ? () => true : (value: string): ValidateResult => {
        if (value) return true;
        else return false;
    },
});

export const suggestUntil = async (message: string, suggestions: StringArray) => await Input.prompt({
    message,
    list: true,
    info: true,
    suggestions,
    validate: (value: string): ValidateResult => { return !!value; },
});

