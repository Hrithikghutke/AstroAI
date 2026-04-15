/**
 * ModelExecutionStrategy — Adaptive concurrency, retry, and timeout management
 *
 * Combines three industrial-grade patterns into a single executor:
 * 1. Semaphore-based concurrency limiter (prevents provider overload)
 * 2. Exponential backoff with jitter (handles 429 rate limits gracefully)
 * 3. Per-request timeouts (prevents hanging calls and truncated output)
 *
 * Usage:
 *   const executor = new ModelExecutor("anthropic/claude-sonnet-4.6");
 *   const results = await executor.executeBatch([task1, task2, task3]);
 *   // or for a single call:
 *   const result = await executor.execute(singleTask);
 */

// ── Strategy Configuration ──

export interface ModelStrategy {
  maxConcurrency: number;   // Max simultaneous calls (semaphore slots)
  timeoutMs: number;        // Per-call deadline
  maxRetries: number;       // Retry attempts on failure
  initialBackoffMs: number; // First retry delay (doubles each attempt)
  staggerMs: number;        // Delay between launching parallel tasks
}

// Strategy map — tuned per model family based on observed behavior
const MODEL_STRATEGIES: Record<string, ModelStrategy> = {
  // Gemini Flash: very cheap, very fast, high rate limits
  "google/gemini-3-flash-preview": {
    maxConcurrency: 5,
    timeoutMs: 120_000,
    maxRetries: 2,
    initialBackoffMs: 1_000,
    staggerMs: 200,
  },
  // Gemini Pro: moderate cost, moderate speed
  "google/gemini-3.1-pro-preview": {
    maxConcurrency: 3,
    timeoutMs: 150_000,
    maxRetries: 2,
    initialBackoffMs: 2_000,
    staggerMs: 500,
  },
  // Claude Sonnet: higher cost, stricter rate limits
  "anthropic/claude-sonnet-4.6": {
    maxConcurrency: 2,
    timeoutMs: 150_000,
    maxRetries: 3,
    initialBackoffMs: 3_000,
    staggerMs: 800,
  },
  // Claude Haiku: cheap, fast, high rate limits (used for JSON agents)
  "anthropic/claude-haiku-4.5": {
    maxConcurrency: 5,
    timeoutMs: 30_000,
    maxRetries: 2,
    initialBackoffMs: 1_000,
    staggerMs: 100,
  },
  // DeepSeek: sequential only, slow but capable
  "deepseek/deepseek-chat-v3-0324:free": {
    maxConcurrency: 1,
    timeoutMs: 200_000,
    maxRetries: 2,
    initialBackoffMs: 3_000,
    staggerMs: 0,
  },
  "deepseek/deepseek-v3.2": {
    maxConcurrency: 1,
    timeoutMs: 200_000,
    maxRetries: 2,
    initialBackoffMs: 3_000,
    staggerMs: 0,
  },
};

// Default strategy for unknown models — conservative
const DEFAULT_STRATEGY: ModelStrategy = {
  maxConcurrency: 2,
  timeoutMs: 150_000,
  maxRetries: 2,
  initialBackoffMs: 2_000,
  staggerMs: 500,
};

function getStrategy(model: string): ModelStrategy {
  // Exact match first
  if (MODEL_STRATEGIES[model]) return MODEL_STRATEGIES[model];
  // Partial match by model family
  const key = Object.keys(MODEL_STRATEGIES).find((k) => model.includes(k.split("/")[1]?.split("-")[0] ?? ""));
  return key ? MODEL_STRATEGIES[key] : DEFAULT_STRATEGY;
}

// ── Semaphore ──
// Promise-based concurrency limiter. acquire() returns a release function.
// When all slots are occupied, acquire() blocks until one frees up.

class Semaphore {
  private current = 0;
  private queue: (() => void)[] = [];

  constructor(private readonly max: number) {}

  async acquire(): Promise<() => void> {
    if (this.current < this.max) {
      this.current++;
      return () => this.release();
    }
    // All slots occupied — wait in line
    return new Promise<() => void>((resolve) => {
      this.queue.push(() => {
        this.current++;
        resolve(() => this.release());
      });
    });
  }

  private release(): void {
    this.current--;
    if (this.queue.length > 0) {
      const next = this.queue.shift()!;
      next();
    }
  }
}

// ── Retry with Exponential Backoff + Jitter ──

function isRetryableError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    // Rate limited (429), server errors (5xx), timeouts, network errors
    if (msg.includes("429") || msg.includes("rate limit")) return true;
    if (msg.includes("500") || msg.includes("502") || msg.includes("503") || msg.includes("504")) return true;
    if (msg.includes("timeout") || msg.includes("timed out")) return true;
    if (msg.includes("terminated") || msg.includes("response too short")) return true;
    if (msg.includes("econnreset") || msg.includes("fetch failed") || msg.includes("network")) return true;
  }
  return false;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  initialBackoffMs: number,
  label: string = "task",
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;

      // Don't retry aborts or non-retryable errors
      if (err instanceof Error && err.name === "AbortError") throw err;
      if (!isRetryableError(err)) throw err;

      if (attempt < maxRetries) {
        // Exponential backoff: 1s → 2s → 4s → 8s...
        const baseDelay = initialBackoffMs * Math.pow(2, attempt);
        // Jitter: ±25% to prevent thundering herd
        const jitter = baseDelay * 0.25 * (Math.random() * 2 - 1);
        const waitMs = Math.round(baseDelay + jitter);
        console.warn(
          `[ModelExecutor] ${label} attempt ${attempt + 1}/${maxRetries + 1} failed: ${err instanceof Error ? err.message : String(err)} — retrying in ${waitMs}ms`,
        );
        await new Promise((res) => setTimeout(res, waitMs));
      }
    }
  }
  throw lastError;
}

// ── Timeout Wrapper ──

async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  label: string = "task",
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`[ModelExecutor] ${label} timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );
  });

  try {
    const result = await Promise.race([fn(), timeoutPromise]);
    clearTimeout(timer!);
    return result;
  } catch (err) {
    clearTimeout(timer!);
    throw err;
  }
}

// ── Delay helper ──

const delay = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

// ── ModelExecutor ──
// The main public API. Create one per model, then call execute() or executeBatch().

export class ModelExecutor {
  private strategy: ModelStrategy;
  private semaphore: Semaphore;
  public readonly modelId: string;

  constructor(model: string) {
    this.modelId = model;
    this.strategy = getStrategy(model);
    this.semaphore = new Semaphore(this.strategy.maxConcurrency);
    console.log(
      `[ModelExecutor] Initialized for ${model}: concurrency=${this.strategy.maxConcurrency} timeout=${this.strategy.timeoutMs}ms retries=${this.strategy.maxRetries} stagger=${this.strategy.staggerMs}ms`,
    );
  }

  /** Execute a single async task with timeout + retry + concurrency control */
  async execute<T>(task: () => Promise<T>, label: string = "task"): Promise<T> {
    const release = await this.semaphore.acquire();
    try {
      return await withRetry(
        () => withTimeout(task, this.strategy.timeoutMs, label),
        this.strategy.maxRetries,
        this.strategy.initialBackoffMs,
        label,
      );
    } finally {
      release();
    }
  }

  /**
   * Execute a batch of async tasks with concurrency control, stagger delays,
   * per-task timeouts, and automatic retries.
   *
   * Returns PromiseSettledResult[] so callers can handle partial failures
   * (same contract as Promise.allSettled).
   */
  async executeBatch<T>(
    tasks: (() => Promise<T>)[],
    labels?: string[],
  ): Promise<PromiseSettledResult<T>[]> {
    const promises = tasks.map((task, index) => {
      const label = labels?.[index] ?? `task-${index}`;

      return (async () => {
        // Stagger: delay launch by index * staggerMs
        if (index > 0 && this.strategy.staggerMs > 0) {
          await delay(index * this.strategy.staggerMs);
        }
        return this.execute(task, label);
      })();
    });

    return Promise.allSettled(promises);
  }

  /** Expose strategy for logging/debugging */
  getStrategy(): Readonly<ModelStrategy> {
    return { ...this.strategy };
  }
}
