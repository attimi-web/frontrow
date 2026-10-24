export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          criteria: Json
          description: string
          id: string
          name: string
          rarity: Database["public"]["Enums"]["achievement_rarity"]
          slug: string
          sort_order: number
        }
        Insert: {
          criteria?: Json
          description: string
          id?: string
          name: string
          rarity?: Database["public"]["Enums"]["achievement_rarity"]
          slug: string
          sort_order?: number
        }
        Update: {
          criteria?: Json
          description?: string
          id?: string
          name?: string
          rarity?: Database["public"]["Enums"]["achievement_rarity"]
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      artists: {
        Row: {
          bio: string | null
          created_at: string
          formed_year: number | null
          genres: string[]
          id: string
          image_url: string | null
          name: string
          origin_city: string | null
          origin_country: string | null
          spotify_id: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          formed_year?: number | null
          genres?: string[]
          id?: string
          image_url?: string | null
          name: string
          origin_city?: string | null
          origin_country?: string | null
          spotify_id?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          formed_year?: number | null
          genres?: string[]
          id?: string
          image_url?: string | null
          name?: string
          origin_city?: string | null
          origin_country?: string | null
          spotify_id?: string | null
        }
        Relationships: []
      }
      concert_artists: {
        Row: {
          artist_id: string
          billing_order: number
          concert_id: string
          role: Database["public"]["Enums"]["artist_role"]
        }
        Insert: {
          artist_id: string
          billing_order?: number
          concert_id: string
          role?: Database["public"]["Enums"]["artist_role"]
        }
        Update: {
          artist_id?: string
          billing_order?: number
          concert_id?: string
          role?: Database["public"]["Enums"]["artist_role"]
        }
        Relationships: [
          {
            foreignKeyName: "concert_artists_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concert_artists_concert_id_fkey"
            columns: ["concert_id"]
            isOneToOne: false
            referencedRelation: "concerts"
            referencedColumns: ["id"]
          },
        ]
      }
      concert_buddies: {
        Row: {
          concert_id: string
          created_at: string
          id: string
          linked_concert_id: string | null
          owner_id: string
          status: Database["public"]["Enums"]["buddy_status"]
          tagged_user_id: string
        }
        Insert: {
          concert_id: string
          created_at?: string
          id?: string
          linked_concert_id?: string | null
          owner_id: string
          status?: Database["public"]["Enums"]["buddy_status"]
          tagged_user_id: string
        }
        Update: {
          concert_id?: string
          created_at?: string
          id?: string
          linked_concert_id?: string | null
          owner_id?: string
          status?: Database["public"]["Enums"]["buddy_status"]
          tagged_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "concert_buddies_concert_id_fkey"
            columns: ["concert_id"]
            isOneToOne: false
            referencedRelation: "concerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concert_buddies_linked_concert_id_fkey"
            columns: ["linked_concert_id"]
            isOneToOne: false
            referencedRelation: "concerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concert_buddies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concert_buddies_tagged_user_id_fkey"
            columns: ["tagged_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      concerts: {
        Row: {
          accred_client: string | null
          accred_first_3_songs: boolean | null
          accred_photo_pit: boolean | null
          accred_publication_url: string | null
          accred_type: Database["public"]["Enums"]["press_type"] | null
          created_at: string
          date: string
          festival_name: string | null
          headliner_id: string | null
          id: string
          personal_note: string | null
          photos: string[]
          setlist_fm_id: string | null
          status: Database["public"]["Enums"]["concert_status"]
          ticket_currency: string | null
          ticket_price: number | null
          ticket_price_paid: number | null
          ticket_scan_url: string | null
          ticket_type: Database["public"]["Enums"]["ticket_type"] | null
          tour_id: string | null
          tour_name: string | null
          type: Database["public"]["Enums"]["concert_type"]
          updated_at: string
          user_id: string
          venue_id: string | null
        }
        Insert: {
          accred_client?: string | null
          accred_first_3_songs?: boolean | null
          accred_photo_pit?: boolean | null
          accred_publication_url?: string | null
          accred_type?: Database["public"]["Enums"]["press_type"] | null
          created_at?: string
          date: string
          festival_name?: string | null
          headliner_id?: string | null
          id?: string
          personal_note?: string | null
          photos?: string[]
          setlist_fm_id?: string | null
          status?: Database["public"]["Enums"]["concert_status"]
          ticket_currency?: string | null
          ticket_price?: number | null
          ticket_price_paid?: number | null
          ticket_scan_url?: string | null
          ticket_type?: Database["public"]["Enums"]["ticket_type"] | null
          tour_id?: string | null
          tour_name?: string | null
          type?: Database["public"]["Enums"]["concert_type"]
          updated_at?: string
          user_id: string
          venue_id?: string | null
        }
        Update: {
          accred_client?: string | null
          accred_first_3_songs?: boolean | null
          accred_photo_pit?: boolean | null
          accred_publication_url?: string | null
          accred_type?: Database["public"]["Enums"]["press_type"] | null
          created_at?: string
          date?: string
          festival_name?: string | null
          headliner_id?: string | null
          id?: string
          personal_note?: string | null
          photos?: string[]
          setlist_fm_id?: string | null
          status?: Database["public"]["Enums"]["concert_status"]
          ticket_currency?: string | null
          ticket_price?: number | null
          ticket_price_paid?: number | null
          ticket_scan_url?: string | null
          ticket_type?: Database["public"]["Enums"]["ticket_type"] | null
          tour_id?: string | null
          tour_name?: string | null
          type?: Database["public"]["Enums"]["concert_type"]
          updated_at?: string
          user_id?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "concerts_headliner_id_fkey"
            columns: ["headliner_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concerts_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concerts_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      festival_days: {
        Row: {
          concert_id: string
          date: string
          day_order: number
          id: string
        }
        Insert: {
          concert_id: string
          date: string
          day_order?: number
          id?: string
        }
        Update: {
          concert_id?: string
          date?: string
          day_order?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "festival_days_concert_id_fkey"
            columns: ["concert_id"]
            isOneToOne: false
            referencedRelation: "concerts"
            referencedColumns: ["id"]
          },
        ]
      }
      festival_stages: {
        Row: {
          concert_id: string
          day_id: string
          id: string
          stage_name: string
          stage_order: number
        }
        Insert: {
          concert_id: string
          day_id: string
          id?: string
          stage_name: string
          stage_order?: number
        }
        Update: {
          concert_id?: string
          day_id?: string
          id?: string
          stage_name?: string
          stage_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "festival_stages_concert_id_fkey"
            columns: ["concert_id"]
            isOneToOne: false
            referencedRelation: "concerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "festival_stages_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "festival_days"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: Database["public"]["Enums"]["friendship_status"]
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: Database["public"]["Enums"]["friendship_status"]
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["friendship_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json
          id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      performances: {
        Row: {
          artist_id: string
          attended: boolean
          concert_id: string
          end_time: string | null
          id: string
          perf_order: number
          role: Database["public"]["Enums"]["artist_role"]
          stage_id: string
          start_time: string | null
        }
        Insert: {
          artist_id: string
          attended?: boolean
          concert_id: string
          end_time?: string | null
          id?: string
          perf_order?: number
          role?: Database["public"]["Enums"]["artist_role"]
          stage_id: string
          start_time?: string | null
        }
        Update: {
          artist_id?: string
          attended?: boolean
          concert_id?: string
          end_time?: string | null
          id?: string
          perf_order?: number
          role?: Database["public"]["Enums"]["artist_role"]
          stage_id?: string
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performances_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performances_concert_id_fkey"
            columns: ["concert_id"]
            isOneToOne: false
            referencedRelation: "concerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performances_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "festival_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          display_name: string | null
          id: string
          is_press: boolean
          is_public: boolean
          joined_at: string
          location: string | null
          press_type: Database["public"]["Enums"]["press_type"] | null
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          display_name?: string | null
          id: string
          is_press?: boolean
          is_public?: boolean
          joined_at?: string
          location?: string | null
          press_type?: Database["public"]["Enums"]["press_type"] | null
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          display_name?: string | null
          id?: string
          is_press?: boolean
          is_public?: boolean
          joined_at?: string
          location?: string | null
          press_type?: Database["public"]["Enums"]["press_type"] | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      setlist_songs: {
        Row: {
          concert_id: string
          id: string
          is_encore: boolean
          note: string | null
          performance_id: string | null
          position: number
          title: string
        }
        Insert: {
          concert_id: string
          id?: string
          is_encore?: boolean
          note?: string | null
          performance_id?: string | null
          position: number
          title: string
        }
        Update: {
          concert_id?: string
          id?: string
          is_encore?: boolean
          note?: string | null
          performance_id?: string | null
          position?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "setlist_songs_concert_id_fkey"
            columns: ["concert_id"]
            isOneToOne: false
            referencedRelation: "concerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setlist_songs_performance_id_fkey"
            columns: ["performance_id"]
            isOneToOne: false
            referencedRelation: "performances"
            referencedColumns: ["id"]
          },
        ]
      }
      tours: {
        Row: {
          artist_id: string
          created_at: string
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          total_shows: number | null
        }
        Insert: {
          artist_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          total_shows?: number | null
        }
        Update: {
          artist_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          total_shows?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tours_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          progress: number | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          progress?: number | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          progress?: number | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          capacity: number | null
          city: string
          country: string
          country_name: string
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          name: string
          type: Database["public"]["Enums"]["venue_type"] | null
        }
        Insert: {
          capacity?: number | null
          city: string
          country: string
          country_name: string
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          type?: Database["public"]["Enums"]["venue_type"] | null
        }
        Update: {
          capacity?: number | null
          city?: string
          country?: string
          country_name?: string
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          type?: Database["public"]["Enums"]["venue_type"] | null
        }
        Relationships: []
      }
      wishlist_artists: {
        Row: {
          alerts_on: boolean
          artist_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          alerts_on?: boolean
          artist_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          alerts_on?: boolean
          artist_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_artists_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_artists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      achievement_unlock_rates: {
        Args: Record<PropertyKey, never>
        Returns: { achievement_id: string; pct: number }[]
      }
      can_read_concert: { Args: { cid: string }; Returns: boolean }
      find_or_create_artist: {
        Args: { p_name: string }
        Returns: Database["public"]["Tables"]["artists"]["Row"]
      }
      find_or_create_venue: {
        Args: {
          p_city: string
          p_country: string
          p_country_name: string
          p_name: string
        }
        Returns: Database["public"]["Tables"]["venues"]["Row"]
      }
      find_or_create_tour: {
        Args: { p_artist_id: string; p_name: string }
        Returns: Database["public"]["Tables"]["tours"]["Row"]
      }
      is_concert_owner: { Args: { cid: string }; Returns: boolean }
      save_festival: {
        Args: { p_concert_id: string | null; p_payload: Json }
        Returns: string
      }
      set_tour_total_shows: {
        Args: { p_tour_id: string; p_total: number }
        Returns: Database["public"]["Tables"]["tours"]["Row"]
      }
      username_available: { Args: { name: string }; Returns: boolean }
    }
    Enums: {
      achievement_rarity: "common" | "uncommon" | "rare" | "legendary"
      artist_role: "headliner" | "support" | "special_guest" | "opener"
      buddy_status: "pending" | "confirmed" | "declined"
      concert_status: "attended" | "planned" | "wishlist"
      concert_type: "concert" | "festival"
      friendship_status: "pending" | "accepted" | "blocked"
      press_type: "photo" | "video" | "press" | "all_access"
      ticket_type: "GA" | "Seated" | "VIP" | "Free" | "Press"
      venue_type:
        | "arena"
        | "club"
        | "festival_site"
        | "theatre"
        | "outdoor"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      achievement_rarity: ["common", "uncommon", "rare", "legendary"],
      artist_role: ["headliner", "support", "special_guest", "opener"],
      buddy_status: ["pending", "confirmed", "declined"],
      concert_status: ["attended", "planned", "wishlist"],
      concert_type: ["concert", "festival"],
      friendship_status: ["pending", "accepted", "blocked"],
      press_type: ["photo", "video", "press", "all_access"],
      ticket_type: ["GA", "Seated", "VIP", "Free", "Press"],
      venue_type: [
        "arena",
        "club",
        "festival_site",
        "theatre",
        "outdoor",
        "other",
      ],
    },
  },
} as const
