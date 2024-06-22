import { parse } from "https://deno.land/std@0.181.0/flags/mod.ts";
import { white, green, blue } from "https://deno.land/std@0.181.0/fmt/colors.ts";
import { loadCommands, executeCommand } from "./cli.ts";

// Start and show banner and footer
const cmd = new Deno.Command("clear", { args: [] });
const { stdout } = await cmd.output();
console.log(new TextDecoder().decode(stdout));

const VERSION = "1.2.2";
const banner = green(`
   _____      ___________________ __   _______   ____
  / __/ | /| / /  _/_  __/ ___/ // /  / ___/ /  /  _/
 _\\ \\ | |/ |/ // /  / / / /__/ _  /  / /__/ /___/ /
/___/ |__/|__/___/ /_/  \\___/_//_/   \\___/____/___/
`);

const footer = `
_____________________________________________________
First Advantage                        -- Ship Faster
${blue(white(` v${VERSION}-${Deno.build.os}-${Deno.build.arch} `))}
`;

console.log(banner + footer);

// parse args, load commands and execute requested command
const args = parse(Deno.args);
const commands = await loadCommands();

await executeCommand(commands, args);