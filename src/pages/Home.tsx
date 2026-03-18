import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHomepageData } from "@/hooks/useHomepageData";

// Existing feed components — unchanged
import FeedFilterChips from "@/components/feed/FeedFilterChips";
import StoriesRow from "@/components/feed/StoriesRow";
import NewsArticleCard from "@/components/feed/NewsArticleCard";
import FanPostCard from "@/components/feed/FanPostCard";
import EventFeedCard from "@/components/feed/EventFeedCard";
import ScoreFeedCard from "@/components/feed/ScoreFeedCard";

// New AURA-styled components
import AuraHeroSection from "@/components/AuraHeroSection";
import TrendingCards from "@/components/TrendingCards";
import AuraMarquee from "@/components/AuraMarquee";
import AuraBottomNav from "@/components/AuraBottomNav";

// Assets
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
  { id: "fp1", authorName: "Jada Williams", authorAvatar: "", content: "March Madness bracket is already busted but I don't even care \u{1F602}\u{1F3C0} Anyone watching the Sweet 16 games tonight? Let's get a group watch going!", mediaUrl: null, mediaType: null, createdAt: new Date(Date.now() - 3600000).toISOString(), likesCount: 24, commentsCount: 8 },
  { id: "fp2", authorName: "Toni Rivera", authorAvatar: "", content: "Lakers comeback in the 4th was WILD last night. AD had 38 points and LeBron with the dagger three \u{1F4AA}\u{1F3C0} Playoff push is real!", mediaUrl: null, mediaType: null, createdAt: new Date(Date.now() - 7200000).toISOString(), likesCount: 42, commentsCount: 15 },
  { id: "fp3", authorName: "Ari Chen", authorAvatar: "", content: "LAFC home opener this weekend \u2014 who's tailgating at the Banc? Bringing the grill and good vibes \u{1F355}\u26BD\u2728 DM me for the meetup spot!", mediaUrl: null, mediaType: null, createdAt: new Date(Date.now() - 14400000).toISOString(), likesCount: 67, commentsCount: 31 },
];

/* ── Mock scores (March 2026) ── */
const MOCK_SCORES = [
  { homeTeam: "Lakers", awayTeam: "Clippers", homeScore: 108, awayScore: 102, isLive: true, gameTime: "Q4 \u00B7 3:42" },
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
      for (let n = 0; n < 3 && newsIdx < news.length; n++, newsIdx++) {
        items.push({ type: "news", data: news[newsIdx] });
      }
      if (postIdx < MOCK_FAN_POSTS.length) {
        items.push({ type: "fan_post", data: MOCK_FAN_POSTS[postIdx++] });
      }
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
    <div className="bg-base-100 text-white font-sans w-full min-h-screen overflow-x-hidden pb-28">
      {/* Noise overlay */}
      <div className="noise-bg" />

      {/* ── AURA Header ── */}
      <header className="w-full flex justify-between items-center p-6 relative z-50">
        <img src={lLogo} alt="Loverball" className="h-8 mix-blend-difference" />
        <Link to="/inbox" className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center bg-white/5 backdrop-blur-md hover:bg-white/10 transition-colors relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-orange text-black text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
      </header>

      {/* ── Hero Section ── */}
      <AuraHeroSection />

      {/* ── Marquee Ticker ── */}
      <AuraMarquee />

      {/* ── Trending Cards ── */}
      <TrendingCards />

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

      {/* ── Feed Section ── */}
      <section className="px-4 mt-4 relative z-20">
        {/* Feed header */}
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/10">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-pink to-accent-orange flex items-center justify-center text-white text-lg font-display shadow-lg shadow-accent-orange/20">
            LB
          </div>
          <div>
            <h3 className="font-sans font-medium text-lg text-white">Your Feed</h3>
            <p className="font-sans font-light text-[10px] uppercase tracking-widest text-white/50 mt-0.5">Updated Daily</p>
          </div>
        </div>

        <main className="space-y-3">
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
      </section>

      {/* ── Bottom Nav ── */}
      <AuraBottomNav />
    </div>
  );
};

export default Home;
