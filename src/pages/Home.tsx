import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHomepageData } from "@/hooks/useHomepageData";
import BottomNav from "@/components/BottomNav";
import WelcomeBanner from "@/components/WelcomeBanner";
import FeedFilterChips from "@/components/feed/FeedFilterChips";
import StoriesRow from "@/components/feed/StoriesRow";
import NewsArticleCard from "@/components/feed/NewsArticleCard";
import FanPostCard from "@/components/feed/FanPostCard";
import EventFeedCard from "@/components/feed/EventFeedCard";
import ScoreFeedCard from "@/components/feed/ScoreFeedCard";
import lLogo from "@/assets/loverball-script-logo.png";

/* ── Mock stories ── */
const MOCK_STORIES = [
  { id: "1", name: "Jada", avatar: "", seen: false },
  { id: "2", name: "Maya", avatar: "", seen: false },
  { id: "3", name: "Toni", avatar: "", seen: false },
  { id: "4", name: "Ari", avatar: "", seen: true },
  { id: "5", name: "Lex", avatar: "", seen: true },
  { id: "6", name: "Bri", avatar: "", seen: true },
];

/* ── Mock fan posts ── */
const MOCK_FAN_POSTS = [
  { id: "fp1", authorName: "Jada Williams", authorAvatar: "", content: "March Madness bracket is already busted but I don't even care 😂🏀 Anyone watching the Sweet 16 games tonight? Let's get a group watch going!", mediaUrl: null, mediaType: null, createdAt: new Date(Date.now() - 3600000).toISOString(), likesCount: 24, commentsCount: 8 },
  { id: "fp2", authorName: "Toni Rivera", authorAvatar: "", content: "Lakers comeback in the 4th was WILD last night. AD had 38 points and LeBron with the dagger three 💪🏀 Playoff push is real!", mediaUrl: null, mediaType: null, createdAt: new Date(Date.now() - 7200000).toISOString(), likesCount: 42, commentsCount: 15 },
  { id: "fp3", authorName: "Ari Chen", authorAvatar: "", content: "LAFC home opener this weekend — who's tailgating at the Banc? Bringing the grill and good vibes 🍕⚽✨ DM me for the meetup spot!", mediaUrl: null, mediaType: null, createdAt: new Date(Date.now() - 14400000).toISOString(), likesCount: 67, commentsCount: 31 },
];

/* ── Mock scores (March 2026 — NBA, NHL, MLS, NCAA) ── */
const MOCK_SCORES = [
  { homeTeam: "Lakers", awayTeam: "Clippers", homeScore: 108, awayScore: 102, isLive: true, gameTime: "Q4 · 3:42" },
  { homeTeam: "Kings", awayTeam: "Ducks", homeScore: 3, awayScore: 2, isLive: false, gameTime: "Final" },
];

const Home = () => {
  const { user } = useAuth();
  const { data: homepageData } = useHomepageData();
  const [unreadCount, setUnreadCount] = useState(0);
  const [profile, setProfile] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState("For You");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false)
      .then(({ count }) => setUnreadCount(count || 0));
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("name, profile_photo_url, favorite_la_teams, favorite_sports")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [user?.id]);

  const userTeams = (profile?.favorite_la_teams || []) as string[];
  const filters = useMemo(() => ["For You", "Following", ...userTeams], [userTeams]);

  const news = homepageData?.trending_news ?? [];
  const events = homepageData?.upcoming_events ?? [];

  /* ── Interleave algorithm: every 3 news → 1 fan post → 1 event/score ── */
  const feedItems = useMemo(() => {
    const items: Array<{ type: string; data: any }> = [];
    let newsIdx = 0;
    let postIdx = 0;
    let eventIdx = 0;
    let scoreIdx = 0;

    const maxItems = Math.max(news.length, 12);

    for (let i = 0; i < maxItems; i++) {
      // 3 news articles
      for (let n = 0; n < 3 && newsIdx < news.length; n++, newsIdx++) {
        items.push({ type: "news", data: news[newsIdx] });
      }

      // 1 fan post
      if (postIdx < MOCK_FAN_POSTS.length) {
        items.push({ type: "fan_post", data: MOCK_FAN_POSTS[postIdx++] });
      }

      // alternate event and score
      if (i % 2 === 0 && eventIdx < events.length) {
        items.push({ type: "event", data: events[eventIdx++] });
      } else if (scoreIdx < MOCK_SCORES.length) {
        items.push({ type: "score", data: MOCK_SCORES[scoreIdx++] });
      } else if (eventIdx < events.length) {
        items.push({ type: "event", data: events[eventIdx++] });
      }

      if (newsIdx >= news.length && postIdx >= MOCK_FAN_POSTS.length) break;
    }

    return items;
  }, [news, events]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <WelcomeBanner />

      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-border/10">
        <img src={lLogo} alt="Loverball" className="h-8 w-auto" />
        <Link to="/inbox" className="relative p-2 -mr-2">
          <Bell className="w-5 h-5 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-accent" />
          )}
        </Link>
      </header>

      {/* ── Filter Chips ── */}
      <FeedFilterChips
        filters={filters}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* ── Stories Row ── */}
      <StoriesRow
        userAvatar={profile?.profile_photo_url || ""}
        userName={profile?.name || ""}
        stories={MOCK_STORIES}
      />

      {/* ── Feed ── */}
      <main className="px-4 space-y-3 mt-2">
        {feedItems.length === 0 && (
          <>
            {/* Fallback demo cards when no API data */}
            <FanPostCard {...MOCK_FAN_POSTS[0]} />
            <EventFeedCard
              id="demo1"
              title="Sober Brunch & Basketball"
              eventDate="2026-04-05"
              eventTime="11:00 AM"
              venueName="The Courtyard"
              city="Los Angeles"
              slug={null}
            />
            <ScoreFeedCard {...MOCK_SCORES[0]} />
            <FanPostCard {...MOCK_FAN_POSTS[1]} />
            <EventFeedCard
              id="demo2"
              title="WNBA Season Opener Watch Party"
              eventDate="2026-05-17"
              eventTime="7:00 PM"
              venueName="Crypto.com Arena"
              city="Los Angeles"
              slug={null}
            />
            <ScoreFeedCard {...MOCK_SCORES[1]} />
            <FanPostCard {...MOCK_FAN_POSTS[2]} />
          </>
        )}

        {feedItems.map((item, idx) => {
          switch (item.type) {
            case "news":
              return (
                <NewsArticleCard
                  key={`news-${idx}`}
                  id={item.data.id}
                  title={item.data.title}
                  summary={item.data.summary}
                  source={item.data.source}
                  sourceUrl={item.data.source_url}
                  imageUrl={item.data.image_url}
                  category={item.data.category}
                  sportTags={item.data.sport_tags}
                  createdAt={item.data.created_at}
                />
              );
            case "fan_post":
              return <FanPostCard key={`post-${idx}`} {...item.data} />;
            case "event":
              return (
                <EventFeedCard
                  key={`event-${idx}`}
                  id={item.data.id}
                  title={item.data.title}
                  eventDate={item.data.event_date}
                  eventTime={item.data.event_time}
                  venueName={item.data.venue_name}
                  city={item.data.city}
                  slug={item.data.slug}
                />
              );
            case "score":
              return <ScoreFeedCard key={`score-${idx}`} {...item.data} />;
            default:
              return null;
          }
        })}
      </main>

      <BottomNav />
    </div>
  );
};

export default Home;
