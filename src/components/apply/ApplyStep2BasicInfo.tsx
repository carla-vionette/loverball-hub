import type { ApplyFormData } from "@/pages/Apply";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const sports = [
  "Basketball", "Soccer", "Tennis", "Volleyball", "Softball",
  "Track & Field", "Swimming", "Gymnastics", "Golf", "Lacrosse",
  "Field Hockey", "Ice Hockey", "Rugby", "Wrestling", "Boxing",
  "MMA", "Surfing", "Skateboarding", "Cricket", "Other",
];

const leagues = [
  "WNBA", "NWSL", "WTA", "LPGA", "NCAA", "USWNT",
  "PWHL", "Athletes Unlimited", "USL Super League",
  "Big3", "Premier League", "Liga MX", "Other", "N/A",
];

interface Props {
  data: ApplyFormData;
  updateField: <K extends keyof ApplyFormData>(key: K, value: ApplyFormData[K]) => void;
  errors: Record<string, string>;
}

const ApplyStep2BasicInfo = ({ data, updateField, errors }: Props) => (
  <div>
    <h1 className="text-2xl font-bold text-foreground mb-2">Tell us about you</h1>
    <p className="text-muted-foreground text-sm mb-8">
      Basic information to set up your profile.
    </p>

    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          Name / Channel Name *
        </label>
        <Input
          value={data.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="e.g. Loverball, Angel City FC"
          className="rounded-xl"
        />
        {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Bio</label>
        <Textarea
          value={data.bio}
          onChange={(e) => updateField("bio", e.target.value)}
          placeholder="Tell us what you're about in a few sentences..."
          rows={3}
          className="rounded-xl resize-none"
          maxLength={500}
        />
        <p className="text-muted-foreground text-xs mt-1 text-right">{data.bio.length}/500</p>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Sport *</label>
        <Select value={data.sport} onValueChange={(v) => updateField("sport", v)}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Select a sport" />
          </SelectTrigger>
          <SelectContent>
            {sports.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.sport && <p className="text-destructive text-xs mt-1">{errors.sport}</p>}
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">League</label>
        <Select value={data.league} onValueChange={(v) => updateField("league", v)}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Select a league (optional)" />
          </SelectTrigger>
          <SelectContent>
            {leagues.map((l) => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">City *</label>
        <Input
          value={data.city}
          onChange={(e) => updateField("city", e.target.value)}
          placeholder="e.g. Los Angeles, New York"
          className="rounded-xl"
        />
        {errors.city && <p className="text-destructive text-xs mt-1">{errors.city}</p>}
      </div>
    </div>
  </div>
);

export default ApplyStep2BasicInfo;
