import React, { useState, useRef, useCallback, useEffect } from "react ";
import { Search, Users, CheckCircle, Play, ChevronLeft, ChevronRight, Clock, Calendar, MapPin, Newspaper, ExternalLink, Tv, Mic } from "lucide-react ";
import { Input } from "@/components/ui/input ";
import { Badge } from "@/components/ui/badge ";
import { Card } from "@/components/ui/card ";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar ";
import BottomNav from "@/components/BottomNav ";
import TeamFollowSection from "@/components/TeamFollowSection ";
import { supabase } from "@/integrations/supabase/client ";
import { format, formatDistanceToNow } from "date-fns ";
import { getSportEmoji, getSportColor, getCategoryEmoji, generateSummary } from "@/services/newsArticleService ";

const formatFollowers = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

// ─── DB Channel type ───
interface DbChannel {
  id: string;
  channel_name: string;
  slug: string;
  description: string | null;
  channel_type: string;
  league: string | null;
  sport_focus: string | null;
  avatar_url: string | null;
  verified: boolean;
  follower_count: number;
}

const CHANNEL_CATEGORIES = ["All ","Teams ","Creators ","Official "];

// ─── Scroll Row ───
const ScrollRow = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const check = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 10);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    check();
    el.addEventListener("scroll ", check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => { el.removeEventListener("scroll ", check); ro.disconnect(); };
  }, [check]);

  const scroll = (dir:"left " |"right ") => {
    ref.current?.scrollBy({ left: dir ==="left " ? -280 : 280, behavior:"smooth " });
  };

  return (
    <div className={`relative group ${className}`}>
      {canLeft && (
        <button onClick={() => scroll("left ")} className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-card/90 border border-border/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm ">
          <ChevronLeft className="w-4 h-4 text-foreground " />
        </button>
      )}
      {canRight && (
        <button onClick={() => scroll("right ")} className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-card/90 border border-border/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm ">
          <ChevronRight className="w-4 h-4 text-foreground " />
        </button>
      )}
      <div ref={ref} className="flex gap-3 overflow-x-auto pb-2 scrollbar-none scroll-smooth ">
        {children}
      </div>
    </div>
  );
};

// ─── Follow Button ───
const FollowButton = ({ compact = false }: { compact?: boolean }) => {
  const [following, setFollowing] = useState(false);
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFollowing(!following); }}
      className={`rounded-full text-xs font-semibold transition-all duration-200 ${compact ?"px-3 py-1" :"px-4 py-1.5"} ${
        following
          ?"bg-secondary text-muted-foreground border border-border "
          :"bg-accent text-accent-foreground hover:bg-accent/90"
      }`}
    >
      {following ?"Following " :"Follow "}
    </button>
  );
};

// ─── Channel Card ───
const ChannelCard = ({ channel }: { channel: DbChannel }) => {
  const initials = channel.channel_name.split(" ").map(w => w[0]).join("").slice(0, 2);
  const typeColor = channel.channel_type ==="team " ?"bg-accent " : channel.channel_type ==="creator " ?"bg-primary " :"bg-primary ";

  return (
    <a href={`/channel/${channel.slug}`} className="block ">
      <Card className="p-4 hover:shadow-md transition-all group cursor-pointer ">
        <div className="flex items-start gap-3">
          <Avatar className="w-12 h-12 flex-shrink-0">
            {channel.avatar_url && <AvatarImage src={channel.avatar_url} />}
            <AvatarFallback className={`${typeColor} text-white font-bold text-sm`}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="font-semibold text-sm text-foreground truncate ">{channel.channel_name}</h3>
              {channel.verified && <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground mb-1.5">@{channel.slug}</p>
            <div className="flex items-center gap-2 mb-2 flex-wrap ">
              {channel.league && (
                <Badge className="bg-accent/10 text-accent text-[10px] font-semibold border-0 rounded-full ">{channel.league}</Badge>
              )}
              {channel.sport_focus && (
                <Badge variant="outline " className="text-[10px] rounded-full ">{channel.sport_focus}</Badge>
              )}
              <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> {formatFollowers(channel.follower_count)}</span>
            </div>
            {channel.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{channel.description}</p>
            )}
          </div>
          <div className="flex-shrink-0 pt-1">
            <FollowButton />
          </div>
        </div>
      </Card>
    </a>
  );
};

// ─── Compact Creator Card ───
const CreatorCard = ({ channel }: { channel: DbChannel }) => {
  const initials = channel.channel_name.split(" ").map(w => w[0]).join("").slice(0, 2);

  return (
    <a href={`/channel/${channel.slug}`} className="flex-shrink-0 w-[160px] block ">
      <Card className="p-3 hover:shadow-md transition-all cursor-pointer h-full ">
        <div className="flex flex-col items-center text-center gap-2">
          <Avatar className="w-14 h-14">
            {channel.avatar_url && <AvatarImage src={channel.avatar_url} />}
            <AvatarFallback className="bg-primary text-white font-bold ">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center justify-center gap-1">
              <h3 className="font-semibold text-xs truncate ">{channel.channel_name}</h3>
              {channel.verified && <CheckCircle className="w-3 h-3 text-primary " />}
            </div>
            <p className="text-[10px] text-muted-foreground ">{formatFollowers(channel.follower_count)} followers</p>
          </div>
          {channel.sport_focus && (
            <Badge className="bg-accent/10 text-accent text-[10px] font-semibold border-0 rounded-full ">{channel.sport_focus}</Badge>
          )}
          <FollowButton compact />
        </div>
      </Card>
    </a>
  );
};

// ─── News Article Card ───
interface FeedArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  source_url: string;
  image_url: string | null;
  category: string;
  sport_tags: string[];
  team_tags: string[];
  created_at: string;
}

const FALLBACK_GRADIENTS: Record<string, string> = {
  basketball:"from-orange-500 to-amber-600",
  soccer:"from-emerald-500 to-green-600",
  football:"from-amber-800 to-yellow-700",
  tennis:"from-lime-500 to-green-500",
  hockey:"from-blue-500 to-cyan-600",
  default:"from-accent to-primary ",
};

const NewsArticleCard = ({ article }: { article: FeedArticle }) => {
  const primarySport = article.sport_tags?.[0] || "";
  const emoji = getSportEmoji(primarySport);
  const catEmoji = getCategoryEmoji(article.category, primarySport);
  const sportColor = getSportColor(primarySport);
  const gradient = FALLBACK_GRADIENTS[primarySport.toLowerCase()] || FALLBACK_GRADIENTS.default;
  const summary = article.summary || generateSummary(article.title, article.source);
  const timeAgo = (() => {
    try { return formatDistanceToNow(new Date(article.created_at), { addSuffix: true }); } catch { return ""; }
  })();

  return (
    <a href={article.source_url} target="_blank " rel="noopener noreferrer " className="flex-shrink-0 w-[260px] block group ">
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 h-full border-border/20 flex flex-col ">
        <div className="h-32 overflow-hidden relative ">
          {article.image_url ? (
            <img src={article.image_url} alt= "" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy " />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-1.5 p-3`}>
              <span className="text-4xl drop-shadow-lg ">{emoji}</span>
              <span className="text-background/90 text-[9px] font-bold uppercase tracking-widest text-center line-clamp-1">{primarySport || article.category || "Sports "}</span>
            </div>
          )}
          {primarySport && (
            <div className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-md " style={{ backgroundColor: sportColor +"E6 " }}>{emoji}</div>
          )}
        </div>
        <div className="p-3 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="secondary " className="text-[10px] font-semibold px-2 py-0 rounded-full capitalize ">{catEmoji} {primarySport || article.category || "Sports "}</Badge>
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {timeAgo}</span>
          </div>
          <h3 className="font-semibold text-xs text-foreground leading-snug line-clamp-2 group-hover:text-accent transition-colors mb-1">{article.title}</h3>
          <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2 mb-2 flex-1">{summary}</p>
          <div className="flex items-center justify-between mt-auto ">
            {article.source && <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold ">{article.source}</p>}
            <span className="text-[10px] font-semibold text-accent flex items-center gap-1 group-hover:gap-1.5 transition-all ml-auto ">Read full article <ExternalLink className="w-2.5 h-2.5" /></span>
          </div>
        </div>
      </Card>
    </a>
  );
};

// ─── Main Page ───
const Explore = () => {
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("All ");
  const [searchEvents, setSearchEvents] = useState<any[]>([]);
  const [searchUsers, setSearchUsers] = useState<any[]>([]);
  const [newsArticles, setNewsArticles] = useState<FeedArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  // Database channels
  const [teamChannels, setTeamChannels] = useState<DbChannel[]>([]);
  const [creatorChannels, setCreatorChannels] = useState<DbChannel[]>([]);
  const [allChannels, setAllChannels] = useState<DbChannel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);

  // Fetch channels from database
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const { data, error } = await supabase
          .from("creator_channels ")
          .select("id, channel_name, slug, description, channel_type, league, sport_focus, avatar_url, verified, follower_count ")
          .eq("status ","active ")
          .order("channel_name ");
        if (error) throw error;
        const channels = (data || []) as DbChannel[];
        setAllChannels(channels);
        setTeamChannels(channels.filter(c => c.channel_type ==="team "));
        setCreatorChannels(channels.filter(c => c.channel_type ==="creator "));
      } catch {
        // silently handle
      } finally {
        setChannelsLoading(false);
      }
    };
    fetchChannels();
  }, []);

  // Fetch news articles
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data, error } = await supabase.from("feed_items ").select("*").order("created_at ", { ascending: false }).limit(12);
        if (error) throw error;
        setNewsArticles(data || []);
      } catch { setNewsArticles([]); }
      finally { setNewsLoading(false); }
    };
    fetchNews();
  }, []);

  // Search
  useEffect(() => {
    if (!search || search.length < 2) {
      setSearchEvents([]);
      setSearchUsers([]);
      return;
    }
    const timer = setTimeout(async () => {
      const [eventsRes, usersRes] = await Promise.all([
        supabase.from("events ").select("id, title, event_date, event_time, city, event_type, sport_tags, image_url ").eq("status ","published ").or(`title.ilike.%${search}%,city.ilike.%${search}%`).limit(5),
        supabase.from("profiles ").select("id, name, profile_photo_url, city ").ilike("name ", `%${search}%`).limit(5),
      ]);
      setSearchEvents(eventsRes.data || []);
      setSearchUsers(usersRes.data || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Filter channels by search and category
  const filteredChannels = allChannels.filter(ch => {
    const matchFilter =
      channelFilter ==="All " ||
      (channelFilter ==="Teams " && ch.channel_type ==="team ") ||
      (channelFilter ==="Creators " && ch.channel_type ==="creator ") ||
      (channelFilter ==="Official " && ch.channel_type ==="loverball_official ");
    const matchSearch = !search || ch.channel_name.toLowerCase().includes(search.toLowerCase()) ||
      (ch.slug || "").toLowerCase().includes(search.toLowerCase()) ||
      (ch.description || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const hasUnifiedResults = search && search.length >= 2;
  const isSearching = !!search;

  return (
    <div className="min-h-screen bg-background ">
      <BottomNav />

      <main className="pb-24 md:pb-0">
        <div className="max-w-3xl mx-auto px-5 md:px-10 py-6">
          <h1 className="font-display text-2xl md:text-[28px] font-bold uppercase tracking-tight mb-5">Discover</h1>

          {/* Search */}
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground " />
            <Input placeholder="Search channels, events, people..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 rounded-full bg-secondary border-border/20" />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground ">✕</button>}
          </div>

          {/* Channel Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none ">
            {CHANNEL_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setChannelFilter(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  channelFilter === cat ?"bg-primary text-primary-foreground shadow-sm scale-105" :"border border-foreground/20 text-foreground hover:bg-secondary "
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Unified search results */}
          {hasUnifiedResults && (
            <>
              {searchEvents.length > 0 && (
                <section className="mb-6">
                  <h2 className="font-display text-sm font-semibold uppercase tracking-wide mb-2 flex items-center gap-2 text-muted-foreground "><Calendar className="w-3.5 h-3.5" /> Events</h2>
                  <div className="space-y-2">
                    {searchEvents.map((ev: any) => (
                      <a key={ev.id} href={`/event/${ev.id}`} className="block ">
                        <Card className="p-3 hover:shadow-md transition-all cursor-pointer ">
                          <div className="flex items-center gap-3">
                            {ev.image_url ? (
                              <img src={ev.image_url} alt={ev.title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Calendar className="w-5 h-5 text-primary " /></div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-foreground truncate ">{ev.title}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground ">
                                <span>{format(new Date(ev.event_date),"MMM d ")}</span>
                                {ev.city && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{ev.city}</span>}
                              </div>
                            </div>
                          </div>
                        </Card>
                      </a>
                    ))}
                  </div>
                </section>
              )}
              {searchUsers.length > 0 && (
                <section className="mb-6">
                  <h2 className="font-display text-sm font-semibold uppercase tracking-wide mb-2 flex items-center gap-2 text-muted-foreground "><Users className="w-3.5 h-3.5" /> People</h2>
                  <div className="space-y-2">
                    {searchUsers.map((u: any) => (
                      <a key={u.id} href={`/member/${u.id}`} className="block ">
                        <Card className="p-3 hover:shadow-md transition-all cursor-pointer ">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10"><AvatarImage src={u.profile_photo_url || undefined} /><AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold ">{u.name?.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-foreground truncate ">{u.name}</p>
                              {u.city && <p className="text-xs text-muted-foreground flex items-center gap-0.5"><MapPin className="w-3 h-3" />{u.city}</p>}
                            </div>
                          </div>
                        </Card>
                      </a>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* Channel results when filtering */}
          {(isSearching || channelFilter !=="All ") && (
            <section className="mb-8">
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide mb-3">
                {channelFilter ==="All " ?"Channels " : channelFilter} ({filteredChannels.length})
              </h2>
              {filteredChannels.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground ">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm ">No channels found</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredChannels.map(ch => <ChannelCard key={ch.id} channel={ch} />)}
                </div>
              )}
            </section>
          )}

          {/* Default browse view */}
          {!isSearching && channelFilter ==="All " && (
            <>
              {/* Teams Section */}
              <TeamFollowSection />

              {/* Latest News */}
              <section className="mb-8">
                <h2 className="font-display text-lg font-semibold uppercase tracking-wide mb-3 flex items-center gap-2"><Newspaper className="w-4 h-4 text-accent " /> Latest News</h2>
                {newsLoading ? (
                  <ScrollRow>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex-shrink-0 w-[260px] rounded-xl overflow-hidden border border-border/20 animate-pulse ">
                        <div className="h-32 bg-muted " /><div className="p-3 space-y-2"><div className="h-3 w-16 bg-muted rounded-full " /><div className="h-3 w-full bg-muted rounded " /><div className="h-3 w-3/4 bg-muted rounded " /></div>
                      </div>
                    ))}
                  </ScrollRow>
                ) : newsArticles.length > 0 ? (
                  <ScrollRow>{newsArticles.map(a => <NewsArticleCard key={a.id} article={a} />)}</ScrollRow>
                ) : (
                  <p className="text-sm text-muted-foreground ">No news articles available right now.</p>
                )}
              </section>

              {/* Team Channels */}
              {teamChannels.length > 0 && (
                <section className="mb-8">
                  <h2 className="font-display text-lg font-semibold uppercase tracking-wide mb-3 flex items-center gap-2"><Tv className="w-4 h-4 text-accent " /> Team Channels</h2>
                  <ScrollRow>
                    {teamChannels.map(ch => <CreatorCard key={ch.id} channel={ch} />)}
                  </ScrollRow>
                </section>
              )}

              {/* Creator Channels */}
              {creatorChannels.length > 0 && (
                <section className="mb-8">
                  <h2 className="font-display text-lg font-semibold uppercase tracking-wide mb-3 flex items-center gap-2"><Mic className="w-4 h-4 text-primary " /> Creator Channels</h2>
                  <ScrollRow>
                    {creatorChannels.map(ch => <CreatorCard key={ch.id} channel={ch} />)}
                  </ScrollRow>
                </section>
              )}

              {/* Browse All Channels */}
              <section>
                <h2 className="font-display text-lg font-semibold uppercase tracking-wide mb-3">Browse All Channels</h2>
                {channelsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse p-4 border rounded-lg "><div className="flex gap-3"><div className="w-12 h-12 rounded-full bg-muted " /><div className="flex-1 space-y-2"><div className="h-4 w-32 bg-muted rounded " /><div className="h-3 w-20 bg-muted rounded " /></div></div></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {allChannels.slice(0, 12).map(ch => <ChannelCard key={ch.id} channel={ch} />)}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Explore;
