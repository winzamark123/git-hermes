#!/usr/bin/env bun

import { loadConfig, runConfigure } from "./config";
import { getStagedDiff } from "./git";
import { generateCommitMessage } from "./ai";
import { commitWithMessage } from "./git";

function printHelp() {
  console.error(`Usage: git hermes [command] [options]

Commands:
  configure    Interactive setup for model, API key, and prompt

Options:
  --commit     Generate message and commit automatically
  --model      Override model (e.g. openai:gpt-4o)
  --help       Show this help message

Examples:
  git hermes                              Print commit message to stdout
  git hermes --commit                     Generate and commit
  git hermes --model anthropic:claude-sonnet-4-20250514  Override model
  git hermes configure                    Interactive setup`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  if (args[0] === "configure") {
    await runConfigure();
    process.exit(0);
  }

  const shouldCommit = args.includes("--commit");

  let modelOverride: string | undefined;
  const modelIndex = args.indexOf("--model");
  if (modelIndex !== -1) {
    modelOverride = args[modelIndex + 1];
    if (!modelOverride) {
      throw new Error("--model requires a value (e.g. --model openai:gpt-4o)");
    }
  }

  const config = await loadConfig({ modelOverride });
  const diff = await getStagedDiff();

  console.error("Generating commit message...");
  const message = await generateCommitMessage({ diff, config });

  if (shouldCommit) {
    const result = await commitWithMessage({ message });
    console.error(result);
  } else {
    process.stdout.write(message + "\n");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
