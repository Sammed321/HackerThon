import React from 'react';
import { Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-edge/50 py-4 px-6">
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-display text-slate-300">SmritiGraph</span>
          <span>v1.0.0 · MIT License</span>
          <span className="hidden md:inline text-slate-600">·</span>
          <span className="hidden md:inline">Built for Hacktoberfest Hack Day 2026 — Track 2 · Audiovisual Heritage Day</span>
        </div>
        <div className="flex items-center gap-3 text-slate-600">
          <span><kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-slate-400">⌘/Ctrl</kbd>+<kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-slate-400">K</kbd> palette</span>
          <span><kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-slate-400">Space</kbd> play</span>
          <span><kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-slate-400">1–4</kbd> tabs</span>
          <a href="https://github.com/smritigraph/smritigraph" target="_blank" rel="noreferrer" className="hover:text-gold inline-flex items-center gap-1">
            <Github size={12} /> github.com/smritigraph
          </a>
        </div>
      </div>
    </footer>
  );
}
