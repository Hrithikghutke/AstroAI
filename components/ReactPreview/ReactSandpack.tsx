"use client";

import {
  SandpackProvider,
  SandpackLayout,
  SandpackFileExplorer,
  SandpackCodeEditor,
  SandpackPreview,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { atomDark } from "@codesandbox/sandpack-themes";
import { useEffect } from "react";
import { GeneratedReactFiles } from "@/types/react-generation";

import { Panel, Group, Separator } from "react-resizable-panels";

interface ReactSandpackProps {
  files: GeneratedReactFiles;
  onFilesChange?: (files: GeneratedReactFiles) => void;
  viewMode?: "code" | "preview" | "design";
}

export default function ReactSandpack({ files, onFilesChange, viewMode = "code" }: ReactSandpackProps) {
  const showCode = viewMode === "code";

  // Compute a stable snapshot key to force a clean Nodebox remount when a main file like App.jsx changes significantly
  // This prevents the "Zombified" worker state
  const snapshotKey = files["/App.js"]?.length || 0;

  return (
    <div className="flex-1 w-full h-full relative border-l border-white/5 overflow-hidden">
      <SandpackProvider
        key={snapshotKey}
        template="react"
        theme={atomDark}
        files={files}
        options={{
          externalResources: [
            "https://cdn.tailwindcss.com",
            "https://cdn.jsdelivr.net/npm/daisyui@latest/dist/full.min.css",
          ],
          recompileMode: "delayed",
          recompileDelay: 500,
        }}
        customSetup={{
          dependencies: {
            "react": "^18",
            "react-dom": "^18",
            "react-router-dom": "^6",
            "lucide-react": "latest",
          },
        }}
      >
      <style>{`
        .sp-wrapper { height: 100% !important; flex: 1; display: flex; flex-direction: column; }
        .sp-layout { height: 100% !important; flex: 1; display: flex; }
        .sp-stack { height: 100% !important; flex: 1; }
      `}</style>
      
      <SandpackLayout className="flex-1 w-full h-full !border-none !rounded-none">
        <Group orientation="horizontal" className="w-[100%] h-full text-white">
          {showCode && (
            <Panel defaultSize={20} minSize={10} className="border-r border-white/10 shrink-0 flex flex-col h-full">
              <SandpackFileExplorer style={{ height: "100%" }} />
            </Panel>
          )}

          {showCode && (
            <Separator className="w-1 bg-[#1a1a1a] hover:bg-indigo-500/50 transition-colors cursor-col-resize active:bg-indigo-500 shrink-0" />
          )}

          {showCode && (
            <Panel defaultSize={40} minSize={20} className="border-r border-white/10 shrink-0 flex flex-col h-full">
              <SandpackCodeEditor
                showTabs
                showLineNumbers
                showInlineErrors
                wrapContent
                closableTabs
                style={{ height: "100%", flex: 1 }}
              />
            </Panel>
          )}

          {showCode && (
            <Separator className="w-1 bg-[#1a1a1a] hover:bg-indigo-500/50 transition-colors cursor-col-resize active:bg-indigo-500 shrink-0" />
          )}

          <Panel defaultSize={showCode ? 40 : 100} minSize={20} className="min-w-0 flex flex-col bg-white h-full relative">
            <SandpackPreview
              showOpenInCodeSandbox={false}
              showRefreshButton
              style={{ height: "100%", flex: 1 }}
            />
          </Panel>
        </Group>
      </SandpackLayout>
    </SandpackProvider>
    </div>
  );
}
