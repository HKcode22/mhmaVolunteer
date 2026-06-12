import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0/+esm';

let generator = null;

async function loadModel() {
  try {
    generator = await pipeline('text-generation', 'onnx-community/SmolLM2-135M-Instruct', {
      dtype: 'q4',
      device: 'webgpu',
    });
    return true;
  } catch (err) {
    return false;
  }
}

const systemPrompt =
  "You are a helpful assistant for the MHMA (Mountain House Muslim Association) website. " +
  "Help users navigate the site and answer questions about features including events, programs, " +
  "donations, pledges, members, construction, and dashboard management. " +
  "Keep replies extremely concise (1-2 short sentences), polite, and helpful. " +
  "If asked something completely unrelated to the website, politely redirect. " +
  "For navigation questions, direct users to the correct page or menu item.";

loadModel().then((ok) => {
  self.postMessage({ type: 'status', status: ok ? 'ready' : 'error', error: ok ? '' : 'Failed to load model' });
});

self.addEventListener('message', async (event) => {
  const { type, data } = event.data;

  if (type === 'query') {
    if (!generator) {
      self.postMessage({ type: 'result', answer: null });
      return;
    }

    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: data.query },
      ];

      const output = await generator(messages, {
        max_new_tokens: 128,
        temperature: 0.2,
        do_sample: true,
      });

      const fullText = output[0]?.generated_text || '';
      const parts = fullText.split(/<\|im_start\|>assistant/);
      const answer = parts.length > 1 ? parts[parts.length - 1].replace(/<\|im_end\|>/g, '').trim() : fullText;

      self.postMessage({ type: 'result', answer: answer || null });
    } catch (err) {
      self.postMessage({ type: 'result', answer: null, error: err.message });
    }
  }
});
