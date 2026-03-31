export type PetalVariant = {
  name: string
  color: string
}

const petalVariants: PetalVariant[] = [
  { name: 'Sakura Mist', color: '#f8c8dc' },
  { name: 'Dawn Petal', color: '#f6b2c4' },
  { name: 'Blush Breeze', color: '#f2a9c7' },
  { name: 'Soft Rose', color: '#f3bdd7' },
  { name: 'Moonlit Bloom', color: '#f1c7dd' },
]

const japaneseQuotes = [
  '花は桜木、人は武士。',
  '七転び八起き。',
  '雨降って地固まる。',
  '一期一会。',
  '明日は明日の風が吹く。',
]

const pickRandom = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)]

const createInstanceId = () => {
  const now = new Date()
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}`
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `CBP-${date}-${rand}`
}

export const createPetalInstance = () => ({
  instanceId: createInstanceId(),
  petalVariant: pickRandom(petalVariants),
  quote: pickRandom(japaneseQuotes),
})
