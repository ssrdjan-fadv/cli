import { Command } from "../types.ts";
import { title, echo, runShellCommand } from "../cli.ts";
import { red } from "https://deno.land/std@0.181.0/fmt/colors.ts";

const gitStatusCommand: Command = {
  name: "git-status",
  description: "Show the git status of the current directory",
  usage: "switch git-status [options]",
  options: [
    { flags: "-s, --short", description: "Give the output in the short-format" },
    { flags: "-b, --branch", description: "Show branch information" },
    { flags: "-h, --help", description: "Show help for this command" },
  ],
  examples: [
    "switch git-status",
    "switch git-status --short",
    "switch git-status --branch",
  ],
  execute: async (args: Record<string, unknown>) => {
    if (
      args.help === true ||
      args.h === true ||
      (Array.isArray(args._) && (args._.includes("help") || args._.includes("--help")))
    ) {
      showGitStatusHelp();
      return;
    }

    title("Git Status");

    const gitArgs = ["status"];
    if (args.s === true || args.short === true) gitArgs.push("--short");
    if (args.b === true || args.branch === true) gitArgs.push("--branch");

    const result = await runShellCommand("git", gitArgs);
    if (result.ok) {
      echo(result.value);
    } else {
      echo(red("\n❌ Failed to get git status. " + result.value));
      Deno.exit(1);
    }
  }
};

function showGitStatusHelp() {
  echo(`Usage: ${gitStatusCommand.usage}`);
  echo(gitStatusCommand.description);
  echo("\nOptions:");
  gitStatusCommand.options?.forEach(option => {
    echo(`  ${option.flags.padEnd(20)} ${option.description}`);
  });
  echo("\nExamples:");
  gitStatusCommand.examples?.forEach(example => {
    echo(`  ${example}`);
  });
  echo("\nNote: This command requires git to be installed and the current directory to be a git repository.");
}

export default gitStatusCommand;