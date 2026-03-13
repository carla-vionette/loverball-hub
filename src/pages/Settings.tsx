import { useState, useEffect } from "react";
import DesktopNav from "@/components/DesktopNav";
import BottomNav from "@/components/BottomNav";
import MobileHeader from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Bell, Eye, EyeOff, MapPin, Save } from "lucide-react";
import { LA_PRO_TEAMS, LA_D1_COLLEGES } from "@/lib/laTeamsConfig";
import { SPORTS_OPTIONS } from "@/lib/onboardingOptions";

interface NotificationPref {
  id?: string;
  preference_type: string;
  preference_key: string;
  game_reminders: boolean;
  event_alerts: boolean;
  news_updates: boolean;
  sms_enabled: boolean;
}

interface FeedPrefs {
  hidden_sports: string[];
  hidden_event_types: string[];
  home_venue: string;
  home_neighborhood: string;
  preferred_distance_miles: number;
}

const ALL_TEAMS = [
  ...LA_PRO_TEAMS.map(t => ({ key: t.shortName, name: t.name, league: t.league, type: "team" as const })),
  ...LA_D1_COLLEGES.map(t => ({ key: t.shortName, name: t.name, league: t.conference, type: "team" as const })),
];

const EVENT_TYPES = [
  "Watch Party",
  "Mixer",
  "Panel",
  "Pickup Game",
  "Tournament",
  "Networking",
  "Viewing Party",
];

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<Map<string, NotificationPref>>(new Map());
  const [feedPrefs, setFeedPrefs] = useState<FeedPrefs>({
    hidden_sports: [],
    hidden_event_types: [],
    home_venue: "",
    home_neighborhood: "",
    preferred_distance_miles: 25,
  });
  const [userTeams, setUserTeams] = useState<string[]>([]);

  useEffect(() => {
    if (user) loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;
    try {
      // Load notification prefs
      const { data: nPrefs } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id);

      const prefsMap = new Map<string, NotificationPref>();
      nPrefs?.forEach(p => {
        prefsMap.set(`${p.preference_type}:${p.preference_key}`, p as NotificationPref);
      });
      setNotifPrefs(prefsMap);

      // Load feed prefs
      const { data: fPrefs } = await supabase
        .from("user_feed_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fPrefs) {
        setFeedPrefs({
          hidden_sports: fPrefs.hidden_sports || [],
          hidden_event_types: fPrefs.hidden_event_types || [],
          home_venue: fPrefs.home_venue || "",
          home_neighborhood: fPrefs.home_neighborhood || "",
          preferred_distance_miles: fPrefs.preferred_distance_miles || 25,
        });
      }

      // Load user's favorite teams
      const { data: profile } = await supabase
        .from("profiles")
        .select("favorite_la_teams")
        .eq("id", user.id)
        .single();

      setUserTeams(profile?.favorite_la_teams || []);
    } catch (err) {
      // Preferences load error handled silently
    } finally {
      setLoading(false);
    }
  };

  const getOrCreatePref = (type: string, key: string): NotificationPref => {
    const existing = notifPrefs.get(`${type}:${key}`);
    return existing || {
      preference_type: type,
      preference_key: key,
      game_reminders: true,
      event_alerts: true,
      news_updates: false,
      sms_enabled: false,
    };
  };

  const updateNotifPref = (type: string, key: string, field: keyof NotificationPref, value: boolean) => {
    const pref = getOrCreatePref(type, key);
    const updated = { ...pref, [field]: value };
    setNotifPrefs(prev => {
      const next = new Map(prev);
      next.set(`${type}:${key}`, updated);
      return next;
    });
  };

  const toggleHiddenSport = (sport: string) => {
    setFeedPrefs(prev => ({
      ...prev,
      hidden_sports: prev.hidden_sports.includes(sport)
        ? prev.hidden_sports.filter(s => s !== sport)
        : [...prev.hidden_sports, sport],
    }));
  };

  const toggleHiddenEventType = (type: string) => {
    setFeedPrefs(prev => ({
      ...prev,
      hidden_event_types: prev.hidden_event_types.includes(type)
        ? prev.hidden_event_types.filter(t => t !== type)
        : [...prev.hidden_event_types, type],
    }));
  };

  const saveAllPreferences = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Save notification prefs
      const prefsToUpsert = Array.from(notifPrefs.values()).map(p => ({
        user_id: user.id,
        preference_type: p.preference_type,
        preference_key: p.preference_key,
        game_reminders: p.game_reminders,
        event_alerts: p.event_alerts,
        news_updates: p.news_updates,
        sms_enabled: p.sms_enabled,
      }));

      if (prefsToUpsert.length > 0) {
        const { error: nError } = await supabase
          .from("notification_preferences")
          .upsert(prefsToUpsert, { onConflict: "user_id,preference_type,preference_key" });
        if (nError) throw nError;
      }

      // Save feed prefs
      const { error: fError } = await supabase
        .from("user_feed_preferences")
        .upsert({
          user_id: user.id,
          hidden_sports: feedPrefs.hidden_sports,
          hidden_event_types: feedPrefs.hidden_event_types,
          home_venue: feedPrefs.home_venue || null,
          home_neighborhood: feedPrefs.home_neighborhood || null,
          preferred_distance_miles: feedPrefs.preferred_distance_miles,
        }, { onConflict: "user_id" });

      if (fError) throw fError;
      toast.success("Preferences saved!");
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-64">
        <MobileHeader />
        <DesktopNav />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const favoriteTeams = ALL_TEAMS.filter(t => userTeams.includes(t.key));
  const otherTeams = ALL_TEAMS.filter(t => !userTeams.includes(t.key));

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-64">
      <MobileHeader />
      <DesktopNav />

      <main className="container mx-auto px-4 pt-20 md:pt-8 py-8 pb-20 md:pb-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground text-sm">Manage notifications, feed & location preferences</p>
          </div>
          <Button onClick={saveAllPreferences} disabled={saving} className="rounded-full gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </div>

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="bg-transparent gap-2 h-auto p-0 w-full justify-start overflow-x-auto">
            <TabsTrigger value="notifications" className="rounded-full px-5 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Bell className="h-4 w-4 mr-2" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="feed" className="rounded-full px-5 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Eye className="h-4 w-4 mr-2" /> Feed
            </TabsTrigger>
            <TabsTrigger value="location" className="rounded-full px-5 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MapPin className="h-4 w-4 mr-2" /> Location
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            {/* Favorite teams section */}
            {favoriteTeams.length > 0 && (
              <Card className="rounded-2xl border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Your Teams</CardTitle>
                  <p className="text-sm text-muted-foreground">Set notifications for your favorite teams</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {favoriteTeams.map(team => {
                    const pref = getOrCreatePref("team", team.key);
                    return (
                      <div key={team.key} className="space-y-3 pb-4 border-b border-border/30 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{team.name}</p>
                            <p className="text-xs text-muted-foreground">{team.league}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Game reminders</span>
                            <Switch
                              checked={pref.game_reminders}
                              onCheckedChange={(v) => updateNotifPref("team", team.key, "game_reminders", v)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Event alerts</span>
                            <Switch
                              checked={pref.event_alerts}
                              onCheckedChange={(v) => updateNotifPref("team", team.key, "event_alerts", v)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">News updates</span>
                            <Switch
                              checked={pref.news_updates}
                              onCheckedChange={(v) => updateNotifPref("team", team.key, "news_updates", v)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">SMS alerts</span>
                            <Switch
                              checked={pref.sms_enabled}
                              onCheckedChange={(v) => updateNotifPref("team", team.key, "sms_enabled", v)}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Other teams */}
            {otherTeams.length > 0 && (
              <Card className="rounded-2xl border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Other Teams</CardTitle>
                  <p className="text-sm text-muted-foreground">Enable notifications for additional teams</p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {otherTeams.map(team => {
                      const pref = notifPrefs.get(`team:${team.key}`);
                      const isActive = pref && (pref.game_reminders || pref.event_alerts);
                      return (
                        <Badge
                          key={team.key}
                          variant={isActive ? "default" : "outline"}
                          className="cursor-pointer rounded-full px-3 py-1.5 text-xs transition-colors"
                          onClick={() => {
                            if (isActive) {
                              updateNotifPref("team", team.key, "game_reminders", false);
                              updateNotifPref("team", team.key, "event_alerts", false);
                            } else {
                              updateNotifPref("team", team.key, "game_reminders", true);
                              updateNotifPref("team", team.key, "event_alerts", true);
                            }
                          }}
                        >
                          {team.key}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Global notification settings */}
            <Card className="rounded-2xl border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">General Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "new_messages", label: "New messages", desc: "DMs and group chat messages" },
                  { key: "event_reminders", label: "Event reminders", desc: "Reminders for RSVP'd events" },
                  { key: "connection_requests", label: "Connection requests", desc: "When someone wants to connect" },
                  { key: "weekly_recap", label: "Weekly recap", desc: "Your week in sports summary" },
                ].map(item => {
                  const pref = getOrCreatePref("general", item.key);
                  return (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch
                        checked={pref.event_alerts}
                        onCheckedChange={(v) => updateNotifPref("general", item.key, "event_alerts", v)}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feed Tab */}
          <TabsContent value="feed" className="space-y-6">
            <Card className="rounded-2xl border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <EyeOff className="h-5 w-5" /> Hidden Sports
                </CardTitle>
                <p className="text-sm text-muted-foreground">Hide these sports from your feed and recommendations</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {SPORTS_OPTIONS.filter(s => s !== "Other").map(sport => {
                    const isHidden = feedPrefs.hidden_sports.includes(sport);
                    return (
                      <Badge
                        key={sport}
                        variant={isHidden ? "destructive" : "outline"}
                        className="cursor-pointer rounded-full px-3 py-1.5 text-xs transition-colors"
                        onClick={() => toggleHiddenSport(sport)}
                      >
                        {isHidden && <EyeOff className="h-3 w-3 mr-1" />}
                        {sport}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Hidden Event Types</CardTitle>
                <p className="text-sm text-muted-foreground">Hide these event types from your feed</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {EVENT_TYPES.map(type => {
                    const isHidden = feedPrefs.hidden_event_types.includes(type);
                    return (
                      <Badge
                        key={type}
                        variant={isHidden ? "destructive" : "outline"}
                        className="cursor-pointer rounded-full px-3 py-1.5 text-xs transition-colors"
                        onClick={() => toggleHiddenEventType(type)}
                      >
                        {isHidden && <EyeOff className="h-3 w-3 mr-1" />}
                        {type}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Location Tab */}
          <TabsContent value="location" className="space-y-6">
            <Card className="rounded-2xl border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" /> Home Venue
                </CardTitle>
                <p className="text-sm text-muted-foreground">Set your preferred venue for location-based recommendations</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Favorite venue</label>
                  <Input
                    placeholder="e.g. Crypto.com Arena, SoFi Stadium..."
                    value={feedPrefs.home_venue}
                    onChange={(e) => setFeedPrefs(prev => ({ ...prev, home_venue: e.target.value }))}
                    className="rounded-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Neighborhood</label>
                  <Input
                    placeholder="e.g. Downtown LA, Santa Monica, Pasadena..."
                    value={feedPrefs.home_neighborhood}
                    onChange={(e) => setFeedPrefs(prev => ({ ...prev, home_neighborhood: e.target.value }))}
                    className="rounded-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Preferred distance: {feedPrefs.preferred_distance_miles} miles
                  </label>
                  <Slider
                    value={[feedPrefs.preferred_distance_miles]}
                    onValueChange={([v]) => setFeedPrefs(prev => ({ ...prev, preferred_distance_miles: v }))}
                    min={5}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>5 mi</span>
                    <span>100 mi</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
};

export default Settings;
