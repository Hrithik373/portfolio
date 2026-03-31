import { quoteLeads } from '../../data/quoteLeads'
import { getNextQuoteLeadIndex } from '../../storage/rotationStore'

export const getQuoteLead = (sender: string, seed: string) => {
  const index = getNextQuoteLeadIndex(sender, seed, quoteLeads.length)
  return quoteLeads[index]
}
