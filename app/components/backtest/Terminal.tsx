'use client';

import { useEffect, useRef } from 'react';

interface TerminalProps {
  output: string[];
}

export function Terminal({ output }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div className="h-64 flex flex-col bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-cyan-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/20">
      <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 px-6 py-3 border-b border-cyan-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <span className="text-cyan-400 font-mono text-sm font-semibold">terminal</span>
        </div>
        <div className="text-xs text-gray-500 font-mono">
          {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div
        ref={terminalRef}
        className="flex-1 p-4 font-mono text-xs overflow-y-auto custom-scrollbar"
      >
        {output.map((line, idx) => (
          <div
            key={idx}
            className={`mb-1 animate-fadeIn ${
              line.includes('ERROR') ? 'text-red-400' :
              line.includes('SUCCESS') || line.includes('completed') ? 'text-green-400' :
              line.includes('WARNING') ? 'text-yellow-400' :
              'text-green-400'
            }`}
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            {line}
          </div>
        ))}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-cyan-400">$</span>
          <div className="w-2 h-4 bg-cyan-400 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
