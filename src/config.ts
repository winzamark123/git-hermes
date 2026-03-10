import { z } from "zod";
import { join } from "path";
import { homedir } from "os";

const SUPPORTED_PROVIDERS = ["openai", "anthropic", "google", "groq"] as const;

const configSchema = z.object({
  model: z.string().regex(/^.+:.+$/, "Expected 'providerId:modelId' (e.g. 'openai:gpt-4o')"),
  apiKey: z.string().min(1),
  prompt: z.string().optional(),
});

export type Config = z.infer<typeof configSchema>;

function getConfigPath() {
  const xdgConfig = process.env.XDG_CONFIG_HOME;
  const base = xdgConfig || join(homedir(), ".config");
  return join(base, "hermes", "config.json");
}

export async function loadConfig({ modelOverride }: { modelOverride?: string } = {}) {
  let fileConfig: Partial<Config> = {};

  const configPath = getConfigPath();
  const file = Bun.file(configPath);

  if (await file.exists()) {
    const raw = await file.json();
    const parsed = configSchema.partial().safeParse(raw);
    if (parsed.success) {
      fileConfig = parsed.data;
    }
  }

  // priority: CLI args > env vars > config file
  const model = modelOverride || process.env.HERMES_MODEL || fileConfig.model;
  const apiKey = process.env.HERMES_API_KEY || fileConfig.apiKey;
  const prompt = fileConfig.prompt;

  if (!model || !apiKey) {
    throw new Error(
      "Missing configuration. Run `git hermes configure` or set HERMES_MODEL and HERMES_API_KEY environment variables."
    );
  }

  const config = configSchema.parse({ model, apiKey, prompt });

  // validate provider
  const providerId = model.split(":")[0];
  if (!SUPPORTED_PROVIDERS.includes(providerId as (typeof SUPPORTED_PROVIDERS)[number])) {
    throw new Error(`Unknown provider '${providerId}'. Supported: ${SUPPORTED_PROVIDERS.join(", ")}`);
  }

  return config;
}

export async function saveConfig({ config }: { config: Config }) {
  const configPath = getConfigPath();
  const dir = configPath.slice(0, configPath.lastIndexOf("/"));

  await Bun.spawn(["mkdir", "-p", dir]).exited;
  await Bun.write(configPath, JSON.stringify(config, null, 2) + "\n");
}

async function prompt({ message }: { message: string }) {
  process.stderr.write(message);

  for await (const line of console) {
    return line.trim();
  }

  return "";
}

export async function runConfigure() {
  console.error("git-hermes configuration\n");

  const model = await prompt({
    message: "Model (e.g. openai:gpt-4o, anthropic:claude-sonnet-4-20250514): ",
  });

  if (!model || !model.includes(":")) {
    throw new Error("Expected 'providerId:modelId' (e.g. 'openai:gpt-4o')");
  }

  const providerId = model.split(":")[0];
  if (!SUPPORTED_PROVIDERS.includes(providerId as (typeof SUPPORTED_PROVIDERS)[number])) {
    throw new Error(`Unknown provider '${providerId}'. Supported: ${SUPPORTED_PROVIDERS.join(", ")}`);
  }

  const apiKey = await prompt({ message: "API key: " });
  if (!apiKey) {
    throw new Error("API key is required.");
  }

  const customPrompt = await prompt({
    message: "Custom prompt (press Enter to use default): ",
  });

  const config: Config = {
    model,
    apiKey,
    ...(customPrompt ? { prompt: customPrompt } : {}),
  };

  await saveConfig({ config });
  console.error("\nConfiguration saved to " + getConfigPath());
}
