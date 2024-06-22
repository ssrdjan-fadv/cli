import { Command } from "../types.ts";
import { echo, title } from "../cli.ts";

export const switchDefaultPlugin: Command = {
  name: "default",
  description: "Default action when no subcommand is provided.",

  execute: async () => {
    title("Welcome to the Switch Cli app!");
    echo("Run switch --help for usage.");
  },
};
