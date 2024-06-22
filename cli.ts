import { parse } from "https://deno.land/std@0.181.0/flags/mod.ts";
import { cyan, bold, white, red, yellow, green, blue } from "https://deno.land/std@0.181.0/fmt/colors.ts";
import { Command } from "./types.ts";

export const standardOptions = [
  { name: "domain", description: "The github organization for this app.", type: "string" },
  { name: "type", description: "The Switch application type.", type: "string" },
  { name: "language", description: "The language / framework used.", type: "string" },
  { name: "github-org", description: "Optional. Creates a github repository in the specified organization.", type: "string" },
  { name: "base", description: "Optional, Base project template repository in github. Format OWNER-OR-ORG/REPO.", type: "string" },
  { name: "branch", description: "Optional, A specific branch/feature/tag. Default will be 'main'.", type: "string" },
  { name: "resource", description: "Optional, Add external resources to the project.", type: "string[]" },
  { name: "port", description: "Optional, A specific port for incoming traffic. Required only for container apps.", type: "number" },
  { name: "skip-tickets", description: "Skip creating an onboarding ticket for Cloud Engineering team.", type: "boolean" },
];

export const printStandardOptionsHelp = (): void => {
  console.log("Standard options:");
  for (const option of standardOptions) {
    console.log(`  --${option.name}\t${option.description}`);
  }
};

export const parseArgs = (args: string[]): Record<string, unknown> => {
  return parse(args, {
    string: ["domain", "type", "language", "github-org", "base", "branch"],
    boolean: ["skip-tickets"],
    collect: ["resource"],
    default: { branch: "main" },
  });
};

export const loadCommands = async (): Promise<Command[]> => {
  const commandsDir = "commands";
  const plugins: Command[] = [];

  for await (const command of Deno.readDir(commandsDir)) {
    if (command.isFile && command.name.endsWith(".ts")) {
      const module = await import(`./${commandsDir}/${command.name}`);
      if (typeof module.default === "object" && 'execute' in module.default) {
        plugins.push(module.default as Command);
      }
    }
  }
  return plugins;
};

export const executeCommand = async (plugins: Command[], args: Record<string, unknown>): Promise<void> => {
  const commandName = args[0] as string;
  const command = plugins.find(command => command.name === commandName);

  if (command) {
    await command.execute(args);
  } else {
    console.log("Unknown command. Use --help for usage information.");
  }
};

export const title = (message: string): void => console.log(cyan(bold(`\n${message}\n`)));
export const echo = (message: string): void => console.log(white(message));
export const error = (message: string): void => console.log(red(message));

export const confirm = (message: string): boolean => {
  const response = prompt(yellow(`${message} (y/n)`));
  return response?.toLowerCase() === 'y';
};

export const select = (message: string, options: string[]): string => {
  console.log(yellow(message));
  options.forEach((option, index) => {
    console.log(`${index + 1}. ${option}`);
  });
  const response = prompt(yellow("Enter your choice (number):"));
  const index = parseInt(response || "", 10) - 1;
  return options[index] || options[0];
};

export const numberInput = (message: string): number => {
  const response = prompt(yellow(message));
  return parseInt(response || "0", 10);
};
