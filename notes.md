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





## chapter 2: UI Infrastructure

### step - 1 : Toast Notifications

ToastProvider => Toast

React Context wraps the app

success error  info

commands call ctx.toast.show() Auto-dismiss after 3 seconds



### step 2: Dialog and Keyboard layers

KeyboardLayerProvider

Layer Stack (top wins)
1. dialog
2. command menu
3. base (textarea)


### step 3: Theme System

1. ThemeProvider
2. 33 color presets
3. ~/.nightcode/prefs

Live preview on highlight
Reverton dismiss, persist on confirm
Every component read useTheme()


Provider Nesting Order (index.tsx)
1. ThemeProvider
2. KeyboardLayerProvider
3. DialogProvider
4. ToastProvider
5. ThemeRoot



## chapter 3: Routing and Screen Layout

### step 1: Routing and screens

1. index.tsx (createMemoryRouter)
2. RootLayout (provides + <Outlet/>)
3. 1. home   2. NewSession 3. Session



### step 2: Session Screen UI

1. SessionShell

11. scrollbox (stickyScroll)
1. UserMessage
2. BotMessage + model tag
3. ErrorMessage

22. InputBar (disabled while loading)

33. 1. Spinner
    2. tab agents




## chapter 4: Server , Shared packages and Database

### Monorepo Packages
1. @nightcode/cli (TUI + api client)
2. @nightcode/server (Hono REST API)
3. @nightcode/shared (models , Zod schemas)
4. @nightode/database (Prisma client)


#### step 1 Server and API Client
1. Hono server : 3000


2. Session Routes
11. GET/sessions
12. GET/session/:id
13. POST/sessions + zod validation


3. CLI api client (hc<AppType>)



#### step 2 Database (Prisma and Neon)
1. Prisma + pg adapter -> Postgres
2. Schema
21. Session -> Message
22. Role , Mode , MessageStatus



## Sentry Monitoring

### Its 3am . Porduction is broken . Now what ?

#### WIHTOUT Sentry

User -> Express server -> 500 error 



#### WITH Sentry
User -> Server -> Sentry

1. Issue: 'My first Sentry error' + full stack trace
2. Trace: POST/ sessions 487ms status 500
3. Logs: filterable by method , path , status , duration
4. Frequency : 47 events , 12 users affected



How it works

Request -> sentry() -> request timer -> your route handler -> app.onError() -> Response