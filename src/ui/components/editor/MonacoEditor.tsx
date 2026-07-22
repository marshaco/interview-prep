import { useEffect, useRef } from 'react';
import Editor, { type BeforeMount, type OnMount } from '@monaco-editor/react';
import { registerPythonTheme } from './pythonMonacoTheme';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  onSubmit?: () => void;
  onSave?: () => void;
}

export function MonacoEditor({ value, onChange, onRun, onSubmit, onSave }: MonacoEditorProps) {
  const onRunRef = useRef(onRun);
  useEffect(() => {
    onRunRef.current = onRun;
  }, [onRun]);

  const onSubmitRef = useRef(onSubmit);
  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const handleBeforeMount: BeforeMount = (monaco) => {
    registerPythonTheme(monaco);
  };

  const handleMount: OnMount = (editor, monaco) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- monaco-editor's own .d.ts isn't fully resolved by eslint's type-aware parser here; tsc typechecks this file cleanly.
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRunRef.current();
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- same as above.
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
      onSubmitRef.current?.();
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- same as above.
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSaveRef.current?.();
    });
  };

  return (
    <Editor
      height="100%"
      language="python"
      theme="triecode-dark"
      value={value}
      beforeMount={handleBeforeMount}
      onMount={handleMount}
      onChange={(nextValue) => onChange(nextValue ?? '')}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        automaticLayout: true,
        tabSize: 4,
      }}
    />
  );
}
