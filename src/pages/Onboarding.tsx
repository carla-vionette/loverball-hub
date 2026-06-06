/**
 * Loverball Beta onboarding wizard — 4 steps:
 *  1. Contact & identity (phone, birthdate, zip)
 *  2. Sports fandoms (pro leagues, college leagues, teams typeahead)
 *  3. Vibe & personality tags
 *  4. Confirm & enter
 *
 * Saves all selections to `profiles` and marks has_completed_onboarding=true,
 * then routes to /feed.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronRight, ChevronLeft, X, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Seo from "@/components/Seo";

const PRO_LEAGUES = [
  "NFL", "NBA", "WNBA", "NWSL", "PWHL", "MLB", "MLS", "USWNT", "USMNT", "LPGA", "WTA", "F1",
];
const COLLEGE_LEAGUES = [
  "NCAA Football",
  "NCAA Women's Basketball",
  "NCAA Men's Basketball",
  "NCAA Women's Soccer",
  "NCAA Volleyball",
  "NCAA Softball",
  "NCAA Gymnastics",
];

const VIBE_TAGS: { label: string; emoji: string }[] = [
  { emoji: "🍻", label: "I love watch parties" },
  { emoji: "🙃", label: "I'm a little shy" },
  { emoji: "👯", label: "Here to make new friends" },
  { emoji: "🌱", label: "Building community" },
  { emoji: "💃", label: "I love to dance" },
  { emoji: "🍽️", label: "Total foodie" },
  { emoji: "🎨", label: "Into culture & art" },
  { emoji: "🎵", label: "Music is life" },
  { emoji: "✈️", label: "I travel for games" },
  { emoji: "📱", label: "I follow sports on social" },
  { emoji: "🏟️", label: "Season ticket energy" },
  { emoji: "🧠", label: "I'm a stats nerd" },
  { emoji: "🎉", label: "I'm the hype person" },
  { emoji: "🤝", label: "Looking for a sports crew" },
];

interface TeamRow {
  id: string;
  name: string;
  league: string;
  level: string;
}

const Onboarding = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect") || "/feed";
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // step 1
  const [phone, setPhone] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [zip, setZip] = useState("");
  const [firstName, setFirstName] = useState("");

  // step 2
  const [proLeagues, setProLeagues] = useState<string[]>([]);
  const [collegeLeagues, setCollegeLeagues] = useState<string[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [teamQuery, setTeamQuery] = useState("");
  const [teamResults, setTeamResults] = useState<TeamRow[]>([]);

  // step 3
  const [vibes, setVibes] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?mode=signup&redirect=${encodeURIComponent(`/onboarding?redirect=${redirect}`)}`);
    }
  }, [authLoading, user, navigate, redirect]);

  // Hydrate first name + existing values
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("name, pro_leagues, college_leagues, favorite_teams, vibe_tags")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setFirstName((data.name ?? "").split(" ")[0] || "");
        setProLeagues(data.pro_leagues ?? []);
        setCollegeLeagues(data.college_leagues ?? []);
        setTeams(data.favorite_teams ?? []);
        setVibes(data.vibe_tags ?? []);
      }
      // Sensitive PII: read via owner-only sources
      const { data: sensitive } = await supabase
        .from("profiles_sensitive" as any)
        .select("phone_number, birthday")
        .eq("id", user.id)
        .maybeSingle();
      if (sensitive) {
        setPhone((sensitive as any).phone_number ?? "");
        setBirthdate((sensitive as any).birthday ?? "");
      }
      const { data: loc } = await supabase.rpc("get_my_location");
      if (loc && typeof loc === "object") {
        setZip(((loc as any).zip_code as string) ?? "");
      }
    })();

  }, [user?.id]);

  // Team typeahead
  useEffect(() => {
    const q = teamQuery.trim();
    if (q.length < 2) {
      setTeamResults([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("teams_directory")
        .select("id, name, league, level")
        .ilike("name", `%${q}%`)
        .limit(8);
      if (!cancelled) setTeamResults(data ?? []);
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [teamQuery]);

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const ageOk = useMemo(() => {
    if (!birthdate) return false;
    const dob = new Date(birthdate);
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 18);
    return dob <= cutoff;
  }, [birthdate]);

  const step1Valid = phone.replace(/\D/g, "").length >= 10 && ageOk && /^\d{5}$/.test(zip);
  const step2Valid = proLeagues.length + collegeLeagues.length > 0 || teams.length > 0;
  const step3Valid = vibes.length > 0;

  const next = () => setStep((s) => Math.min(4, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        phone_number: phone,
        birthdate,
        zip_code: zip,
        pro_leagues: proLeagues,
        college_leagues: collegeLeagues,
        favorite_teams: teams,
        vibe_tags: vibes,
        has_completed_onboarding: true,
        trial_started_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't save your profile", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Welcome to Loverball${firstName ? `, ${firstName}` : ""}!` });
    navigate(redirect, { replace: true });
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#FAF7F2] text-[#1A1A1A]">
      <Seo title="Set up your Loverball profile" description="Tell us your fandoms so we can build your feed." path="/onboarding" />
      <div className="max-w-xl mx-auto px-5 pt-8 pb-32">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-1 flex-1 rounded-full transition-colors"
              style={{ background: n <= step ? "#E85D2F" : "#E8E3DC" }}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <header>
              <p className="text-xs uppercase tracking-widest text-[#6B6B6B]">Step 1 of 4</p>
              <h1 className="font-display text-3xl mt-2">A few details to get started</h1>
            </header>
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone number</Label>
                <Input id="phone" inputMode="tel" placeholder="+1 555 555 5555"
                  value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="dob">Birthdate</Label>
                <Input id="dob" type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} />
                {birthdate && !ageOk && (
                  <p className="text-xs text-[#E85D2F] mt-1">You must be 18 or older to join Loverball.</p>
                )}
              </div>
              <div>
                <Label htmlFor="zip">Zip code</Label>
                <Input id="zip" inputMode="numeric" maxLength={5} placeholder="90210"
                  value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <header>
              <p className="text-xs uppercase tracking-widest text-[#6B6B6B]">Step 2 of 4</p>
              <h1 className="font-display text-3xl mt-2">What do you watch?</h1>
            </header>

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide mb-2">Pro leagues</h2>
              <div className="flex flex-wrap gap-2">
                {PRO_LEAGUES.map((l) => (
                  <Chip key={l} label={l} active={proLeagues.includes(l)}
                    onClick={() => toggle(proLeagues, setProLeagues, l)} />
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide mb-2">College</h2>
              <div className="flex flex-wrap gap-2">
                {COLLEGE_LEAGUES.map((l) => (
                  <Chip key={l} label={l} active={collegeLeagues.includes(l)}
                    onClick={() => toggle(collegeLeagues, setCollegeLeagues, l)} />
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide mb-2">Your teams</h2>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
                <Input className="pl-9" placeholder="Search teams (e.g. Lakers, USC)"
                  value={teamQuery} onChange={(e) => setTeamQuery(e.target.value)} />
                {teamResults.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full bg-white border border-[#E8E3DC] rounded-md shadow-sm overflow-hidden">
                    {teamResults.map((t) => (
                      <li key={t.id}>
                        <button type="button"
                          onClick={() => {
                            if (!teams.includes(t.name)) setTeams([...teams, t.name]);
                            setTeamQuery("");
                            setTeamResults([]);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-[#FAF5E9] text-sm flex items-center justify-between"
                        >
                          <span>{t.name}</span>
                          <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">{t.league}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {teams.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {teams.map((t) => (
                    <span key={t}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium"
                      style={{ background: "#E85D2F", color: "#fff" }}>
                      {t}
                      <button aria-label={`Remove ${t}`}
                        onClick={() => setTeams(teams.filter((x) => x !== t))}
                        className="ml-1 opacity-80 hover:opacity-100">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {teams.length === 0 && (
                <p className="text-xs text-[#6B6B6B] mt-2">
                  Start typing a team name. We'll match common misspellings.
                </p>
              )}
            </section>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <header>
              <p className="text-xs uppercase tracking-widest text-[#6B6B6B]">Step 3 of 4</p>
              <h1 className="font-display text-3xl mt-2">Tell us who you are — pick everything that fits.</h1>
            </header>
            <div className="flex flex-wrap gap-2">
              {VIBE_TAGS.map((v) => (
                <Chip key={v.label} label={`${v.emoji} ${v.label}`}
                  active={vibes.includes(v.label)}
                  onClick={() => toggle(vibes, setVibes, v.label)} />
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 text-center pt-8">
            <header>
              <p className="text-xs uppercase tracking-widest text-[#6B6B6B]">Step 4 of 4</p>
              <h1 className="font-display text-4xl mt-3">
                Welcome to Loverball{firstName ? `, ${firstName}` : ""}.
              </h1>
              <p className="text-[#6B6B6B] mt-3">Your feed is ready.</p>
            </header>
            <div className="bg-white border border-[#E8E3DC] rounded-2xl p-5 text-left text-sm space-y-2">
              <Row k="Phone" v={phone} />
              <Row k="Birthday" v={birthdate} />
              <Row k="Zip" v={zip} />
              <Row k="Pro leagues" v={proLeagues.join(", ") || "—"} />
              <Row k="College" v={collegeLeagues.join(", ") || "—"} />
              <Row k="Teams" v={teams.join(", ") || "—"} />
              <Row k="Vibe" v={`${vibes.length} selected`} />
            </div>
          </div>
        )}

        {/* Footer nav */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#FAF7F2]/95 backdrop-blur border-t border-[#E8E3DC] px-5 py-4">
          <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
            <Button variant="ghost" size="lg" onClick={back} disabled={step === 1}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            {step < 4 ? (
              <Button size="lg" onClick={next}
                disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid) || (step === 3 && !step3Valid)}>
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button size="lg" onClick={handleFinish} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Enter Loverball →
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button type="button" onClick={onClick}
    className="px-3.5 py-2 rounded-full text-sm font-medium transition-colors border"
    style={{
      background: active ? "#E85D2F" : "#FFFFFF",
      borderColor: active ? "#E85D2F" : "#E8E3DC",
      color: active ? "#FFFFFF" : "#1A1A1A",
    }}>
    {label}
  </button>
);

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between gap-3">
    <span className="text-[#6B6B6B]">{k}</span>
    <span className="font-medium text-right truncate max-w-[60%]">{v || "—"}</span>
  </div>
);

export default Onboarding;
