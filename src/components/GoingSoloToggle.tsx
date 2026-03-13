import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Hand } from "lucide-react";

interface Props {
  eventId: string;
}

const GoingSoloToggle = ({ eventId }: Props) => {
  const { user } = useAuth();
  const [goingSolo, setGoingSolo] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("event_guests")
      .select("going_solo")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setGoingSolo(data.going_solo || false);
        setLoading(false);
      });
  }, [user?.id, eventId]);

  const handleToggle = async (checked: boolean) => {
    if (!user) return;
    setGoingSolo(checked);
    await supabase
      .from("event_guests")
      .update({ going_solo: checked })
      .eq("event_id", eventId)
      .eq("user_id", user.id);
  };

  if (loading || !user) return null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-warning/10 border border-warning/20">
      <div className="text-lg">👋</div>
      <div className="flex-1">
        <Label htmlFor="going-solo" className="text-sm font-medium text-foreground cursor-pointer">
          I'm going solo
        </Label>
        <p className="text-xs text-muted-foreground">Let others know you're open to saying hi!</p>
      </div>
      <Switch
        id="going-solo"
        checked={goingSolo}
        onCheckedChange={handleToggle}
      />
    </div>
  );
};

export default GoingSoloToggle;
