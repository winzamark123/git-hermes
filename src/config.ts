import { z } from "zod";
import { join } from "node:path";
import { homedir } from "node:os";
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { spawn } from "node:child_process";
import { DEFAULT_PROMPT } from "./prompt.js";

const SUPPORTED_PROVIDERS = ["openai", "anthropic", "google", "groq"] as const;
const DEFAULT_PROVIDER = "openai";
const DEFAULT_MODEL = "gpt-4o";

const configSchema = z.object({
  provider: z.enum(SUPPORTED_PROVIDERS),
  model: z.string().min(1),
  apiKey: z.string().min(1),
  prompt: z.string().optional(),
});

export type Config = z.infer<typeof configSchema>;

const fileConfigSchema = configSchema.partial();

function getConfigPath() {
  const xdgConfig = process.env.XDG_CONFIG_HOME;
  const base = xdgConfig || join(homedir(), ".config");
  return join(base, "hermes", "config.json");
}

async function fileExists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function ensureConfigExists() {
  const configPath = getConfigPath();
  const dir = configPath.slice(0, configPath.lastIndexOf("/"));
  await mkdir(dir, { recursive: true });

  const defaultConfig = {
    provider: DEFAULT_PROVIDER,
    model: DEFAULT_MODEL,
    apiKey: "your-api-key-here",
    prompt: DEFAULT_PROMPT,
  };

  await writeFile(configPath, JSON.stringify(defaultConfig, null, 2) + "\n");
  console.log(`Created default config at ${configPath}`);
}

export async function loadConfig({
  providerOverride,
  modelOverride,
  apiKeyOverride,
  promptOverride,
}: {
  providerOverride?: string;
  modelOverride?: string;
  apiKeyOverride?: string;
  promptOverride?: string;
} = {}) {
  const configPath = getConfigPath();
  let fileConfig: z.infer<typeof fileConfigSchema> = {};

  if (await fileExists(configPath)) {
    const raw = JSON.parse(await readFile(configPath, "utf-8"));
    const parsed = fileConfigSchema.safeParse(raw);
    if (parsed.success) {
      fileConfig = parsed.data;
    }
  } else {
    await ensureConfigExists();
  }

  // priority: CLI flags > env vars > config file > defaults
  const provider = providerOverride || process.env.HERMES_PROVIDER || fileConfig.provider || DEFAULT_PROVIDER;
  const model = modelOverride || process.env.HERMES_MODEL || fileConfig.model || DEFAULT_MODEL;
  const apiKey = apiKeyOverride || process.env.HERMES_API_KEY || fileConfig.apiKey;
  const prompt = promptOverride || fileConfig.prompt;

  if (!apiKey) {
    throw new Error(
      `No API key found. Set one of:\n` +
        `  export HERMES_API_KEY=your-key\n` +
        `  git hermes -k your-key\n` +
        `  Edit ${configPath} and add "apiKey": "your-key"`,
    );
  }

  if (!SUPPORTED_PROVIDERS.includes(provider as (typeof SUPPORTED_PROVIDERS)[number])) {
    throw new Error(`Unknown provider '${provider}'. Supported: ${SUPPORTED_PROVIDERS.join(", ")}`);
  }

  return configSchema.parse({ provider, model, apiKey, prompt });
}

export async function openConfig() {
  const configPath = getConfigPath();

  if (!(await fileExists(configPath))) {
    await ensureConfigExists();
  }

  const editor = process.env.EDITOR || process.env.VISUAL || "vi";
  const proc = spawn(editor, [configPath], { stdio: "inherit" });

  await new Promise<void>((resolve, reject) => {
    proc.on("close", (code) => {
      if (code === 0 || code === null) resolve();
      else reject(new Error(`Editor exited with code ${code}`));
    });
    proc.on("error", reject);
  });
}
