import { useEffect, useState } from "react";
import { useTheme } from "../providers/theme";
import {Mode} from '@nightcode/database/enums';
 
type Props = {
    mode?: Mode;
};

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function Spinner({mode = Mode.BUILD}: Props) {
    const { colors } = useTheme();
    const [frameIndex, setFrameIndex] = useState(0);

    const activeColor = mode === Mode.PLAN ? colors.planMode : colors.primary

    useEffect(() => {
        const timer = setInterval(() => {
            setFrameIndex((current) => (current + 1) % FRAMES.length);
        }, 80);

        return () => clearInterval(timer);
    }, []);

    return <text fg={activeColor} >{FRAMES[frameIndex]}</text>;
}