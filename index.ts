import { createSwitch } from "./commands/switch.ts";

const VERSION = "1.2.2"; // You might want to import this from a separate file
await createSwitch(VERSION).parse(Deno.args);