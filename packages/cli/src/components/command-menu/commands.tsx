import type {Command} from './types.ts'
import { AgentsDialogContent,SessionsDialogContent , ThemeDialogContent , ModelsDialogContent} from '../dialogs'
import {SUPPORTED_CHAT_MODELS} from '@nightcode/shared'
import {openBillingPortal , openUpgradeCheckout} from '../../lib/upgrade';

export const COMMANDS: Command[] = [
    {
        name: "new",
        description: "Start a new conversation",
        value: "/new",
        action: (ctx)=>{
           ctx.navigate("/");
        },
    },
    
    {
        name: "agents",
        description: "Switch agents",
        value: "/agents",
        action : (ctx)=>{
            ctx.dialog.open({
                title: "Select agent",
                children: <AgentsDialogContent currentMode={ctx.mode} onSelectMode={ctx.setMode}/>
            });
        },
    },

    {
        name: "models",
        description:"Select AI model for generating",
        value: "/models",
        action : (ctx)=>{
            ctx.dialog.open({
                title: "Select model",
                children: 
                    <ModelsDialogContent 
                        models={SUPPORTED_CHAT_MODELS.map((model)=> model.id)} 
                        onSelectModel={ctx.setModel}
                    />
            });
        },
    },

    {
        name: "sessions",
        description:"Browser past sessions",
        value: "/sessions",
        action : (ctx)=>{
            ctx.dialog.open({
                title: "Sessions",
                children: <SessionsDialogContent/>
            });
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
        description: "Sign in with your browser",
        value: "/login",
        action: async (ctx) => {
            if (ctx.auth.user) {
            ctx.toast.show({
                message: `Already signed in as ${ctx.auth.user.email}.`,
            });
            return;
            }

            ctx.toast.show({ message: "Opening browser to sign in..." });

            const user = await ctx.auth.login();

            ctx.toast.show({
            variant: "success",
            message: `Signed in as ${user.email}.`,
            });
        },
    },

    {
        name: "logout",
        description: "Sign out of your account",
        value: "/logout",
        action: async (ctx) => {
            if (!ctx.auth.user) {
            ctx.toast.show({ message: "You are not signed in." });
            return;
            }

            await ctx.auth.logout();

            ctx.toast.show({
            variant: "success",
            message: "Signed out.",
            });
        },
    },

    {
        name: "upgrade",
        description: "Buy more credits",
        value: "/upgrade",
        action: async (ctx)=>{
            ctx.toast.show({message: "opening credits checkout.."});

            try {
                await openUpgradeCheckout();
                ctx.toast.show({
                    variant: "success",
                    message: "Checkout opened in browser",
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to open checkout";
                ctx.toast.show({variant : "error" , message});
            }
        },
    },

    {
        name:"usage",
        description:"Open billing portal in your browser",
        value: "/usage",
        action: async (ctx)=>{
            ctx.toast.show({message: "opening billing portal..."});

            try {
                await openBillingPortal();
                ctx.toast.show({
                    variant: "success",
                    message: "Billing portal opened in browser",
                });
            } catch (error){
                const message = error instanceof Error ? error.message : "Failed to open billing portal";
                ctx.toast.show({variant : "error", message});
            }
        },
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



