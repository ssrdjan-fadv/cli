// plugins/switch_default.ts

import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import { PluginCommand } from "../domain/plugin-interface.ts";
import { echo } from "../commands/cli.ts";

const switchDefaultPlugin: PluginCommand = {
  name: "default",
  description: "Default action when no subcommand is provided.",
  createCommand: () => {
    return new Command()
      .description("Default action when no subcommand is provided.")
      .action(() => {
        echo("Run switch --help for usage.");
      });
  },
};

export default switchDefaultPlugin;