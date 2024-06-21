import { Cli, displayBanner } from "./commands/cli.ts";
import { createSwitchDefault } from "./commands/switch-default.ts";
import { createSwitchSetup } from "./commands/switch-setup.ts";
import { createSwitchInit } from "./commands/switch-init.ts";

displayBanner("1.2.2");

const cli = Cli()
cli.command("setup", createSwitchSetup());
cli.command("init", createSwitchInit());
cli.command("default", createSwitchDefault());
cli.parse(Deno.args);
