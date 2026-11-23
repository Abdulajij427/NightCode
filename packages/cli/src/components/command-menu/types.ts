import type {ToastContextValue} from '../../providers/toast'
import type {DialogContextValue} from '../../providers/dialog'

import type {ModeType , SupportedChatModelId} from '@nightcode/shared'
import type { AuthContextValue } from "../../providers/auth";


export type CommandContext = {
    exit: () => void;
    toast: ToastContextValue;
    dialog: DialogContextValue;
    navigate: (path: string) => void;
    mode: ModeType;
    setMode: (mode: ModeType) => void;
    setModel: (model : SupportedChatModelId) => void;
    auth: AuthContextValue;
};



export type Command = {
    name : string;
    description: string;
    value: string;
    action? : (ctx: CommandContext) => void | Promise<void>;
};


