import redisClient from './redisClient.js';

const queue = 'queue:';
const counter = (name) => queue + name + '_counter';
const jobHashKey = (name) => queue + name + '_job_';
const jobQKey = (name) => queue + name + '_data';
const lockedKey = (name, jobId) => queue + name + `_lock_${jobId}`;

let nextRetryJob;

const WorkerPool = {
  default: {
    maxRetryCount: 1,
    maxWaitForLockedJobsBeforeRetry: 5, // in mimutes
    exec: (jobId, payload) => {
      console.log(jobId, payload);
    },
    onError: (jobId, error) => {
      console.error({jobId, error})
    }
  }
};

async function _AddJob(name, data, retry = 0) {
  if(typeof data === 'object') throw 'Queue: Data payload cant be Object';
  const jobId = await redisClient.incr(counter(name));
  await redisClient.hmset(jobHashKey(name) + jobId, { jobId, data, retry });
  await redisClient.lpush(jobQKey(name), jobId);
  executeBatch(name).catch(console.error);
  return jobId;
}

async function checForLeftOverAndClean(name) {
  const lockedKeysTopic = queue + name + '_lock_';
  const leftOverJobKeys = await redisClient.keys(process.env.TOPIC_PREFIX + lockedKeysTopic + '*');
  if (!leftOverJobKeys.length) {
    await redisClient.flushall();
    return;
  }
  const now = Date.now();
  let nextPossible;
  for (const key of leftOverJobKeys) {
    // const jobId = key.split('_lock_')[1];
    const lastRun = await redisClient.get(key);
    const nexRun = new Date(lastRun).getTime() + WorkerPool[name].maxWaitForLockedJobsBeforeRetry * 60000 - now;
    if (nexRun > 0) {
      nextPossible = Math.min(nextPossible, nexRun);
      continue;
    }
    const jobId = key.split('_lock_')[1];
    const job = await redisClient.hgetall(jobHashKey(name) + jobId);
    if (!job) {
      console.error(`Queue: No Job found for jobId ${jobId}`);
      continue;
    }
    await redisClient.del(lockedKey(name, jobId));
    await handler(name, jobId, job.data, job.retry);
  }
  if(nextPossible !== 0){
    nextRetryJob = setTimeout(() => checForLeftOverAndClean(name), nextPossible);
  }
}

async function executeBatch(name) {
  const jobId = await redisClient.rpop(jobQKey(name));
  if (!jobId) {
    await checForLeftOverAndClean(name);
    return;
  }
  if (!!nextRetryJob) {
    clearTimeout(nextRetryJob);
    nextRetryJob = null;
  }
  const job = await redisClient.hgetall(jobHashKey(name) + jobId);
  if (!job) {
    console.error(`Queue: No Job found for jobId ${jobId}`);
    await redisClient.del(lockedKey(name, jobId));
    executeBatch(name);
    return;
  }
  await handler(name, jobId, job.data, job.retry);
  executeBatch(name);
  return;
}

export function AddJob(name, data) {
  return _AddJob(name, data);
}

async function handler(name, jobId, data, retry) {
  const now = new Date();
  try {
    //NOTE: below code is responsible to block the code to re-execute if ran in cluster mode multiple time (!important) and value is current timeStamp to retrigger the locked and unfinished one
    const isLocked = await redisClient.set(lockedKey(name, jobId), now.toISOString(), 'NX');
    if (isLocked !== 'OK') {
      console.log('Queue: Race condition met');
      return;
    }

    if (!WorkerPool[name]) throw `No worker found for name: ${name} in Pool`;
    await WorkerPool[name].exec(jobId, data);
    await cleanJobId(name, jobId);
  } catch (error) {
    ++retry;
    await redisClient.hmset(jobHashKey(name) + jobId, { retry });
    if (retry > WorkerPool[name].maxRetryCount) {
      await WorkerPool[name].onError(jobId, error)
      await cleanJobId(name, jobId);
    }
  }
}

/**
/**
 * Registers a worker with the given name, execution function, and maximum retry count.
 *
 * @param {string} name - The name of the worker.
 * @param {Object} WorkerHandler - Configuaration to the handler with some default value
 * @param {number} [WorkerHandler.maxRetryCount=0] - The maximum number of retries for a job. Defaults to 0.
 * @param {number} [WorkerHandler.maxWaitForLockedJobsBeforeRetry=5] - The maximum number of minutes need to wait before retry (in minutes). Defaults to 5
 * @param {(jobId: string, payload: string) => void} WorkerHandler.exec - The function to execute jobs, receiving a job ID and a payload.
 * @param {(jobId: string, error: Error) => void} WorkerHandler.onError - The function to execute jobs, during error.
 */
// exec, maxWaitForLockedJobsBeforeRetry = 5, maxRetryCount = 0
export async function AddWorker(name, WorkerHandler) {
  WorkerPool[name] = {...WorkerPool.default, ...WorkerHandler};
  executeBatch(name);
}

// Can't able to Remove scheduled Job because this slow down our logic to process it.


async function cleanJobId(name, jobId){
  await redisClient.del(lockedKey(name, jobId));
  await redisClient.del(jobHashKey(name) + jobId);
}