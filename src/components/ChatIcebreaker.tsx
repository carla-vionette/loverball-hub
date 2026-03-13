import { useState } from "react";
import { MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const ICEBREAKERS = [
  "Who are you rooting for? 🏆",
  "What's your hot take for tonight? 🔥",
  "First time at this venue? 📍",
  "What's your game day snack? 🍿",
  "Who's your all-time favorite player? ⭐",
  "Are you coming with friends or flying solo? 👋",
  "What's the best sports moment you've ever witnessed live? 😱",
];

interface ChatIcebreakerProps {
  onSelect: (prompt: string) => void;
}

export default function ChatIcebreaker({ onSelect }: ChatIcebreakerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [prompt] = useState(() => ICEBREAKERS[Math.floor(Math.random() * ICEBREAKERS.length)]);

  if (dismissed) return null;

  return (
    <div className="mx-4 mb-3 rounded-2xl bg-accent/10 border border-accent/20 p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-accent mb-1">Icebreaker</p>
          <p className="text-sm text-foreground font-medium">{prompt}</p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              className="rounded-full text-xs bg-accent hover:bg-accent/90 text-accent-foreground gap-1"
              onClick={() => {
                onSelect(prompt);
                setDismissed(true);
              }}
            >
              <MessageCircle className="w-3 h-3" /> Answer
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full text-xs"
              onClick={() => setDismissed(true)}
            >
              Skip
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
