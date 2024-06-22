import { Cli } from "./utils/cli.ts";
import { loadPlugins } from "./utils/plugin-loader.ts";

// Load plugin commands
const plugins = await loadPlugins();
for (const plugin of plugins) {
  Cli.command(plugin.name, plugin.createCommand());
}

// Parse command line arguments
await Cli.parse(Deno.args);