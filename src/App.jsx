import React, { useEffect, useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { MainArea } from './components/MainArea';
import { useStore } from './store';
import { db } from './db';
import { Analytics } from '@vercel/analytics/react';

function App() {
  const [loading, setLoading] = useState(true);
  const theme = useStore((state) => state.theme);
  const setTheme = useStore((state) => state.setTheme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // ── Global shortcut: Shift+T → toggle day / night mode ────────────────
  const handleGlobalKeys = useCallback((e) => {
    const tag = document.activeElement?.tagName;
    const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable;
    if (inInput) return;
    if (e.shiftKey && e.key === 'T') {
      e.preventDefault();
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  }, [theme, setTheme]);

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [handleGlobalKeys]);

  useEffect(() => {
    // Initializing indexeddb
    db.open().then(() => {
      setLoading(false);
    }).catch(err => {
      console.error("Failed to open db", err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-parchment-100 dark:bg-wood-900 text-wood-900 dark:text-parchment-100 font-serif">Loading library...</div>;
  }

  return (
    <div className="flex h-screen bg-parchment-100 dark:bg-wood-900 overflow-hidden text-wood-900 dark:text-parchment-100 font-sans selection:bg-gold-500/30">
      <Sidebar />
      <MainArea />
      <Analytics />
    </div>
  );
}

export default App;
