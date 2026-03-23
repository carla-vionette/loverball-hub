import type { ApplyFormData } from "@/pages/Apply";
import { Pencil, User, Users, Building2 } from "lucide-react";

interface Props {
  data: ApplyFormData;
  onEdit: (step: number) => void;
}

const accountIcons = { creator: User, team: Users, organization: Building2 };
const accountLabels = { creator: "Creator", team: "Team", organization: "Organization" };

const formatFollowers = (n: number) => {
  if (!n) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const Section = ({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: number;
  onEdit: (s: number) => void;
  children: React.ReactNode;
}) => (
  <div className="p-4 rounded-2xl border border-border bg-card">
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold text-foreground text-sm">{title}</h3>
      <button
        onClick={() => onEdit(step)}
        className="text-primary text-xs font-medium flex items-center gap-1 hover:opacity-70"
      >
        <Pencil className="w-3 h-3" /> Edit
      </button>
    </div>
    {children}
  </div>
);

const Row = ({ label, value }: { label: string; value?: string | number }) => (
  <div className="flex items-start justify-between py-1">
    <span className="text-muted-foreground text-sm">{label}</span>
    <span className="text-foreground text-sm font-medium text-right max-w-[60%] truncate">
      {value || "—"}
    </span>
  </div>
);

const ApplyStep5Review = ({ data, onEdit }: Props) => {
  const Icon = data.accountType ? accountIcons[data.accountType as keyof typeof accountIcons] : User;
  const typeLabel = data.accountType ? accountLabels[data.accountType as keyof typeof accountLabels] : "—";

  const socials = [
    { name: "Instagram", url: data.instagramUrl, followers: data.instagramFollowers },
    { name: "TikTok", url: data.tiktokUrl, followers: data.tiktokFollowers },
    { name: "YouTube", url: data.youtubeUrl, followers: data.youtubeFollowers },
    { name: "X / Twitter", url: data.twitterUrl, followers: data.twitterFollowers },
  ].filter((s) => s.url);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Review your application</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Double-check everything before submitting. You can edit any section.
      </p>

      <div className="space-y-4 pb-20">
        {/* Account type */}
        <Section title="Account Type" step={1} onEdit={onEdit}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <span className="font-medium text-foreground">{typeLabel}</span>
          </div>
        </Section>

        {/* Basic info */}
        <Section title="Basic Info" step={2} onEdit={onEdit}>
          <Row label="Name" value={data.name} />
          <Row label="Bio" value={data.bio} />
          <Row label="Sport" value={data.sport} />
          <Row label="League" value={data.league} />
          <Row label="City" value={data.city} />
        </Section>

        {/* Social */}
        {socials.length > 0 && (
          <Section title="Social Media" step={3} onEdit={onEdit}>
            {socials.map((s) => (
              <div key={s.name} className="flex items-center justify-between py-1">
                <span className="text-muted-foreground text-sm">{s.name}</span>
                <span className="text-foreground text-sm font-medium">
                  {formatFollowers(s.followers)} followers
                </span>
              </div>
            ))}
          </Section>
        )}

        {/* Uploads */}
        {(data.logoUrl || data.bannerUrl) && (
          <Section title="Uploads" step={4} onEdit={onEdit}>
            <div className="flex gap-3">
              {data.logoUrl && (
                <img
                  src={data.logoUrl}
                  alt="Logo"
                  className="w-16 h-16 rounded-xl object-cover border border-border"
                />
              )}
              {data.bannerUrl && (
                <img
                  src={data.bannerUrl}
                  alt="Banner"
                  className="h-16 rounded-xl object-cover border border-border flex-1"
                />
              )}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
};

export default ApplyStep5Review;
