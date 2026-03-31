export const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs = 6000,
) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}
