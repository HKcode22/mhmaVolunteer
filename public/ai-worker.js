console.log('[AI Worker] Starting worker...');

// Try multiple CDN URLs for Transformers.js
const CDN_URLS = [
  'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0/dist/transformers.min.js',
  'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0/+esm',
  'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js',
  'https://unpkg.com/@huggingface/transformers@4.2.0/dist/transformers.min.js',
  'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js',
];

let TF = null;
let loadError = '';

async function tryLoad() {
  for (const url of CDN_URLS) {
    try {
      console.log('[AI Worker] Trying CDN:', url);
      const resp = await fetch(url);
      if (!resp.ok) { console.warn('[AI Worker] CDN returned', resp.status); continue; }
      let text = await resp.text();
      console.log('[AI Worker] Fetched', (text.length / 1024).toFixed(0), 'KB from', url);

      // Transform ESM export to global assignment for worker compatibility
      text = text.replace(/^export \{([^}]+)\};/m, 'self.Transformers = { $1 };');
      // Also handle default exports
      text = text.replace(/export default\s+(\w+)/g, 'self.TransformersDefault = $1;');

      (0, eval)(text);

      if (typeof self.Transformers !== 'undefined') {
        TF = self.Transformers;
        console.log('[AI Worker] Loaded via eval from', url);
        return true;
      }
      // Check for direct pipeline export
      if (typeof self.pipeline === 'function') {
        TF = { pipeline: self.pipeline };
        console.log('[AI Worker] Found pipeline global');
        return true;
      }
    } catch (e) {
      loadError = `${e.message} (${url})`;
      console.warn('[AI Worker] CDN failed:', loadError);
    }
  }
  return false;
}

let generator = null;

async function loadModel() {
  self.postMessage({ type: 'status', status: 'loading' });

  const loaded = await tryLoad();
  if (!loaded) {
    console.error('[AI Worker] Failed to load Transformers.js from all CDNs');
    self.postMessage({ type: 'status', status: 'error', error: 'Failed to load Transformers.js: ' + loadError });
    return;
  }

  try {
    console.log('[AI Worker] Creating text-generation pipeline...');
    const modelId = 'onnx-community/SmolLM2-135M-Instruct-ONNX-MHA';
    console.log('[AI Worker] Model:', modelId);

    const createPipeline = TF.pipeline || (TF.default && TF.default.pipeline);
    if (!createPipeline) {
      throw new Error('pipeline function not found in Transformers.js');
    }

    generator = await createPipeline('text-generation', modelId, {
      dtype: 'q4',
      device: 'webgpu',
    });
    console.log('[AI Worker] Pipeline ready');
    return true;
  } catch (err) {
    console.error('[AI Worker] Model load failed:', err.message);
    if (err.stack) console.error('[AI Worker] Stack:', err.stack);
    self.postMessage({ type: 'status', status: 'error', error: 'Model load: ' + err.message });
    return false;
  }
}

loadModel().then((ok) => {
  if (ok) self.postMessage({ type: 'status', status: 'ready' });
});

self.addEventListener('message', async (event) => {
  const { type, data } = event.data;

  if (type === 'query') {
    if (!generator) {
      self.postMessage({ type: 'result', answer: null });
      return;
    }

    try {
      let userPrompt = data.query;
      if (data.context) {
        userPrompt = `Context from the website:\n${data.context}\n\nUser question: ${data.query}\n\nAnswer concisely based on the context above.`;
      }

      const messages = [
        {
          role: 'system',
          content: 'You are a helpful MHMA website assistant. Keep replies under 2 sentences. Be concise and accurate.',
        },
        { role: 'user', content: userPrompt },
      ];

      const output = await generator(messages, {
        max_new_tokens: 128,
        temperature: 0.2,
        do_sample: true,
      });

      const fullText = output[0]?.generated_text || '';
      const parts = fullText.split(/assistant\n/);
      const answer = parts.length > 1 ? parts[parts.length - 1].trim() : fullText;
      self.postMessage({ type: 'result', answer: answer || null });
    } catch (err) {
      console.error('[AI Worker] Generation error:', err.message);
      self.postMessage({ type: 'result', answer: null, error: err.message });
    }
  }
});
