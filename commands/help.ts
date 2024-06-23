import { Command } from "../types.ts";
import { title, echo, error } from "../cli.ts";
import { discoverCommands } from "../cli.ts";

const helpCommand: Command = {
  name: "help",
  description: "Display help information for Switch CLI commands",
  execute: async (args: Record<string, unknown>) => {
    const commands = await discoverCommands();

    // Check if a specific command was requested
    const commandName = args._ && Array.isArray(args._) && args._.length > 0
      ? args._[0] as string
      : undefined;

    if (commandName) {
      const command = commands.find(cmd => cmd.name === commandName);

      if (command) {
        showCommandHelp(command);
      } else {
        error(`Unknown command: ${commandName}`);
        echo("Use 'switch help' to see a list of all available commands.");
      }
    } else {
      showGeneralHelp(commands);
    }
  },
};

function showGeneralHelp(commands: Command[]) {
  title("Switch CLI Help");
  echo("Usage: switch [command] [options]");

  echo("\nAvailable commands:");
  commands.forEach(cmd => {
    echo(`  ${cmd.name.padEnd(15)} ${cmd.description}`);
  });
  echo("\nFor more information on a specific command, use: switch help <command>");
}

function showCommandHelp(command: Command) {
  title(`Help: ${command.name}`);
  echo(`Description: ${command.description}`);

  if (command.usage) {
    echo(`\nUsage: ${command.usage}`);
  }

  if (command.options && command.options.length > 0) {
    echo("\nOptions:");
    command.options.forEach(option => {
      echo(`  ${option.flags.padEnd(20)} ${option.description}`);
    });
  }

  if (command.examples && command.examples.length > 0) {
    echo("\nExamples:");
    command.examples.forEach(example => {
      echo(`  ${example}`);
    });
  }
}

export default helpCommand;