import { Command } from "../types.ts";
import { title, echo, runShellCommand } from "../cli.ts";

const dirCommand: Command = {
  name: "dir",
  description: "Show the content of the current directory",
  usage: "switch dir [options]",
  options: [
    { flags: "-a, --all", description: "Show hidden files" },
    { flags: "-l, --long", description: "Use long listing format" },
  ],
  examples: [
    "switch dir",
    "switch dir --all",
    "switch dir -l",
    "switch dir -al",
  ],
  execute: async (args: Record<string, unknown>) => {
    if (args.help) {
      showDirHelp();
      return;
    }

    title("Folder Content");

    const lsArgs: string[] = [];
    if (args.a || args.all) lsArgs.push("-a");
    if (args.l || args.long) lsArgs.push("-l");

    const result = await runShellCommand("ls", lsArgs);
    if (result.ok) {
      echo(result.value);
    } else {
      echo(`Error: ${result.value}`);
    }
  }
};

function showDirHelp() {
  echo("Usage: " + dirCommand.usage);
  echo(dirCommand.description);
  echo("\nOptions:");
  dirCommand.options?.forEach(option => {
    echo(`  ${option.flags.padEnd(20)} ${option.description}`);
  });
  echo("\nExamples:");
  dirCommand.examples?.forEach(example => {
    echo(`  ${example}`);
  });
}

export default dirCommand;