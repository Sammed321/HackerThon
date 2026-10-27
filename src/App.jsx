import React, { useEffect } from 'react';
import { useApp } from './store.jsx';
import Header from './components/Header.jsx';
import MediaStudio from './components/MediaStudio.jsx';
import Constellation from './components/Constellation.jsx';
import Assistant from './components/Assistant.jsx';
import StandardsHub from './components/StandardsHub.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import IngestModal from './components/IngestModal.jsx';
import ContextCard from './components/ContextCard.jsx';
import Toasts from './components/Toasts.jsx';
import Footer from './components/Footer.jsx';

const TABS = [
  { id: 'studio', num: '1', label: 'Media Studio', hint: 'Archival player + cultural decoder' },
  { id: 'graph', num: '2', label: 'Heritage Constellation', hint: 'Interactive knowledge graph' },
  { id: 'assistant', num: '3', label: 'Talk to the Archive', hint: 'Grounded RAG assistant' },
  { id: 'standards', num: '4', label: 'Open Standards Hub', hint: 'IIIF · Dublin Core · exports' },
];

export default function App() {
  const { tab, setTab, toggle, setPaletteOpen } = useApp();

  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      if (typing) return;
      if (e.key === ' ') { e.preventDefault(); toggle(); }
      else if (e.key === '1') setTab('studio');
      else if (e.key === '2') setTab('graph');
      else if (e.key === '3') setTab('assistant');
      else if (e.key === '4') setTab('standards');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, setTab, setPaletteOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-obsidian relative">
      {/* ambient museum glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/3 w-[46rem] h-[46rem] rounded-full bg-gold/[0.05] blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[40rem] h-[40rem] rounded-full bg-aqua/[0.04] blur-3xl" />
        <div className="absolute bottom-0 -left-40 w-[36rem] h-[36rem] rounded-full bg-iris/[0.05] blur-3xl" />
      </div>

      <Header
        tabs={TABS}
        activeTab={tab}
        onSelect={(id) => setTab(id)}
      />

      <main className="relative flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-6 pb-6">
        <div className="pt-3 flex items-center gap-2 md:hidden overflow-x-auto pb-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`chip shrink-0 ${tab === t.id ? 'bg-gold/15 text-gold border-gold/40' : 'bg-white/5 text-slate-300 border-white/10'}`}
            >
              <span className="opacity-60">{t.num}</span> {t.label}
            </button>
          ))}
        </div>
        <div className="animate-fadeUp" key={tab}>
          {tab === 'studio' && <MediaStudio />}
          {tab === 'graph' && <Constellation />}
          {tab === 'assistant' && <Assistant />}
          {tab === 'standards' && <StandardsHub />}
        </div>
      </main>

      <Footer />

      <CommandPalette />
      <SettingsModal />
      <IngestModal />
      <ContextCard />
      <Toasts />
    </div>
  );
}
