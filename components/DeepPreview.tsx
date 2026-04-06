"use client";

import { useEffect, useRef } from "react";

export default function DeepPreview({
  html,
  viewport = "desktop",
  editable = false,
}: {
  html: string;
  viewport?: "desktop" | "mobile";
  editable?: boolean;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !html) return;

    // Revoke previous blob URL to free memory
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }

    let finalHtml = html;
    if (editable) {
      const EDITOR_SCRIPT = `
        console.log('CrawlCube Editor Script Initializing...');
        
        function initEditor() {
          console.log('Editor init running');
          const allElements = document.body.querySelectorAll('*');
          allElements.forEach(el => {
            if (!el.hasAttribute('data-editor-id')) {
              el.setAttribute('data-editor-id', Math.random().toString(36).substr(2, 9));
            }
          });

          const style = document.createElement('style');
          style.id = 'crawlcube-editor-style';
          style.textContent = '.editor-hover-outline { outline: 3px solid #3b82f6 !important; outline-offset: -3px !important; cursor: pointer !important; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.3) !important; }';
          document.head.appendChild(style);

          let currentHover = null;
          
          function extractElementData(target) {
            const computed = window.getComputedStyle(target);
            const styles = {
              fontSize: computed.fontSize,
              fontWeight: computed.fontWeight,
              textAlign: computed.textAlign,
              color: computed.color,
              backgroundColor: computed.backgroundColor,
              margin: computed.margin,
              padding: computed.padding,
              borderRadius: computed.borderRadius
            };
            
            const inlineStyle = target.getAttribute('style') || '';
            const innerHTML = target.innerHTML || '';
            
            let current = target;
            const hierarchy = [];
            while (current && current !== document.body && current !== document.documentElement) {
              hierarchy.unshift({
                id: current.getAttribute('data-editor-id'),
                tagName: current.tagName
              });
              current = current.parentElement;
            }

            window.parent.postMessage({
              type: 'ELEMENT_CLICKED',
              data: {
                id: target.getAttribute('data-editor-id'),
                tagName: target.tagName,
                computedStyles: styles,
                inlineStyle: inlineStyle,
                innerHTML: innerHTML,
                hierarchy: hierarchy
              }
            }, '*');
          }

          document.addEventListener('mouseover', (e) => {
            if (currentHover && currentHover !== e.target) {
              currentHover.classList.remove('editor-hover-outline');
            }
            if (e.target && e.target !== document.body && e.target !== document.documentElement) {
              e.target.classList.add('editor-hover-outline');
              currentHover = e.target;
            }
          }, true);

          document.addEventListener('mouseout', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('editor-hover-outline')) {
              e.target.classList.remove('editor-hover-outline');
            }
          }, true);

          document.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const target = e.target;
            if (!target || target === document.body || target === document.documentElement) return;

            extractElementData(target);
          }, true);

          window.addEventListener('message', (e) => {
            if (!e.data) return;
            if (e.data.type === 'SELECT_ELEMENT') {
              const target = document.querySelector('[data-editor-id="' + e.data.data.id + '"]');
              if (target) {
                if (currentHover) currentHover.classList.remove('editor-hover-outline');
                target.classList.add('editor-hover-outline');
                currentHover = target;
                extractElementData(target);
              }
            }
            if (e.data.type === 'UPDATE_STYLE') {
              const { id, styles } = e.data.data;
              const target = document.querySelector('[data-editor-id="' + id + '"]');
              if (target) {
                Object.entries(styles).forEach(([k, v]) => {
                  target.style[k] = v;
                });
              }
            }
            if (e.data.type === 'UPDATE_CONTENT') {
              const { id, content } = e.data.data;
              const target = document.querySelector('[data-editor-id="' + id + '"]');
              if (target) {
                target.innerHTML = content;
              }
            }
          });
        }

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', initEditor);
        } else {
          initEditor();
        }
      `;

      if (finalHtml.includes('</body>')) {
        finalHtml = finalHtml.replace('</body>', `<script id="crawlcube-editor-script">${EDITOR_SCRIPT}</script></body>`);
      } else {
        finalHtml += `<script id="crawlcube-editor-script">${EDITOR_SCRIPT}</script>`;
      }
    }

    const blob = new Blob([finalHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    blobUrlRef.current = url;
    iframe.src = url;

    // Cleanup on unmount
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, [html, editable]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <iframe
      ref={iframeRef}
      className="rounded-lg shadow-2xl transition-all duration-300 border-0"
      style={{
        width: viewport === "mobile" ? "390px" : "100%",
        height: "100%",
        minHeight: "600px",
        background: "white",
        display: "block",
      }}
      sandbox="allow-scripts allow-same-origin allow-forms"
      title="Deep Dive Preview"
    />
  );
}
