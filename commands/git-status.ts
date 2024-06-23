import { Command } from "../types.ts";
import { title, echo, runShellCommand } from "../cli.ts";

const gitStatusCommand: Command = {
  name: "git-status",
  description: "Show the git status of the current directory",
  execute: async (args: Record<string, unknown>) => {
    if (args.help) {
      echo("Usage: switch git-status");
      echo("Shows the git status of the current directory.");
      echo("This command does not take any additional options.");
      return;
    }
    title("Git Status");
    await runShellCommand("git", ["status"]);
  }
};

export default gitStatusCommand;