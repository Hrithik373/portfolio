/**
 * Deezer public playlist pipeline — no API key required.
 * Fetches public playlist data via Deezer's open API.
 * Returns the same shape as before so the frontend needs no changes.
 */

export interface SpotifyTrackItem {
  id: string
  name: string
  artist: string
  albumArt: string | null
  previewUrl: string | null
  spotifyUrl: string
  durationMs: number
}

export interface SpotifyPlaylistData {
  id: string
  name: string
  description: string
  image: string | null
  externalUrl: string
  tracks: SpotifyTrackItem[]
}

export async function getPlaylistData(playlistId: string): Promise<SpotifyPlaylistData> {
  const url = `https://api.deezer.com/playlist/${encodeURIComponent(playlistId)}`

  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      'Origin': 'https://www.deezer.com',
      'Referer': 'https://www.deezer.com/',
    },
  })

  if (!res.ok) {
    throw new Error(`Deezer playlist fetch failed (${res.status}) for playlist ${playlistId}`)
  }

  const text = await res.text()

  // Deezer sometimes returns HTML when blocking server IPs
  if (text.trimStart().startsWith('<')) {
    throw new Error('Deezer returned HTML instead of JSON — likely blocked by bot detection')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = JSON.parse(text) as any

  if (data.error) {
    throw new Error(`Deezer API error: ${JSON.stringify(data.error)}`)
  }

  return {
    id: String(data.id),
    name: data.title as string,
    description: (data.description as string) || '',
    image: (data.picture_big as string) ?? (data.picture as string) ?? null,
    externalUrl: (data.link as string) ?? `https://www.deezer.com/playlist/${playlistId}`,
    tracks: ((data.tracks?.data ?? []) as unknown[])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((t: any) => t?.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((t: any): SpotifyTrackItem => ({
        id: String(t.id),
        name: t.title as string,
        artist: (t.artist?.name as string) || 'Unknown',
        albumArt: (t.album?.cover_big as string) ?? (t.album?.cover as string) ?? null,
        previewUrl: (t.preview as string) || null,
        spotifyUrl: (t.link as string) ?? `https://www.deezer.com/track/${t.id}`,
        durationMs: ((t.duration as number) ?? 0) * 1000,
      })),
  }
}
