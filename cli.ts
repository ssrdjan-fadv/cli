import { parse } from "https://deno.land/std@0.181.0/flags/mod.ts";
import { cyan, bold, white, red, yellow } from "https://deno.land/std@0.181.0/fmt/colors.ts";
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

export const title = (message: string): void => console.log(cyan(bold(`\n${message}\n`)));
export const echo = (message: string): void => console.log(white(message));
export const error = (message: string): void => console.log(red(message));

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

export const loadCommand = async (commandName: string): Promise<Command> => {
  const commandsDir = "commands";
  const commandFile = `${commandsDir}/${commandName}.ts`;

  try {
    const module = await import(`./${commandFile}`);
    if (typeof module.default === "object" && 'execute' in module.default) {
      return module.default as Command;
    } else {
      throw new Error(`Invalid command module: ${commandName}`);
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      // If the command file is not found, try loading the default command
      if (commandName !== "default") {
        return loadCommand("default");
      }
    }
    throw error;
  }
};

export const discoverCommands = async (): Promise<Command[]> => {
  const commandsDir = "commands";
  const commands: Command[] = [];

  for await (const entry of Deno.readDir(commandsDir)) {
    if (entry.isFile && entry.name.endsWith(".ts")) {
      const commandName = entry.name.replace(".ts", "");
      try {
        const command = await loadCommand(commandName);
        commands.push(command);
      } catch (error) {
        error(`Error loading command ${commandName}: ${error.message}`);
      }
    }
  }
  return commands;
};        

export async function runShellCommand(command: string, args: string[], successMsg?: string, errorMsg?: string): Promise<boolean> {
  const process = new Deno.Command(command, {
    args,
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout, stderr } = await process.output();
  try {
    if (code === 0) {
      console.log(successMsg ? `${successMsg}\n` : `${new TextDecoder().decode(stdout).trim()}\n`);
      return true;
    }
    error(errorMsg ? errorMsg : `Shell Command ${command} failed: ${new TextDecoder().decode(stderr)}`);
  }
  catch (e) {
    error(errorMsg ? errorMsg : `Shell Command ${command} error: ${e.message}`);
  }
  return false;
}

export async function runSwitchCommand(input: string): Promise<boolean> {  
  try {
    const args = parse(input.split(' '), {
      boolean: ["help"],
      alias: { h: "help" },
    });
    const commandName = args.help ? "help" : (args._[0] as string) || "default";
    const command = await loadCommand(commandName);
    await command.execute(args);
  } catch (err) {
    error(red(`Switch Command "${input}" error: ${err.message}`));
    return false;
  }
  return true;
}

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
