// Types for tools/lib/prism.mjs, so TypeScript callers (tools/client-smoke.ts) are type-checked.
export interface PrismHandle {
  /** Resolves when Prism is listening; rejects if it fails to start within 60 s or exits early. */
  ready: Promise<void>;
  /** Stops Prism if it is still running. Safe to call more than once. */
  stop(): void;
}

export function startPrism(options: { contractPath: string; port: number }): PrismHandle;
