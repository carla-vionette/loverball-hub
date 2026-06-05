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
      admin_activity_log: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      admin_config: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          config_key: string
          config_value: Json
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          duration_ms: number | null
          event_name: string
          event_type: string
          id: string
          page_path: string | null
          properties: Json | null
          referrer_path: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          event_name: string
          event_type: string
          id?: string
          page_path?: string | null
          properties?: Json | null
          referrer_path?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          event_name?: string
          event_type?: string
          id?: string
          page_path?: string | null
          properties?: Json | null
          referrer_path?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          badge_type: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_type: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_type?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_subscriptions: {
        Row: {
          channel_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_subscriptions_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "creator_channels"
            referencedColumns: ["id"]
          },
        ]
      }
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
      check_ins: {
        Row: {
          checked_in_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          checked_in_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          checked_in_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      client_errors: {
        Row: {
          component_stack: string | null
          created_at: string
          id: string
          message: string
          route: string | null
          source: string | null
          stack: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          component_stack?: string | null
          created_at?: string
          id?: string
          message: string
          route?: string | null
          source?: string | null
          stack?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          component_stack?: string | null
          created_at?: string
          id?: string
          message?: string
          route?: string | null
          source?: string | null
          stack?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      community_groups: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          group_type: string
          icon_emoji: string | null
          id: string
          is_official: boolean
          member_count: number
          name: string
          rules: string | null
          team_key: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          group_type?: string
          icon_emoji?: string | null
          id?: string
          is_official?: boolean
          member_count?: number
          name: string
          rules?: string | null
          team_key?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          group_type?: string
          icon_emoji?: string | null
          id?: string
          is_official?: boolean
          member_count?: number
          name?: string
          rules?: string | null
          team_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      creator_applications: {
        Row: {
          account_type: string | null
          admin_notes: string | null
          applicant_user_id: string
          banner_url: string | null
          bio: string | null
          city: string | null
          content_focus: string
          created_at: string
          desired_channel_name: string
          example_content_links: string | null
          id: string
          instagram_followers: number | null
          instagram_url: string | null
          league: string | null
          logo_url: string | null
          name: string | null
          reviewed_at: string | null
          social_handles: string | null
          sport: string | null
          status: string
          submitted_at: string | null
          tiktok_followers: number | null
          tiktok_url: string | null
          twitter_followers: number | null
          twitter_url: string | null
          youtube_followers: number | null
          youtube_url: string | null
        }
        Insert: {
          account_type?: string | null
          admin_notes?: string | null
          applicant_user_id: string
          banner_url?: string | null
          bio?: string | null
          city?: string | null
          content_focus: string
          created_at?: string
          desired_channel_name: string
          example_content_links?: string | null
          id?: string
          instagram_followers?: number | null
          instagram_url?: string | null
          league?: string | null
          logo_url?: string | null
          name?: string | null
          reviewed_at?: string | null
          social_handles?: string | null
          sport?: string | null
          status?: string
          submitted_at?: string | null
          tiktok_followers?: number | null
          tiktok_url?: string | null
          twitter_followers?: number | null
          twitter_url?: string | null
          youtube_followers?: number | null
          youtube_url?: string | null
        }
        Update: {
          account_type?: string | null
          admin_notes?: string | null
          applicant_user_id?: string
          banner_url?: string | null
          bio?: string | null
          city?: string | null
          content_focus?: string
          created_at?: string
          desired_channel_name?: string
          example_content_links?: string | null
          id?: string
          instagram_followers?: number | null
          instagram_url?: string | null
          league?: string | null
          logo_url?: string | null
          name?: string | null
          reviewed_at?: string | null
          social_handles?: string | null
          sport?: string | null
          status?: string
          submitted_at?: string | null
          tiktok_followers?: number | null
          tiktok_url?: string | null
          twitter_followers?: number | null
          twitter_url?: string | null
          youtube_followers?: number | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      creator_channel_emails: {
        Row: {
          channel_id: string
          contact_email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          channel_id: string
          contact_email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          channel_id?: string
          contact_email?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_channel_emails_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: true
            referencedRelation: "creator_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_channels: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          brand_colors: Json | null
          channel_name: string
          channel_type: string
          content_language: string | null
          created_at: string
          description: string | null
          follower_count: number
          founded_year: number | null
          id: string
          league: string | null
          location: string | null
          owner_user_id: string
          slug: string
          social_links: Json | null
          sport_focus: string | null
          status: string
          target_audience: string | null
          total_views: number
          updated_at: string
          upload_schedule: string | null
          verified: boolean
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          brand_colors?: Json | null
          channel_name: string
          channel_type?: string
          content_language?: string | null
          created_at?: string
          description?: string | null
          follower_count?: number
          founded_year?: number | null
          id?: string
          league?: string | null
          location?: string | null
          owner_user_id: string
          slug: string
          social_links?: Json | null
          sport_focus?: string | null
          status?: string
          target_audience?: string | null
          total_views?: number
          updated_at?: string
          upload_schedule?: string | null
          verified?: boolean
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          brand_colors?: Json | null
          channel_name?: string
          channel_type?: string
          content_language?: string | null
          created_at?: string
          description?: string | null
          follower_count?: number
          founded_year?: number | null
          id?: string
          league?: string | null
          location?: string | null
          owner_user_id?: string
          slug?: string
          social_links?: Json | null
          sport_focus?: string | null
          status?: string
          target_audience?: string | null
          total_views?: number
          updated_at?: string
          upload_schedule?: string | null
          verified?: boolean
          website_url?: string | null
        }
        Relationships: []
      }
      curated_content: {
        Row: {
          body: string | null
          content_type: string
          created_at: string
          date: string
          id: string
          image_url: string | null
          sport: string | null
          team_tag: string | null
          title: string
        }
        Insert: {
          body?: string | null
          content_type?: string
          created_at?: string
          date?: string
          id?: string
          image_url?: string | null
          sport?: string | null
          team_tag?: string | null
          title: string
        }
        Update: {
          body?: string | null
          content_type?: string
          created_at?: string
          date?: string
          id?: string
          image_url?: string | null
          sport?: string | null
          team_tag?: string | null
          title?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_comments: {
        Row: {
          created_at: string
          event_id: string
          id: string
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_comments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_guests: {
        Row: {
          created_at: string
          event_id: string
          going_solo: boolean
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          going_solo?: boolean
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          going_solo?: boolean
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_guests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_invites: {
        Row: {
          created_at: string
          event_id: string
          expires_at: string | null
          id: string
          invite_link_token: string
          invite_type: string
          recipient_email: string | null
          recipient_phone: string | null
          sent_by_user_id: string | null
          source: string | null
          status: string
          used_at: string | null
          used_by_user_id: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          expires_at?: string | null
          id?: string
          invite_link_token?: string
          invite_type?: string
          recipient_email?: string | null
          recipient_phone?: string | null
          sent_by_user_id?: string | null
          source?: string | null
          status?: string
          used_at?: string | null
          used_by_user_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          expires_at?: string | null
          id?: string
          invite_link_token?: string
          invite_type?: string
          recipient_email?: string | null
          recipient_phone?: string | null
          sent_by_user_id?: string | null
          source?: string | null
          status?: string
          used_at?: string | null
          used_by_user_id?: string | null
        }
        Relationships: []
      }
      event_match_members: {
        Row: {
          checked_in_with_match: boolean
          created_at: string
          event_match_id: string
          id: string
          response_status: string
          role: string
          user_id: string
        }
        Insert: {
          checked_in_with_match?: boolean
          created_at?: string
          event_match_id: string
          id?: string
          response_status?: string
          role?: string
          user_id: string
        }
        Update: {
          checked_in_with_match?: boolean
          created_at?: string
          event_match_id?: string
          id?: string
          response_status?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_match_members_event_match_id_fkey"
            columns: ["event_match_id"]
            isOneToOne: false
            referencedRelation: "event_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      event_matches: {
        Row: {
          conversation_id: string | null
          created_at: string
          created_by_user_id: string | null
          event_id: string
          id: string
          label: string | null
          match_type: string
          meeting_location_label: string | null
          meeting_time: string | null
          status: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          created_by_user_id?: string | null
          event_id: string
          id?: string
          label?: string | null
          match_type?: string
          meeting_location_label?: string | null
          meeting_time?: string | null
          status?: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          created_by_user_id?: string | null
          event_id?: string
          id?: string
          label?: string | null
          match_type?: string
          meeting_location_label?: string | null
          meeting_time?: string | null
          status?: string
        }
        Relationships: []
      }
      event_matchmaking_preferences: {
        Row: {
          age_range_optional: string | null
          coming_solo: boolean
          created_at: string
          event_id: string
          id: string
          intent_tags: string[]
          location_preference: string | null
          match_mode_preference: string
          meeting_window_preference: string | null
          notes_optional: string | null
          open_to_cross_team_match: boolean
          social_energy: string | null
          team_affinity_tags: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          age_range_optional?: string | null
          coming_solo?: boolean
          created_at?: string
          event_id: string
          id?: string
          intent_tags?: string[]
          location_preference?: string | null
          match_mode_preference?: string
          meeting_window_preference?: string | null
          notes_optional?: string | null
          open_to_cross_team_match?: boolean
          social_energy?: string | null
          team_affinity_tags?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          age_range_optional?: string | null
          coming_solo?: boolean
          created_at?: string
          event_id?: string
          id?: string
          intent_tags?: string[]
          location_preference?: string | null
          match_mode_preference?: string
          meeting_window_preference?: string | null
          notes_optional?: string | null
          open_to_cross_team_match?: boolean
          social_energy?: string | null
          team_affinity_tags?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      event_password_attempts: {
        Row: {
          attempted_at: string
          event_id: string
          id: string
          identifier: string
          success: boolean
        }
        Insert: {
          attempted_at?: string
          event_id: string
          id?: string
          identifier: string
          success?: boolean
        }
        Update: {
          attempted_at?: string
          event_id?: string
          id?: string
          identifier?: string
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "event_password_attempts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          approval_status: string
          attendance_status: string
          checked_in_at: string | null
          created_at: string
          event_id: string
          guest_name: string | null
          guest_phone: string | null
          id: string
          identity_completed_at: string | null
          invite_id: string | null
          invited_by_user_id: string | null
          joined_event_chat_at: string | null
          plus_ones: number | null
          status: string
          user_id: string
        }
        Insert: {
          approval_status?: string
          attendance_status?: string
          checked_in_at?: string | null
          created_at?: string
          event_id: string
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          identity_completed_at?: string | null
          invite_id?: string | null
          invited_by_user_id?: string | null
          joined_event_chat_at?: string | null
          plus_ones?: number | null
          status?: string
          user_id: string
        }
        Update: {
          approval_status?: string
          attendance_status?: string
          checked_in_at?: string | null
          created_at?: string
          event_id?: string
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          identity_completed_at?: string | null
          invite_id?: string | null
          invited_by_user_id?: string | null
          joined_event_chat_at?: string | null
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
      event_submissions: {
        Row: {
          admin_notes: string | null
          city: string | null
          created_at: string
          description: string | null
          email: string
          event_date: string
          event_time: string | null
          event_type: string | null
          id: string
          image_url: string | null
          phone: string
          social_links: Json | null
          status: string
          submitter_id: string
          title: string
          updated_at: string
          venue_name: string | null
        }
        Insert: {
          admin_notes?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          email: string
          event_date: string
          event_time?: string | null
          event_type?: string | null
          id?: string
          image_url?: string | null
          phone: string
          social_links?: Json | null
          status?: string
          submitter_id: string
          title: string
          updated_at?: string
          venue_name?: string | null
        }
        Update: {
          admin_notes?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          email?: string
          event_date?: string
          event_time?: string | null
          event_type?: string | null
          id?: string
          image_url?: string | null
          phone?: string
          social_links?: Json | null
          status?: string
          submitter_id?: string
          title?: string
          updated_at?: string
          venue_name?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          allow_mutual_invites: boolean
          allow_photo_uploads: boolean
          allow_plus_ones: boolean | null
          anonymize_guest_list: boolean
          banner_image: string | null
          capacity: number | null
          city: string | null
          co_host_ids: string[] | null
          created_at: string
          crew_mode_enabled: boolean
          description: string | null
          end_time: string | null
          event_date: string
          event_link: string | null
          event_password_hash: string | null
          event_tags: string[] | null
          event_time: string | null
          event_type: string | null
          guest_visibility: boolean | null
          hide_activity_timestamps: boolean
          host_user_id: string | null
          id: string
          image_url: string | null
          layout_json: Json | null
          location: string | null
          location_lat: number | null
          location_lng: number | null
          location_map_url: string | null
          location_type: string | null
          matchmaking_enabled: boolean
          matchmaking_requires_approval: boolean
          one_to_one_mode_enabled: boolean
          open_invite_enabled: boolean
          password_required: boolean
          plus_one_limit: number
          price: number | null
          promoted: boolean
          rsvp_approval_required: boolean | null
          rsvp_deadline: string | null
          show_guest_count: boolean
          slug: string | null
          sport_tags: string[] | null
          status: string | null
          theme: string | null
          tier: string | null
          title: string
          updated_at: string
          venue_name: string | null
          venue_type: string | null
          virtual_link: string | null
          visibility: string
          waitlist_enabled: boolean
        }
        Insert: {
          allow_mutual_invites?: boolean
          allow_photo_uploads?: boolean
          allow_plus_ones?: boolean | null
          anonymize_guest_list?: boolean
          banner_image?: string | null
          capacity?: number | null
          city?: string | null
          co_host_ids?: string[] | null
          created_at?: string
          crew_mode_enabled?: boolean
          description?: string | null
          end_time?: string | null
          event_date: string
          event_link?: string | null
          event_password_hash?: string | null
          event_tags?: string[] | null
          event_time?: string | null
          event_type?: string | null
          guest_visibility?: boolean | null
          hide_activity_timestamps?: boolean
          host_user_id?: string | null
          id?: string
          image_url?: string | null
          layout_json?: Json | null
          location?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_map_url?: string | null
          location_type?: string | null
          matchmaking_enabled?: boolean
          matchmaking_requires_approval?: boolean
          one_to_one_mode_enabled?: boolean
          open_invite_enabled?: boolean
          password_required?: boolean
          plus_one_limit?: number
          price?: number | null
          promoted?: boolean
          rsvp_approval_required?: boolean | null
          rsvp_deadline?: string | null
          show_guest_count?: boolean
          slug?: string | null
          sport_tags?: string[] | null
          status?: string | null
          theme?: string | null
          tier?: string | null
          title: string
          updated_at?: string
          venue_name?: string | null
          venue_type?: string | null
          virtual_link?: string | null
          visibility?: string
          waitlist_enabled?: boolean
        }
        Update: {
          allow_mutual_invites?: boolean
          allow_photo_uploads?: boolean
          allow_plus_ones?: boolean | null
          anonymize_guest_list?: boolean
          banner_image?: string | null
          capacity?: number | null
          city?: string | null
          co_host_ids?: string[] | null
          created_at?: string
          crew_mode_enabled?: boolean
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_link?: string | null
          event_password_hash?: string | null
          event_tags?: string[] | null
          event_time?: string | null
          event_type?: string | null
          guest_visibility?: boolean | null
          hide_activity_timestamps?: boolean
          host_user_id?: string | null
          id?: string
          image_url?: string | null
          layout_json?: Json | null
          location?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_map_url?: string | null
          location_type?: string | null
          matchmaking_enabled?: boolean
          matchmaking_requires_approval?: boolean
          one_to_one_mode_enabled?: boolean
          open_invite_enabled?: boolean
          password_required?: boolean
          plus_one_limit?: number
          price?: number | null
          promoted?: boolean
          rsvp_approval_required?: boolean | null
          rsvp_deadline?: string | null
          show_guest_count?: boolean
          slug?: string | null
          sport_tags?: string[] | null
          status?: string | null
          theme?: string | null
          tier?: string | null
          title?: string
          updated_at?: string
          venue_name?: string | null
          venue_type?: string | null
          virtual_link?: string | null
          visibility?: string
          waitlist_enabled?: boolean
        }
        Relationships: []
      }
      feed_items: {
        Row: {
          category: string
          created_at: string
          id: string
          image_url: string | null
          source: string
          source_url: string
          sport_tags: string[]
          summary: string
          team_tags: string[]
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          source: string
          source_url: string
          sport_tags?: string[]
          summary: string
          team_tags?: string[]
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          source?: string
          source_url?: string
          sport_tags?: string[]
          summary?: string
          team_tags?: string[]
          title?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          mutual_teams: string[] | null
          requester_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          mutual_teams?: string[] | null
          requester_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          mutual_teams?: string[] | null
          requester_id?: string
          status?: string
          updated_at?: string | null
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
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          content: string
          created_at: string
          group_id: string
          id: string
          is_pinned: boolean
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_id: string
          id?: string
          is_pinned?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          is_pinned?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          created_at: string | null
          id: string
          invite_code: string
          inviter_id: string | null
          signup_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invite_code: string
          inviter_id?: string | null
          signup_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invite_code?: string
          inviter_id?: string | null
          signup_count?: number | null
        }
        Relationships: []
      }
      lb_events: {
        Row: {
          capacity: number | null
          created_at: string
          description: string | null
          ends_at: string | null
          hero_image_url: string | null
          host_user_id: string | null
          id: string
          is_private: boolean
          neighborhood: string | null
          pillar: string
          slug: string
          starts_at: string
          title: string
          venue_address: string | null
          venue_name: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          hero_image_url?: string | null
          host_user_id?: string | null
          id?: string
          is_private?: boolean
          neighborhood?: string | null
          pillar: string
          slug: string
          starts_at: string
          title: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          hero_image_url?: string | null
          host_user_id?: string | null
          id?: string
          is_private?: boolean
          neighborhood?: string | null
          pillar?: string
          slug?: string
          starts_at?: string
          title?: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lb_events_host_user_id_fkey"
            columns: ["host_user_id"]
            isOneToOne: false
            referencedRelation: "lb_users"
            referencedColumns: ["id"]
          },
        ]
      }
      lb_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          plus_one_count: number
          referral_user_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          plus_one_count?: number
          referral_user_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          plus_one_count?: number
          referral_user_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lb_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "lb_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lb_rsvps_referral_user_id_fkey"
            columns: ["referral_user_id"]
            isOneToOne: false
            referencedRelation: "lb_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lb_rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "lb_users"
            referencedColumns: ["id"]
          },
        ]
      }
      lb_teams: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          league: string
          logo_url: string | null
          name: string
          sport: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          league: string
          logo_url?: string | null
          name: string
          sport: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          league?: string
          logo_url?: string | null
          name?: string
          sport?: string
        }
        Relationships: []
      }
      lb_users: {
        Row: {
          birthday: string | null
          created_at: string
          created_via_event_id: string | null
          display_name: string | null
          email: string | null
          favorite_sports: string[]
          favorite_team_ids: string[]
          id: string
          phone: string | null
          photo_url: string | null
          profile_completion: number
          updated_at: string
          vibe_tags: string[]
        }
        Insert: {
          birthday?: string | null
          created_at?: string
          created_via_event_id?: string | null
          display_name?: string | null
          email?: string | null
          favorite_sports?: string[]
          favorite_team_ids?: string[]
          id: string
          phone?: string | null
          photo_url?: string | null
          profile_completion?: number
          updated_at?: string
          vibe_tags?: string[]
        }
        Update: {
          birthday?: string | null
          created_at?: string
          created_via_event_id?: string | null
          display_name?: string | null
          email?: string | null
          favorite_sports?: string[]
          favorite_team_ids?: string[]
          id?: string
          phone?: string | null
          photo_url?: string | null
          profile_completion?: number
          updated_at?: string
          vibe_tags?: string[]
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
      members: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      notification_preferences: {
        Row: {
          created_at: string
          event_alerts: boolean
          game_reminders: boolean
          id: string
          news_updates: boolean
          preference_key: string
          preference_type: string
          sms_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_alerts?: boolean
          game_reminders?: boolean
          id?: string
          news_updates?: boolean
          preference_key: string
          preference_type: string
          sms_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_alerts?: boolean
          game_reminders?: boolean
          id?: string
          news_updates?: boolean
          preference_key?: string
          preference_type?: string
          sms_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      point_transactions: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          points: number
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          points: number
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          points?: number
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_transactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_saves: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_saves_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          category: string | null
          content: string | null
          created_at: string
          id: string
          media_type: string | null
          media_url: string | null
          title: string | null
          updated_at: string
          views: number | null
        }
        Insert: {
          author_id: string
          category?: string | null
          content?: string | null
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          title?: string | null
          updated_at?: string
          views?: number | null
        }
        Update: {
          author_id?: string
          category?: string | null
          content?: string | null
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          title?: string | null
          updated_at?: string
          views?: number | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          in_stock: boolean | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string | null
          age_range: string | null
          billing_period: string | null
          bio: string | null
          city: string | null
          created_at: string
          current_streak: number
          email_notifications_enabled: boolean
          event_comfort_level: string | null
          fan_vibe: string | null
          favorite_la_teams: string[] | null
          favorite_sports: string[] | null
          favorite_teams_players: string[] | null
          has_completed_onboarding: boolean
          id: string
          in_app_notifications_enabled: boolean
          industries: string[] | null
          instagram_url: string | null
          interested_in_la28: boolean | null
          interested_in_world_cup_la: boolean | null
          last_streak_week: string | null
          latitude: number | null
          linkedin_url: string | null
          longest_streak: number
          longitude: number | null
          looking_for_tags: string[] | null
          membership_tier: string | null
          name: string
          neighborhood: string | null
          other_interests: string[] | null
          participation_preferences: string[] | null
          primary_role: string | null
          profile_photo_url: string | null
          pronouns: string | null
          sms_notifications_enabled: boolean | null
          sms_unsubscribed: boolean
          sports_experience_types: string[] | null
          state: string | null
          tiktok_url: string | null
          total_points: number
          updated_at: string
          username: string | null
          website_url: string | null
          zip_code: string | null
        }
        Insert: {
          account_type?: string | null
          age_range?: string | null
          billing_period?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          current_streak?: number
          email_notifications_enabled?: boolean
          event_comfort_level?: string | null
          fan_vibe?: string | null
          favorite_la_teams?: string[] | null
          favorite_sports?: string[] | null
          favorite_teams_players?: string[] | null
          has_completed_onboarding?: boolean
          id: string
          in_app_notifications_enabled?: boolean
          industries?: string[] | null
          instagram_url?: string | null
          interested_in_la28?: boolean | null
          interested_in_world_cup_la?: boolean | null
          last_streak_week?: string | null
          latitude?: number | null
          linkedin_url?: string | null
          longest_streak?: number
          longitude?: number | null
          looking_for_tags?: string[] | null
          membership_tier?: string | null
          name: string
          neighborhood?: string | null
          other_interests?: string[] | null
          participation_preferences?: string[] | null
          primary_role?: string | null
          profile_photo_url?: string | null
          pronouns?: string | null
          sms_notifications_enabled?: boolean | null
          sms_unsubscribed?: boolean
          sports_experience_types?: string[] | null
          state?: string | null
          tiktok_url?: string | null
          total_points?: number
          updated_at?: string
          username?: string | null
          website_url?: string | null
          zip_code?: string | null
        }
        Update: {
          account_type?: string | null
          age_range?: string | null
          billing_period?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          current_streak?: number
          email_notifications_enabled?: boolean
          event_comfort_level?: string | null
          fan_vibe?: string | null
          favorite_la_teams?: string[] | null
          favorite_sports?: string[] | null
          favorite_teams_players?: string[] | null
          has_completed_onboarding?: boolean
          id?: string
          in_app_notifications_enabled?: boolean
          industries?: string[] | null
          instagram_url?: string | null
          interested_in_la28?: boolean | null
          interested_in_world_cup_la?: boolean | null
          last_streak_week?: string | null
          latitude?: number | null
          linkedin_url?: string | null
          longest_streak?: number
          longitude?: number | null
          looking_for_tags?: string[] | null
          membership_tier?: string | null
          name?: string
          neighborhood?: string | null
          other_interests?: string[] | null
          participation_preferences?: string[] | null
          primary_role?: string | null
          profile_photo_url?: string | null
          pronouns?: string | null
          sms_notifications_enabled?: boolean | null
          sms_unsubscribed?: boolean
          sports_experience_types?: string[] | null
          state?: string | null
          tiktok_url?: string | null
          total_points?: number
          updated_at?: string
          username?: string | null
          website_url?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      profiles_sensitive: {
        Row: {
          birthday: string | null
          created_at: string
          id: string
          phone_number: string | null
          updated_at: string
        }
        Insert: {
          birthday?: string | null
          created_at?: string
          id: string
          phone_number?: string | null
          updated_at?: string
        }
        Update: {
          birthday?: string | null
          created_at?: string
          id?: string
          phone_number?: string | null
          updated_at?: string
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
      saved_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      sms_send_log: {
        Row: {
          body_preview: string | null
          created_at: string
          id: string
          status: string
          to_phone: string
          user_id: string | null
        }
        Insert: {
          body_preview?: string | null
          created_at?: string
          id?: string
          status?: string
          to_phone: string
          user_id?: string | null
        }
        Update: {
          body_preview?: string | null
          created_at?: string
          id?: string
          status?: string
          to_phone?: string
          user_id?: string | null
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
      story_reactions: {
        Row: {
          article_id: string
          created_at: string
          id: string
          reaction: string
          user_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          reaction: string
          user_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          id: string
          plan: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string | null
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
      team_follows: {
        Row: {
          created_at: string
          id: string
          team_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          team_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          team_key?: string
          user_id?: string
        }
        Relationships: []
      }
      user_feed_preferences: {
        Row: {
          created_at: string
          hidden_event_types: string[]
          hidden_sports: string[]
          home_neighborhood: string | null
          home_venue: string | null
          id: string
          preferred_distance_miles: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hidden_event_types?: string[]
          hidden_sports?: string[]
          home_neighborhood?: string | null
          home_venue?: string | null
          id?: string
          preferred_distance_miles?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hidden_event_types?: string[]
          hidden_sports?: string[]
          home_neighborhood?: string | null
          home_venue?: string | null
          id?: string
          preferred_distance_miles?: number | null
          updated_at?: string
          user_id?: string
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
      video_likes: {
        Row: {
          created_at: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_views: {
        Row: {
          created_at: string
          id: string
          user_id: string | null
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id?: string | null
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_views_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          category: string | null
          channel_id: string
          created_at: string
          description: string | null
          duration: string | null
          duration_seconds: number | null
          id: string
          is_published: boolean
          published_at: string | null
          tags: string[] | null
          thumbnail: string | null
          thumbnail_url: string | null
          tier: string | null
          title: string
          uploaded_by: string | null
          video_url: string
        }
        Insert: {
          category?: string | null
          channel_id: string
          created_at?: string
          description?: string | null
          duration?: string | null
          duration_seconds?: number | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          tags?: string[] | null
          thumbnail?: string | null
          thumbnail_url?: string | null
          tier?: string | null
          title: string
          uploaded_by?: string | null
          video_url: string
        }
        Update: {
          category?: string | null
          channel_id?: string
          created_at?: string
          description?: string | null
          duration?: string | null
          duration_seconds?: number | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          tags?: string[] | null
          thumbnail?: string | null
          thumbnail_url?: string | null
          tier?: string | null
          title?: string
          uploaded_by?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "creator_channels"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _test_age_event_password_attempts: {
        Args: { p_event_id: string; p_seconds: number; p_session_token: string }
        Returns: number
      }
      _test_reset_event_password_attempts: {
        Args: { p_event_id: string; p_session_token?: string }
        Returns: undefined
      }
      _test_set_event_password: {
        Args: { p_event_id: string; p_password: string }
        Returns: undefined
      }
      admin_get_event_attendees: {
        Args: { p_event_id: string }
        Returns: {
          approval_status: string
          created_at: string
          guest_name: string
          guest_phone: string
          id: string
          plus_ones: number
          profile_city: string
          profile_email: string
          profile_instagram_url: string
          profile_name: string
          profile_photo_url: string
          status: string
          user_id: string
        }[]
      }
      check_rate_limit: {
        Args: {
          p_action_type: string
          p_max_requests?: number
          p_user_id: string
          p_window_minutes?: number
        }
        Returns: boolean
      }
      get_event_invite_by_token: {
        Args: { p_token: string }
        Returns: {
          created_at: string
          event_id: string
          id: string
          invite_link_token: string
          recipient_email: string
          recipient_phone: string
          sent_by_user_id: string
          status: string
        }[]
      }
      get_my_account_settings: { Args: never; Returns: Json }
      get_my_location: { Args: never; Returns: Json }
      get_public_profile_columns: { Args: { target_id: string }; Returns: Json }
      get_safe_profile: { Args: { profile_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      set_event_password: {
        Args: { p_event_id: string; p_password: string }
        Returns: boolean
      }
      validate_and_use_invite: { Args: { invite_code: string }; Returns: Json }
      verify_event_password:
        | { Args: { p_event_id: string; p_password: string }; Returns: boolean }
        | {
            Args: {
              p_event_id: string
              p_password: string
              p_session_token?: string
            }
            Returns: Json
          }
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
