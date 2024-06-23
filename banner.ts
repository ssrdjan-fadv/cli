import { brightCyan, brightWhite } from "https://deno.land/std@0.181.0/fmt/colors.ts";
import { echo, runShellCommand } from "./cli.ts";

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

}

const footer = `
╔═══════════════════════════════════════════════════╗
║                                                   ║
║        First Advantage -- Ship Faster!            ║
║                                                   ║
╚═══════════════════════════════════════════════════╝

v${VERSION}-${Deno.build.os}, ${Deno.build.arch}
`;

export async function printBanner() {
  // Hide cursor
  Deno.stdout.writeSync(new TextEncoder().encode("\x1b[?25l"));

  await runShellCommand("clear", []);
  await animateBanner();
  echo(footer);

  // Show Cursor
  Deno.stdout.writeSync(new TextEncoder().encode("\x1b[?25h"));
}