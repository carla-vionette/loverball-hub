import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MobileHeader from "@/components/MobileHeader";
import DesktopNav from "@/components/DesktopNav";
import BottomNav from "@/components/BottomNav";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  SPORTS_OPTIONS,
  EXPERIENCE_OPTIONS,
  CONTENT_INTERESTS_OPTIONS,
  COMFORT_LEVEL_OPTIONS,
  PARTICIPATION_OPTIONS,
} from "@/lib/onboardingOptions";

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

// ─── Editable multi-select section ──────────────────────
type EditableSectionProps = {
  title: string;
  field: keyof InterestsData;
  options: string[];
  values: string[] | null;
  variant?: "secondary" | "outline";
  onSave: (field: keyof InterestsData, values: string[]) => Promise<void>;
};

const EditableSection = ({ title, field, options, values, variant = "secondary", onSave }: EditableSectionProps) => {
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string[]>(values ?? []);
  const [saving, setSaving] = useState(false);

  const toggle = (item: string) => {
    setSelected((prev) => prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item]);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(field, selected);
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setSelected(values ?? []);
    setEditing(false);
  };

  if (!editing && (!values || values.length === 0)) return null;

  return (
    <motion.div variants={staggerItem}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {!editing ? (
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setEditing(true)}>
              <Pencil className="w-4 h-4" />
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="rounded-full" onClick={handleCancel} disabled={saving}>
                <X className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={handleSave} disabled={saving}>
                <Check className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {editing
              ? options.map((opt) => (
                  <Badge
                    key={opt}
                    variant={selected.includes(opt) ? "default" : "outline"}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggle(opt)}
                  >
                    {opt}
                  </Badge>
                ))
              : (values ?? []).map((s) => (
                  <Badge key={s} variant={variant}>{s}</Badge>
                ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ─── Editable single-select section ─────────────────────
type EditableSingleProps = {
  title: string;
  field: keyof InterestsData;
  options: string[];
  value: string | null;
  onSave: (field: keyof InterestsData, values: string[] | string) => Promise<void>;
};

const EditableSingleSelect = ({ title, field, options, value, onSave }: EditableSingleProps) => {
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string>(value ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(field, selected);
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setSelected(value ?? "");
    setEditing(false);
  };

  if (!editing && !value) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium">Comfort Level</p>
        {!editing ? (
          <Button variant="ghost" size="icon" className="rounded-full h-7 w-7" onClick={() => setEditing(true)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="rounded-full h-7 w-7" onClick={handleCancel} disabled={saving}>
              <X className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full h-7 w-7" onClick={handleSave} disabled={saving}>
              <Check className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {editing
          ? options.map((opt) => (
              <Badge
                key={opt}
                variant={selected === opt ? "default" : "outline"}
                className="cursor-pointer transition-colors"
                onClick={() => setSelected(opt)}
              >
                {opt}
              </Badge>
            ))
          : <Badge variant="secondary">{value}</Badge>}
      </div>
    </div>
  );
};

// ─── Main Page ──────────────────────────────────────────
const ProfileInterests = () => {
  const [data, setData] = useState<InterestsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      setUserId(user.id);
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

  const handleSave = useCallback(async (field: keyof InterestsData, value: string[] | string) => {
    if (!userId) return;
    const { error } = await supabase
      .from("profiles")
      .update({ [field]: value })
      .eq("id", userId);
    if (error) {
      toast.error("Failed to save changes");
      return;
    }
    setData((prev) => prev ? { ...prev, [field]: value } : prev);
    toast.success("Updated!");
  }, [userId]);

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

            <EditableSection
              title="Favorite Sports"
              field="favorite_sports"
              options={SPORTS_OPTIONS}
              values={data.favorite_sports}
              variant="secondary"
              onSave={handleSave}
            />

            <EditableSection
              title="Favorite Teams & Players"
              field="favorite_teams_players"
              options={[]} // free-form, no predefined options needed
              values={data.favorite_teams_players}
              variant="outline"
              onSave={handleSave}
            />

            <EditableSection
              title="How I Experience Sports"
              field="sports_experience_types"
              options={EXPERIENCE_OPTIONS}
              values={data.sports_experience_types}
              variant="secondary"
              onSave={handleSave}
            />

            <EditableSection
              title="Content Interests"
              field="other_interests"
              options={CONTENT_INTERESTS_OPTIONS}
              values={data.other_interests}
              variant="outline"
              onSave={handleSave}
            />

            {(data.event_comfort_level || (data.participation_preferences && data.participation_preferences.length > 0)) && (
              <motion.div variants={staggerItem}>
                <Card>
                  <CardHeader><CardTitle>Event Preferences</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <EditableSingleSelect
                      title="Comfort Level"
                      field="event_comfort_level"
                      options={COMFORT_LEVEL_OPTIONS}
                      value={data.event_comfort_level}
                      onSave={handleSave}
                    />
                    <EditableSection
                      title="I want to"
                      field="participation_preferences"
                      options={PARTICIPATION_OPTIONS}
                      values={data.participation_preferences}
                      variant="outline"
                      onSave={handleSave}
                    />
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
