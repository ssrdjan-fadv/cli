import { parse } from "https://deno.land/std@0.181.0/flags/mod.ts";
import { cyan, bold, white, red, yellow } from "https://deno.land/std@0.181.0/fmt/colors.ts";
import { Command, Result } from "./types.ts";

export const standardOptions = [
  { name: "org", description: "The github organization for this app.", type: "string" },
  { name: "type", description: "The Switch application type.", type: "string" },
  { name: "language", description: "The language / framework used.", type: "string" },
  { name: "base", description: "Optional, Base project template repository in github. Format OWNER-OR-ORG/REPO.", type: "string" },
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
    default: { branch: "main" },
    string: ["org", "type", "language"],
  });
};

const loadCommand = async (commandName: string): Promise<Command> => {
  const module = await import(`./commands/${commandName}.ts`);
  if (typeof module.default === "object" && 'execute' in module.default) {
    return module.default as Command;
  }
  throw new Error(`Invalid command module: ${commandName}`);
};

export const discoverCommands = async (): Promise<Command[]> => {
  const commands: Command[] = [];

  for await (const entry of Deno.readDir("commands")) {
    if (entry.isFile && entry.name.endsWith(".ts")) {
      const commandName = entry.name.replace(".ts", "");
      try {
        const command = await loadCommand(commandName);
        commands.push(command);
      } catch (error) {
        console.error(`Error loading command ${commandName}: ${error.message}`);
      }
    }
  }
  return commands;
};        

export async function runShellCommand(command: string, args: string[], successMsg?: string, errorMsg?: string): Promise<Result<string>> {
  let finalErrorMsg = '';

  try {
    const process = new Deno.Command(command, { args, stdout: "piped", stderr: "piped", });
    const { code, stdout, stderr } = await process.output();
    if (code === 0) {
      return { ok: true, value: successMsg ? `${successMsg}\n` : `${new TextDecoder().decode(stdout).trim()}\n`  };
    }
    finalErrorMsg = errorMsg || `Shell Command ${command} failed: ${new TextDecoder().decode(stderr) }`;
    console.error(finalErrorMsg);
  } catch (e) {
    finalErrorMsg = errorMsg || `Shell Command ${command} error: ${e instanceof Error ? e.message : String(e)}`;
    console.error(finalErrorMsg);
  }
  return { ok: false, value: finalErrorMsg };
}

export async function runSwitchCommand(input: string): Promise<boolean> {  
  try {
    const args = parse(input.split(' '), { boolean: ["help"], alias: { h: "help" }});
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

export const stringInput = (message: string): string => {
  const response = prompt(yellow(message));
  return response || "";
};

export const numberInput = (message: string): number => {
  const response = prompt(yellow(message));
  return parseInt(response || "0", 10);
};
