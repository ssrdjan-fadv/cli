import { Command } from "../types.ts";
import { runShellCommand, title, echo, error } from "../cli.ts";
import { green, red } from "https://deno.land/std@0.181.0/fmt/colors.ts";

const addSecretCommand: Command = {
  name: "add-secret",
  description: "Add a secret to Azure Key Vault",
  usage: "switch add-secret --vault-name <vault-name> --name <secret-name> --value <secret-value>",
  options: [
    { flags: "--vault-name <name>", description: "The name of the Azure Key Vault (required)" },
    { flags: "--name <name>", description: "The name of the secret (required)" },
    { flags: "--value <value>", description: "The value of the secret (required)" },
    { flags: "-h, --help", description: "Show help for this command" },
  ],
  examples: [
    "switch add-secret --vault-name myVault --name mySecret --value myValue",
  ],
  execute: async (args: Record<string, unknown>) => {
    if (
      args.help === true ||
      args.h === true ||
      (Array.isArray(args._) && (args._.includes("help") || args._.includes("--help")))
    ) {
      showAddSecretHelp();
      return;
    }

    const vaultName = args["vault-name"];
    const secretName = args.name;
    const secretValue = args.value;

    if (!vaultName || !secretName || !secretValue) {
      error(red("Missing required arguments. Use --help for usage information."));
      Deno.exit(1);
    }

    title(`Adding secret to Azure Key Vault: ${vaultName}`);
    const result = await runShellCommand(
      "az",
      ["keyvault", "secret", "set", "--vault-name", vaultName as string, "--name", secretName as string, "--value", secretValue as string],
      "Secret added successfully",
      `'az' is not installed or you're not logged in.`
    );

    if (result.ok) {
      echo(green("\n✔ Secret added successfully"));
    } else {
      error(red("\n❌ Failed to add secret. " + result.value));
      Deno.exit(1);
    }
  }
};

function showAddSecretHelp() {
  echo(`Usage: ${addSecretCommand.usage}`);
  echo(addSecretCommand.description);
  echo("\nOptions:");
  addSecretCommand.options?.forEach(option => {
    echo(`  ${option.flags.padEnd(30)} ${option.description}`);
  });
  echo("\nExamples:");
  addSecretCommand.examples?.forEach(example => {
    echo(`  ${example}`);
  });
  echo("\nNote: This command requires the Azure CLI ('az') to be installed and logged in.");
}

export default addSecretCommand;