import { bold, red, brightWhite, brightGreen } from "https://deno.land/std@0.181.0/fmt/colors.ts";
import { discoverCommands, runSwitchCommand, echo } from "./cli.ts";
import { printBanner } from "./banner.ts";

function printPrompt() {
  echo(brightWhite("\n" + "=".repeat(50)));
  echo(bold(brightWhite("Enter a command (or 'exit' to quit):")));
  echo(brightWhite("=".repeat(50)));
}

async function showInitialHelp() {
  echo(bold(brightWhite("\nAvailable commands:")));
  const commands = await discoverCommands();
  commands.forEach(cmd => {
    echo(brightWhite(`  ${cmd.name.padEnd(15)} ${cmd.description}`));
  });
  echo(bold(brightWhite("\n⚠️  For more details, type 'help' or '<command> --help'")));
}

async function runInitialCheck() {
  const result = await runSwitchCommand("check");
  if(!result) {
    echo(red("\n⚠️ Critical dependencies are missing. Please install them and try again."));
    echo(brightWhite("Run 'switch check' for more details on missing dependencies.\n"));
    Deno.exit(1);
  }
}

async function main() {
  await printBanner();
  await runInitialCheck();
  await showInitialHelp();

  while (true) {
    printPrompt();
    const input = prompt(bold(brightGreen("➤ ")));
    
    if (!input) continue;
    
    if (input.toLowerCase() === 'exit') {
      echo(brightGreen("Thank you for using Switch CLI. Goodbye!"));
      Deno.exit(0);
    }

    echo(brightWhite("\nExecuting command: ") + brightWhite(input) + "\n");
    await runSwitchCommand(input);
  }
}

if (import.meta.main) {
  main();
}