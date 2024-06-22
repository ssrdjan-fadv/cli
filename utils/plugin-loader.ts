// utils/plugin_loader.ts

import { PluginCommand } from "../domain/plugin-interface.ts";

export async function loadPlugins(): Promise<PluginCommand[]> {
  const pluginDir = "./plugins";
  const plugins: PluginCommand[] = [];

  for await (const dirEntry of Deno.readDir(pluginDir)) {
    if (dirEntry.isFile && dirEntry.name.endsWith(".ts")) {
      const module = await import(`../${pluginDir}/${dirEntry.name}`);
      if (typeof module.default === "object" && "createCommand" in module.default) {
        plugins.push(module.default as PluginCommand);
      }
    }
  }

  return plugins;
}