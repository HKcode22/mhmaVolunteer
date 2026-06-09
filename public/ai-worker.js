importScripts('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js');

let extractor = null;
let knowledgeEmbeddings = [];
let knowledgeItems = [];

self.addEventListener('message', async (event) => {
  const { type, data } = event.data;

  if (type === 'init') {
    knowledgeItems = data.knowledgeBase;
    postMessage({ type: 'init-status', status: 'loading' });

    try {
      extractor = await self.Transformers.pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        quantized: true,
      });

      knowledgeEmbeddings = [];
      for (const item of knowledgeItems) {
        const text = item.keywords.join(' ') + ' ' + item.q;
        const output = await extractor(text, { pooling: 'mean', normalize: true });
        knowledgeEmbeddings.push(Array.from(output.data));
      }

      postMessage({ type: 'init-status', status: 'ready', count: knowledgeItems.length });
    } catch (error) {
      postMessage({ type: 'init-status', status: 'error', error: error.message });
    }
  } else if (type === 'query') {
    try {
      const { query, role, currentPage } = data;
      const output = await extractor(query, { pooling: 'mean', normalize: true });
      const queryEmbedding = Array.from(output.data);

      let bestIndex = -1;
      let bestScore = 0;

      for (let i = 0; i < knowledgeEmbeddings.length; i++) {
        let score = cosineSimilarity(queryEmbedding, knowledgeEmbeddings[i]);

        const item = knowledgeItems[i];
        if (role && item.roles && item.roles.includes(role)) {
          score += 0.15;
        }
        if (currentPage && item.pages && item.pages.includes(currentPage)) {
          score += 0.1;
        }

        if (score > bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }

      postMessage({
        type: 'result',
        query,
        bestMatch: bestIndex >= 0 && bestScore > 0.3
          ? { index: bestIndex, score: bestScore, item: knowledgeItems[bestIndex] }
          : null,
      });
    } catch (error) {
      postMessage({ type: 'error', error: error.message });
    }
  }
});

function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return magA > 0 && magB > 0 ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}
