"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Eye, RotateCcw, Clock, Box, LoaderCircle } from "lucide-react";
import { GeneratedReactFiles } from "@/types/react-generation";
import { DEEP_DIVE_MODELS, getModelConfig } from "@/lib/modelConfig";
import { useCredits } from "@/context/CreditsContext";
import ReactGenerationProgress, {
  AgentStep,
  getThinkingLabel,
  ThinkingText,
} from "./ReactGenerationProgress";

export interface ReactMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  snapshotFiles?: GeneratedReactFiles;
  snapshotVersion?: number;
  tokens?: { input: number; output: number; total: number; credits: number };
  model?: string;
  isGenerating?: boolean;
  agentSteps?: AgentStep[];
  architectData?: any;
  createdAt: Date;
}

export default function ReactChatPanel({
  onFilesChange,
  initialPrompt,
  initialFiles,
}: {
  onFilesChange: (files: GeneratedReactFiles | null) => void;
  initialPrompt?: string;
  initialFiles?: GeneratedReactFiles | null;
}) {
  const [messages, setMessages] = useState<ReactMessage[]>(() => {
    try {
      const stored = sessionStorage.getItem("crawlcube_react_messages");
      if (stored)
        return JSON.parse(stored).map((m: any) => ({
          ...m,
          createdAt: new Date(m.createdAt),
        }));
    } catch {}

    if (initialFiles && initialPrompt) {
      return [
        {
          id: "u-initial",
          role: "user",
          content: initialPrompt,
          createdAt: new Date(),
        },
        {
          id: "a-initial",
          role: "assistant",
          content: "Generated React components based on your request.",
          snapshotFiles: initialFiles,
          snapshotVersion: 1,
          model: "Restored from Session/DB",
          createdAt: new Date(),
        },
      ];
    }
    return [
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hi! I'm CrawlCube AI's React module. Describe the web application you want to build.",
        createdAt: new Date(),
      },
    ];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof sessionStorage !== "undefined") {
      const stored = sessionStorage.getItem("crawlcube_react_model");
      if (stored) return stored;
    }
    return "anthropic/claude-3.5-sonnet";
  });
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasAutoStarted = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    if (messages.length > 0 && messages[messages.length - 1].snapshotFiles) {
      onFilesChange(messages[messages.length - 1].snapshotFiles || null);
    }
  }, [messages, onFilesChange]);

  useEffect(() => {
    if (
      initialPrompt &&
      !initialFiles &&
      !hasAutoStarted.current &&
      messages.length <= 1
    ) {
      hasAutoStarted.current = true;
      handleSend(initialPrompt, true);
    }
  }, [initialPrompt, initialFiles, messages.length]);

  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(
        "crawlcube_react_messages",
        JSON.stringify(messages),
      );
    }
  }, [messages]);

  const handleSend = async (
    customPrompt?: string,
    isAutoStart: boolean = false,
  ) => {
    const text = (customPrompt || input).trim();
    if (!text || loading) return;

    const userMsg: ReactMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: new Date(),
    };
    const aiMsgId = crypto.randomUUID();
    const initAiMsg: ReactMessage = {
      id: aiMsgId,
      role: "assistant",
      content: "",
      isGenerating: true,
      agentSteps: [],
      createdAt: new Date(),
    };

    if (!isAutoStart) {
      setMessages((prev) => [...prev, userMsg, initAiMsg]);
    } else {
      setMessages([userMsg, initAiMsg]);
    }

    setInput("");
    setLoading(true);

    try {
      // Find the last snapshot of files to pass as context
      const lastSnapshot = [...messages]
        .reverse()
        .find((m) => m.snapshotFiles)?.snapshotFiles;

      const res = await fetch("/api/generate-react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          model: selectedModel,
          existingFiles: lastSnapshot || undefined,
        }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let finalFiles: any = null;
      let finalTokens: any = null;
      let generatedSiteName: string = "React App";
      let buffer = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const line of parts) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.action === "agent-update") {
                  setMessages((prev) =>
                    prev.map((m) => {
                      if (m.id === aiMsgId) {
                        const steps = m.agentSteps || [];
                        const existing = [...steps];
                        const idx = existing.findIndex(
                          (s) => s.id === data.step.id,
                        );
                        if (idx >= 0)
                          existing[idx] = { ...existing[idx], ...data.step };
                        else existing.push(data.step);
                        return { 
                          ...m, 
                          agentSteps: existing,
                          architectData: data.architectData || m.architectData
                        };
                      }
                      return m;
                    }),
                  );
                } else if (data.action === "generation-complete") {
                  finalFiles = data.files;
                  finalTokens = data.tokens;
                } else if (data.action === "error") {
                  throw new Error(data.message);
                }
              } catch (e) {
                // incomplete chunk or parse error, ignore
              }
            }
          }
        }
      }

      if (!finalFiles)
        throw new Error("Stream closed before files were generated.");

      // Calculate next version
      const v = [...messages].filter((m) => m.snapshotFiles).length + 1;

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === aiMsgId) {
            return {
              ...m,
              content: "Generated React components based on your request.",
              snapshotFiles: finalFiles,
              snapshotVersion: v,
              tokens: finalTokens
                ? {
                    input: finalTokens.inputTokens || 0,
                    output: finalTokens.outputTokens || 0,
                    total:
                      (finalTokens.inputTokens || 0) +
                      (finalTokens.outputTokens || 0),
                    credits: finalTokens.creditsUsed || 0,
                  }
                : undefined,
              model: selectedModel,
              isGenerating: false,
            };
          }
          return m;
        }),
      );

      sessionStorage.setItem(
        "crawlcube_react_files",
        JSON.stringify(finalFiles),
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? { ...m, content: `❌ Error: ${err.message}`, isGenerating: false }
            : m,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (files: GeneratedReactFiles) => {
    onFilesChange(files);
    // Force set in session to persist the restored context if they hit Save
    sessionStorage.setItem("crawlcube_react_files", JSON.stringify(files));
    alert(
      "Restored version locally! Make sure to click Save to persist these changes permanently.",
    );
  };

  const MODELS = DEEP_DIVE_MODELS; // Reusing deep dive model lists
  const activeModel =
    MODELS.find((m) => m.model === selectedModel) || MODELS[0];

  return (
    <div className="w-[350px] shrink-0 border-r border-[#222] bg-[#0f0f0f] flex flex-col h-full overflow-hidden text-sm">
      {/* Header */}
      <div className="p-4 border-b border-[#222] shrink-0 bg-[#0a0a0a]">
        <div className="flex items-center gap-2 font-semibold text-white">
          React Generation{" "}
          <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] px-1.5 py-0.5 rounded tracking-wider uppercase">
            BETA
          </span>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
          >
            {m.role === "user" ? (
              <div className="bg-indigo-600/90 text-white px-4 py-2.5 rounded-2xl max-w-[90%] break-words">
                {m.content}
              </div>
            ) : (
              <div className="w-full">
                <p className="text-white/80 font-medium mb-3">{m.content}</p>

                {(m.isGenerating ||
                  (m.agentSteps && m.agentSteps.length > 0)) && (
                  <div className="bg-[#151515] p-3 rounded-xl border border-white/10 my-3">
                    {m.isGenerating && (
                      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/5">
                        <LoaderCircle className="w-4 h-4 text-white/50 animate-spin" />
                        <ThinkingText label={getThinkingLabel(m.agentSteps)} />
                      </div>
                    )}
                    {m.agentSteps && m.agentSteps.length > 0 && (
                      <ReactGenerationProgress steps={m.agentSteps} architectData={m.architectData} />
                    )}
                  </div>
                )}

                {m.snapshotFiles && (
                  <div className="bg-[#151515] border border-white/10 rounded-xl overflow-hidden mt-2 flex flex-col shadow-xl shadow-black/20">
                    <div className="bg-white/5 px-3 py-2 border-b border-white/10 flex items-center justify-between text-xs text-white/60">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="font-semibold tracking-wider text-white">
                          SNAPSHOT
                        </span>
                        <span className="bg-indigo-500/20 text-indigo-400 px-1.5 rounded-full font-mono">
                          v{m.snapshotVersion}
                        </span>
                      </div>
                      <span className="font-mono bg-white/5 px-1.5 rounded">
                        {Object.keys(m.snapshotFiles).length} files
                      </span>
                    </div>
                    <div className="p-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-[#0a0a0a] p-2 rounded-lg border border-white/5">
                        <p className="text-white/40 font-mono text-[10px] mb-1 uppercase tracking-widest">
                          Snapshot
                        </p>
                        <p className="text-white/80 font-medium">
                          Generation Version {m.snapshotVersion}
                        </p>
                      </div>
                      <div className="bg-[#0a0a0a] p-2 rounded-lg border border-white/5">
                        <p className="text-white/40 font-mono text-[10px] mb-1 uppercase tracking-widest">
                          Framework
                        </p>
                        <p className="text-white/80 font-medium">React</p>
                      </div>
                      <div className="bg-[#0a0a0a] p-2 rounded-lg border border-white/5 col-span-2">
                        <p className="text-white/40 font-mono text-[10px] mb-1 uppercase tracking-widest">
                          Libraries
                        </p>
                        <p className="text-white/80 font-medium truncate">
                          react, react-dom, react-router-dom, tailwind
                        </p>
                      </div>
                    </div>
                    <div className="px-3 py-2 bg-[#0a0a0a] border-t border-white/10 text-[11px] text-white/50 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <p>Version {m.snapshotVersion} context active.</p>
                      </div>
                      {m.tokens && (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[#a855f7]/70 font-mono text-[10px]">
                          <span>in: {(m.tokens.input / 1000).toFixed(1)}k</span>
                          <span>
                            out: {(m.tokens.output / 1000).toFixed(1)}k
                          </span>
                          <span>
                            total: {(m.tokens.total / 1000).toFixed(1)}k
                          </span>
                          <span className="ml-auto text-yellow-500/80 font-sans tracking-wide">
                            ⚡ {m.tokens.credits.toFixed(1)} cr
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-1">
                        {m.model && (
                          <span className="max-w-[120px] truncate">
                            {m.model.split("/").pop()}
                          </span>
                        )}
                        <button
                          onClick={() =>
                            m.snapshotFiles && handleRestore(m.snapshotFiles)
                          }
                          className="text-white hover:text-indigo-400 flex items-center gap-1.5 transition-colors cursor-pointer ml-auto"
                        >
                          <RotateCcw className="w-3 h-3" /> Restore version
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-[#222] bg-[#0a0a0a]">
        <div className="border border-white/10 rounded-xl overflow-hidden bg-[#111] focus-within:border-indigo-500/50 transition-colors flex flex-col">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Describe your React project..."
            className="w-full bg-transparent text-white placeholder-white/30 p-3 min-h-[80px] max-h-[200px] resize-none outline-none overflow-y-auto"
          />
          <div className="px-2 py-1.5 bg-[#080808] border-t border-white/5 flex items-center justify-between">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent text-xs text-white/60 focus:text-white outline-none cursor-pointer max-w-[140px]"
            >
              {MODELS.map((model) => (
                <option
                  key={model.model}
                  value={model.model}
                  className="bg-neutral-900 text-white"
                >
                  {model.label}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
