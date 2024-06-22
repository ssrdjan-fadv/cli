import { PluginCommand } from "../domain/types.ts";

export const loadPlugins = async (): Promise<PluginCommand[]> => {
  const pluginDir = "./plugins";
  const plugins: PluginCommand[] = [];

  for await (const dirEntry of Deno.readDir(pluginDir)) {
    if (dirEntry.isFile && dirEntry.name.endsWith(".ts")) {
      const module = await import(`../${pluginDir}/${dirEntry.name}`);
      if (typeof module.default === "object" && 'execute' in module.default) {
        plugins.push(module.default as PluginCommand);
      }
    }
  }

  return plugins;
};