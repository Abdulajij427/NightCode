import { useCallback, useRef, useState, type ReactNode } from "react";
import { TextAttributes, type InputRenderable, type ScrollBoxRenderable } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useKeyboardLayer } from "../providers/keyboard-layer";
import { useTheme } from "../providers/theme";

const MAX_VISIBLE_ITEMS = 6;

type DialogSearchListProps<T> = {
    items: T[];
    onSelect: (item: T) => void;
    onHighlight?: (item: T) => void;
    filterFn: (item: T, query: string) => boolean;
    renderItem: (item: T, isSelected: boolean) => ReactNode;
    getKey: (item: T) => string;
    placeholder?: string;
    emptyText?: string;
};

export function DialogSearchList<T>({
    items,
    onSelect,
    onHighlight,
    filterFn,
    renderItem,
    getKey,
    placeholder = "Search",
    emptyText = "No results",
}: DialogSearchListProps<T>) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [searchValue, setSearchValue] = useState("");
    const inputRef = useRef<InputRenderable>(null);
    const scrollRef = useRef<ScrollBoxRenderable>(null);
    const { isTopLayer } = useKeyboardLayer();
    const { colors } = useTheme();

    const filtered = searchValue
        ? items.filter((item) => filterFn(item, searchValue))
        : items;

    const visibleHeight = Math.min(filtered.length, MAX_VISIBLE_ITEMS);

    // Keyboard handler hamesha latest values padhe, isliye refs
    const indexRef = useRef(0);
    const filteredRef = useRef(filtered);
    filteredRef.current = filtered;

    const handleContentChange = useCallback(() => {
        const text = inputRef.current?.value ?? "";
        setSearchValue(text);
        indexRef.current = 0;
        setSelectedIndex(0);
        scrollRef.current?.scrollTo(0);
    }, []);

    // Highlight badalne ka kaam ek jagah: state + onHighlight (updater ke bahar)
    const highlight = (index: number) => {
        if (index === indexRef.current) return;

        indexRef.current = index;
        setSelectedIndex(index);

        const item = filteredRef.current[index];
        if (item && onHighlight) onHighlight(item);
    };

    // Highlighted row screen se bahar ho to scroll karo
    const scrollIntoView = (index: number) => {
        const sb = scrollRef.current;
        if (!sb) return;

        const viewportHeight = sb.viewport.height;
        if (index < sb.scrollTop) {
            sb.scrollTo(index);
        } else if (index > sb.scrollTop + viewportHeight - 1) {
            sb.scrollTo(index - viewportHeight + 1);
        }
    };

    useKeyboard((key) => {
        if (!isTopLayer("dialog")) return;

        const list = filteredRef.current;

        if (key.name === "return" || key.name === "enter") {
            const item = list[indexRef.current];
            if (item) onSelect(item);
            return;
        }

        if (list.length === 0) return;

        if (key.name === "up") {
            const next = Math.max(0, indexRef.current - 1);
            highlight(next);
            scrollIntoView(next);
        } else if (key.name === "down") {
            const next = Math.min(list.length - 1, indexRef.current + 1);
            highlight(next);
            scrollIntoView(next);
        }
    });

    return (
        <box flexDirection="column" gap={1}>
            <input
                ref={inputRef}
                placeholder={placeholder}
                focused
                onContentChange={handleContentChange}
            />

            {filtered.length === 0 ? (
                <text attributes={TextAttributes.DIM}>{emptyText}</text>
            ) : (
                <scrollbox ref={scrollRef} height={visibleHeight}>
                    {filtered.map((item, i) => {
                        const isSelected = i === selectedIndex;
                        const content = renderItem(item, isSelected);

                        return (
                            <box
                                key={getKey(item)}
                                flexDirection="row"
                                height={1}
                                overflow="hidden"
                                backgroundColor={isSelected ? colors.selection : undefined}
                                onMouseMove={() => highlight(i)}
                                onMouseDown={() => onSelect(item)}
                            >
                                {typeof content === "string" ? <text>{content}</text> : content}
                            </box>
                        );
                    })}
                </scrollbox>
            )}
        </box>
    );
}