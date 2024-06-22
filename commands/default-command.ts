import { PluginCommand } from "../domain/types.ts";
import { echo, title } from "../utils/cli.ts";

export const switchDefaultPlugin: PluginCommand = {
  name: "default",
  description: "Default action when no subcommand is provided.",

  execute: async () => {
    title("Welcome to the Switch Cli app!");
    echo("Run switch --help for usage.");
  },
};
