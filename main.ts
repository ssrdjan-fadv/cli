import { parse } from "https://deno.land/std@0.181.0/flags/mod.ts";
import { loadCommands, executeCommand } from "./cli.ts";

const args = parse(Deno.args);
const commands = await loadCommands();

await executeCommand(commands, args);