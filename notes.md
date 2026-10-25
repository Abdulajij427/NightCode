# building NIGHTCODE (clone of claude code)

## chapter 1: Project Setup and Component Architecture

### Step 1: Scaffold the Monorepo
1. nightcode (Bun monorepo)
2. packages/cli (@nightcode/cli)
3. @opentui + React 19
4. App() -> <textarea focused/>
(bun run devicli -> working TUI)

### Step 2: Component Architecture
1. App()
2. Header => (ASCII "Night code") + InputBar =>({textarea} + {StatusBar} + {CommandMenu (opens on "/)  (/new) ,(/models) , (/theme) , (/agents), (/sessions), (/exit) .. Arrow keys + Enter to select})
