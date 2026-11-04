import type {Command} from './types.ts'
import {ThemeDialogContent} from '../dialogs'

export const COMMANDS: Command[] = [
    {
        name: "new",
        description: "Start a new conversation",
        value: "/new",
        action: (ctx)=>{
            
            ctx.toast.show({message: "Starting new conversation..."});
        },
    },
    
    {
        name: "agents",
        description: "Switch agents",
        value: "/agents",
        action: (ctx)=>{
            ctx.dialog.open({
                title: "Select Mode",
                children: <text>Agent selection comming soon...</text>
            })
        },
    },

    {
        name: "models",
        description:"Select AI model for generating",
        value: "/models",
        action: (ctx)=>{
            ctx.dialog.open({
                title: "Select Model",
                children: <text>Model selection coming soon..</text>,
            });
        },
    },

    {
        name: "sessions",
        description:"Browser past sessions",
        value: "/sessions",
        action : (ctx)=>{
            ctx.toast.show({message: "Loading sessions..."});
        },
    },

    {
        name: "theme",
        description:"Change color  theme",
        value: "/theme",
        action: (ctx)=>{
            ctx.dialog.open({
                title: "Select Theme",
                children: <ThemeDialogContent />,
            })
        },
    },

    {
        name: "login",
        description:"Sign in with yoour browser",
        value: "/login",
        action: (ctx)=>{
            ctx.toast.show({message: "Opening browser to sign in..."})
        }
    },

    {
        name: "logout",
        description:"Sign out of your account",
        value: "/logout",
        action: (ctx)=>{
            ctx.toast.show({variant: "success" , message:"Signed out"})
        },
    },

    {
        name: "upgrade",
        description: "Buy more credits",
        value: "/upgrade",
        action: (ctx)=>{
            ctx.toast.show({message: "opening credits checkout.."});
        },
    },

    {
        name:"usage",
        description:"Open billing portal in your browser",
        value: "/usage",
        action: (ctx)=>{
            ctx.toast.show({message: "opening billing portal..."})
        }
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

