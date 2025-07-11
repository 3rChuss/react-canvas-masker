import * as React from 'react';
import '../maskEditor.less';
import type { UseMaskEditorProps } from '../hooks/useMaskEditor';
import type { MaskEditorCanvasRef } from '../hooks/useMaskEditor';
export type { MaskEditorCanvasRef };
export interface MaskEditorProps extends UseMaskEditorProps {
    canvasRef?: React.RefObject<MaskEditorCanvasRef>;
}
export declare const MaskEditor: React.FC<MaskEditorProps>;
