import { User, Users, Building2 } from "lucide-react";
import { motion } from "framer-motion";

const accountTypes = [
  {
    value: "creator" as const,
    icon: User,
    title: "Creator",
    desc: "Individual content creator, athlete, or influencer",
  },
  {
    value: "team" as const,
    icon: Users,
    title: "Team",
    desc: "Sports team, club, or player collective",
  },
  {
    value: "organization" as const,
    icon: Building2,
    title: "Organization",
    desc: "League, brand, media company, or nonprofit",
  },
];

interface Props {
  value: string;
  onChange: (v: "creator" | "team" | "organization") => void;
  error?: string;
}

const ApplyStep1AccountType = ({ value, onChange, error }: Props) => (
  <div>
    <h1 className="text-2xl font-bold text-foreground mb-2">What type of account?</h1>
    <p className="text-muted-foreground text-sm mb-8">
      Choose the option that best describes you or your organization.
    </p>

    <div className="space-y-3">
      {accountTypes.map((type, i) => {
        const selected = value === type.value;
        return (
          <motion.button
            key={type.value}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => onChange(type.value)}
            className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all ${
              selected
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              <type.icon className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">{type.title}</p>
              <p className="text-sm text-muted-foreground">{type.desc}</p>
            </div>
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                selected ? "border-primary bg-primary" : "border-muted-foreground/30"
              }`}
            >
              {selected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
            </div>
          </motion.button>
        );
      })}
    </div>

    {error && <p className="text-destructive text-sm mt-3">{error}</p>}
  </div>
);

export default ApplyStep1AccountType;
