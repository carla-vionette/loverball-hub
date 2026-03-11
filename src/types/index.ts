export type AppRole = 'pending' | 'member' | 'admin';
export type SubscriptionPlan = 'free' | 'pro' | 'premium';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';
export type ContentTier = 'free' | 'pro' | 'premium';

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

export interface VideoItem {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail: string | null;
  created_at: string;
  uploaded_by: string | null;
  category: string | null;
  tier: ContentTier;
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
  tier: ContentTier;
  layout_json: EventLayout | null;
  banner_image: string | null;
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

// Event Builder section types
export type EventSectionType =
  | 'title'
  | 'description'
  | 'speakers'
  | 'schedule'
  | 'gallery'
  | 'video'
  | 'location'
  | 'registration';

export interface EventSection {
  id: string;
  type: EventSectionType;
  data: Record<string, unknown>;
}

export interface EventLayout {
  sections: EventSection[];
}

// Referral badge milestones
export interface InviteMilestone {
  threshold: number;
  label: string;
  emoji: string;
}

export const INVITE_MILESTONES: InviteMilestone[] = [
  { threshold: 5, label: 'Rookie Recruiter', emoji: '🌟' },
  { threshold: 10, label: 'Team Captain', emoji: '🏆' },
  { threshold: 25, label: 'MVP', emoji: '👑' },
];

// Video categories
export const VIDEO_CATEGORIES = [
  'Basketball',
  'Soccer',
  'Tennis',
  'WNBA',
  'Culture',
  'Fitness',
  'Highlights',
  'Interviews',
  'Training',
  'Events',
  'Community',
  'Other',
] as const;

export type VideoCategory = typeof VIDEO_CATEGORIES[number];

// Plan pricing config
export interface PlanConfig {
  id: SubscriptionPlan;
  name: string;
  price: number;
  interval: string;
  features: string[];
  highlighted?: boolean;
}

export const PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'forever',
    features: [
      '3 videos per month',
      'Limited events access',
      'Community access',
      'Invite friends',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    interval: 'month',
    features: [
      'Full video library',
      'All events access',
      'Member dashboard',
      'Priority support',
      'Invite friends',
    ],
    highlighted: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 19.99,
    interval: 'month',
    features: [
      'Everything in Pro',
      'Exclusive events',
      'Early access content',
      'VIP badge on profile',
      'Priority RSVP',
    ],
  },
];
