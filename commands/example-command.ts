// plugins/example_command.ts

import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import { PluginCommand } from "../domain/plugin-interface.ts";

const exampleCommand: PluginCommand = {
  name: "example",
  description: "An example plugin command",
  createCommand: () => {
    return new Command()
      .description("This is an example plugin command")
      .action(() => {
        console.log("Hello from the example plugin!");
      });
  },
};

export default exampleCommand;