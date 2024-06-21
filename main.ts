import { Cli } from "./commands/cli.ts";
import { createSwitchDefault } from "./commands/switch-default.ts";
import { createSwitchSetup } from "./commands/switch-setup.ts";
import { createSwitchInit } from "./commands/switch-init.ts";

Cli.command("setup", createSwitchSetup());
Cli.command("init", createSwitchInit());
Cli.command("default", createSwitchDefault());
Cli.parse(Deno.args);
