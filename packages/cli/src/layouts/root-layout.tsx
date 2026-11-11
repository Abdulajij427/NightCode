import {Outlet} from 'react-router'
import {ToastProvider} from '../providers/toast';
import {DialogProvider} from '../providers/dialog';
import {KeyboardLayerProvider} from '../providers/keyboard-layer';
import {ThemeProvider} from '../providers/theme';
import {ThemeRoot} from './themed-root';
import {ErrorBoundary} from '../components/error-boundry'
import {PromptConfigProvider} from '../providers/prompt-config';

export function RootLayout(){
    return(
        <ThemeProvider>
            <ToastProvider>
                <KeyboardLayerProvider>
                    <DialogProvider>
                        <PromptConfigProvider>
                            <ThemeRoot>
                                <ErrorBoundary>
                                    <Outlet />
                                </ErrorBoundary>
                            </ThemeRoot>
                        </PromptConfigProvider>
                    </DialogProvider>
                </KeyboardLayerProvider>
            </ToastProvider>
        </ThemeProvider>
    )
}










