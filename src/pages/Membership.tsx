import { useState } from "react ";
import { Link, useNavigate } from "react-router-dom ";
import { Seo } from "@/components/Seo ";
import { Check, Minus, ChevronDown, Sparkles, Loader2 } from "lucide-react ";
import { C, fonts } from "@/lib/editorialTheme ";
import { H1, H2, H3, Body, Slug, Mono, PrimaryBtn, SecondaryBtn, TertiaryLink } from "@/components/editorial/primitives ";
import { useAuth } from "@/hooks/useAuth ";
import { createCheckoutSession } from "@/services/subscriptionService ";
import { toast } from "sonner ";


type Tier = {
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  features: string[];
  cta: string;
  highlight?: boolean;
};

const TIERS: Tier[] = [
  {
    name:"Free ",
    price:"$0",
    cadence:"forever ",
    tagline:"A taste of the club. Read, watch, look around.",
    features: ["Join core events for free ","Ad-supported editorial stories & scores ","Group chat preview "],
    cta:"Create account ",
  },
  {
    name:"All-Access ",
    price:"$35",
    cadence:"per month ",
    tagline:"The full members-only home.",
    features: ["Everything in Free ","Unlimited group chats ","Smart fan matching ","Members-only events ","Private city crews ","Priority event invites ","Mixers, away-game travel, and merch drops ",
    ],
    cta:"Go All-Access ",
    highlight: true,
  },
];

const COMPARE = [
  { label:"Ad-supported editorial stories & scores ", free: true, all: true },
  { label:"Join core events for free ", free: true, all: true },
  { label:"Group chats ", free:"Preview ", all:"Unlimited " },
  { label:"Smart fan matching ", free: false, all: true },
  { label:"Members-only events ", free: false, all: true },
  { label:"Private city crews ", free: false, all: true },
  { label:"Priority event invites ", free: false, all: true },
  { label:"Mixers, away-game travel, and merch drops ", free: false, all: true },
] as const;

const FAQS = [
  { q:"Who is Loverball for?", a:"Sports fans who want a serious community — built around watch parties, group chats, fan matching, and IRL meetups. Headquartered in LA, members worldwide." },
  { q:"Can I cancel anytime?", a:"Yes. Memberships are month-to-month. Cancel from your billing settings — no calls, no friction." },
  { q:"What does All-Access include?", a:"All-Access unlocks the full members-only community: unlimited group chats, smart fan matching, members-only events, private city crews, priority event invites, mixers, away-game travel, and merch drops." },
  { q:"Do I need an invite code?", a:"Yes — Loverball is invite-only during this season. Use your code at signup, or join the waitlist." },
  { q:"Is there a free option?", a:"Free accounts can read editorial, join core events, and preview the community. Smart matching, unlimited group chats, and members-only events require All-Access." },
];

const Membership = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState<number | null>(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const goSignup = () => navigate("/auth?mode=signup&redirect=/membership ");

  const goCheckout = async () => {
    if (!user) {
      navigate("/auth?mode=signup&redirect=/membership&checkout=all-access ");
      return;
    }
    setCheckoutLoading(true);
    try {
      const url = await createCheckoutSession("local ");
      window.location.href = url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message :"Checkout unavailable ");
      setCheckoutLoading(false);
    }
  };

  const handleTierCta = (tierName: string) => {
    if (tierName ==="Free ") return goSignup();
    return goCheckout();
  };

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: fonts.sans }} className="min-h-screen ">
      <Seo
        title="Choose your pass — Loverball Membership "
        description="Choose your Loverball pass. Free or All-Access — the members-only home for sports fandom."
        path="/membership "
      />

      {/* Hero */}
      <section className="px-6 md:px-12 pt-32 md:pt-40 pb-16 max-w-6xl ">
        <Slug>Membership · Choose your pass</Slug>
        <H1 className="mt-6">Pick your<br/>Loverball pass.</H1>
        <Body muted size={18} className="mt-8 max-w-xl ">
          Start free. Upgrade to All-Access when you're ready for the full members-only home.
        </Body>
      </section>

      {/* Pricing tiers */}
      <section className="px-6 md:px-12 pb-24 max-w-6xl ">
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl ">
          {TIERS.map((t) => {
            const hi = !!t.highlight;
            return (
              <article
                key={t.name}
                className="relative p-8 md:p-10 flex flex-col "
                style={{
                  background: hi
                    ? `linear-gradient(180deg, ${C.raspberry}0F 0%, ${C.surface} 60%)`
                    : C.surface,
                  border: hi ? `1.5px solid ${C.raspberry}` : `0.5px solid ${C.border}`,
                  borderRadius: 8,
                  boxShadow: hi
                    ? `0 24px 60px -28px ${C.raspberry}99, 0 0 0 4px ${C.raspberry}14`
                    :"none ",
                  transform: hi ?"translateY(-8px)" :"none ",
                }}
              >
                {hi && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-1.5"
                    style={{
                      background: C.raspberry,
                      color:"#fff ",
                      fontFamily: fonts.mono,
                      fontSize: 10,
                      letterSpacing:"0.18em ",
                      textTransform:"uppercase ",
                      borderRadius: 999,
                      fontWeight: 600,
                      boxShadow: `0 8px 20px -8px ${C.raspberry}AA`,
                    }}
                  >
                    <Sparkles size={11} /> Most members pick this
                  </div>
                )}

                <Mono color={hi ? C.raspberry : C.muted}>{t.name}</Mono>

                <div className="mt-6 flex items-baseline gap-2">
                  <span style={{ fontFamily: fonts.serif, fontStyle:"italic ", fontWeight: 500, fontSize: 72, lineHeight: 1, letterSpacing:"-0.02em ", color: C.text }}>{t.price}</span>
                  <Mono>/ {t.cadence}</Mono>
                </div>
                <Body muted size={14} className="mt-3">{t.tagline}</Body>

                <ul className="mt-8 space-y-3 flex-1">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-3" style={{ fontFamily: fonts.sans, fontSize: 14, lineHeight: 1.55, color: C.text }}>
                      <Check size={16} color={hi ? C.raspberry : C.gold} strokeWidth={2.25} className="mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-10">
                  {hi ? (
                    <PrimaryBtn onClick={() => handleTierCta(t.name)} disabled={checkoutLoading} style={{ width:"100%" }}>
                      {checkoutLoading ?"Loading…" : t.cta}
                    </PrimaryBtn>
                  ) : (
                    <SecondaryBtn onClick={() => handleTierCta(t.name)} style={{ width:"100%" }}>{t.cta}</SecondaryBtn>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Comparison */}
      <section className="px-6 md:px-12 py-20 max-w-6xl " style={{ borderTop: `0.5px solid ${C.border}` }}>
        <Slug>Compare</Slug>
        <H2 className="mt-4 mb-12">What's in each pass.</H2>

        <div className="overflow-x-auto ">
          <table className="w-full min-w-[640px]" style={{ borderCollapse:"collapse " }}>
            <thead>
              <tr style={{ borderBottom: `0.5px solid ${C.borderStrong}` }}>
                <th className="text-left py-4"><Mono>Feature</Mono></th>
                <th className="text-left py-4"><Mono>Free</Mono></th>
                <th className="text-left py-4"><Mono color={C.raspberry}>All-Access</Mono></th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((row) => (
                <tr key={row.label} style={{ borderBottom: `0.5px solid ${C.border}` }}>
                  <td className="py-4 pr-4" style={{ fontFamily: fonts.sans, fontSize: 15, color: C.text }}>{row.label}</td>
                  {[row.free, row.all].map((v, i) => (
                    <td key={i} className="py-4 pr-4" style={{ fontFamily: fonts.sans, fontSize: 14, color: C.muted }}>
                      {v === true ? <Check size={16} color={C.raspberry} /> : v === false ? <Minus size={16} color={C.border} /> : <span style={{ color: C.text }}>{v}</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 md:px-12 py-20 max-w-3xl " style={{ borderTop: `0.5px solid ${C.border}` }}>
        <Slug>FAQ</Slug>
        <H2 className="mt-4 mb-12">Questions, answered.</H2>

        <div>
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} style={{ borderBottom: `0.5px solid ${C.border}` }}>
                <button onClick={() => setOpen(isOpen ? null : i)} className="w-full text-left py-6 flex items-center justify-between gap-4">
                  <H3 style={{ fontSize: 22 }}>{f.q}</H3>
                  <ChevronDown size={18} style={{ transform: isOpen ?"rotate(180deg)" :"none ", transition:"transform 200ms ", color: C.muted }} />
                </button>
                {isOpen && <Body muted className="pb-6 pr-10">{f.a}</Body>}
              </div>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 md:px-12 py-24 text-center " style={{ borderTop: `0.5px solid ${C.border}` }}>
        <Slug>Ready</Slug>
        <H2 className="mt-4 mx-auto max-w-3xl " style={{ fontSize:"clamp(40px, 6vw, 80px)" }}>
          The members-only home for sports fandom.
        </H2>
        <div className="mt-10 flex flex-wrap gap-4 justify-center ">
          <PrimaryBtn onClick={goCheckout} disabled={checkoutLoading}>{checkoutLoading ?"Loading…" :"Go All-Access "}</PrimaryBtn>
          <SecondaryBtn to="/club ">Tour the Club</SecondaryBtn>
        </div>
      </section>

      <footer className="px-6 md:px-12 py-10" style={{ borderTop: `0.5px solid ${C.border}` }}>
        <Mono size={10}>© 2026 Loverball · Built in LA</Mono>
      </footer>
    </div>
  );
};

export default Membership;
