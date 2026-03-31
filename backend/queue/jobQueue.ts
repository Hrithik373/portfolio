type AsyncJob = () => Promise<void>

const queue: AsyncJob[] = []
let draining = false

const drain = async () => {
  if (draining) return
  draining = true
  while (queue.length > 0) {
    const job = queue.shift()
    if (!job) break
    try {
      await job()
    } catch (err) {
      console.error('[jobQueue]', err)
    }
  }
  draining = false
}

/** FIFO async queue for inbound email processing (swap for Redis/Bull later). */
export const enqueue = (job: AsyncJob) => {
  queue.push(job)
  void drain()
}
