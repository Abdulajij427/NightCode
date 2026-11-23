import prettyMs from 'pretty-ms';
import { EmptyBorder } from "../border";
import { useTheme } from "../../providers/theme";
import type { Message } from "../../hooks/use-chat";
import { Mode , type ModeType } from "@nightcode/shared";
import { TextAttributes } from "@opentui/core";

type ClientMessagePart = Message["parts"][number];
type ToolPart = Extract<ClientMessagePart , {type: `tool-${string}` | "dynamic-tool"}>;

type Props = {
    parts: ClientMessagePart[];
    model: string;
    mode: ModeType;
    durationMs?: number;
    streaming?: boolean;
    interrupted?: boolean;
};

// Tool parts ka shape: type "tool-<naam>" ya "dynamic-tool"
type ToolPartLike = {
    type: string;
    toolCallId?: string;
    toolName?: string;
    state?: string;
    input?: unknown;
};

type PartKind = "text" | "reasoning" | "tool";

function getPartKind(part: ClientMessagePart): PartKind | null {
    if (part.type === "text") return "text";
    if (part.type === "reasoning") return "reasoning";
    if (part.type === "dynamic-tool" || part.type.startsWith("tool-")) return "tool";
    return null; // step-start, source, file vagairah
}

function formatToolName(name: string): string {
    // const tool = part as ToolPartLike;
    // const raw = tool.type === "dynamic-tool" ? (tool.toolName ?? "tool") : tool.type.slice("tool-".length);

    return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}


function isToolPart(part: ClientMessagePart): part is ToolPart {
    return part.type === "dynamic-tool" || part.type.startsWith("tool-")
};


function formatToolArgs(tc: ToolPart):string {
    if (!("input" in tc) || tc.input == null) return "";
    if (typeof tc.input !== "object") return String(tc.input);
    return Object.values(tc.input).map(String).join(" ");
};



function isToolRunning(part: ClientMessagePart): boolean {
    const state = (part as ToolPartLike).state;
    return state !== "output-available" && state !== "output-error";
}

type PartGroup = {
    kind: PartKind;
    parts: { part: ClientMessagePart; index: number }[];
    key: string;
};

function groupConsecutiveParts(parts: Message["parts"]): PartGroup[] {
    const groups: PartGroup[] = [];

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i]!;
        const kind = getPartKind(part);
        if (!kind) continue;

        const lastGroup = groups[groups.length - 1];

        if (lastGroup && lastGroup.kind === kind) {
            lastGroup.parts.push({ part, index: i });
        } else {
            const key =
                isToolPart(part) ? `group-tc-${part.toolCallId}` : `group-${kind}-${i}`;
            groups.push({ kind, parts: [{ part, index: i }], key });
        }
    }

    return groups;
}

export function BotMessage({
    parts,
    model,
    mode,
    durationMs,
    streaming = false,
    
}: Props) {
    const { colors } = useTheme();

    return (
        <box width="100%" alignItems="center">
            {groupConsecutiveParts(parts).map((group , index) => (
                <box key={group.key}  width="100%" paddingTop={index === 0 ? 0 : 1}>
                    {group.parts.map(({ part, index }) => {
                        if (part.type === "reasoning") {
                            return (
                                <box
                                    key={`reasoning-${index}`}
                                    border={["left"]}
                                    borderColor={colors.thinkingBorder}
                                    customBorderChars={{ ...EmptyBorder, vertical: "│" }}
                                    width="100%"
                                    paddingX={2}
                                >
                                    <text attributes={TextAttributes.DIM}>
                                        <em fg={colors.thinking}>Thinking </em>
                                        {part.text}
                                    </text>
                                </box>
                            );
                        }

                        // if (group.kind === "tool") {
                        //     const toolCallId = (part as ToolPartLike).toolCallId ?? `tool-${index}`;
                        if (isToolPart(part)) {
                            const toolName = 
                                part.type === "dynamic-tool" ? part.toolName : part.type.slice("tool-".length);

                            return (
                                <box
                                    key={part.toolCallId}
                                    border={["left"]}
                                    borderColor={colors.thinkingBorder}
                                    customBorderChars={{ ...EmptyBorder, vertical: "│" }}
                                    width="100%"
                                    paddingX={2}
                                >
                                    <text attributes={TextAttributes.DIM}>
                                        <em fg={colors.info}>{formatToolName(toolName)}: </em>
                                        {formatToolArgs(part)}
                                        {part.state !== "output-available" && part.state !== "output-error" 
                                        ? " ..." 
                                        : ""
                                        }
                                        {part.state === "output-error" ? `${part.errorText}` : ""}
                                    </text>
                                </box>
                            );
                        }

                        if (part.type === "text") {
                            return (
                                <box key={`text-${index}`} paddingX={3} width="100%">
                                    <text>{part.text}</text>
                                </box>
                            );
                        }

                        return null;
                    })}
                </box>
            ))}

            <box paddingX={3} paddingY={1} gap={1} width="100%">
                <box flexDirection="row" gap={2}>
                    <text
                         fg={mode === Mode.PLAN ? colors.planMode : colors.primary}
                    >
                        ◉
                    </text>
                    <box flexDirection="row" gap={1}>
                        <text >
                            {mode === Mode.PLAN ? "plan" : "build"}
                        </text>
                        <text attributes={TextAttributes.DIM} fg={colors.dimSeparator}>
                            &gt;
                        </text>
                        <text attributes={TextAttributes.DIM}>{model}</text>
                        {durationMs !== undefined && durationMs !== null ? (
                            <box flexDirection="row" gap={1}>
                                <text attributes={TextAttributes.DIM} fg={colors.dimSeparator}>
                                    &gt;
                                </text>
                                <text attributes={TextAttributes.DIM}>
                                    {prettyMs(durationMs)}
                                </text>
                            </box>
                        ) : null}
                    </box>
                </box>
            </box>
        </box>
    );
}