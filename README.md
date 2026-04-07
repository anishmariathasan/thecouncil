# The Council

A multi-agent research chat platform that runs entirely on localhost. Configure multiple AI agents that collaborate on your research questions — one speaks, the others silently monitor and only interject when they have something meaningful to add.

## Features

- **Council Mode** (default): A primary agent responds directly. Silent agents monitor and only interject when they meaningfully disagree or have critical additions.
- **Round Robin Mode**: Each agent responds in sequence, offering their unique perspective.
- **Two-phase interjection system**: Silent agents first pass a gate check (YES/NO), then only produce a full response if they have something substantial.
- **Anti-recursion safeguards**: Depth limit (1), per-agent cooldown, max 2 interjections per turn.
- **Multi-provider support**: OpenAI, Anthropic, Google, and OpenRouter (300+ models).
- **Configurable thinking/reasoning levels**: Set effort levels per model per provider.
- **Rich rendering**: LaTeX equations (KaTeX), syntax-highlighted code, markdown tables.
- **Drag-and-drop file uploads**: Images, PDFs, and other files with multi-file support.
- **Dark mode**: System-aware theme with manual toggle.
- **Local-only storage**: API keys and configuration stored in `.council/` — never sent anywhere except to the respective provider APIs.

## Supported Models

| Provider | Models |
|----------|--------|
| OpenAI | GPT-5.4, GPT-5.4 Pro/Mini/Nano, o3, o3-pro, o4-mini, GPT-4.1, GPT-4o |
| Anthropic | Claude Opus 4.6, Claude Sonnet 4.6, Claude Haiku 4.5 |
| Google | Gemini 3.1 Pro, Gemini 3.1 Flash Lite, Gemini 3 Flash, Gemini 2.5 Pro/Flash |
| OpenRouter | 300+ models (enter model ID directly) |

## Installation

### Prerequisites

- Node.js 18+ (22+ recommended)
- npm or pnpm

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd thecouncil

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### First-time Configuration

1. Navigate to **Settings** (bottom of sidebar or `/settings`).
2. Add at least one API key (OpenAI, Anthropic, Google, or OpenRouter).
3. Add agents using presets or custom configuration.
4. Return to **Chat** and start a conversation.

## Agent Presets

The Council ships with 8 ready-made agent presets:

**General Research:**
- Research Analyst — thorough analysis and evidence assessment
- Critical Thinker — logical evaluation and assumption challenging
- Devil's Advocate — constructive contrarian viewpoints
- Domain Synthesiser — cross-domain connection finding
- Methodology Expert — research design and statistical analysis
- Practical Strategist — implementation feasibility and planning

**ML-Specific:**
- ML Research Expert — machine learning research methodology
- ML Experiment Designer — experiment design and evaluation

## Project Structure

```
app/
  api/chat/         — Streaming chat API (orchestrator entry point)
  api/config/       — Configuration management API
  chat/             — Chat page
  settings/         — Settings page
components/
  chat/             — Message list, input, bubbles, markdown renderer
  settings/         — API key manager, agent configurator
  sidebar/          — Navigation sidebar
lib/
  agents/           — Agent presets, registry, factory
  orchestrator/     — Council mode and round-robin orchestration
  providers/        — Provider registry, factory, key tester
  storage/          — Local config store (.council/)
  types/            — TypeScript type definitions
```

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run start     # Start production server
npm run test      # Run test suite
npm run lint      # Run ESLint
```

## How It Works

### Council Mode

1. Your message is sent to the **primary agent**, which streams its response.
2. All **silent agents** receive the conversation context and the primary agent's response.
3. Each silent agent runs a **gate check** — a quick YES/NO decision on whether they have something meaningful to add.
4. Agents that pass the gate produce a full **interjection** (limited to 2 per turn).
5. Interjections appear below the primary response, clearly attributed.

### Round Robin Mode

Each agent responds in sequence. The first agent streams directly; subsequent agents provide their perspective one by one.

## Configuration

Configuration is stored in `.council/config.json` (automatically created, gitignored). This includes:

- API keys (stored locally only)
- Agent configurations
- Default mode and primary agent
- Orchestration settings (interjection depth, cooldowns, limits)

## Technology

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- [Vercel AI SDK](https://sdk.vercel.ai/) (`ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`)
- [shadcn/ui](https://ui.shadcn.com/) + Tailwind CSS
- [KaTeX](https://katex.org/) for LaTeX rendering
- [Vitest](https://vitest.dev/) for testing

## Licence

MIT
