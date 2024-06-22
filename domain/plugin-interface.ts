// domain/plugin_interface.ts

import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";

export interface PluginCommand {
  name: string;
  description: string;
  createCommand: () => Command;
}