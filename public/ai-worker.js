let generator = null;

async function loadTransformers() {
  const urls = [
    'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0',
    'https://unpkg.com/@huggingface/transformers@4.2.0?module',
    'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1',
  ];
  for (const url of urls) {
    try {
      const mod = await import(url);
      if (mod?.pipeline) return mod;
    } catch (e) {
      continue;
    }
  }
  return null;
}

async function loadModel() {
  self.postMessage({ type: 'status', status: 'loading' });

  const TF = await loadTransformers();
  if (!TF) {
    self.postMessage({ type: 'status', status: 'error', error: 'Failed to load Transformers.js from any CDN' });
    return;
  }

  try {
    generator = await TF.pipeline('text-generation', 'onnx-community/SmolLM2-135M-Instruct-ONNX-MHA', {
      dtype: 'q4',
      device: 'webgpu',
    });
    self.postMessage({ type: 'status', status: 'ready' });
  } catch (err) {
    self.postMessage({ type: 'status', status: 'error', error: 'Model load: ' + err.message });
  }
}

loadModel();

self.addEventListener('message', async (event) => {
  const { type, data } = event.data;

  if (type === 'query') {
    if (!generator) {
      self.postMessage({ type: 'result', answer: null });
      return;
    }
    try {
      let prompt = data.query;
      if (data.context) {
        prompt = `Context:\n${data.context}\n\nQuestion: ${data.query}\n\nAnswer concisely based on the context.`;
      }

      const output = await generator(
        [{ role: 'system', content: 'You are a helpful MHMA website assistant. Keep replies under 2 sentences.' }, { role: 'user', content: prompt }],
        { max_new_tokens: 128, temperature: 0.2, do_sample: true }
      );

      const text = output[0]?.generated_text || '';
      const parts = text.split(/assistant\n/);
      self.postMessage({ type: 'result', answer: (parts.length > 1 ? parts.pop().trim() : text) || null });
    } catch (err) {
      self.postMessage({ type: 'result', answer: null });
    }
  }
});
