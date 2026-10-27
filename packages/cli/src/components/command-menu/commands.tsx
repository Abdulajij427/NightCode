import type {Command} from './types.ts'

export const COMMANDS: Command[] = [
    {
        name: "new",
        description: "Start a new conversation",
        value: "/new",
        action: (ctx)=>{
            ctx.exit();
        }
    },
    
    {
        name: "agents",
        description: "Switch agents",
        value: "/agents"
    },

    {
        name: "models",
        description:"Select AI model for generating",
        value: "/models"
    },

    {
        name: "sessions",
        description:"Browser past sessions",
        value: "/sessions"
    },

    {
        name: "theme",
        description:"Change color  theme",
        value: "/theme"
    },

    {
        name: "login",
        description:"Sign in with yoour browser",
        value: "/login"
    },

    {
        name: "logout",
        description:"Sign out of your account",
        value: "/logout"
    },

    {
        name: "upgrade",
        description: "Buy more credits",
        value: "/upgrade"
    },

    {
        name:"usage",
        description:"Open billing portal in your browser",
        value: "/usage"
    },

    {
        name: "exit",
        description: "Quit the application",
        value: "/exit",
        action: (ctx) => {
            ctx.exit();
        },
    },
];

