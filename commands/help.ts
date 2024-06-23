import { Command } from "../types.ts";
import { title, echo } from "../cli.ts";
import { discoverCommands } from "../cli.ts";

const helpCommand: Command = {
  name: "help",
  description: "Display help information for Switch CLI commands",
  execute: async () => {
    title("Switch CLI Help");
    echo("Usage: switch [command] [options]");
    
    const commands = await discoverCommands();
    
    echo("\nAvailable commands:");
    commands.forEach(cmd => {
      echo(`  ${cmd.name.padEnd(15)} ${cmd.description}`);
    });
    echo("\nFor more information on a specific command, use: switch <command> --help");
  },
};

export default helpCommand;