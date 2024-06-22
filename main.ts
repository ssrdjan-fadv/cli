import { parse } from "https://deno.land/std@0.181.0/flags/mod.ts";
import { white, green, blue, yellow, bold, cyan, red } from "https://deno.land/std@0.181.0/fmt/colors.ts";
import { loadCommand, executeCommand, discoverCommands } from "./cli.ts";

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

function clearConsole() {
  const cmd = new Deno.Command("clear", { args: [] });
  const { stdout } = cmd.outputSync();
  console.log(new TextDecoder().decode(stdout));
}

function printBanner() {
  clearConsole();
  console.log(banner + footer);
}

async function runCommand(input: string) {
  const args = parse(input.split(' '), {
    boolean: ["help"],
    alias: { h: "help" },
  });

  const commandName = args.help ? "help" : (args._[0] as string) || "default";

  try {
    const command = await loadCommand(commandName);
    await executeCommand(command, args);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

function printPrompt() {
  console.log(cyan("\n" + "=".repeat(50)));
  console.log(bold(yellow("Enter a command (or 'exit' to quit):")));
  console.log(cyan("=".repeat(50)));
}

async function showInitialHelp() {
  console.log(bold(cyan("\nAvailable commands:")));
  const commands = await discoverCommands();
  commands.forEach(cmd => {
    console.log(yellow(`  ${cmd.name.padEnd(15)} ${cmd.description}`));
  });
  console.log(bold(cyan("\n⚠️  For more details, type 'help' or '<command> --help'")));
}

async function runInitialCheck() {
  const checkCommand = await loadCommand("check");
  try {
    await executeCommand(checkCommand, {});
  } catch (_) {
    Deno.exit(1);
  }
}

async function main() {
  printBanner();
  await runInitialCheck();
  await showInitialHelp();

  while (true) {
    printPrompt();
    const input = prompt(bold(green("➤ ")));
    
    if (!input) continue;
    
    if (input.toLowerCase() === 'exit') {
      console.log(green("Thank you for using Switch CLI. Goodbye!"));
      Deno.exit(0);
    }

    console.log(white("\nExecuting command: ") + yellow(input) + "\n");
    await runCommand(input);
  }
}

if (import.meta.main) {
  main();
}