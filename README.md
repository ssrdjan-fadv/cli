# Switch CLI - Adding New Commands

This document outlines the process of adding new commands to the Switch CLI using our plugin-based approach.

## Table of Contents

- [Switch CLI - Adding New Commands](#switch-cli---adding-new-commands)
  - [Table of Contents](#table-of-contents)
  - [Command Structure](#command-structure)
  - [Steps to Add a New Command](#steps-to-add-a-new-command)
    - [Example 1 - Here's a minimal example of a new command:](#example-1---heres-a-minimal-example-of-a-new-command)
  - [Creating a Command that Executes Shell Commands](#creating-a-command-that-executes-shell-commands)
    - [Example - 2 Complete `dirCommand`](#example---2-complete-dircommand)
    - [Key Points for Shell Command Execution](#key-points-for-shell-command-execution)
  - [Conclusion](#conclusion)

## Command Structure

Each command is structured as a separate module with a default export conforming to the `Command` interface. Here's the basic structure of a command:

```typescript
import { Command } from "../types.ts";

const myNewCommand: Command = {
  name: "my-new-command",
  description: "Description of what the command does",
  usage: "switch my-new-command [options]",
  options: [
    { flags: "-o, --option <value>", description: "Description of the option" },
    { flags: "-h, --help", description: "Show help for this command" },
  ],
  examples: [
    "switch my-new-command",
    "switch my-new-command --option value",
  ],
  execute: async (args: Record<string, unknown>) => {
    // Command implementation goes here
  },
};

export default myNewCommand;
```

## Steps to Add a New Command

1. **Create a new file:**
   Create a new file in the `commands` directory, e.g., `myNewCommand.ts`. This file will contain all the logic for your new command.

2. **Import necessary types and utilities:**
   At the top of your new file, import the required types and utility functions. This typically includes the `Command` type, CLI utilities, and color functions for output formatting.

   ```typescript
   import { Command } from "../types.ts";
   import { echo, title } from "../cli.ts";
   import { green, red } from "https://deno.land/std@0.181.0/fmt/colors.ts";
   ```

3. **Define your command object:**
   Create an object that conforms to the `Command` interface. This object should include the command's name, description, usage instructions, available options, and usage examples.

   ```typescript
   const myNewCommand: Command = {
     name: "my-new-command",
     description: "Description of what the command does",
     usage: "switch my-new-command [options]",
     options: [
       { flags: "-o, --option <value>", description: "Description of the option" },
       { flags: "-h, --help", description: "Show help for this command" },
     ],
     examples: [
       "switch my-new-command",
       "switch my-new-command --option value",
     ],
     execute: async (args: Record<string, unknown>) => {
       // Command implementation will go here
     },
   };
   ```

4. **Implement the `execute` function:**
   This is where the main logic of your command goes. Start by checking if the user has requested help, and if not, proceed with the command's functionality.

   ```typescript
   execute: async (args: Record<string, unknown>) => {
     if (
       args.help === true || 
       args.h === true || 
       (Array.isArray(args._) && (args._.includes("help") || args._.includes("--help")))
     ) {
       showCommandHelp();
       return;
     }

     // Your command logic goes here
     title("My New Command");
     echo(green("Command executed successfully!"));
   },
   ```

5. **Implement a help function:**
   Create a separate function to display help information for your command. This function should show the usage, description, available options, and examples.

   ```typescript
   function showCommandHelp() {
     echo(`Usage: ${myNewCommand.usage}`);
     echo(myNewCommand.description);
     echo("\nOptions:");
     myNewCommand.options?.forEach(option => {
       echo(`  ${option.flags.padEnd(30)} ${option.description}`);
     });
     echo("\nExamples:");
     myNewCommand.examples?.forEach(example => {
       echo(`  ${example}`);
     });
   }
   ```

6. **Export your command:**
   Make sure to export your command as the default export at the end of the file. This allows it to be easily imported and registered in the main CLI file.

   ```typescript
   export default myNewCommand;
   ```

### Example 1 - Here's a minimal example of a new command:

```typescript
import { Command } from "../types.ts";
import { echo, title } from "../cli.ts";
import { green, red } from "https://deno.land/std@0.181.0/fmt/colors.ts";

const greetCommand: Command = {
  name: "greet",
  description: "Greet a user",
  usage: "switch greet [options] <name>",
  options: [
    { flags: "-l, --loud", description: "Greet loudly" },
    { flags: "-h, --help", description: "Show help for this command" },
  ],
  examples: [
    "switch greet John",
    "switch greet --loud Jane",
  ],
  execute: async (args: Record<string, unknown>) => {
    if (args.help === true || args.h === true) {
      showGreetHelp();
      return;
    }

    const name = Array.isArray(args._) ? args._[0] : "User";
    const greeting = args.loud ? `HELLO, ${name.toUpperCase()}!` : `Hello, ${name}!`;
    
    title("Greeting");
    echo(green(greeting));
  },
};

function showGreetHelp() {
  echo(`Usage: ${greetCommand.usage}`);
  echo(greetCommand.description);
  echo("\nOptions:");
  greetCommand.options?.forEach(option => {
    echo(`  ${option.flags.padEnd(20)} ${option.description}`);
  });
  echo("\nExamples:");
  greetCommand.examples?.forEach(example => {
    echo(`  ${example}`);
  });
}

export default greetCommand;
```

## Creating a Command that Executes Shell Commands

Sometimes you may need to create a command that executes OS shell (or 'gh', 'az') commands). Here's how to do it, using a `dir` command as an example:

1. **Import necessary modules:**
   In addition to the usual imports, make sure to import the `runShellCommand` function from your CLI utilities.

   ```typescript
   import { Command } from "../types.ts";
   import { title, echo, runShellCommand } from "../cli.ts";
   ```

2. **Define your command object:**
   Create your command object as usual, but pay special attention to the options that will be passed to the shell command.

   ```typescript
   const dirCommand: Command = {
     name: "dir",
     description: "Show the content of the current directory",
     usage: "switch dir [options]",
     options: [
       { flags: "-a, --all", description: "Show hidden files" },
       { flags: "-l, --long", description: "Use long listing format" },
     ],
     examples: [
       "switch dir",
       "switch dir --all",
       "switch dir -l",
       "switch dir -al",
     ],
     execute: async (args: Record<string, unknown>) => {
       // Implementation will go here
     }
   };
   ```

3. **Implement the execute function:**
   In the execute function, you'll need to:
   - Check for help request
   - Prepare arguments for the shell command based on user input
   - Execute the shell command using `runShellCommand`
   - Handle the result

   ```typescript
   execute: async (args: Record<string, unknown>) => {
     if (args.help) {
       showDirHelp();
       return;
     }

     title("Folder Content");

     const lsArgs: string[] = [];
     if (args.a || args.all) lsArgs.push("-a");
     if (args.l || args.long) lsArgs.push("-l");

     const result = await runShellCommand("ls", lsArgs);
     if (result.ok) {
       echo(result.value);
     } else {
       echo(`Error: ${result.value}`);
     }
   }
   ```

4. **Implement the help function:**
   Create a function to display help information for your command.

   ```typescript
   function showDirHelp() {
     echo("Usage: " + dirCommand.usage);
     echo(dirCommand.description);
     echo("\nOptions:");
     dirCommand.options?.forEach(option => {
       echo(`  ${option.flags.padEnd(20)} ${option.description}`);
     });
     echo("\nExamples:");
     dirCommand.examples?.forEach(example => {
       echo(`  ${example}`);
     });
   }
   ```

5. **Export the command:**
   Don't forget to export your command as the default export.

   ```typescript
   export default dirCommand;
   ```

### Example - 2 Complete `dirCommand` 

```typescript
import { Command } from "../types.ts";
import { title, echo, runShellCommand } from "../cli.ts";

const dirCommand: Command = {
  name: "dir",
  description: "Show the content of the current directory",
  usage: "switch dir [options]",
  options: [
    { flags: "-a, --all", description: "Show hidden files" },
    { flags: "-l, --long", description: "Use long listing format" },
  ],
  examples: [
    "switch dir",
    "switch dir --all",
    "switch dir -l",
    "switch dir -al",
  ],
  execute: async (args: Record<string, unknown>) => {
    if (args.help) {
      showDirHelp();
      return;
    }

    title("Folder Content");

    const lsArgs: string[] = [];
    if (args.a || args.all) lsArgs.push("-a");
    if (args.l || args.long) lsArgs.push("-l");

    const result = await runShellCommand("ls", lsArgs);
    if (result.ok) {
      echo(result.value);
    } else {
      echo(`Error: ${result.value}`);
    }
  }
};

function showDirHelp() {
  echo("Usage: " + dirCommand.usage);
  echo(dirCommand.description);
  echo("\nOptions:");
  dirCommand.options?.forEach(option => {
    echo(`  ${option.flags.padEnd(20)} ${option.description}`);
  });
  echo("\nExamples:");
  dirCommand.examples?.forEach(example => {
    echo(`  ${example}`);
  });
}

export default dirCommand;
```

### Key Points for Shell Command Execution

- Use the `runShellCommand` function to execute shell commands. This function typically handles the complexities of running a shell command and returns a result object.
- Parse user input carefully to construct the arguments for your shell command.
- Always handle both success and error cases when executing a shell command.
- Provide clear feedback to the user about the result of the command execution.

## Conclusion

By following this guide, you should be able to easily add new commands to the Switch CLI using our plugin-based approach. This modular structure allows for easy maintenance and expansion of the CLI's functionality. If you have any questions or need further assistance, please don't hesitate to ask the development team.
