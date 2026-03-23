import type { ApplyFormData } from "@/pages/Apply";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

const socialFields = [
  {
    label: "Instagram",
    urlKey: "instagramUrl" as const,
    followersKey: "instagramFollowers" as const,
    placeholder: "https://instagram.com/yourhandle",
    emoji: "📸",
    color: "from-pink-500 to-purple-600",
  },
  {
    label: "TikTok",
    urlKey: "tiktokUrl" as const,
    followersKey: "tiktokFollowers" as const,
    placeholder: "https://tiktok.com/@yourhandle",
    emoji: "🎵",
    color: "from-black to-gray-800",
  },
  {
    label: "YouTube",
    urlKey: "youtubeUrl" as const,
    followersKey: "youtubeFollowers" as const,
    placeholder: "https://youtube.com/@yourchannel",
    emoji: "▶️",
    color: "from-red-500 to-red-600",
  },
  {
    label: "X / Twitter",
    urlKey: "twitterUrl" as const,
    followersKey: "twitterFollowers" as const,
    placeholder: "https://x.com/yourhandle",
    emoji: "𝕏",
    color: "from-gray-800 to-black",
  },
];

interface Props {
  data: ApplyFormData;
  updateField: <K extends keyof ApplyFormData>(key: K, value: ApplyFormData[K]) => void;
}

const ApplyStep3Social = ({ data, updateField }: Props) => (
  <div>
    <h1 className="text-2xl font-bold text-foreground mb-2">Social media presence</h1>
    <p className="text-muted-foreground text-sm mb-8">
      Add your social links so we can learn more about your content. All fields are optional.
    </p>

    <div className="space-y-5">
      {socialFields.map((field, i) => (
        <motion.div
          key={field.urlKey}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="p-4 rounded-2xl border border-border bg-card"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{field.emoji}</span>
            <span className="font-semibold text-foreground text-sm">{field.label}</span>
          </div>
          <Input
            value={data[field.urlKey] as string}
            onChange={(e) => updateField(field.urlKey, e.target.value)}
            placeholder={field.placeholder}
            className="rounded-xl mb-2"
          />
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={data[field.followersKey] || ""}
              onChange={(e) =>
                updateField(field.followersKey, parseInt(e.target.value) || 0)
              }
              placeholder="Follower count"
              className="rounded-xl max-w-[160px]"
              min={0}
            />
            <span className="text-xs text-muted-foreground">followers</span>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

export default ApplyStep3Social;
