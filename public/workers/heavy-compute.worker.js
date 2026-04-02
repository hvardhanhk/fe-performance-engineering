/**
 * heavy-compute.worker.js — Web Worker for off-main-thread computation.
 *
 * WHY WEB WORKERS ARE THE ULTIMATE INP FIX:
 *
 * INP (Interaction to Next Paint) measures the time from user input to
 * the next frame paint. The browser cannot paint while the main thread
 * is busy — ANY computation that runs during this window delays the paint.
 *
 * useDeferredValue and useTransition help by deprioritising React updates,
 * but they still run ON the main thread. If the computation itself is >16ms,
 * the frame will still be dropped.
 *
 * Web Workers run on a separate OS thread. Computation here CANNOT block
 * the main thread — the browser paints at 60fps regardless of what the
 * worker is doing.
 *
 * Tradeoffs:
 * - Cannot access DOM (but we don't need it for compute-heavy tasks)
 * - Communication via postMessage() is asynchronous (structured clone overhead)
 * - Bundle size: workers are separate files, not included in main bundle
 * - Browser support: 100% (IE10+)
 *
 * Use cases: data processing, sorting/filtering large datasets, crypto,
 * image manipulation, WASM execution.
 */

self.onmessage = function (event) {
  const { type, payload, id } = event.data;

  if (type === "FILTER_POSTS") {
    const { posts, query } = payload;
    const start = performance.now();

    // This is the same expensive filter from /bad — but now it runs off-thread
    // The main thread stays free to handle user input and paint frames
    const lower = query.toLowerCase();
    const result = posts.filter(
      (post) =>
        post.title.toLowerCase().includes(lower) ||
        post.body.toLowerCase().includes(lower)
    );

    // Simulate heavier work (e.g. fuzzy matching, ranking)
    for (let i = 0; i < result.length; i++) {
      result[i] = {
        ...result[i],
        score: result[i].title.toLowerCase().indexOf(lower),
      };
    }
    result.sort((a, b) => a.score - b.score);

    const duration = Math.round(performance.now() - start);

    self.postMessage({ id, type: "FILTER_RESULT", payload: result, duration });
  }
};
