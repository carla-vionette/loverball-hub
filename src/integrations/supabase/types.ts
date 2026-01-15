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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      chats: {
        Row: {
          created_at: string
          id: string
          match_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          name: string | null
          phone: string | null
          plus_ones: number | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          name?: string | null
          phone?: string | null
          plus_ones?: number | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          name?: string | null
          phone?: string | null
          plus_ones?: number | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          allow_plus_ones: boolean | null
          capacity: number | null
          city: string | null
          created_at: string
          description: string | null
          end_time: string | null
          event_date: string
          event_time: string | null
          event_type: string | null
          host_user_id: string | null
          id: string
          image_url: string | null
          location_map_url: string | null
          location_type: string | null
          rsvp_deadline: string | null
          slug: string | null
          sport_tags: string[] | null
          status: string | null
          theme: string | null
          title: string
          updated_at: string
          venue_name: string | null
          virtual_link: string | null
          visibility: string
        }
        Insert: {
          allow_plus_ones?: boolean | null
          capacity?: number | null
          city?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date: string
          event_time?: string | null
          event_type?: string | null
          host_user_id?: string | null
          id?: string
          image_url?: string | null
          location_map_url?: string | null
          location_type?: string | null
          rsvp_deadline?: string | null
          slug?: string | null
          sport_tags?: string[] | null
          status?: string | null
          theme?: string | null
          title: string
          updated_at?: string
          venue_name?: string | null
          virtual_link?: string | null
          visibility?: string
        }
        Update: {
          allow_plus_ones?: boolean | null
          capacity?: number | null
          city?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_time?: string | null
          event_type?: string | null
          host_user_id?: string | null
          id?: string
          image_url?: string | null
          location_map_url?: string | null
          location_type?: string | null
          rsvp_deadline?: string | null
          slug?: string | null
          sport_tags?: string[] | null
          status?: string | null
          theme?: string | null
          title?: string
          updated_at?: string
          venue_name?: string | null
          virtual_link?: string | null
          visibility?: string
        }
        Relationships: []
      }
      invites: {
        Row: {
          code: string
          created_at: string
          created_by_user_id: string | null
          expires_at: string | null
          id: string
          max_uses: number | null
          used_count: number | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by_user_id?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          used_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by_user_id?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          used_count?: number | null
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string
          id: string
          status: string
          user_a_id: string
          user_b_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          user_a_id: string
          user_b_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          user_a_id?: string
          user_b_id?: string
        }
        Relationships: []
      }
      member_applications: {
        Row: {
          created_at: string
          email: string | null
          id: string
          instagram_or_linkedin_url: string | null
          name: string
          reviewed_by_user_id: string | null
          role_title: string | null
          status: string
          updated_at: string
          user_id: string | null
          why_join: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          instagram_or_linkedin_url?: string | null
          name: string
          reviewed_by_user_id?: string | null
          role_title?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          why_join?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          instagram_or_linkedin_url?: string | null
          name?: string
          reviewed_by_user_id?: string | null
          role_title?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          why_join?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_range: string | null
          bio: string | null
          city: string | null
          created_at: string
          event_comfort_level: string | null
          favorite_la_teams: string[] | null
          favorite_sports: string[] | null
          favorite_teams_players: string[] | null
          id: string
          industries: string[] | null
          instagram_url: string | null
          interested_in_la28: boolean | null
          interested_in_world_cup_la: boolean | null
          linkedin_url: string | null
          looking_for_tags: string[] | null
          name: string
          neighborhood: string | null
          other_interests: string[] | null
          participation_preferences: string[] | null
          phone_number: string | null
          primary_role: string | null
          profile_photo_url: string | null
          pronouns: string | null
          sms_notifications_enabled: boolean | null
          sports_experience_types: string[] | null
          tiktok_url: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          age_range?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          event_comfort_level?: string | null
          favorite_la_teams?: string[] | null
          favorite_sports?: string[] | null
          favorite_teams_players?: string[] | null
          id: string
          industries?: string[] | null
          instagram_url?: string | null
          interested_in_la28?: boolean | null
          interested_in_world_cup_la?: boolean | null
          linkedin_url?: string | null
          looking_for_tags?: string[] | null
          name: string
          neighborhood?: string | null
          other_interests?: string[] | null
          participation_preferences?: string[] | null
          phone_number?: string | null
          primary_role?: string | null
          profile_photo_url?: string | null
          pronouns?: string | null
          sms_notifications_enabled?: boolean | null
          sports_experience_types?: string[] | null
          tiktok_url?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          age_range?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          event_comfort_level?: string | null
          favorite_la_teams?: string[] | null
          favorite_sports?: string[] | null
          favorite_teams_players?: string[] | null
          id?: string
          industries?: string[] | null
          instagram_url?: string | null
          interested_in_la28?: boolean | null
          interested_in_world_cup_la?: boolean | null
          linkedin_url?: string | null
          looking_for_tags?: string[] | null
          name?: string
          neighborhood?: string | null
          other_interests?: string[] | null
          participation_preferences?: string[] | null
          phone_number?: string | null
          primary_role?: string | null
          profile_photo_url?: string | null
          pronouns?: string | null
          sms_notifications_enabled?: boolean | null
          sports_experience_types?: string[] | null
          tiktok_url?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      rate_limit_log: {
        Row: {
          action_type: string
          created_at: string
          id: string
          request_count: number
          user_id: string
          window_start: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          request_count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          request_count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      sports_ticker_items: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          item_type: string
          link_url: string | null
          published_at: string | null
          starts_at: string | null
          tag: string | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          item_type: string
          link_url?: string | null
          published_at?: string | null
          starts_at?: string | null
          tag?: string | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          item_type?: string
          link_url?: string | null
          published_at?: string | null
          starts_at?: string | null
          tag?: string | null
          title?: string
        }
        Relationships: []
      }
      swipes: {
        Row: {
          created_at: string
          direction: string
          id: string
          swiper_id: string
          target_user_id: string
        }
        Insert: {
          created_at?: string
          direction: string
          id?: string
          swiper_id: string
          target_user_id: string
        }
        Update: {
          created_at?: string
          direction?: string
          id?: string
          swiper_id?: string
          target_user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_action_type: string
          p_max_requests?: number
          p_user_id: string
          p_window_minutes?: number
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_and_use_invite: { Args: { invite_code: string }; Returns: Json }
    }
    Enums: {
      app_role: "pending" | "member" | "admin"
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
      app_role: ["pending", "member", "admin"],
    },
  },
} as const
