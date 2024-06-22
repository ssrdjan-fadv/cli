import { Command } from "../types.ts";
import { title, echo, error } from "../cli.ts";

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

    try {
      const process = new Deno.Command("az", {
        args: [
          "keyvault",
          "secret",
          "set",
          "--vault-name",
          vaultName as string,  //todo: could be deduced from the context?
          "--name",
          secretName as string,
          "--value",
          secretValue as string,
        ],
        stdout: "piped",
        stderr: "piped",
      });

      const { code, stdout, stderr } = await process.output();

      if (code === 0) {
        const result = JSON.parse(new TextDecoder().decode(stdout));
        echo("Secret added successfully:");
        echo(`Name: ${result.name}`);
        echo(`Vault: ${result.vaultUri}`);
        echo(`Creation Date: ${result.properties.created}`);
      } else {
        const errorMessage = new TextDecoder().decode(stderr);
        error(`Azure CLI command failed: ${errorMessage}`);
      }
    } catch (e) {
      error(`Failed to execute Azure CLI command: ${e.message}`);
    }
  }
};

export default addSecretCommand;