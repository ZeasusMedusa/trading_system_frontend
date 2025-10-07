'use client';

import { useRef, useState } from 'react';

interface StrategyEditorProps {
  strategyCode: string;
  isDragging: boolean;
  onCodeChange: (code: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGetDefault?: () => void;
  onGetBuyDefault?: () => void;
  onGetSellDefault?: () => void;
  onGetDualTemplate?: () => void;
}

export function StrategyEditor({
  strategyCode,
  isDragging,
  onCodeChange,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  fileInputRef,
  onFileChange,
  onGetDefault,
  onGetBuyDefault,
  onGetSellDefault,
  onGetDualTemplate,
}: StrategyEditorProps) {
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);

  return (
    <div
      className={`flex-1 flex flex-col bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border rounded-2xl overflow-hidden shadow-2xl transition-all ${
        isDragging
          ? 'border-cyan-500 border-2 shadow-cyan-500/50'
          : 'border-purple-500/30 shadow-purple-500/20'
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 px-6 py-3 border-b border-purple-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <span className="text-purple-400 font-mono text-sm font-semibold">strategy.json</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onFileSelect}
            className="text-xs text-gray-400 hover:text-cyan-400 flex items-center gap-2 transition-colors cursor-pointer hover:bg-gray-700/30 px-3 py-1.5 rounded-lg"
          >
            <span>📁 Drag & Drop .json file here</span>
          </button>
            {onGetDefault && (
              <button
                onClick={onGetDefault}
                className="text-xs text-gray-400 hover:text-emerald-400 flex items-center gap-2 transition-colors cursor-pointer hover:bg-gray-700/30 px-3 py-1.5 rounded-lg"
              >
                <span>⬇️ Get Default Strategy</span>
              </button>
            )}
          {onGetBuyDefault && (
            <button
              onClick={onGetBuyDefault}
              className="text-xs text-gray-400 hover:text-emerald-400 flex items-center gap-2 transition-colors cursor-pointer hover:bg-gray-700/30 px-3 py-1.5 rounded-lg"
            >
              <span>⬇️ Get BUY Strategy</span>
            </button>
          )}
          {onGetSellDefault && (
            <button
              onClick={onGetSellDefault}
              className="text-xs text-gray-400 hover:text-emerald-400 flex items-center gap-2 transition-colors cursor-pointer hover:bg-gray-700/30 px-3 py-1.5 rounded-lg"
            >
              <span>⬇️ Get SELL Strategy</span>
            </button>
          )}
          {onGetDualTemplate && (
            <button
              onClick={onGetDualTemplate}
              className="text-xs text-gray-400 hover:text-emerald-400 flex items-center gap-2 transition-colors cursor-pointer hover:bg-gray-700/30 px-3 py-1.5 rounded-lg"
            >
              <span>⬇️ Get DUAL Template</span>
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={onFileChange}
          className="hidden"
        />
      </div>

      <div className="flex-1 overflow-hidden relative flex">
        {/* Line numbers */}
        <LineNumbers strategyCode={strategyCode} scrollTop={scrollTop} />

        <div className="flex-1 relative overflow-hidden">
          {/* Empty state placeholder */}
          {!strategyCode && !isDragging && <EmptyState />}

          {/* Blinking cursor indicator when empty */}
          {!strategyCode && !isDragging && (
            <div className="absolute top-6 left-6 flex items-center gap-1 pointer-events-none">
              <span className="text-gray-700 font-mono text-sm">{'{'}</span>
              <div className="w-2 h-4 bg-cyan-500 animate-pulse"></div>
            </div>
          )}

          <textarea
            value={strategyCode}
            onChange={(e) => onCodeChange(e.target.value)}
            onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
            ref={textAreaRef}
            className={`w-full h-full p-6 bg-transparent text-gray-300 font-mono text-sm resize-none focus:outline-none custom-scrollbar ${
              strategyCode ? 'opacity-100' : 'opacity-0'
            }`}
            placeholder=""
            spellCheck={false}
          />

          {/* Drag overlay */}
          {isDragging && <DragOverlay />}
        </div>
      </div>
    </div>
  );
}

function LineNumbers({ strategyCode, scrollTop = 0 }: { strategyCode: string; scrollTop?: number }) {
  return (
    <div
      className="w-12 bg-black/30 border-r border-gray-800/50 py-6 px-2 flex-shrink-0 overflow-hidden"
      style={{ transform: `translateY(${-scrollTop}px)` }}
    >
      {strategyCode ? (
        strategyCode.split('\n').map((_, index) => (
          <div
            key={index}
            className="text-gray-600 text-xs font-mono text-right leading-5 select-none"
          >
            {index + 1}
          </div>
        ))
      ) : (
        <div className="text-gray-600 text-xs font-mono text-right leading-5 select-none">1</div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="flex flex-col items-center gap-4 text-gray-500">
        <div className="relative">
          <div className="text-8xl opacity-20">📋</div>
          <div className="absolute -bottom-2 -right-2 text-4xl">✨</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-400 mb-2">No Strategy Loaded</div>
          <div className="text-sm text-gray-500 max-w-xs">
            Drag & drop a <span className="text-purple-400 font-mono">.json</span> file here
            <br />
            or click the 📁 button above to select a file
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-2 h-2 rounded-full bg-purple-500/50 animate-pulse"></div>
          <div className="w-2 h-2 rounded-full bg-cyan-500/50 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 rounded-full bg-pink-500/50 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}

function DragOverlay() {
  return (
    <div className="absolute inset-0 bg-cyan-500/20 backdrop-blur-sm flex items-center justify-center pointer-events-none">
      <div className="bg-gray-900/90 border-2 border-cyan-500 border-dashed rounded-2xl px-8 py-6 flex flex-col items-center gap-3">
        <div className="text-6xl">📂</div>
        <div className="text-cyan-400 font-bold text-xl">Drop JSON file here</div>
        <div className="text-gray-400 text-sm">strategy.json will be loaded automatically</div>
      </div>
    </div>
  );
}
