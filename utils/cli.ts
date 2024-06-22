import { cyan, bold, white, red, yellow } from "https://deno.land/std@0.181.0/fmt/colors.ts";
import { PluginCommand } from "../domain/types.ts";

export const executeCommand = async (plugins: PluginCommand[], args: Record<string, unknown>): Promise<void> => {
  const commandName = args[0] as string;
  const command = plugins.find(plugin => plugin.name === commandName);

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