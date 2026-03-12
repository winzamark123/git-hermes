#!/usr/bin/env bun

import { loadConfig, openConfig } from "./config";
import { getStagedDiff, commitWithMessage } from "./git";
import { generateCommitMessage } from "./ai";

function printHelp() {
  console.error(`Usage: git hermes [command] [options]

Commands:
  config                    Open config file in $EDITOR

Options:
  -p, --provider <name>     AI provider (openai, anthropic, google, groq)
  -m, --model <name>        Model name (e.g. gpt-4o, claude-sonnet-4-20250514)
  -k, --api-key <key>       API key
      --prompt <text>        Custom system prompt
      --dry-run              Print commit message without committing
  -h, --help                Show this help message

Examples:
  git hermes                                Generate and commit
  git hermes -p anthropic -m claude-sonnet-4-20250514   Override provider and model
  git hermes --dry-run                      Preview message
  git hermes config                         Edit configuration`);
}

function getFlagValue({ args, flags }: { args: string[]; flags: string[] }) {
  for (const flag of flags) {
    const index = args.indexOf(flag);
    if (index !== -1) {
      const value = args[index + 1];
      if (!value || value.startsWith("-")) {
        throw new Error(`${flag} requires a value`);
      }
      return value;
    }
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  if (args[0] === "config") {
    await openConfig();
    process.exit(0);
  }

  const dryRun = args.includes("--dry-run");
  const providerOverride = getFlagValue({ args, flags: ["-p", "--provider"] });
  const modelOverride = getFlagValue({ args, flags: ["-m", "--model"] });
  const apiKeyOverride = getFlagValue({ args, flags: ["-k", "--api-key"] });
  const promptOverride = getFlagValue({ args, flags: ["--prompt"] });

  const config = await loadConfig({ providerOverride, modelOverride, apiKeyOverride, promptOverride });
  const diff = await getStagedDiff();

  console.error("Generating commit message...");
  const message = await generateCommitMessage({ diff, config });

  if (dryRun) {
    process.stdout.write(message + "\n");
  } else {
    const result = await commitWithMessage({ message });
    console.error(result);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
