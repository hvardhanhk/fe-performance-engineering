"use client";

/**
 * useWebWorker — generic hook for off-main-thread computation.
 *
 * Wraps the Web Worker postMessage/onmessage pattern in a React hook
 * so components can call async functions that run on a worker thread.
 *
 * DESIGN DECISIONS:
 *
 * 1. Worker is created once per component mount and terminated on unmount.
 *    Creating workers is expensive (~1ms) — reuse them for repeated calls.
 *
 * 2. Each message gets a unique ID. The worker echoes it back so we can
 *    resolve the correct Promise even if messages arrive out of order.
 *
 * 3. Pending callbacks are stored in a Map keyed by message ID.
 *    This handles concurrent calls correctly without race conditions.
 *
 * 4. The worker URL is loaded from /public — no bundler config needed.
 *    In a production setup you'd use a bundler plugin (e.g. worker-loader)
 *    to inline the worker and get content-hashing.
 */

import { useRef, useEffect, useCallback } from "react";

type WorkerMessage = {
  id: string;
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  duration?: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PendingCallback = (result: any) => void;

export function useWebWorker(workerPath: string) {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, PendingCallback>>(new Map());
  let idCounter = 0;

  useEffect(() => {
    workerRef.current = new Worker(workerPath);

    workerRef.current.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const { id, payload } = event.data;
      const resolve = pendingRef.current.get(id);
      if (resolve) {
        resolve(payload);
        pendingRef.current.delete(id);
      }
    };

    workerRef.current.onerror = (err) => {
      console.error("[useWebWorker] Worker error:", err);
    };

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      pendingRef.current.clear();
    };
  }, [workerPath]);

  const postMessage = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <T>(type: string, payload: any): Promise<T> => {
      return new Promise((resolve) => {
        const id = `${type}-${++idCounter}`;
        pendingRef.current.set(id, resolve as PendingCallback);
        workerRef.current?.postMessage({ id, type, payload });
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return { postMessage };
}
