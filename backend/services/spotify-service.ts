/**
 * Spotify Client Credentials pipeline
 * Fetches public playlist data — no user login required.
 * Token is cached in-memory (valid 1 hour).
 */

interface SpotifyToken {
  access_token: string
  expires_at: number
}

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

let tokenCache: SpotifyToken | null = null

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expires_at) {
    return tokenCache.access_token
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set')
  }

  const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Spotify token request failed (${res.status}): ${text}`)
  }

  const data = (await res.json()) as { access_token: string; expires_in: number }
  // Expire 60 s early to avoid edge-case stale tokens
  tokenCache = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000,
  }

  return tokenCache.access_token
}

export async function getPlaylistData(playlistId: string): Promise<SpotifyPlaylistData> {
  const token = await getAccessToken()

  // Request only the fields we need to keep the response small
  const fields = [
    'id', 'name', 'description', 'images', 'external_urls',
    'tracks.items(track(id,name,artists(name),album(images),preview_url,external_urls,duration_ms))',
  ].join(',')

  const url =
    `https://api.spotify.com/v1/playlists/${encodeURIComponent(playlistId)}` +
    `?fields=${encodeURIComponent(fields)}&market=IN`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    throw new Error(`Spotify playlist fetch failed (${res.status}) for playlist ${playlistId}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await res.json()) as any

  return {
    id: data.id as string,
    name: data.name as string,
    description: (data.description as string) || '',
    image: (data.images?.[0]?.url as string) ?? null,
    externalUrl:
      (data.external_urls?.spotify as string) ??
      `https://open.spotify.com/playlist/${playlistId}`,
    tracks: ((data.tracks?.items ?? []) as unknown[])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((item: any) => item?.track?.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any): SpotifyTrackItem => {
        const t = item.track
        return {
          id: t.id as string,
          name: t.name as string,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          artist: ((t.artists ?? []) as any[]).map((a: any) => a.name as string).join(', ') || 'Unknown',
          albumArt: (t.album?.images?.[0]?.url as string) ?? null,
          previewUrl: (t.preview_url as string | null) ?? null,
          spotifyUrl: (t.external_urls?.spotify as string) ?? '',
          durationMs: (t.duration_ms as number) ?? 0,
        }
      }),
  }
}
