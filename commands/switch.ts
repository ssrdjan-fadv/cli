import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import { banner, debug, echo } from "../utils/cli.ts";
import { createSwitchSetup } from "./switch-setup.ts";
import { createSwitchInit } from "./switch-init.ts";

export const createSwitch = (version: string) => {
  banner(version);

  const switchCommand = new Command()
    .name("switch")
    .description("The Command Line Shell for Switch Applications")
    .version(version)
    .alias("sc");

  switchCommand.globalOption("-X", "Optional. Enables debug mode.", {
    action: () => {
      Deno.env.set("DEBUG", "true");
      debug("Debug mode enabled.");
    },
  });

  // Add subcommands
  switchCommand.command("setup", createSwitchSetup());
  switchCommand.command("init", createSwitchInit());

  // Default action when no subcommand is provided
  switchCommand.action(() => {
    echo("Run switch --help for usage.");
  });

  return switchCommand;
};
