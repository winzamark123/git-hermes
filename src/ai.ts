import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { DEFAULT_PROMPT } from "./prompt";
import type { Config } from "./config";

const providerFactory = {
  openai: createOpenAI,
  anthropic: createAnthropic,
  google: createGoogleGenerativeAI,
  groq: createGroq,
} as const;

export async function generateCommitMessage({ diff, config }: { diff: string; config: Config }) {
  const [providerId, ...rest] = config.model.split(":");
  const modelId = rest.join(":");

  const factory = providerFactory[providerId as keyof typeof providerFactory];
  if (!factory) {
    throw new Error(`Unknown provider '${providerId}'. Supported: ${Object.keys(providerFactory).join(", ")}`);
  }

  const provider = factory({ apiKey: config.apiKey });
  const model = provider(modelId);

  const { text } = await generateText({
    model,
    system: config.prompt || DEFAULT_PROMPT,
    prompt: diff,
  });

  return text.trim();
}
