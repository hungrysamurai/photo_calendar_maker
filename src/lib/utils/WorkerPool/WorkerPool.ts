export default class WorkerPool {
  workerSrc: string;
  idleWorkers: Worker[];
  workQueue: CacheWorkerWorkQueue;
  workerMap: CacheWorkerMap;

  constructor(numWorkers: number, workerSrc: URL) {
    this.idleWorkers = [];
    this.workQueue = [];
    this.workerMap = new Map();

    for (let i = 0; i < numWorkers; i++) {
      let worker = new Worker(workerSrc, { type: "module" });

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
    }
  }

  addWork(work: CacheWorkerWork): Promise<Blob> {
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
