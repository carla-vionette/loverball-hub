import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mic2, Users, Building2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import loverballLogo from "@/assets/loverball-script-logo.png";

type AccountType = "member" | "creator" | "team" | "organization";

const accountTypes: {
  value: AccountType;
  label: string;
  description: string;
  icon: typeof User;
}[] = [
  {
    value: "member",
    label: "Member",
    description: "Fan looking to connect with the sports community",
    icon: User,
  },
  {
    value: "creator",
    label: "Creator",
    description: "Sports content creator with an audience",
    icon: Mic2,
  },
  {
    value: "team",
    label: "Team",
    description: "Sports team or athletic organization",
    icon: Users,
  },
  {
    value: "organization",
    label: "Organization",
    description: "Sports media company or league",
    icon: Building2,
  },
];

const AccountTypeSelection = () => {
  const [selected, setSelected] = useState<AccountType | null>(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!selected) return;

    if (selected === "member") {
      navigate("/onboarding");
    } else {
      navigate(`/creator-application?type=${selected}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-center h-16">
          <img src={loverballLogo} alt="Loverball" className="h-20 w-auto" />
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-4 sm:px-6 pt-12 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <p className="text-primary text-sm font-medium tracking-widest mb-4 uppercase">
            Almost there
          </p>
          <h1 className="text-3xl sm:text-4xl font-sans font-normal text-foreground mb-3">
            How will you use Loverball?
          </h1>
          <p className="text-muted-foreground text-sm">
            Choose the account type that best describes you.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="space-y-3"
        >
          {accountTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selected === type.value;
            return (
              <button
                key={type.value}
                onClick={() => setSelected(type.value)}
                className={`w-full flex items-center gap-4 p-5 border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:border-primary/40"
                }`}
              >
                <div
                  className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">
                    {type.label}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {type.description}
                  </p>
                </div>
                {isSelected && (
                  <div className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <svg
                      className="w-3.5 h-3.5 text-primary-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="pt-8"
        >
          <Button
            onClick={handleContinue}
            disabled={!selected}
            className="w-full rounded-none h-12 text-sm tracking-wider gap-2"
          >
            CONTINUE
            <ChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default AccountTypeSelection;
