import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { C, fonts } from "@/lib/editorialTheme";
import Seo from "@/components/Seo";
import { MessageCircle, Send, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PROMPTS = [
  "I'm new here — say hi if you're around.",
  "Looking for a watch crew this season.",
  "First Loverball event soon — anyone going?",
];

const WelcomeFirstMove = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [city, setCity] = useState<string | null>(null);
  const [message, setMessage] = useState(PROMPTS[0]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/"); return; }
      const { data: p } = await supabase
        .from("profiles").select("name, city").eq("id", user.id).maybeSingle();
      setName(p?.name?.split(" ")[0] || "friend");
      setCity(p?.city || null);
    })();
  }, [navigate]);

  const handleSend = async () => {
    setSending(true);
    // Best-effort: in this scope we just confirm and route. Real chat insert happens when the user joins a channel.
    setTimeout(() => {
      toast({ title: "You're in.", description: "Welcome to the community." });
      navigate("/feed", { replace: true });
    }, 500);
  };

  const skip = () => navigate("/feed", { replace: true });

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: C.bg, color: C.text, fontFamily: fonts.sans }}>
      <Seo title="Make your first move · Loverball" description="Say hi." path="/welcome/first-move" />

      <header className="px-5 pt-5 pb-3">
        <button
          onClick={() => navigate(-1)}
          className="text-xs uppercase tracking-[0.2em] flex items-center gap-1.5 opacity-70 hover:opacity-100"
          style={{ fontFamily: fonts.mono, color: C.muted }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto px-5 pt-6 pb-32">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
            style={{ background: "rgba(232,93,47,0.12)" }}
          >
            <MessageCircle className="w-7 h-7" style={{ color: C.raspberry }} />
          </div>
          <h1 style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 36, lineHeight: 1.05 }}>
            Say hi, {name}.
          </h1>
          <p className="mt-3 mb-7" style={{ color: C.muted, fontSize: 15 }}>
            One sentence is plenty. {city ? `Drop in to the ${city} circle.` : "Drop in to your community."}
          </p>
        </motion.div>

        <div className="mb-3">
          <div className="flex gap-2 flex-wrap mb-3">
            {PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setMessage(p)}
                className="text-[11px] px-3 py-2 rounded-full"
                style={{
                  background: message === p ? C.raspberry : "transparent",
                  color: message === p ? "#fff" : C.text,
                  border: `1px solid ${message === p ? C.raspberry : C.borderStrong}`,
                  fontFamily: fonts.mono,
                  letterSpacing: "0.05em",
                }}
              >
                Use this
              </button>
            ))}
          </div>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="rounded-2xl"
            style={{ background: C.surface, borderColor: C.borderStrong, color: C.text, fontSize: 16, padding: 16 }}
            maxLength={280}
          />
          <div className="text-right text-[11px] mt-1" style={{ color: C.muted, fontFamily: fonts.mono }}>
            {message.length}/280
          </div>
        </div>
      </main>

      <div
        className="fixed bottom-0 left-0 right-0 border-t px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]"
        style={{ background: C.surface, borderColor: C.border }}
      >
        <div className="max-w-md mx-auto flex flex-col gap-2">
          <Button
            onClick={handleSend}
            disabled={sending || !message.trim()}
            className="w-full h-14 rounded-full text-xs uppercase tracking-[0.22em] border-0"
            style={{ background: C.raspberry, color: "#fff", fontFamily: fonts.mono }}
          >
            <Send className="w-4 h-4 mr-2" /> Post & enter the community
          </Button>
          <button
            onClick={skip}
            className="text-center text-[11px] uppercase tracking-[0.18em] py-2 opacity-60 hover:opacity-100"
            style={{ color: C.muted, fontFamily: fonts.mono }}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeFirstMove;
