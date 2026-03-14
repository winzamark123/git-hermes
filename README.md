# git-hermes

AI-powered git commit messages from your staged diffs.

[![npm version](https://img.shields.io/npm/v/git-hermes?style=flat-square)](https://www.npmjs.com/package/git-hermes)
[![license](https://img.shields.io/npm/l/git-hermes?style=flat-square)](./LICENSE)
[![downloads](https://img.shields.io/npm/dm/git-hermes?style=flat-square)](https://www.npmjs.com/package/git-hermes)

## Demo

<!-- TODO: add demo video/gif -->

## Table of Contents

- [Getting Started](#getting-started)
- [Usage](#usage)
- [Configuration](#configuration)
- [AI Providers](#ai-providers)
- [Contributing](#contributing)
- [License](#license)

## Getting Started

### Homebrew (recommended)

```bash
brew install winzamark123/tap/git-hermes
```

### npm / Bun

```bash
# npm
npm i -g git-hermes

# bun
bun i -g git-hermes

# one-shot with npx
npx git-hermes
```

> [!TIP]
> `git-hermes` installs as a git subcommand — no aliases needed. Any binary named `git-<name>` is automatically available as `git <name>`.

On first run, a default config is created at `~/.config/hermes/config.json` with OpenAI (`gpt-4o`) as the default provider. Set your API key by opening the config in your editor:

```bash
git hermes config
# add your API key: "apiKey": "sk-..."
```

Or pass it inline:

```bash
git hermes -p anthropic -m claude-sonnet-4-20250514 -k sk-ant-your-key
```

## Usage

```bash
# generate a commit message and commit
git hermes

# preview the message without committing
git hermes --dry-run

# override provider and model
git hermes -p anthropic -m claude-sonnet-4-20250514

# pass an API key inline
git hermes -k sk-your-key

# custom system prompt for one run
git hermes --prompt "be concise, no scope"

# open config in $EDITOR
git hermes config

# show help
git hermes --help
```

## Configuration

Config file: `~/.config/hermes/config.json`

```json
{
  "provider": "openai",
  "model": "gpt-4o",
  "apiKey": "sk-...",
  "prompt": "optional custom system prompt"
}
```

### Priority

Values are resolved in this order (highest wins):

| Source | Scope | Provider | Model | API Key |
|---|---|---|---|---|
| CLI flag | Single run | `-p, --provider` | `-m, --model` | `-k, --api-key` |
| Environment variable | Shell session | `HERMES_PROVIDER` | `HERMES_MODEL` | `HERMES_API_KEY` |
| Config file | Persistent | `provider` | `model` | `apiKey` |
| Default | — | `openai` | `gpt-4o` | — |

For persistent settings, edit your config with `git hermes config`. CLI flags and environment variables are temporary and do not modify the config file.

### Custom Prompts

Override the default system prompt to change commit message style:

```bash
# one-off override
git hermes --prompt "use gitmoji format"

# persistent override via config
git hermes config
# then add "prompt": "your custom prompt"
```

## AI Providers

git-hermes uses the [Vercel AI SDK](https://sdk.vercel.ai) and supports any model from these providers:

| Provider | Flag | Example models | Supported models |
|---|---|---|---|
| OpenAI | `-p openai` | `gpt-4o`, `gpt-4o-mini`, `o3-mini` | [View all](https://sdk.vercel.ai/providers/ai-sdk-providers/openai#model-capabilities) |
| Anthropic | `-p anthropic` | `claude-sonnet-4-20250514`, `claude-haiku-4-5-20251001` | [View all](https://sdk.vercel.ai/providers/ai-sdk-providers/anthropic#model-capabilities) |
| Google | `-p google` | `gemini-2.0-flash`, `gemini-2.5-pro` | [View all](https://sdk.vercel.ai/providers/ai-sdk-providers/google-generative-ai#model-capabilities) |
| Groq | `-p groq` | `llama-3.3-70b-versatile` | [View all](https://sdk.vercel.ai/providers/ai-sdk-providers/groq#model-capabilities) |

## Contributing

Interested in contributing? We'd love your help.

1. Fork the repo
2. Create your branch (`git checkout -b my-feature`)
3. Make your changes
4. Run typechecks (`bun run tsc --noEmit`)
5. Commit and push
6. Open a pull request

## License

[MIT](./LICENSE)
