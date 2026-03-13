export type AppRole = 'pending' | 'member' | 'admin';
export type SubscriptionPlan = 'free' | 'community' | 'allaccess';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';
export type ContentTier = 'free' | 'community' | 'allaccess';

export interface UserProfile {
  id: string;
  name: string;
  email?: string | null;
  bio: string | null;
  city: string | null;
  neighborhood: string | null;
  phone_number: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  tiktok_url: string | null;
  primary_role: string | null;
  industries: string[] | null;
  favorite_la_teams: string[] | null;
  looking_for_tags: string[] | null;
  favorite_sports: string[] | null;
  age_range: string | null;
  pronouns: string | null;
  profile_photo_url: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_end: string | null;
  created_at: string;
}

export interface Invite {
  id: string;
  inviter_id: string;
  invite_code: string;
  signup_count: number;
  created_at: string;
}

export interface VideoItem {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail: string | null;
  created_at: string;
  uploaded_by: string | null;
  category: string | null;
  tier: ContentTier | null;
  duration: string | null;
}

export interface EventItem {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  event_link: string | null;
  image: string | null;
  event_type: string | null;
  visibility: string;
  created_at: string;
  tier: ContentTier | null;
  layout_json: EventLayout | null;
  banner_image: string | null;
}

export interface MemberApplication {
  id: string;
  email?: string | null;
  name: string;
  role_title?: string | null;
  instagram_or_linkedin_url?: string | null;
  why_join?: string | null;
  status: string;
  created_at: string;
  user_id?: string | null;
}

export interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

// Event Builder types
export type EventSectionType = 'title' | 'description' | 'speakers' | 'schedule' | 'gallery' | 'video' | 'location' | 'registration';

export interface EventSection {
  id: string;
  type: EventSectionType;
  data: Record<string, unknown>;
  order: number;
}

export interface EventLayout {
  sections: EventSection[];
}

export interface LeaderboardEntry {
  inviter_id: string;
  invite_code: string;
  signup_count: number;
  inviter_name?: string;
  inviter_photo?: string | null;
}

export interface SubscriptionWithUser extends Subscription {
  user_name?: string;
  user_email?: string;
}
