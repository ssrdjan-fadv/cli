import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import { echo } from "./cli.ts";

// Default action when no subcommand is provided
export const createSwitchDefault = () => {
  const command = new Command()
    .name("setup")
    .description("Performs a system check to locate pre-requisite dependencies.")
    .example("switch setup", "Checks the system configuration and installs any missing dependencies.");

  command.action(echo("Run switch --help for usage."));
  return command;
};