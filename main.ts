import { bold, red, white, green } from "https://deno.land/std@0.181.0/fmt/colors.ts";
import { discoverCommands, runSwitchCommand, echo } from "./cli.ts";
import { printBanner } from "./banner.ts";

const printPrompt = () => {
  echo(white("\n" + "=".repeat(50)));
  echo(bold(white("Enter a command (or 'exit' to quit):")));
  echo(white("=".repeat(50)));
};

const showInitialHelp = async () => {
  echo(bold(white("\nAvailable commands:")));
  const commands = await discoverCommands();
  commands.forEach(cmd => {
    echo(white(`  ${cmd.name.padEnd(15)} ${cmd.description}`));
  });
  echo(bold(white("\n⚠️  For more details, type 'help' or '<command> --help'")));
};

const runInitialCheck = async () => {
  const result = await runSwitchCommand("check");
  if (!result) {
    echo(red("\n⚠️ Critical dependencies are missing. Please install them and try again."));
    echo(white("Run 'switch check' for more details on missing dependencies.\n"));
    Deno.exit(1);
  }
};

const main = async () => {
  await printBanner();
  await runInitialCheck();
  await showInitialHelp();

  while (true) {
    printPrompt();
    const input = prompt(bold(green("➤ ")));

    if (!input) continue;

    if (input.toLowerCase() === 'exit') {
      echo(green("Thank you for using Switch CLI. Goodbye!"));
      Deno.exit(0);
    }

    echo(white("\nExecuting command: ") + white(input) + "\n");
    await runSwitchCommand(input);
  }
};

if (import.meta.main) {
  main();
}