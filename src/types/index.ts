export type AppRole = 'pending' | 'member' | 'admin';

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
