import { Component, type ErrorInfo, type ReactNode } from "react";
import { appendFileSync } from "node:fs";

type State = { error: Error | null };

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
    override state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    override componentDidCatch(error: Error, info: ErrorInfo) {
        appendFileSync(
            "crash.log",
            `${new Date().toISOString()}\n${error.stack}\n${info.componentStack}\n\n`,
        );
    }

    override render() {
        if (this.state.error) {
            return <text fg="red">{this.state.error.message} (see crash.log)</text>;
        }
        return this.props.children;
    }
}