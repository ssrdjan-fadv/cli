import { Command } from "../types.ts";
import { echo, title } from "../cli.ts";

const switchDefaultPlugin: Command = {
  name: "default",
  description: "Default action when no command is provided.",
  execute: async (args: Record<string, unknown>) => {
    title("Welcome to the Switch CLI app!");
    echo("To see available commands and options, run: switch help");
  },
};

export default switchDefaultPlugin;