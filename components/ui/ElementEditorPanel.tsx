"use client";

import React, { useState, useEffect } from "react";
import { X, Type, PaintBucket, Maximize, Code } from "lucide-react";

const SliderInput = ({ label, value, onChange, min = 0, max = 100 }: any) => {
  const numMatch = (value || "").toString().match(/^-?\d*\.?\d+/);
  const numValue = numMatch ? parseFloat(numMatch[0]) : 0;
  let unit = (value || "").toString().replace(/^-?\d*\.?\d+/, "").trim() || "px";
  if (unit !== "px" && unit !== "rem" && unit !== "em" && unit !== "%" && unit !== "vw" && unit !== "vh") {
    unit = "px"; // default fallback for weird computed styles
  }

  const handleChange = (newVal: string | number) => {
    onChange(`${newVal}${unit}`);
  };

  return (
    <div>
      <label className="text-xs text-neutral-400 mb-1 flex justify-between">
        <span>{label}</span>
      </label>
      <div className="flex gap-2 items-center">
        <input 
          type="range" 
          min={min} 
          max={max} 
          value={numValue} 
          onChange={(e) => handleChange(e.target.value)} 
          className="flex-1 h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500" 
        />
        <div className="flex items-center bg-[#141414] border border-[#333] rounded overflow-hidden w-20">
          <input 
            type="number" 
            value={numValue} 
            onChange={(e) => handleChange(e.target.value)} 
            className="w-full bg-transparent px-2 py-1 text-xs outline-none text-right"
          />
          <span className="text-[10px] text-neutral-500 pr-1">{unit}</span>
        </div>
      </div>
    </div>
  );
};

export default function ElementEditorPanel({
  element,
  activeTab,
  onTabChange,
  onClose,
  onUpdateStyle,
  onUpdateContent,
  onSelectElement,
  onResetStyle,
}: {
  element: any;
  activeTab?: "typography" | "colors" | "spacing" | "css";
  onTabChange?: (tab: "typography" | "colors" | "spacing" | "css") => void;
  onClose: () => void;
  onUpdateStyle: (styles: Record<string, string>) => void;
  onUpdateContent: (content: string) => void;
  onSelectElement?: (id: string) => void;
  onResetStyle?: (initialStyle: string) => void;
}) {
  const [styles, setStyles] = useState<Record<string, string>>(
    element.computedStyles || {}
  );
  
  const [content, setContent] = useState<string>(element.innerHTML || "");
  const [plainText, setPlainText] = useState<string>(() => {
    if (typeof window === 'undefined') return element.innerHTML || "";
    const temp = document.createElement('div');
    temp.innerHTML = element.innerHTML || "";
    return temp.textContent || "";
  });

  const [_internalTab, _setInternalTab] = useState<"typography" | "colors" | "spacing" | "css">("colors");
  
  const tag = (element.tagName || "").toUpperCase();
  const isTextElement = ['H1','H2','H3','H4','H5','H6','P','SPAN','A','BUTTON','LI','LABEL','STRONG','EM','B','I'].includes(tag);
  const isImageNode = tag === 'IMG' || tag === 'SVG';

  const defaultTab = isTextElement ? "typography" : "colors";
  
  useEffect(() => {
    if (!onTabChange && _internalTab !== defaultTab) {
      _setInternalTab(defaultTab);
    }
  }, [element.tagName]);

  let currentTab = onTabChange ? activeTab : _internalTab;
  
  if (currentTab === "typography" && !isTextElement) {
    currentTab = "colors";
  }

  const setTab = onTabChange || _setInternalTab;

  const [customCss, setCustomCss] = useState(element.inlineStyle || "");

  const handleStyleChange = (key: string, value: string) => {
    const newStyles = { ...styles, [key]: value };
    setStyles(newStyles);
    onUpdateStyle({ [key]: value });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    onUpdateContent(e.target.value);
  };
  
  const handlePlainTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPlainText(e.target.value);
    setContent(e.target.value);
    onUpdateContent(e.target.value);
  };

  const handleCustomCssChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomCss(e.target.value);
    const rules = e.target.value.split(';').filter(r => r.trim());
    const newStyles: Record<string, string> = {};
    rules.forEach(rule => {
      const [k, v] = rule.split(':');
      if (k && v) {
        newStyles[k.trim()] = v.trim();
      }
    });
    onUpdateStyle(newStyles);
  };
  
  const doResetStyles = () => {
    if (onResetStyle) {
      onResetStyle(element.inlineStyle || '');
      // Hard reset the react state
      setStyles(element.computedStyles || {});
      setCustomCss(element.inlineStyle || '');
    }
  };

  const tabsToRender = [
    ...(isTextElement ? [{ id: "typography", icon: Type, title: "Text" }] : []),
    { id: "colors", icon: PaintBucket, title: "Colors" },
    { id: "spacing", icon: Maximize, title: "Space" },
    { id: "css", icon: Code, title: "Code" },
  ];

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-[#1e1e1e] border-l border-[#333] text-white flex flex-col shadow-2xl z-50 rounded-tl-xl overflow-hidden animate-in slide-in-from-right-8 duration-200">
      {/* Header */}
      <div className="flex flex-col border-b border-[#333]">
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-[#333] px-2 py-1 rounded text-orange-400 font-semibold uppercase">{tag}</span>
            <span className="text-sm font-semibold text-neutral-200">Edit Element</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#333] rounded-md transition-colors">
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        </div>
        
        {/* Breadcrumbs for Hierarchy Selection */}
        {element.hierarchy && element.hierarchy.length > 0 && (
          <div className="px-4 pb-3 flex flex-wrap items-center gap-1 overflow-x-auto scrollbar-none">
            {element.hierarchy.map((n: any, idx: number) => {
              const isLast = idx === element.hierarchy.length - 1;
              return (
                <React.Fragment key={n.id}>
                  <button 
                    onClick={() => onSelectElement && onSelectElement(n.id)}
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition-colors ${isLast ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-neutral-500 hover:bg-[#333] hover:text-neutral-300'}`}
                    title="Select this parent container"
                  >
                    {n.tagName.toLowerCase()}
                  </button>
                  {!isLast && <span className="text-neutral-600 text-[9px] font-black">›</span>}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex px-2 pt-2 border-b border-[#333] gap-1 relative">
        {tabsToRender.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`flex-1 flex justify-center py-2.5 rounded-t-lg transition-colors group ${
              currentTab === t.id ? "bg-[#2a2a2a] text-blue-400" : "text-neutral-500 hover:text-neutral-300 hover:bg-[#252525]"
            }`}
            title={t.title}
          >
            <t.icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-4 space-y-8 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
        {currentTab === "typography" && isTextElement && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col space-y-2">
              <label className="text-xs text-neutral-400 block flex justify-between">
                <span>Plain Text Content</span>
                {plainText !== content && <span className="text-orange-400/80 text-[9px]">Warning: Editing deletes formatting</span>}
              </label>
              <textarea
                value={plainText}
                onChange={handlePlainTextChange}
                className="w-full bg-[#141414] border border-[#333] rounded-md p-3 text-xs font-mono text-blue-300 outline-none focus:border-blue-500 scrollbar-thin scrollbar-thumb-[#444]"
                rows={3}
              />
            </div>
            
            <SliderInput 
              label="Font Size" 
              value={styles.fontSize || "16px"} 
              min={8} 
              max={120} 
              onChange={(v: string) => handleStyleChange("fontSize", v)} 
            />
            
            <SliderInput 
              label="Font Weight" 
              value={styles.fontWeight || "400"} 
              min={100} 
              max={900} 
              onChange={(v: string) => handleStyleChange("fontWeight", v.replace('px', ''))} 
            />

            <div>
               <label className="text-xs text-neutral-400 mb-2 block">Text Align</label>
               <div className="flex gap-2">
                 {["left", "center", "right", "justify"].map(align => (
                   <button 
                     key={align}
                     onClick={() => handleStyleChange("textAlign", align)}
                     className={`flex-1 py-1.5 text-xs capitalize rounded border transition-colors ${styles.textAlign === align ? "bg-blue-500/20 text-blue-400 border-blue-500/50" : "bg-[#141414] border-[#333] text-neutral-400 hover:text-white"}`}
                   >
                     {align}
                   </button>
                 ))}
               </div>
            </div>
          </div>
        )}

        {currentTab === "colors" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {isTextElement && (
              <div>
                <label className="text-xs text-neutral-400 mb-2 block">Text Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={styles.color || "#ffffff"}
                    onChange={(e) => handleStyleChange("color", e.target.value)}
                     className="w-10 h-10 rounded border border-[#333] bg-transparent cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={styles.color || ""}
                    onChange={(e) => handleStyleChange("color", e.target.value)}
                    className="flex-1 bg-[#141414] border border-[#333] rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 font-mono"
                    placeholder="#ffffff or rgb(...)"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="text-xs text-neutral-400 mb-2 block">{isTextElement && !tag.includes('BUTTON') ? 'Highlight Background' : 'Background Color'}</label>
               <div className="flex gap-2">
                <input
                  type="color"
                  value={styles.backgroundColor || "#000000"}
                  onChange={(e) => handleStyleChange("backgroundColor", e.target.value)}
                   className="w-10 h-10 rounded border border-[#333] bg-transparent cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={styles.backgroundColor || ""}
                  onChange={(e) => handleStyleChange("backgroundColor", e.target.value)}
                  className="flex-1 bg-[#141414] border border-[#333] rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 font-mono"
                  placeholder="transparent or #000..."
                />
              </div>
            </div>
          </div>
        )}

        {currentTab === "spacing" && (
           <div className="space-y-6 animate-in fade-in duration-200">
             <SliderInput 
               label="Margin" 
               value={styles.margin || "0px"} 
               min={0} 
               max={200} 
               onChange={(v: string) => handleStyleChange("margin", v)} 
             />
             <SliderInput 
               label="Padding" 
               value={styles.padding || "0px"} 
               min={0} 
               max={200} 
               onChange={(v: string) => handleStyleChange("padding", v)} 
             />
             <SliderInput 
               label="Border Radius" 
               value={styles.borderRadius || "0px"} 
               min={0} 
               max={150} 
               onChange={(v: string) => handleStyleChange("borderRadius", v)} 
             />
           </div>
        )}

        {currentTab === "css" && (
          <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-200">
            {!isImageNode && (
              <div className="flex flex-col space-y-2">
                <label className="text-xs text-neutral-400 block">Element HTML Content</label>
                <textarea
                  value={content}
                  onChange={handleContentChange}
                  className="w-full bg-[#141414] border border-[#333] rounded-md p-3 text-xs font-mono text-blue-300 outline-none focus:border-blue-500 scrollbar-thin scrollbar-thumb-[#444]"
                  rows={6}
                />
              </div>
            )}
            
            <div className="flex flex-col space-y-2 flex-1">
              <label className="text-xs text-neutral-400 block">Inline CSS Styles</label>
              <textarea
                value={customCss}
                onChange={handleCustomCssChange}
                placeholder={"color: red;\\nmargin-top: 20px;"}
                className="flex-1 w-full bg-[#141414] border border-[#333] rounded-md p-3 text-xs font-mono text-blue-300 outline-none focus:border-blue-500 scrollbar-thin scrollbar-thumb-[#444]"
                rows={6}
              />
              <p className="text-[10px] text-neutral-500">Edit pure HTML or inject additional CSS manually.</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Tools */}
      <div className="p-4 border-t border-[#333] bg-[#141414]">
        <button
          onClick={doResetStyles}
          className="w-full py-2 bg-[#2a2a2a] hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-md border border-[#333] hover:border-neutral-500 transition-colors"
        >
          Reset Element Styles
        </button>
      </div>

    </div>
  );
}
