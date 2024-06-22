import { parse } from "https://deno.land/std@0.181.0/flags/mod.ts";
import { white, green, yellow, bold, cyan, red, blue } from "https://deno.land/std@0.181.0/fmt/colors.ts";
import { loadCommand, executeCommand, discoverCommands } from "./cli.ts";

const VERSION = "1.2.2";

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function rainbowText(text: string): string {
  const colors = [green, blue, cyan, yellow];

  let result = "";
  for (let i = 0; i < text.length; i++) {
    const color = colors[i % colors.length];
    result += color(text[i]);
  }
  return result;
}

async function animateBanner() {
  Deno.stdout.writeSync(new TextEncoder().encode("\x1b[?25l"));
  const bannerFrames = [
    `
   _____      ___________________ __   _______   ____
  / __/ | /| / /  _/_  __/ ___/ // /  / ___/ /  /  _/
 _\\ \\ | |/ |/ // /  / / / /__/ _  /  / /__/ /___/ /
/___/ |__/|__/___/ /_/  \\___/_//_/   \\___/____/___/
    ✨
    `,
    `
   _____      ___________________ __   _______   ____
  / __/ | /| / /  _/_  __/ ___/ // /  / ___/ /  /  _/
 _\\ \\ | |/ |/ // /  / / / /__/ _  /  / /__/ /___/ /
/___/ |__/|__/___/ /_/  \\___/_//_/   \\___/____/___/
    ✨ ✨ 
    `,
    `
   _____      ___________________ __   _______   ____
  / __/ | /| / /  _/_  __/ ___/ // /  / ___/ /  /  _/
 _\\ \\ | |/ |/ // /  / / / /__/ _  /  / /__/ /___/ /
/___/ |__/|__/___/ /_/  \\___/_//_/   \\___/____/___/
    ✨ 
    `,
    `
   _____      ___________________ __   _______   ____
  / __/ | /| / /  _/_  __/ ___/ // /  / ___/ /  /  _/
 _\\ \\ | |/ |/ // /  / / / /__/ _  /  / /__/ /___/ /
/___/ |__/|__/___/ /_/  \\___/_//_/   \\___/____/___/
    `,
  ];

  for (let i = 0; i < 3; i++) {
    for (const frame of bannerFrames) {
      console.clear();
      console.log(rainbowText(frame));
      await sleep(200);
    }
  }
  Deno.stdout.writeSync(new TextEncoder().encode("\x1b[?25h"));
}

const footer = `
╔═══════════════════════════════════════════════════╗
║                                                   ║
║        First Advantage -- Ship Faster!            ║
║                                                   ║
╚═══════════════════════════════════════════════════╝

v${VERSION}-${Deno.build.os}, ${Deno.build.arch}
`;

function clearConsole() {
  const cmd = new Deno.Command("clear", { args: [] });
  const { stdout } = cmd.outputSync();
  console.log(new TextDecoder().decode(stdout));
}

async function printBanner() {
  clearConsole();
  await animateBanner();
  console.log(footer);
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
    console.error(red(`Error: ${error.message}`));
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
    console.log(red("\n⚠️ Critical dependencies are missing. Please install them and try again."));
    console.log(yellow("Run 'switch check' for more details on missing dependencies."));
    Deno.exit(1);
  }
}

async function main() {
  await printBanner();
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