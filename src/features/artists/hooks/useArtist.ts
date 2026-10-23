import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/useAuthStore'
import { getArtist, getArtistShows, getConcertsWithSetlist } from '../api/artists'

export function useArtist(id: string | undefined) {
  return useQuery({
    queryKey: ['artist', id],
    queryFn: () => getArtist(id as string),
    enabled: !!id,
  })
}

export function useArtistShows(artistId: string | undefined) {
  const userId = useAuthStore((s) => s.user?.id)
  return useQuery({
    queryKey: ['artist-shows', userId, artistId],
    queryFn: () => getArtistShows(userId as string, artistId as string),
    enabled: !!userId && !!artistId,
  })
}

export function useArtistSetlists(concertIds: string[]) {
  return useQuery({
    queryKey: ['artist-setlists', concertIds],
    queryFn: () => getConcertsWithSetlist(concertIds),
    enabled: concertIds.length > 0,
  })
}
