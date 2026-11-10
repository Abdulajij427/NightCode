import { useEffect, useState } from "react";
import { useTheme } from "../providers/theme";

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function Spinner() {
    const { colors } = useTheme();
    const [frameIndex, setFrameIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setFrameIndex((current) => (current + 1) % FRAMES.length);
        }, 80);

        return () => clearInterval(timer);
    }, []);

    return <text fg={colors.primary}>{FRAMES[frameIndex]}</text>;
}