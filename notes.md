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




## chapter 5 :  SSE streaming , useChat hook and interruption


### step 1 : Server-Side Streaming


1. 
CLI client -> chat/:sessionId  -> Vercel AI SDK -> persist to DB




2. Stream Events (ChatStreamEvent)
text-delta -> reasoning-delta -> tool-call -> tool-result -> done -> error


#### step 1 (cont): useChat Hook

useChat(SessionId , initialMsgs)

returns
messages[]   , streaming state , submit() , abort() , interrupt()



#### step 2: Stream Interruption

Press Escape -> Client: capture
             -> Server: persist


Interrupted Message Visual
Dimmed dot + dimmed mode label
"interrupted " replace duration
partial content preserved in UI




## chapter 6: Session Management and configuration

### step -1 : Session Management

1. /sessions  -> Sessions dialog -> API: $get()   -> navigate("/session/:id")  

2. /new  -> navigate("/")


### step - 2: Prompt Config

1.  PromptConfig Provider

11. PromptConfig Provider -> Mode  -> Tab key Plan / Build  -> /agents Dialog


12. PromptConfig Provider -> Model -> /models Dialog  -> Status Bar



## chapter 7: Tool Calling

### step - 1 : Messages Parts and Thinking

1. Old: flat text -> New: ordered message parts
2. 
21. reasoning -> thinking: ... dimmed border
22. tool-call -> Read File: src/... ... calling/ done
23. text


### step - 2: Tools and system Prompt

1. Mode ? 
11. plan -> readFile listDirectory grep glob (read only)
12. Build -> + writeFile, + editFile, + bash (read + write)


2. 
21. buildSystemPrompt mode-specific rules
22. stepCountIs(50) agentic loop cap



## chapter 8: Completing the User Experience 

### step - 1: File Mentions

Textarea input  --> findActiveMention parse @query token -->(direct matches + recursive fallback)  getMentionCandidates readdir + filter + sort -->  FileMentionMenu overlay with scrollbox --> Enter on dir: traverse  or Enter: insert path



### step - 2: clerk Auth

/login --> PKCE OAuth Flow open browser -> Local callback server Bun.server on random port  -> Exchange code for access..token  -> ~/.nightcode/auth.json







## chapter 9: Billing

### polar Credit-Based Billing

1. /upgrade  --> polar checkout open in  browser  ---> polar SDK


2. /usage  --> Customer Portal billing history  --> polar SDK


3.   requireCreditsBalance middleware  
31. credits > 0  ----> Allow request
32. credits = 0  ----> 402: No credits

Guards: POST/sessions
        POST/chat/:id
        POST/chat/:id/resume


4.  AI streaming ---> onFinish callback totalUsage tokens  ---> calculateCreditsForUsage input/output tokens * pricing   --->   ingestAiUsage events.ingest to polar        



