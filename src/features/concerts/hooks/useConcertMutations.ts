import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { findOrCreateArtist, findOrCreateTour, findOrCreateVenue } from '../api/catalog'
import {
  createConcert,
  deleteConcert,
  setConcertLineup,
  updateConcert,
  type LineupEntry,
} from '../api/concerts'
import type { ArtistRef, ConcertFormValues, VenueRef } from '../schemas'
import type { TablesInsert } from '@/types/database'
import type { PressType, TicketType } from '@/types/domain'

async function resolveArtist(ref: ArtistRef): Promise<string> {
  if (ref.id) return ref.id
  const artist = await findOrCreateArtist(ref.name)
  return artist.id
}

async function resolveVenue(ref: VenueRef): Promise<string> {
  if (ref.id) return ref.id
  const venue = await findOrCreateVenue({
    name: ref.name,
    city: ref.city as string,
    country: ref.country as string,
    country_name: ref.country_name as string,
  })
  return venue.id
}

/** Authoritative current user id — matches the JWT sent to PostgREST (auth.uid()). */
async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const id = data.session?.user?.id
  if (!id) throw new Error('You are not signed in')
  return id
}

/** Resolves artists/venue refs, then returns the concert column payload + lineup. */
async function buildPayload(values: ConcertFormValues, userId: string) {
  const headlinerId = await resolveArtist(values.headliner as ArtistRef)

  const lineup: LineupEntry[] = [
    { artist_id: headlinerId, role: 'headliner', billing_order: 0 },
  ]
  let order = 1
  for (const s of values.supports) {
    lineup.push({
      artist_id: await resolveArtist(s.artist),
      role: s.role,
      billing_order: order++,
    })
  }

  const venueId = await resolveVenue(values.venue as VenueRef)
  const tourName = values.tour_name?.trim()
  const tourId = tourName ? (await findOrCreateTour(headlinerId, tourName)).id : null

  const payload: TablesInsert<'concerts'> = {
    user_id: userId,
    type: values.type,
    status: values.status,
    date: values.date,
    headliner_id: headlinerId,
    venue_id: venueId,
    festival_name: values.type === 'festival' ? values.festival_name || null : null,
    tour_name: tourName || null,
    tour_id: tourId,
    ticket_type: (values.ticket_type as TicketType) || null,
    ticket_price_paid: values.ticket_price_paid
      ? Number(values.ticket_price_paid)
      : null,
    ticket_currency: values.ticket_currency || null,
    personal_note: values.personal_note || null,
    accred_type: values.is_accredited ? (values.accred_type as PressType) || null : null,
    accred_client: values.is_accredited ? values.accred_client || null : null,
    accred_photo_pit: values.is_accredited ? !!values.accred_photo_pit : null,
    accred_first_3_songs: values.is_accredited ? !!values.accred_first_3_songs : null,
  }

  return { payload, lineup }
}

export function useCreateConcert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: ConcertFormValues) => {
      const { payload, lineup } = await buildPayload(values, await currentUserId())
      const concert = await createConcert(payload)
      try {
        await setConcertLineup(concert.id, lineup)
      } catch (err) {
        // Roll back the orphaned concert so a failed lineup doesn't leave junk.
        await deleteConcert(concert.id).catch(() => {})
        throw err
      }
      return concert
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['concerts'] })
    },
  })
}

export function useUpdateConcert(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: ConcertFormValues) => {
      const { payload, lineup } = await buildPayload(values, await currentUserId())
      await updateConcert(id, payload)
      await setConcertLineup(id, lineup)
      return { id }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['concerts'] })
      queryClient.invalidateQueries({ queryKey: ['concert', id] })
    },
  })
}

export function useDeleteConcert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteConcert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['concerts'] })
    },
  })
}
