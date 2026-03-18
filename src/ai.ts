import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { DEFAULT_PROMPT } from "./prompt.js";
import type { Config } from "./config.js";

const providerFactory = {
  openai: createOpenAI,
  anthropic: createAnthropic,
  google: createGoogleGenerativeAI,
  groq: createGroq,
} as const;

export async function generateCommitMessage({ diff, config, intention }: { diff: string; config: Config; intention?: string }) {
  const factory = providerFactory[config.provider as keyof typeof providerFactory];
  if (!factory) {
    throw new Error(`Unknown provider '${config.provider}'. Supported: ${Object.keys(providerFactory).join(", ")}`);
  }

  const provider = factory({ apiKey: config.apiKey });
  const model = provider(config.model);

  const basePrompt = config.prompt || DEFAULT_PROMPT;
  const intentionAddendum = intention
    ? `\n\nThe user has provided their intent for this commit: "${intention}"\nUse this as the short description in the subject line. Determine the appropriate type and scope from the diff, but use the user's intent verbatim as the description portion (after "type(scope): ").`
    : "";

  const { text } = await generateText({
    model,
    system: basePrompt + intentionAddendum,
    prompt: diff,
  });

  return text.trim();
}
