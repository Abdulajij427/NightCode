# 🌙 NightCode

### An AI-Powered CLI Coding Agent

NightCode is an AI-powered command-line coding assistant inspired by Claude Code. It helps developers understand their codebases, manage files, debug problems, and interact with AI models directly from their terminal.

Built with Bun, TypeScript, React, and OpenTUI, NightCode brings an interactive AI-powered development experience to the command line.

---

## ✨ Features

### 🤖 AI Coding Modes

**Build Mode**
- Create new files and directories.
- Read and modify existing files.
- Edit code and perform file operations.
- Execute supported terminal commands through local tools.

**Plan Mode**
- Ask questions about your codebase.
- Inspect project files and directories.
- Search and explore code.
- Analyze problems and debug issues.
- Work in a read-only environment.

### 🧠 AI Model & Agent Management
- Switch between supported AI models.
- Select different agents.
- Configure the AI model and working mode.
- Display the active model in the terminal interface.

### 💬 Interactive Chat Experience
- Real-time AI response streaming using Server-Sent Events (SSE).
- Persistent chat sessions.
- Conversation history.
- Thinking and reasoning indicators.
- Tool execution status.
- Interrupt ongoing AI responses using Escape.
- Preserve partial responses after interruption.

### 📂 File Mentions
- Mention project files using `@`.
- Search for files and directories.
- Navigate directory suggestions.
- Insert selected file paths directly into the input.

### 🎨 Theme System
- 33 built-in color presets.
- Live theme preview.
- Persistent theme preferences.
- Custom terminal appearance.

### 🔐 Authentication & Security
- Custom Google OAuth integration.
- OAuth-based signup and signin.
- Token-based authentication.
- Secure credential handling using Bun.secrets.
- User-isolated sessions and conversations.

### 💳 Credit-Based Billing
- Credit-based AI usage system.
- Token consumption tracking.
- Polar integration for billing.
- Usage-based credit calculation.
- Customer billing portal.
- Credit balance validation before AI requests.

### 📊 Monitoring
- Sentry error monitoring.
- Server-side error tracking.
- Request performance monitoring.
- Error investigation and debugging.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Runtime | Bun |
| Language | TypeScript |
| CLI Interface | OpenTUI |
| UI Framework | React 19 |
| Backend | Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Database Hosting | Neon |
| Validation | Zod |
| AI Integration | Vercel AI SDK |
| Authentication | Custom Google OAuth |
| Secret Management | Bun.secrets |
| Streaming | Server-Sent Events |
| Billing | Polar |
| Email | Resend |
| Monitoring | Sentry |

---

## 🏗️ Architecture

NightCode follows a Bun monorepo architecture with four main packages.

```text
nightcode/
│
├── packages/
│   │
│   ├── cli/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── layouts/
│   │   │   ├── lib/
│   │   │   ├── providers/
│   │   │   ├── screens/
│   │   │   ├── index.tsx
│   │   │   └── theme.ts
│   │   └── package.json
│   │
│   ├── server/
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── auth/
│   │   │   │   ├── email/
│   │   │   │   └── polar/
│   │   │   ├── middleware/
│   │   │   ├── routes/
│   │   │   ├── index.ts
│   │   │   ├── sse.ts
│   │   │   └── system-prompt.ts
│   │   └── package.json
│   │
│   ├── database/
│   │   ├── prisma/
│   │   │   ├── migrations/
│   │   │   └── schema.prisma
│   │   ├── src/
│   │   └── package.json
│   │
│   └── shared/
│       ├── src/
│       │   ├── models.ts
│       │   └── schemas.ts
│       └── package.json
│
├── .env.example
├── package.json
├── bun.lock
└── tsconfig.json
```

### Package Responsibilities

| Package | Responsibility |
|---|---|
| `cli` | Interactive terminal UI, chat interface, local tools and API client |
| `server` | Express API, AI orchestration, authentication, streaming and billing |
| `database` | Prisma client, database schema and migrations |
| `shared` | Shared types, supported models and Zod validation schemas |

### Request Flow

```text
Developer
    |
    v
NightCode CLI
    |
    v
Express Backend
    |
    +---- Authentication
    |
    +---- AI Model Integration
    |
    +---- Session Management
    |
    +---- SSE Streaming
    |
    +---- Billing & Credits
    |
    v
PostgreSQL Database

AI Tool Calls
    |
    v
Local CLI Tool Execution
    |
    v
Developer's Project Files
```

---

## 🚀 Getting Started

### Prerequisites

Before installing NightCode, make sure you have:

- Bun installed.
- Node.js installed if required by your project dependencies.
- PostgreSQL database or a Neon database.
- Google OAuth credentials.
- At least one supported AI provider API key.
- Polar credentials if using billing features.
- Resend API credentials if using email functionality.

### 1. Clone the Repository

```bash
git clone https://github.com/Abdulajij427/NightCode.git

cd NightCode
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Configure Environment Variables

Create your environment configuration using the provided example:

```bash
cp .env.example .env
```

Configure the required values:

```env
# API
API_URL=http://localhost:3000

# Database
DATABASE_URL=

# AI Providers
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GROQ_API_KEY=

# Email
RESEND_API_KEY=
EMAIL_FROM=onboarding@resend.dev
TEST_EMAIL_TO=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Polar Billing
POLAR_ACCESS_TOKEN=
POLAR_PRODUCT_ID=
POLAR_SERVER=sandbox
POLAR_CREDITS_METER_ID=
```

Never commit your actual API keys, OAuth secrets, database credentials, or access tokens.

### 4. Configure PostgreSQL

Create a PostgreSQL database or configure your Neon database connection.

Add the database connection string to `DATABASE_URL`.

Run Prisma migrations using the database package's configured migration workflow.

> Check `packages/database/package.json` and `packages/database/prisma7.config.ts` for the exact Prisma commands used by this project.

### 5. Configure Google OAuth

Create OAuth credentials through Google Cloud Console.

Configure the authorized redirect URI according to the callback route implemented in the NightCode server.

Add your credentials:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### 6. Start the Application

Use the development scripts defined in the root and individual package `package.json` files.

Start the Express backend and CLI using the configured development commands.

---

## ⌨️ Available Commands

NightCode provides an interactive command menu.

| Command | Description |
|---|---|
| `/new` | Start a new session |
| `/models` | Switch AI models |
| `/theme` | Change terminal theme |
| `/agents` | Select an agent |
| `/sessions` | Browse previous sessions |
| `/exit` | Exit NightCode |

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Enter` | Submit prompt |
| `Shift + Enter` | Insert a new line |
| `Tab` | Switch between Plan and Build modes |
| `Escape` | Interrupt ongoing generation |
| `Arrow Keys` | Navigate menus |

---

## 🧩 Development Concepts

NightCode combines several important software engineering concepts:

- Monorepo architecture and package management.
- Terminal UI development with React.
- REST API design using Express.js.
- OAuth 2.0 authentication.
- Token-based authorization.
- Database relationships using Prisma.
- Real-time streaming using SSE.
- AI tool calling and agentic workflows.
- Local filesystem operations.
- Usage-based billing and credit management.
- Error monitoring and observability.

---

## 🔒 Security

NightCode uses custom Google OAuth authentication and token-based authorization.

Security considerations include:

- Keep OAuth credentials and API keys private.
- Store sensitive credentials securely.
- Validate incoming API requests.
- Enforce authentication on protected endpoints.
- Isolate user sessions and conversation history.
- Restrict tool permissions according to the selected mode.

---

## 📸 Demo

**Project Demo:** [Watch NightCode on YouTube](https://youtu.be/Tcd3Eo0E4-Q)

**Source Code:** [GitHub Repository](https://github.com/Abdulajij427/NightCode)

---

## 🛣️ Roadmap

Potential future improvements:

- Improve AI agent orchestration.
- Add more AI model providers.
- Improve local tool execution and safety controls.
- Add advanced codebase search.
- Improve terminal UX and accessibility.
- Expand debugging and developer productivity tools.

---

## 👨‍💻 Author

**Abdul Shaikh**

GitHub: [@Abdulajij427](https://github.com/Abdulajij427)

---

## ⭐ Support

If you find NightCode interesting, consider starring the repository on GitHub.

Built with ❤️ for developers who love working in the terminal.
