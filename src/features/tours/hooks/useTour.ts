import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/useAuthStore'
import { getTour, getTourShows, setTourTotalShows } from '../api/tours'

export function useTour(id: string | undefined) {
  return useQuery({
    queryKey: ['tour', id],
    queryFn: () => getTour(id as string),
    enabled: !!id,
  })
}

export function useTourShows(tourId: string | undefined) {
  const userId = useAuthStore((s) => s.user?.id)
  return useQuery({
    queryKey: ['tour-shows', userId, tourId],
    queryFn: () => getTourShows(userId as string, tourId as string),
    enabled: !!userId && !!tourId,
  })
}

export function useSetTourTotal(tourId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (total: number) => setTourTotalShows(tourId, total),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour', tourId] })
    },
  })
}
