"use client";

/**
 * CodeEditor Component
 * Monaco editor integration with advanced features
 */

import { useRef } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { Save, RotateCcw, Copy, Check } from "lucide-react";
import { useState } from "react";
import type { CodeEditorProps } from "./types";

export function CodeEditor({
  value,
  language = "typescript",
  onChange,
  onSave,
  readOnly = false,
  height = "600px",
  theme,
  showMinimap = true,
  enableAutoComplete = true,
  enableErrorDetection = true,
  formatOnSave = true,
}: CodeEditorProps) {
  const { theme: systemTheme } = useTheme();
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<number>(0);
  const [warnings, setWarnings] = useState<number>(0);

  const editorTheme = theme || (systemTheme === "dark" ? "vs-dark" : "light");

  // Handle editor mount
  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure TypeScript/JavaScript compiler options
    if (language === "typescript" || language === "javascript") {
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.Latest,
        allowNonTsExtensions: true,
        moduleResolution:
          monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        esModuleInterop: true,
        jsx: monaco.languages.typescript.JsxEmit.React,
        reactNamespace: "React",
        allowJs: true,
        typeRoots: ["node_modules/@types"],
      });

      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: !enableErrorDetection,
        noSyntaxValidation: !enableErrorDetection,
      });
    }

    // Add save keyboard shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    // Update markers on model change
    if (enableErrorDetection) {
      editor.onDidChangeModelDecorations(() => {
        const model = editor.getModel();
        if (model) {
          const markers = monaco.editor.getModelMarkers({ resource: model.uri });
          const errorCount = markers.filter((m) => m.severity === 8).length;
          const warningCount = markers.filter((m) => m.severity === 4).length;
          setErrors(errorCount);
          setWarnings(warningCount);
        }
      });
    }
  };

  // Handle value change
  const handleChange = (newValue: string | undefined) => {
    if (newValue !== undefined && onChange) {
      onChange(newValue);
      setHasChanges(true);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!editorRef.current || !onSave) return;

    let content = editorRef.current.getValue();

    // Format before save if enabled
    if (formatOnSave) {
      await editorRef.current.getAction("editor.action.formatDocument")?.run();
      content = editorRef.current.getValue();
    }

    onSave(content);
    setHasChanges(false);
  };

  // Handle reset
  const handleReset = () => {
    if (editorRef.current) {
      editorRef.current.setValue(value);
      setHasChanges(false);
    }
  };

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (!editorRef.current) return;

    const content = editorRef.current.getValue();
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format code
  const formatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.formatDocument")?.run();
    }
  };

  return (
    <div className="flex flex-col border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {language}
          </Badge>
          {hasChanges && (
            <Badge variant="outline" className="text-xs text-yellow-600">
              Unsaved
            </Badge>
          )}
          {enableErrorDetection && (
            <>
              {errors > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {errors} error{errors !== 1 ? "s" : ""}
                </Badge>
              )}
              {warnings > 0 && (
                <Badge variant="outline" className="text-xs text-yellow-600">
                  {warnings} warning{warnings !== 1 ? "s" : ""}
                </Badge>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!readOnly && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={formatCode}
                title="Format Code"
              >
                Format
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={!hasChanges}
                title="Reset Changes"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              {onSave && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                  disabled={!hasChanges}
                  title="Save (Cmd+S)"
                >
                  <Save className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            title="Copy to Clipboard"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <Editor
        height={height}
        defaultLanguage={language}
        language={language}
        value={value}
        theme={editorTheme}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: showMinimap },
          fontSize: 14,
          lineNumbers: "on",
          roundedSelection: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          formatOnPaste: true,
          formatOnType: true,
          autoClosingBrackets: "always",
          autoClosingQuotes: "always",
          suggestOnTriggerCharacters: enableAutoComplete,
          quickSuggestions: enableAutoComplete,
          suggest: {
            showMethods: enableAutoComplete,
            showFunctions: enableAutoComplete,
            showConstructors: enableAutoComplete,
            showFields: enableAutoComplete,
            showVariables: enableAutoComplete,
            showClasses: enableAutoComplete,
            showStructs: enableAutoComplete,
            showInterfaces: enableAutoComplete,
            showModules: enableAutoComplete,
            showProperties: enableAutoComplete,
            showEvents: enableAutoComplete,
            showOperators: enableAutoComplete,
            showUnits: enableAutoComplete,
            showValues: enableAutoComplete,
            showConstants: enableAutoComplete,
            showEnums: enableAutoComplete,
            showEnumMembers: enableAutoComplete,
            showKeywords: enableAutoComplete,
            showWords: enableAutoComplete,
            showColors: enableAutoComplete,
            showFiles: enableAutoComplete,
            showReferences: enableAutoComplete,
            showFolders: enableAutoComplete,
            showTypeParameters: enableAutoComplete,
            showSnippets: enableAutoComplete,
          },
          scrollbar: {
            vertical: "visible",
            horizontal: "visible",
          },
        }}
      />
    </div>
  );
}
