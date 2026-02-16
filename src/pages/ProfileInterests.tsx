import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MobileHeader from "@/components/MobileHeader";
import DesktopNav from "@/components/DesktopNav";
import BottomNav from "@/components/BottomNav";
import { motion } from "framer-motion";

type InterestsData = {
  favorite_sports: string[] | null;
  favorite_teams_players: string[] | null;
  sports_experience_types: string[] | null;
  other_interests: string[] | null;
  event_comfort_level: string | null;
  participation_preferences: string[] | null;
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const ProfileInterests = () => {
  const [data, setData] = useState<InterestsData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("favorite_sports, favorite_teams_players, sports_experience_types, other_interests, event_comfort_level, participation_preferences")
        .eq("id", user.id)
        .maybeSingle();
      setData(profile);
      setLoading(false);
    };
    fetch();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pb-20 md:pb-8 pt-[92px] md:pt-[48px]">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={staggerItem} className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/profile")} className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-sans text-foreground">My Interests</h1>
            </motion.div>

            {data.favorite_sports && data.favorite_sports.length > 0 && (
              <motion.div variants={staggerItem}>
                <Card>
                  <CardHeader><CardTitle>Favorite Sports</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {data.favorite_sports.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {data.favorite_teams_players && data.favorite_teams_players.length > 0 && (
              <motion.div variants={staggerItem}>
                <Card>
                  <CardHeader><CardTitle>Favorite Teams & Players</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {data.favorite_teams_players.map(t => <Badge key={t} variant="outline">{t}</Badge>)}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {data.sports_experience_types && data.sports_experience_types.length > 0 && (
              <motion.div variants={staggerItem}>
                <Card>
                  <CardHeader><CardTitle>How I Experience Sports</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {data.sports_experience_types.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {data.other_interests && data.other_interests.length > 0 && (
              <motion.div variants={staggerItem}>
                <Card>
                  <CardHeader><CardTitle>Other Interests</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {data.other_interests.map(i => <Badge key={i} variant="outline">{i}</Badge>)}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {(data.event_comfort_level || (data.participation_preferences && data.participation_preferences.length > 0)) && (
              <motion.div variants={staggerItem}>
                <Card>
                  <CardHeader><CardTitle>Event Preferences</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {data.event_comfort_level && (
                      <div>
                        <p className="text-sm font-medium mb-2">Comfort Level</p>
                        <Badge variant="secondary">{data.event_comfort_level}</Badge>
                      </div>
                    )}
                    {data.participation_preferences && data.participation_preferences.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">I want to</p>
                        <div className="flex flex-wrap gap-2">
                          {data.participation_preferences.map(p => <Badge key={p} variant="outline">{p}</Badge>)}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ProfileInterests;
