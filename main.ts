import { bold, red, brightWhite, brightCyan, brightGreen } from "https://deno.land/std@0.181.0/fmt/colors.ts";
import { discoverCommands, runSwitchCommand, runShellCommand, echo } from "./cli.ts";

const VERSION = "1.2.2";

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function rainbowText(text: string): string {
  const colors = [brightCyan, brightWhite];

  let result = "";
  for (let i = 0; i < text.length; i++) {
    const color = colors[i % colors.length];
    result += color(text[i]);
  }
  return result;
}

async function animateBanner() {
  // Hide cursor
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
    ✨ ✨ ✨  
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
    `,
  ];

  for (const frame of bannerFrames) {
    console.clear();
    echo(rainbowText(frame));
    await sleep(150);
  }

  // Show Cursor
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

async function printBanner() {
  await runShellCommand("clear", []);
  await animateBanner();
  echo(footer);
}

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