import * as React from 'react';
import { UseMaskEditorProps, UseMaskEditorReturn } from '../hooks/useMaskEditor';
export interface MaskEditorContextValue extends UseMaskEditorReturn {
}
export declare const MaskEditorProvider: React.FC<UseMaskEditorProps & {
    children: React.ReactNode;
}>;
export declare function useMaskEditorContext(): MaskEditorContextValue;
//# sourceMappingURL=MaskEditorProvider.d.ts.map