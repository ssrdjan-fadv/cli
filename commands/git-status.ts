import { Command } from "../types.ts";
import { title, echo, error } from "../cli.ts";

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

    try {
      const process = new Deno.Command("git", {
        args: ["status"],
        stdout: "piped",
        stderr: "piped",
      });

      const { code, stdout, stderr } = await process.output();

      if (code === 0) {
        echo(new TextDecoder().decode(stdout));
      } else {
        const errorMessage = new TextDecoder().decode(stderr);
        error(`Git command failed: ${errorMessage}`);
      }
    } catch (e) {
      error(`Failed to execute git command: ${e.message}`);
    }
  }
};

export default gitStatusCommand;