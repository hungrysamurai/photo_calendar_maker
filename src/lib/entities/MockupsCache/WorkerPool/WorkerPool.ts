/**
 * Describes a task to be executed by a Web Worker.
 * @template TIn - The type of data to be passed to the worker.
 * @template _TOut - The type of result expected from the worker (used for typing purposes).
 */
export type WorkerTask<TIn, _TOut> = {
  /** The input data to be processed by the worker. */
  data: TIn;
  /** Optional array of transferable objects (e.g., ArrayBuffer, MessagePort). */
  transfer?: Transferable[];
};

type WorkUnit<TIn, TOut> = [
  task: WorkerTask<TIn, TOut>,
  resolve: (value: TOut) => void,
  reject: (reason?: any) => void
];

/**
 * A generic worker pool for distributing asynchronous tasks across multiple Web Workers.
 *
 * @template TIn - The type of data input to each worker.
 * @template TOut - The type of data output from each worker.
 *
 */
export default class WorkerPool<TIn, TOut> {
  /** The pool of currently idle workers. */
  private idleWorkers: Worker[] = [];

  /** The queue of tasks waiting to be processed. */
  private workQueue: WorkUnit<TIn, TOut>[] = [];

  /** Maps active workers to their respective promise resolvers/rejectors. */
  private workerMap: Map<
    Worker,
    [resolve: (value: TOut) => void, reject: (err?: any) => void]
  > = new Map();

  /** The source URL of the worker script. */
  private readonly workerSrc: string;

  /** Number of worker threads to spawn (defaults to one less than CPU cores). */
  private readonly NUM_WORKERS = Math.max(navigator.hardwareConcurrency - 1, 1);

  /**
   * Creates a new instance of the WorkerPool.
   *
   * @param workerUrl - URL of the JavaScript module for the worker.
   */
  constructor(workerUrl: string) {
    this.workerSrc = workerUrl;

    for (let i = 0; i < this.NUM_WORKERS; i++) {
      let worker = new Worker(workerUrl, { type: "module" });

      worker.onmessage = (message) => {
        this._handleWorkerDone(worker, null, message.data);
      };

      worker.onerror = (error) => {
        this._handleWorkerDone(worker, error, null);
      };

      this.idleWorkers.push(worker);
    }
  }

  /**
   * Submits a new task to the worker pool.
   *
   * @param task - The task to be processed by a worker.
   * @returns A promise that resolves with the result from the worker.
   */
  public addWork(task: WorkerTask<TIn, TOut>): Promise<TOut> {
    return new Promise((resolve, reject) => {
      if (this.idleWorkers.length > 0) {
        const worker = this.idleWorkers.pop()!;
        this.workerMap.set(worker, [resolve, reject]);

        try {
          worker.postMessage(task.data, task.transfer ?? []);
        } catch (err) {
          reject(err);
        }
      } else {
        this.workQueue.push([task, resolve, reject]);
      }
    });
  }

  /**
   * Handles the completion of a worker's task, processing the next task if any.
   *
   * @param worker - The worker that completed the task.
   * @param error - Optional error event, if an error occurred.
   * @param result - The result returned by the worker.
   */
  private _handleWorkerDone(
    worker: Worker,
    error: ErrorEvent | null,
    result: TOut | null
  ) {
    const callbacks = this.workerMap.get(worker);

    if (!callbacks) return;

    const [resolve, reject] = callbacks;
    this.workerMap.delete(worker);

    const nextTask = this.workQueue.shift();

    if (nextTask) {
      const [task, nextResolve, nextReject] = nextTask;
      this.workerMap.set(worker, [nextResolve, nextReject]);

      try {
        worker.postMessage(task.data, task.transfer ?? []);
      } catch (err) {
        nextReject(err);
      }
    } else {
      this.idleWorkers.push(worker);
    }

    error ? reject(error) : resolve(result as TOut);
  }

  /**
   * Terminates all workers.
   * Use this when the pool is no longer needed to free resources.
   */
  public dispose() {
    for (const worker of [...this.idleWorkers, ...this.workerMap.keys()]) {
      worker.terminate();
    }
    this.idleWorkers = [];
    this.workerMap.clear();
    this.workQueue = [];
  }
}
