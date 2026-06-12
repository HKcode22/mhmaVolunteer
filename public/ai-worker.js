let generator = null;

async function loadTransformers() {
  const urls = [
    'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0',
    'https://unpkg.com/@huggingface/transformers@4.2.0?module',
    'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1',
  ];
  for (const url of urls) {
    try {
      console.log('[AI Worker] Trying ESM import:', url);
      const mod = await import(url);
      if (mod?.pipeline) {
        console.log('[AI Worker] Loaded Transformers.js from:', url);
        return mod;
      }
    } catch (e) {
      console.warn('[AI Worker] ESM import failed:', url, e.message);
      continue;
    }
  }
  return null;
}

async function loadModel() {
  self.postMessage({ type: 'status', status: 'loading' });
  console.log('[AI Worker] Starting model load...');

  const TF = await loadTransformers();
  if (!TF) {
    console.error('[AI Worker] All CDNs exhausted, falling back');
    self.postMessage({ type: 'status', status: 'error', error: 'Failed to load Transformers.js from any CDN' });
    return;
  }

  try {
    generator = await TF.pipeline('text-generation', 'onnx-community/SmolLM2-135M-Instruct-ONNX-MHA', {
      dtype: 'q4',
      device: 'webgpu',
    });
    console.log('[AI Worker] Model ready!');
    self.postMessage({ type: 'status', status: 'ready' });

    // Warmup — first inference is slow (compilation), run a tiny one now
    try {
      console.log('[AI Worker] Warmup inference...');
      const t0 = performance.now();
      await generator(
        [{ role: 'system', content: 'You are a helpful assistant.' }, { role: 'user', content: 'Hi' }],
        { max_new_tokens: 4, temperature: 0 }
      );
      console.log('[AI Worker] Warmup done in', Math.round(performance.now() - t0), 'ms');
    } catch (warmupErr) {
      console.warn('[AI Worker] Warmup failed (non-fatal):', warmupErr.message);
    }
  } catch (err) {
    console.error('[AI Worker] Model load failed:', err.message);
    self.postMessage({ type: 'status', status: 'error', error: 'Model load: ' + err.message });
  }
}

loadModel();

self.addEventListener('message', async (event) => {
  const { type, data } = event.data;

  if (type === 'query') {
    const { query, context, id } = data;
    console.log('[AI Worker] Got query id=' + id + ': ' + query.slice(0, 50));
    if (!generator) {
      self.postMessage({ type: 'result', answer: null });
      return;
    }
    try {
      let prompt = data.query;
      if (data.context) {
        prompt = `Context:\n${data.context}\n\nQuestion: ${data.query}\n\nAnswer concisely based on the context.`;
      }

      const t0 = performance.now();
      console.log('[AI Worker] Generating...');
      const output = await generator(
        [{ role: 'system', content: 'You are a helpful MHMA website assistant. Keep replies under 2 sentences.' }, { role: 'user', content: prompt }],
        { max_new_tokens: 64, temperature: 0 }
      );
      const elapsed = Math.round(performance.now() - t0);
      console.log('[AI Worker] Generated in', elapsed, 'ms');

      const text = output[0]?.generated_text || '';
      const parts = text.split(/assistant\n/);
      const answer = (parts.length > 1 ? parts.pop().trim() : text) || null;
      console.log('[AI Worker] Answer:', answer);
      self.postMessage({ type: 'result', answer });
    } catch (err) {
      self.postMessage({ type: 'result', answer: null });
    }
  }
});
