/**
 * Live LLM connectors — Ollama, any OpenAI-compatible endpoint (Gemma 4 included),
 * and Google Gemini. Every call is fault-isolated: failures return normally so
 * the chat can transparently fall back to the deterministic Local Heuristics
 * engine without ever throwing an error to the user.
 */
export const PROVIDERS = [
  {
    id: 'local', name: 'Local Heuristics Engine', tagline: 'Built-in, deterministic, works fully offline', needsKey: false,
  },
  {
    id: 'ollama', name: 'Ollama (local LLM)', tagline: 'Run Gemma / Llama / Mistral entirely on this machine', needsKey: false,
    defaultBase: 'http://localhost:11434', defaultModel: 'gemma2',
  },
  {
    id: 'openai', name: 'OpenAI-compatible endpoint', tagline: 'Any /chat/completions gateway — Gemma 4, vLLM, LM Studio…', needsKey: true,
    defaultBase: 'https://generativelanguage.googleapis.com/v1beta/openai', defaultModel: 'gemma-4-preview',
  },
  {
    id: 'gemini', name: 'Google Gemini API', tagline: 'Gemini 2.0-class models via generativelanguage.googleapis.com', needsKey: true,
    defaultBase: 'https://generativelanguage.googleapis.com', defaultModel: 'gemini-2.0-flash',
  },
];

export const DEFAULT_SETTINGS = {
  provider: 'local',
  ollama: { base: 'http://localhost:11434', model: 'gemma2' },
  openai: { base: 'https://generativelanguage.googleapis.com/v1beta/openai', key: '', model: 'gemma-4-preview' },
  gemini: { base: 'https://generativelanguage.googleapis.com', key: '', model: 'gemini-2.0-flash' },
};

function timeoutSignal(ms) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort('timeout'), ms);
  return { signal: ctl.signal, clear: () => clearTimeout(timer) };
}

async function fetchJson(url, init, timeoutMs) {
  const { signal, clear } = timeoutSignal(timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal });
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch { /* non-JSON error body */ }
    if (!res.ok) {
      const detail = (data && (data.error?.message || data.message)) || text.slice(0, 120) || `HTTP ${res.status}`;
      throw new Error(detail);
    }
    return data ?? JSON.parse(text);
  } finally {
    clear();
  }
}

/** Verify an endpoint is alive. Never throws. */
export async function testConnection(settings) {
  const t0 = performance.now();
  try {
    if (settings.provider === 'ollama') {
      const base = settings.ollama.base.replace(/\/+$/, '');
      const data = await fetchJson(`${base}/api/tags`, { method: 'GET' }, 8000);
      const models = (data.models || []).map((m) => m.name);
      const hasModel = models.some((m) => m.startsWith(settings.ollama.model));
      return { ok: true, ms: Math.round(performance.now() - t0), detail: hasModel
        ? `Connected — ${models.length} model(s); "${settings.ollama.model}" available.`
        : `Connected — but "${settings.ollama.model}" not listed (${models.slice(0, 3).join(', ') || 'none'}). Run: ollama pull ${settings.ollama.model}` };
    }
    if (settings.provider === 'openai') {
      const base = settings.openai.base.replace(/\/+$/, '');
      const data = await fetchJson(`${base}/models`, {
        method: 'GET', headers: { Authorization: `Bearer ${settings.openai.key || ''}` },
      }, 10000);
      const count = (data.data || []).length;
      return { ok: true, ms: Math.round(performance.now() - t0), detail: `Connected — ${count} model(s) visible.` };
    }
    if (settings.provider === 'gemini') {
      const base = settings.gemini.base.replace(/\/+$/, '');
      const data = await fetchJson(`${base}/v1beta/models?key=${encodeURIComponent(settings.gemini.key || '')}`, { method: 'GET' }, 10000);
      const names = (data.models || []).map((m) => m.name?.replace('models/', ''));
      return { ok: true, ms: Math.round(performance.now() - t0), detail: `Connected — ${names.length} model(s); "${settings.gemini.model}" ${names.includes(settings.gemini.model) ? 'available' : 'not in list (may still work)'}.` };
    }
    return { ok: true, ms: 0, detail: 'Local Heuristics Engine — always ready, no connection needed.' };
  } catch (err) {
    return { ok: false, ms: Math.round(performance.now() - t0), detail: String(err?.message || err).slice(0, 160) };
  }
}

/** Chat through the configured provider. Throws only for the caller to catch. */
export async function callLLM(settings, { system, user }) {
  if (settings.provider === 'ollama') {
    const base = settings.ollama.base.replace(/\/+$/, '');
    const data = await fetchJson(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: settings.ollama.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        stream: false,
      }),
    }, 60000);
    return data?.message?.content || '';
  }
  if (settings.provider === 'openai') {
    const base = settings.openai.base.replace(/\/+$/, '');
    const data = await fetchJson(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.openai.key || ''}` },
      body: JSON.stringify({
        model: settings.openai.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.4,
      }),
    }, 40000);
    return data?.choices?.[0]?.message?.content || '';
  }
  if (settings.provider === 'gemini') {
    const base = settings.gemini.base.replace(/\/+$/, '');
    const data = await fetchJson(`${base}/v1beta/models/${encodeURIComponent(settings.gemini.model)}:generateContent?key=${encodeURIComponent(settings.gemini.key || '')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { temperature: 0.4 },
      }),
    }, 40000);
    return (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
  }
  throw new Error('local provider');
}
