import CachingWorker from "./cachingWorker?worker&url";

export default class WorkerPool {
  workerSrc: string;
  idleWorkers: Worker[];
  workQueue: CacheWorkerWorkQueue;
  workerMap: CacheWorkerMap;
  currentState: "idle" | "work" = "idle";

  NUM_VORKERS = navigator.hardwareConcurrency - 1 || 1;

  constructor() {
    this.idleWorkers = [];
    this.workQueue = [];
    this.workerMap = new Map();

    for (let i = 0; i < this.NUM_VORKERS; i++) {
      let worker = new Worker(CachingWorker, { type: "module" });

      worker.onmessage = (message) => {
        this._workerDone(worker, null, message.data);
      };

      worker.onerror = (error) => {
        this._workerDone(worker, error, null);
      };

      this.idleWorkers[i] = worker;
    }
  }

  _workerDone(worker: Worker, error: ErrorEvent | null, response: Blob | null) {
    let workerInMap = this.workerMap.get(worker);

    if (workerInMap) {
      let [resolver, rejector] = workerInMap;

      this.workerMap.delete(worker);

      if (this.workQueue.length === 0) {
        this.idleWorkers.push(worker);
      } else {
        let [work, resolver, rejector] =
          this.workQueue.shift() as CacheWorkerWorkQueueUnit;
        this.workerMap.set(worker, [resolver, rejector]);
        worker.postMessage(work);
      }

      error === null ? resolver(response as Blob) : rejector(error);

      if (this.idleWorkers.length === this.NUM_VORKERS) {
        this.currentState = "idle";
      }
    }
  }

  addWork(work: CacheWorkerWork): Promise<Blob> {
    if (this.currentState === "idle") {
      this.currentState = "work";
    }

    const { bmp } = work;

    return new Promise((resolve, reject) => {
      if (this.idleWorkers.length > 0) {
        let worker = this.idleWorkers.pop() as Worker;
        this.workerMap.set(worker, [resolve, reject]);

        worker.postMessage({ bmp }, [bmp]);
      } else {
        this.workQueue.push([work, resolve, reject]);
      }
    });
  }
}
