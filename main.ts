import { parse } from "https://deno.land/std@0.181.0/flags/mod.ts";
import { loadPlugins } from "./utils/plugin-loader.ts";
import { executeCommand } from "./utils/cli.ts";

const args = parse(Deno.args);
const plugins = await loadPlugins();

await executeCommand(plugins, args);