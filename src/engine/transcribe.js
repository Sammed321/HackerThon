/**
 * On-device transcription — `Xenova/whisper-tiny.en` runs on WebAssembly
 * through transformers.js. Model + runtime files are served from `/models`
 * and `/ort` (this repo's `public/` folder), so after the very first run the
 * browser caches them and every later transcription is fully offline with
 * zero API keys.
 *
 * English speech works best (tiny.en is an English-only checkpoint).
 */

const MODEL_ID = 'Xenova/whisper-tiny.en';

let pipelinePromise = null;

export function transcribeSupported() {
  return typeof window !== 'undefined' && Boolean(
    (window.AudioContext || window.webkitAudioContext)
    && (window.OfflineAudioContext || window.webkitOfflineAudioContext)
  );
}

/**
 * Lazily import transformers.js and build the ASR pipeline once.
 * `onFile` receives { file, progress } (0..1) while weights load.
 */
export async function loadTranscriber(onFile) {
  if (pipelinePromise) return pipelinePromise;
  pipelinePromise = (async () => {
    const { pipeline, env } = await import('@xenova/transformers');
    env.allowLocalModels = true;
    env.allowRemoteModels = false;                    // never phone home
    env.localModelPath = '/models/';
    if (env.backends?.onnx) {
      env.backends.onnx.wasm = env.backends.onnx.wasm || {};
      env.backends.onnx.wasm.wasmPaths = '/ort/';
    }
    return pipeline('automatic-speech-recognition', MODEL_ID, {
      quantized: true,
      progress_callback: (p) => {
        if (p && p.status === 'progress' && typeof p.progress === 'number') {
          try { onFile?.({ file: p.file || 'model weights', progress: Math.min(1, p.progress / 100) }); } catch { /* noop */ }
        }
      },
    });
  })().catch((err) => {
    // allow a retry after a failed first attempt (bad fetch etc.)
    pipelinePromise = null;
    throw err;
  });
  return pipelinePromise;
}

/**
 * Decode any browser-supported media (mp3 / wav / m4a / mp4 / webm audio)
 * to mono Float32Array at 16 kHz — exactly what Whisper expects.
 */
export async function decodeToMono16k(file) {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) throw new Error('This browser cannot decode audio in the page.');

  const raw = await file.arrayBuffer();
  const ctx = new AC();
  let decoded;
  try {
    decoded = await ctx.decodeAudioData(raw);
  } catch {
    throw new Error("This file's audio track could not be decoded — try MP3, WAV or MP4.");
  } finally {
    try { ctx.close?.(); } catch { /* noop */ }
  }

  const target = 16000;
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OAC) throw new Error('This browser cannot resample audio.');
  const off = new OAC(1, Math.max(1, Math.ceil((decoded.duration || 1) * target)), target);
  const src = off.createBufferSource();
  src.buffer = decoded;
  src.connect(off.destination);
  src.start(0);
  const rendered = await off.startRendering();

  return {
    samples: rendered.getChannelData(0),
    duration: rendered.duration || decoded.duration || 0,
  };
}

/**
 * Transcribe a media File. Returns:
 *   { text, chunks: [{ text, timestamp: [start, end] }], duration }
 * `onProgress` receives { step: 'decode'|'load'|'run', value: 0..1, message }.
 */
export async function transcribeFile(file, onProgress) {
  const report = (step, value, message) => {
    try { onProgress?.({ step, value: Math.max(0, Math.min(1, value)), message }); } catch { /* noop */ }
  };

  report('decode', 0.03, 'Decoding audio in the browser…');
  const { samples, duration } = await decodeToMono16k(file);

  let lastFilePct = 0;
  report('load', 0.06 + lastFilePct * 0.5, 'Loading Whisper weights (first run only)…');
  const asr = await loadTranscriber(({ file: name, progress }) => {
    if (progress > lastFilePct) {
      lastFilePct = progress;
      report('load', 0.06 + progress * 0.5, `Loading ${name}… ${Math.round(progress * 100)}%`);
    }
  });

  const expected = Math.max(1, Math.ceil((duration || 30) / 25)); // 30 s chunks, 5 s stride
  let done = 0;
  report('run', 0.58, 'Transcribing on this device…');
  const out = await asr(samples, {
    chunk_length_s: 30,
    stride_length_s: 5,
    return_timestamps: true,
    chunk_callback: () => {
      done += 1;
      report('run', 0.58 + Math.min(0.4, (done / expected) * 0.4), `Transcribing… ~${Math.round((done / expected) * 100)}%`);
    },
  });

  report('done', 1, 'Transcript ready.');
  return {
    text: out?.text || '',
    chunks: (Array.isArray(out?.chunks) ? out.chunks : []).filter((c) => String(c?.text || '').trim()),
    duration,
  };
}
