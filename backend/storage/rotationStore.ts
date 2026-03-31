const lastQuoteLeadByEmail = new Map<string, number>()
let lastGlobalQuoteLeadIndex: number | null = null

const hashString = (input: string): number => {
  return [...input].reduce(
    (acc, char) => (acc * 31 + char.charCodeAt(0)) % 1000000007,
    7
  )
}

export const getNextQuoteLeadIndex = (
  sender: string,
  seed: string,
  total: number
): number => {
  if (total <= 0) return 0

  const hash = hashString(sender + seed)
  let index = hash % total

  const previous = lastQuoteLeadByEmail.get(sender)

  if (previous !== undefined && index === previous) {
    index = (index + 1) % total
  }

  if (lastGlobalQuoteLeadIndex !== null && index === lastGlobalQuoteLeadIndex) {
    index = (index + 1) % total
  }

  lastQuoteLeadByEmail.set(sender, index)
  lastGlobalQuoteLeadIndex = index

  return index
}
