import { Command } from "../types.ts";
import { runShellCommand, title, echo, error, } from "../cli.ts";

const addSecretCommand: Command = {
  name: "add-secret",
  description: "Add a secret to Azure Key Vault",
  execute: async (args: Record<string, unknown>) => {
    if (args.help) {
      echo("Usage: switch add-secret --vault-name <vault-name> --name <secret-name> --value <secret-value>");
      echo("Adds a secret to the specified Azure Key Vault.");
      echo("Options:");
      echo("  --vault-name    The name of the Azure Key Vault (required)");
      echo("  --name          The name of the secret (required)");
      echo("  --value         The value of the secret (required)");
      return;
    }

    const vaultName = args["vault-name"];  //todo: could be deduced from the context?
    const secretName = args.name;
    const secretValue = args.value;
    if (!vaultName || !secretName || !secretValue) {
      error("Missing required arguments. Use --help for usage information.");
      return;
    }

    title(`Adding secret to Azure Key Vault: ${vaultName}`);
    await runShellCommand("az",
      ["keyvault", "secret", "set", "--vault-name", vaultName as string, "--name", secretName as string, "--value", secretValue as string],
      "Secret added successfully",
      `'az' is not installed or you're not logged in.`);
  }
};

export default addSecretCommand;