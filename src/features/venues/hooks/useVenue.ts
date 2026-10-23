import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/useAuthStore'
import { getVenue, getVenueShows } from '../api/venues'

export function useVenue(id: string | undefined) {
  return useQuery({
    queryKey: ['venue', id],
    queryFn: () => getVenue(id as string),
    enabled: !!id,
  })
}

export function useVenueShows(venueId: string | undefined) {
  const userId = useAuthStore((s) => s.user?.id)
  return useQuery({
    queryKey: ['venue-shows', userId, venueId],
    queryFn: () => getVenueShows(userId as string, venueId as string),
    enabled: !!userId && !!venueId,
  })
}
