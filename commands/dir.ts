import { Command } from "../types.ts";
import { title, echo, runShellCommand } from "../cli.ts";

const dirCommand: Command = {
  name: "dir",
  description: "Show the content of the current directory",
  execute: async (args: Record<string, unknown>) => {
    if (args.help) {
      echo("Usage: switch dir");
      echo("Shows the content of the current directory.");
      echo("This command does not take any additional options.");
      return;
    }
    title("Folder Content");
    const result = await runShellCommand("ls", ["-la"]);
    echo(result.value)
  }
};

export default dirCommand;