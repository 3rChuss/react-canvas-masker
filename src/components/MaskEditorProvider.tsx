import * as React from 'react';

import {
  useMaskEditor,
  UseMaskEditorProps,
  UseMaskEditorReturn,
} from '../hooks/useMaskEditor';

export interface MaskEditorContextValue extends UseMaskEditorReturn {}

const MaskEditorContext = React.createContext<
  MaskEditorContextValue | undefined
>(undefined);

export const MaskEditorProvider: React.FC<
  UseMaskEditorProps & { children: React.ReactNode }
> = ({ children, ...props }) => {
  const value = useMaskEditor(props);
  return (
    <MaskEditorContext.Provider value={value}>
      {children}
    </MaskEditorContext.Provider>
  );
};

export function useMaskEditorContext(): MaskEditorContextValue {
  const ctx = React.useContext(MaskEditorContext);
  if (!ctx)
    throw new Error(
      'useMaskEditorContext must be used within a MaskEditorProvider',
    );
  return ctx;
}
