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
          admin_notes: string | null
          applicant_user_id: string
          content_focus: string
          created_at: string
          desired_channel_name: string
          example_content_links: string | null
          id: string
          reviewed_at: string | null
          social_handles: string | null
          status: string
        }
        Insert: {
          admin_notes?: string | null
          applicant_user_id: string
          content_focus: string
          created_at?: string
          desired_channel_name: string
          example_content_links?: string | null
          id?: string
          reviewed_at?: string | null
          social_handles?: string | null
          status?: string
        }
        Update: {
          admin_notes?: string | null
          applicant_user_id?: string
          content_focus?: string
          created_at?: string
          desired_channel_name?: string
          example_content_links?: string | null
          id?: string
          reviewed_at?: string | null
          social_handles?: string | null
          status?: string
        }
        Relationships: []
      }
      creator_channels: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          brand_colors: Json | null
          channel_name: string
          channel_type: string
          contact_email: string | null
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
          contact_email?: string | null
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
          contact_email?: string | null
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
          banner_image: string | null
          capacity: number | null
          city: string | null
          created_at: string
          description: string | null
          end_time: string | null
          event_date: string
          event_link: string | null
          event_time: string | null
          event_type: string | null
          host_user_id: string | null
          id: string
          image_url: string | null
          layout_json: Json | null
          location: string | null
          location_map_url: string | null
          location_type: string | null
          price: number | null
          rsvp_deadline: string | null
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
        }
        Insert: {
          allow_plus_ones?: boolean | null
          banner_image?: string | null
          capacity?: number | null
          city?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date: string
          event_link?: string | null
          event_time?: string | null
          event_type?: string | null
          host_user_id?: string | null
          id?: string
          image_url?: string | null
          layout_json?: Json | null
          location?: string | null
          location_map_url?: string | null
          location_type?: string | null
          price?: number | null
          rsvp_deadline?: string | null
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
        }
        Update: {
          allow_plus_ones?: boolean | null
          banner_image?: string | null
          capacity?: number | null
          city?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_link?: string | null
          event_time?: string | null
          event_type?: string | null
          host_user_id?: string | null
          id?: string
          image_url?: string | null
          layout_json?: Json | null
          location?: string | null
          location_map_url?: string | null
          location_type?: string | null
          price?: number | null
          rsvp_deadline?: string | null
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
          requester_id: string
          status: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
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
          age_range: string | null
          billing_period: string | null
          bio: string | null
          birthday: string | null
          city: string | null
          created_at: string
          current_streak: number
          event_comfort_level: string | null
          favorite_la_teams: string[] | null
          favorite_sports: string[] | null
          favorite_teams_players: string[] | null
          id: string
          industries: string[] | null
          instagram_url: string | null
          interested_in_la28: boolean | null
          interested_in_world_cup_la: boolean | null
          last_streak_week: string | null
          linkedin_url: string | null
          longest_streak: number
          looking_for_tags: string[] | null
          membership_tier: string | null
          name: string
          neighborhood: string | null
          other_interests: string[] | null
          participation_preferences: string[] | null
          phone_number: string | null
          primary_role: string | null
          profile_photo_url: string | null
          pronouns: string | null
          role: string | null
          sms_notifications_enabled: boolean | null
          sports_experience_types: string[] | null
          tiktok_url: string | null
          total_points: number
          updated_at: string
          website_url: string | null
        }
        Insert: {
          age_range?: string | null
          billing_period?: string | null
          bio?: string | null
          birthday?: string | null
          city?: string | null
          created_at?: string
          current_streak?: number
          event_comfort_level?: string | null
          favorite_la_teams?: string[] | null
          favorite_sports?: string[] | null
          favorite_teams_players?: string[] | null
          id: string
          industries?: string[] | null
          instagram_url?: string | null
          interested_in_la28?: boolean | null
          interested_in_world_cup_la?: boolean | null
          last_streak_week?: string | null
          linkedin_url?: string | null
          longest_streak?: number
          looking_for_tags?: string[] | null
          membership_tier?: string | null
          name: string
          neighborhood?: string | null
          other_interests?: string[] | null
          participation_preferences?: string[] | null
          phone_number?: string | null
          primary_role?: string | null
          profile_photo_url?: string | null
          pronouns?: string | null
          role?: string | null
          sms_notifications_enabled?: boolean | null
          sports_experience_types?: string[] | null
          tiktok_url?: string | null
          total_points?: number
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          age_range?: string | null
          billing_period?: string | null
          bio?: string | null
          birthday?: string | null
          city?: string | null
          created_at?: string
          current_streak?: number
          event_comfort_level?: string | null
          favorite_la_teams?: string[] | null
          favorite_sports?: string[] | null
          favorite_teams_players?: string[] | null
          id?: string
          industries?: string[] | null
          instagram_url?: string | null
          interested_in_la28?: boolean | null
          interested_in_world_cup_la?: boolean | null
          last_streak_week?: string | null
          linkedin_url?: string | null
          longest_streak?: number
          looking_for_tags?: string[] | null
          membership_tier?: string | null
          name?: string
          neighborhood?: string | null
          other_interests?: string[] | null
          participation_preferences?: string[] | null
          phone_number?: string | null
          primary_role?: string | null
          profile_photo_url?: string | null
          pronouns?: string | null
          role?: string | null
          sms_notifications_enabled?: boolean | null
          sports_experience_types?: string[] | null
          tiktok_url?: string | null
          total_points?: number
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
