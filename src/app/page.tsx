'use client';
import { useState } from 'react';

export default function Home() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState({
    primary_color: '#0f172a',
    secondary_color: '#1e293b',
    stress_level: 0,
    summary: 'Awaiting your journal entry input...',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!data.error) setTheme(data);
    } catch {
      console.error('Failed to communicate with API server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center text-white transition-all duration-1000 p-6"
      style={{
        backgroundImage: `linear-gradient(135deg, ${theme.primary_color}, ${theme.secondary_color})`,
      }}
    >
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl w-full max-w-md shadow-2xl border border-white/20">
        <h1 className="text-3xl font-bold mb-1 tracking-tight">
          VibeShift - See what colour your mood reflects!!
        </h1>
        <p className="text-sm text-white/70 mb-6">Developer-Mode</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            className="w-full p-4 bg-black/20 rounded-xl border border-white/10 focus:outline-none focus:border-white/40 text-white placeholder-white/40 resize-none h-24"
            placeholder="Type how your day went..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-white text-black font-semibold hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Analyzing Tone Data...' : 'Log & Repaint Screen'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
          <div>
            <span className="text-xs text-white/50 block">
              AI DIAGNOSTIC METRIC
            </span>
            <span className="font-medium text-lg">{theme.summary}</span>
          </div>
          <div>
            <span className="text-xs text-white/50 block mb-1">
              STRESS LEVEL
            </span>
            <div className="w-full bg-black/30 h-3 rounded-full overflow-hidden">
              <div
                className="bg-white h-full transition-all duration-1000"
                style={{ width: `${theme.stress_level}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
