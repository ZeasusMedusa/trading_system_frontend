'use client';

import Link from 'next/link';

interface BacktestHeaderProps {
  displayedText: string;
  showCursor: boolean;
  isRunning: boolean;
  currentPhase: string;
}

export function BacktestHeader({
  displayedText,
  showCursor,
  isRunning,
  currentPhase,
}: BacktestHeaderProps) {
  return (
    <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl sticky top-0 z-10">
      <div className="max-w-[1920px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back
            </Link>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent font-mono">
                {displayedText}
                <span className={`${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity`}>|</span>
              </h1>
              <p className="text-sm text-gray-500">Configure and run your trading strategy</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
              isRunning
                ? 'bg-orange-500/20 border border-orange-500/30 text-orange-400'
                : currentPhase === 'Completed'
                ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                : 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
            }`}>
              ● {isRunning ? 'Running' : currentPhase}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
