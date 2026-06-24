import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import {
  Instagram,
  ArrowRight,
  ArrowUpRight,
  Check,
  MapPin,
  Sparkles,
  Heart,
  Ticket,
} from "lucide-react";
import heroImage from "@/assets/hero-women-new.png";
import loverballWordmark from "@/assets/loverball-wordmark.png.asset.json";

import WhatsHappeningNow from "@/components/WhatsHappeningNow";
import { INSTAGRAM_URL } from "@/lib/socialLinks";
import { trackEvent } from "@/lib/analytics";

import { C, fonts, Mono } from "@/components/home/_theme";
import { HOMEPAGE_PROOF } from "@/components/home/homepageConfig";
import SocialProofSection from "@/components/home/SocialProofSection";
import BenefitsSection from "@/components/home/BenefitsSection";
import DropSection from "@/components/home/DropSection";
import ProductPreviewSection from "@/components/home/ProductPreviewSection";
import RecapGallery from "@/components/home/RecapGallery";

/* ============================================================
   LOVERBALL — MARKETING HOMEPAGE
   Mobile-first editorial layout for women who love sports.
   Section order: Hero → Social Proof → Benefits → The Drop →
   Product Preview → Recap → Stories → Membership → Final CTA.
   ============================================================ */

const MEMBERSHIP_PRICE = 25;
const MEMBERSHIP_ORIG = 35;

const Index = () => {
  const navigate = useNavigate();
  const membershipRef = useRef<HTMLDivElement>(null);
  const [zip, setZip] = useState("");

  const goJoin = (source: string) => {
    trackEvent("user_behavior", "homepage_join_cta", { source });
    navigate("/auth?mode=signup");
  };

  const handleZipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = zip.replace(/\D/g, "").slice(0, 5);
    trackEvent("user_behavior", "homepage_zip_submit", {
      zip_valid: clean.length === 5,
    });
    if (clean.length === 5) navigate(`/events?zip=${clean}`);
  };

  const scrollToMembership = () => {
    trackEvent("user_behavior", "homepage_see_membership_click", {});
    membershipRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{ background: C.cream, color: C.ink, fontFamily: fonts.sans }}>
      <Seo
        title="Loverball — Beta in LA for women who love sports"
        description="Loverball is in beta in Los Angeles. Early access for women who love sports — join watch parties, events, and members-only perks."
        path="/"
        imageAlt="Loverball — beta community for women who love sports in LA"
      />

      <style>{`
        @keyframes lb-rise { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes lb-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes lb-pulse-dot { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.6); opacity: 0.5; } }
        .lb-rise { animation: lb-rise 0.9s cubic-bezier(0.16,1,0.3,1) both; }
        .lb-fade { animation: lb-fade 1.2s ease-out both; }
        .lb-delay-1 { animation-delay: 0.1s; }
        .lb-delay-2 { animation-delay: 0.25s; }
        .lb-delay-3 { animation-delay: 0.4s; }
        .lb-delay-4 { animation-delay: 0.55s; }
        .lb-cta:focus-visible { outline: 2px solid ${C.accent}; outline-offset: 3px; }
      `}</style>

      {/* ============ TOP NAV ============ */}
      <nav
        className="px-5 md:px-10 py-5 flex items-center justify-between sticky top-0 z-50"
        style={{
          background: "rgba(13,13,13,0.85)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: `1px solid ${C.inkRule}`,
        }}
      >
        <div className="flex items-center gap-4 md:gap-6">
          <Link
            to="/auth?mode=signin"
            style={{
              fontFamily: fonts.sans, fontSize: 14, letterSpacing: "0",
              color: C.cream,
            }}
            className="hover:opacity-60 transition-opacity lb-cta"
          >
            Sign in
          </Link>
          <button
            onClick={() => goJoin("nav")}
            className="hover:-translate-y-0.5 transition-transform lb-cta"
            style={{
              background: C.accent, color: "#fff",
              fontFamily: fonts.sans, fontSize: 14, letterSpacing: "-0.01em",
              padding: "14px 26px", borderRadius: 999,
              fontWeight: 600,
              boxShadow: "0 10px 28px -10px rgba(232,93,38,0.7)",
            }}
          >
            Join the Club
          </button>
        </div>
        <div className="hidden md:flex items-center gap-9">
          {[
            ["About", "/about"],
            ["Membership", "/membership"],
            ["Events", "/events"],
            ["Stories", "/feed"],
          ].map(([l, h]) => (
            <Link
              key={l}
              to={h}
              style={{
                fontFamily: fonts.sans, fontSize: 14, letterSpacing: "0",
                color: C.cream,
              }}
              className="hover:opacity-60 transition-opacity lb-cta"
            >
              {l}
            </Link>
          ))}
        </div>
      </nav>

      {/* ============ 1) HERO ============ */}
      {/*
        Headline picked for emotional clarity. Alternates kept as reference:
        // "Find your team. Find your city. Find your people."
        // "Never watch the biggest moments alone again."
      */}
      <section
        className="px-5 md:px-10 pt-12 md:pt-20 pb-16 md:pb-24 relative overflow-hidden"
        style={{ background: C.ink, color: C.cream }}
      >
        <div
          aria-hidden
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${C.accent}33 0%, transparent 70%)`,
            filter: "blur(40px)",
          }}
        />
        <div className="max-w-[1400px] mx-auto relative">
          <div className="flex items-center justify-between mb-10 md:mb-14 lb-fade">
            <Mono color={C.cream}>Vol. 01 — Founding Issue</Mono>
            <span
              className="inline-flex items-center gap-2"
              style={{
                fontFamily: fonts.sans,
                fontSize: 12,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "#fff",
                background: C.accent,
                padding: "6px 12px",
                borderRadius: 999,
                fontWeight: 700,
              }}
            >
              <span
                aria-hidden
                style={{ width: 6, height: 6, borderRadius: 999, background: "#fff", display: "inline-block" }}
              />
              Beta · LA
            </span>
          </div>


          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            <div className="lg:col-span-7">
              <img
                src={loverballWordmark.url}
                alt="Loverball"
                className="block mb-7 md:mb-9 w-[240px] md:w-[340px] lg:w-[400px] h-auto select-none lb-rise"
                draggable={false}
                loading="eager"
                decoding="async"
                style={{ filter: "brightness(0) invert(1)" }}
              />

              <h1
                className="lb-rise lb-delay-2"
                style={{ lineHeight: 0.95, letterSpacing: "-0.035em" }}
              >
                <span
                  style={{
                    display: "block",
                    fontFamily: fonts.serif,
                    fontWeight: 400,
                    fontSize: "clamp(40px, 6.6vw, 104px)",
                    color: C.cream,
                  }}
                >
                  Finally, a sports community
                </span>
                <span
                  style={{
                    display: "block",
                    fontFamily: fonts.serif,
                    fontStyle: "italic",
                    fontWeight: 400,
                    fontSize: "clamp(40px, 6.6vw, 104px)",
                    color: C.accent,
                  }}
                >
                  built for women.
                </span>
              </h1>

              <p
                className="mt-7 max-w-xl lb-rise lb-delay-3"
                style={{ fontSize: 17, lineHeight: 1.6, color: C.inkMuted }}
              >
                Loverball is in beta in Los Angeles — early access for women who
                love sports. Join watch parties, events, and members-only perks.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4 lb-rise lb-delay-4">
                <button
                  onClick={() => goJoin("hero_primary")}
                  className="hover:-translate-y-0.5 transition-transform w-full sm:w-auto lb-cta"
                  style={{
                    background: C.accent, color: "#fff",
                    fontFamily: fonts.sans, fontSize: 16, letterSpacing: "-0.01em",
                    padding: "18px 32px", borderRadius: 999,
                    fontWeight: 600,
                    boxShadow: "0 14px 36px -14px rgba(232,93,38,0.7)",
                  }}
                >
                  Join the Club →
                </button>
                <button
                  onClick={scrollToMembership}
                  className="hover:opacity-80 transition-opacity w-full sm:w-auto lb-cta"
                  style={{
                    background: "transparent",
                    color: C.cream,
                    fontFamily: fonts.sans, fontSize: 15, letterSpacing: "0",
                    padding: "17px 0",
                    fontWeight: 500,
                    textDecoration: "underline",
                    textUnderlineOffset: 4,
                    textDecorationColor: C.inkMuted,
                  }}
                >
                  See what members get
                </button>
              </div>

              {/* Proof bar — warm, confident trust row */}
              <div
                className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 lb-rise lb-delay-4"
                aria-label="Community proof"
              >
                {[HOMEPAGE_PROOF.fans, HOMEPAGE_PROOF.events, HOMEPAGE_PROOF.cities].map((p, i) => (
                  <span key={p} className="inline-flex items-center gap-3">
                    {i > 0 && (
                      <span
                        aria-hidden
                        style={{ width: 4, height: 4, borderRadius: 999, background: C.accent, display: "inline-block" }}
                      />
                    )}
                    <span
                      style={{
                        fontFamily: fonts.sans,
                        fontSize: 15,
                        fontWeight: i === 0 ? 600 : 500,
                        color: i === 0 ? C.cream : C.inkMuted,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {p}
                    </span>
                  </span>
                ))}
              </div>

              {/* ZIP — moved below the social-proof line */}
              <form
                onSubmit={handleZipSubmit}
                className="mt-6 lb-rise lb-delay-4"
                aria-label="Find Loverball fans near you"
              >
                <label
                  htmlFor="homepage-zip"
                  className="block mb-2"
                  style={{
                    fontFamily: fonts.sans, fontSize: 14, letterSpacing: "0",
                    color: C.inkMuted,
                  }}
                >
                  We're live in LA. Enter your ZIP to find events near you.
                </label>
                <div
                  className="inline-flex items-stretch w-full sm:w-auto"
                  style={{
                    border: `1px solid ${C.inkRule}`,
                    borderRadius: 999,
                    background: "transparent",
                    overflow: "hidden",
                    maxWidth: 360,
                  }}
                >
                  <input
                    id="homepage-zip"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{5}"
                    maxLength={5}
                    value={zip}
                    onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                    placeholder="90026"
                    style={{
                      background: "transparent",
                      color: C.cream,
                      fontFamily: fonts.sans,
                      fontSize: 15,
                      letterSpacing: "0",
                      padding: "16px 20px",
                      outline: "none",
                      border: "none",
                      width: 130,
                    }}
                  />
                  <button
                    type="submit"
                    className="hover:opacity-70 transition-opacity inline-flex items-center gap-2 lb-cta"
                    style={{
                      background: "transparent",
                      color: C.cream,
                      fontFamily: fonts.sans, fontSize: 15, letterSpacing: "0",
                      padding: "16px 22px",
                      borderLeft: `1px solid ${C.inkRule}`,
                      fontWeight: 600,
                      flex: 1,
                    }}
                  >
                    Find your fans →
                  </button>
                </div>
              </form>
            </div>

            {/* RIGHT — editorial image */}
            <div className="lg:col-span-5 lb-fade lb-delay-3">
              <figure>
                <div
                  className="relative overflow-hidden"
                  style={{
                    aspectRatio: "4/5",
                    borderRadius: 4,
                    border: `1px solid ${C.inkRule}`,
                  }}
                >
                  <img
                    src={heroImage}
                    alt="Loverball members at a watch party — women sports fans celebrating together"
                    className="w-full h-full object-cover"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                  />
                  <div
                    className="absolute top-4 left-4 inline-flex items-center gap-2"
                    style={{
                      background: "rgba(13,13,13,0.7)",
                      backdropFilter: "blur(8px)",
                      color: C.cream,
                      border: `1px solid ${C.inkRule}`,
                      padding: "8px 12px",
                      borderRadius: 999,
                      fontFamily: fonts.sans, fontSize: 12, letterSpacing: "0",
                    }}
                  >
                    <span
                      aria-hidden
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: C.accent, animation: "lb-pulse-dot 2s infinite" }}
                    />
                    Beta · Los Angeles
                  </div>
                </div>
                <figcaption className="mt-4 flex items-start justify-between gap-4">
                  <Mono color={C.inkMuted} size={10}>Fig. 01 — Members watch party</Mono>
                  <Mono color={C.cream} size={10}>2026</Mono>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* ============ MARQUEE TICKER ============ */}
      <div style={{ background: C.accent, color: "#fff" }} className="overflow-hidden" aria-hidden>
        <div
          className="marquee-track py-4 whitespace-nowrap"
          style={{
            fontFamily: fonts.serif,
            fontStyle: "italic",
            fontSize: 26,
            letterSpacing: "-0.01em",
          }}
        >
          {Array.from({ length: 2 }).map((_, k) => (
            <span key={k} className="inline-flex items-center gap-10 px-6">
              {[
                "For women who love sports",
                "★",
                "Any league. LA first.",
                "★",
                "Real friends, in real life",
                "★",
                "The Monday Drop",
                "★",
                "Members-only watch parties",
                "★",
              ].map((t, i) => (
                <span key={`${k}-${i}`}>{t}</span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ============ 2) SOCIAL PROOF ============ */}
      <SocialProofSection />

      {/* ============ 3) BENEFITS ============ */}
      <BenefitsSection />

      {/* ============ 4) THE DROP — Members-only, gated ============ */}
      <DropSection />

      {/* ============ 5) PRODUCT PREVIEW (mock cards) ============ */}
      <ProductPreviewSection />

      {/* ============ 6) RECAP GALLERY ============ */}
      <RecapGallery />

      {/* ============ 7) WHAT'S HAPPENING + STORIES ============ */}
      <section
        className="px-5 md:px-10 py-20 md:py-28"
        style={{ background: C.creamHi, borderTop: `1px solid ${C.rule}` }}
        aria-labelledby="happening-heading"
      >
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-end justify-between mb-10 gap-6">
            <div>
              <Mono color={C.creamMuted}>§ — On deck</Mono>
              <h2
                id="happening-heading"
                className="mt-3"
                style={{
                  fontFamily: fonts.serif,
                  fontStyle: "italic",
                  fontWeight: 400,
                  fontSize: "clamp(34px, 5vw, 60px)",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  color: C.ink,
                }}
              >
                What's happening in LA.
              </h2>
            </div>
            <Link
              to="/events"
              style={{
                fontFamily: fonts.sans, fontSize: 14, letterSpacing: "0",
                color: C.ink,
              }}
              className="hidden md:inline-flex items-center gap-2 hover:opacity-60 lb-cta"
            >
              All events <ArrowUpRight size={14} />
            </Link>
          </div>
          <WhatsHappeningNow />
        </div>
      </section>


      {/* ============ 8) MEMBERSHIP ============ */}
      <section
        ref={membershipRef}
        className="px-5 md:px-10 py-24 md:py-36"
        style={{ background: C.cream }}
        aria-labelledby="membership-heading"
      >
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-5">
              <Mono color={C.ink}>§ — Membership</Mono>
              <h2
                id="membership-heading"
                className="mt-5"
                style={{
                  fontFamily: fonts.serif,
                  fontWeight: 400,
                  fontSize: "clamp(42px, 6.4vw, 96px)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.03em",
                  color: C.ink,
                }}
              >
                One pass.<br />
                <span style={{ fontStyle: "italic" }}>Everything in.</span>
              </h2>
              <p className="mt-8 max-w-md" style={{ color: C.inkSoft, fontSize: 17, lineHeight: 1.55 }}>
                Loverball isn't a feature subscription — it's the club you want to
                belong to. Members get the people, the perks, and the front-of-line
                pass.
              </p>

              <ul className="mt-8 space-y-4 max-w-md">
                {[
                  { Icon: Heart, label: "Meet women fans near you" },
                  { Icon: MapPin, label: "Members-only watch parties & LA events" },
                  { Icon: Sparkles, label: "The Monday Drop — exclusive perks every week" },
                  { Icon: ArrowRight, label: "Meet each other at watch parties" },
                  { Icon: Ticket, label: "First access to invites, perks, priority RSVPs" },
                ].map((row) => (
                  <li key={row.label} className="flex items-start gap-3" style={{ fontSize: 15, color: C.inkSoft, lineHeight: 1.5 }}>
                    <span
                      aria-hidden
                      className="inline-flex items-center justify-center shrink-0"
                      style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: C.ink, color: C.accent,
                      }}
                    >
                      <row.Icon size={14} strokeWidth={2} />
                    </span>
                    <span>{row.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-7">
              <article
                className="relative p-8 md:p-12"
                style={{ background: C.ink, color: C.cream, borderRadius: 24 }}
              >
                <div className="flex items-start justify-between gap-4 mb-10">
                  <Mono color={C.accent}>The Club — Founding member</Mono>
                  <Mono color={C.inkMuted} size={10}>Monthly</Mono>
                </div>

                <div className="flex items-baseline gap-4 flex-wrap">
                  <span
                    style={{
                      fontFamily: fonts.display,
                      fontSize: "clamp(96px, 14vw, 180px)",
                      lineHeight: 0.9,
                      color: C.cream,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    ${MEMBERSHIP_PRICE}
                  </span>
                  <span style={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: 22, color: C.inkMuted }}>
                    / month
                  </span>
                  <span
                    style={{
                      fontFamily: fonts.display,
                      fontSize: 40,
                      color: C.inkMuted,
                      textDecoration: "line-through",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    ${MEMBERSHIP_ORIG}
                  </span>
                </div>
                <div className="mt-4">
                  <Mono color={C.accent}>Founding rate · Locked for life · Limited spots</Mono>
                </div>

                <div className="mt-10 pt-8" style={{ borderTop: `1px solid ${C.inkRule}` }}>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                    {[
                      "Meet women fans near you",
                      "Members-only watch parties",
                      "LA events & meet-ups",
                      "The Monday Drop",
                      "Meet at watch parties",
                      "Priority RSVPs",
                      "Founding-member perks",
                      "First access to invites",
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-3" style={{ fontSize: 14, lineHeight: 1.55 }}>
                        <Check size={16} color={C.accent} strokeWidth={2.25} className="mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => goJoin("membership_card")}
                    className="hover:-translate-y-0.5 transition-transform lb-cta"
                    style={{
                      background: C.accent, color: "#fff",
                      fontFamily: fonts.sans, fontSize: 16, letterSpacing: "-0.01em",
                      padding: "18px 32px", borderRadius: 999,
                      fontWeight: 600,
                      boxShadow: "0 14px 36px -16px rgba(232,93,38,0.7)",
                    }}
                  >
                    Join the Club
                  </button>
                  <Link
                    to="/membership"
                    className="inline-flex items-center gap-2 hover:opacity-80 lb-cta"
                    style={{
                      fontFamily: fonts.sans, fontSize: 15, letterSpacing: "0",
                      color: C.cream,
                      borderBottom: `1px solid ${C.inkMuted}`, paddingBottom: 4,
                      fontWeight: 500,
                    }}
                  >
                    Full details <ArrowRight size={12} />
                  </Link>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 9) FINAL CTA ============ */}
      <section className="px-5 md:px-10 py-24 md:py-36 text-center" style={{ background: C.creamHi }}>
        <div className="max-w-4xl mx-auto">
          <Mono color={C.creamMuted}>§ — Come find your people</Mono>
          <h2
            className="mt-6"
            style={{
              fontFamily: fonts.serif,
              fontWeight: 400,
              fontSize: "clamp(44px, 8vw, 120px)",
              lineHeight: 0.95,
              letterSpacing: "-0.035em",
              color: C.ink,
            }}
          >
            Your game. Your LA.<br />
            <span style={{ fontStyle: "italic", color: C.accent }}>Your crew.</span>

          </h2>
          <p
            className="mt-6 max-w-xl mx-auto"
            style={{ color: C.inkSoft, fontSize: 17, lineHeight: 1.6 }}
          >
            This isn't a feed of strangers. It's women in LA, the games you
            actually care about, and the watch parties already on the schedule.
            Pull up.
          </p>
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => goJoin("final_cta")}
              className="hover:-translate-y-0.5 transition-transform lb-cta"
              style={{
                background: C.accent, color: "#fff",
                fontFamily: fonts.sans, fontSize: 16, letterSpacing: "-0.01em",
                padding: "20px 36px", borderRadius: 999,
                fontWeight: 600,
                boxShadow: "0 14px 36px -16px rgba(232,93,38,0.7)",
              }}
            >
              Join the Club →
            </button>
            <Link
              to="/events"
              className="inline-flex items-center gap-2 hover:bg-black/5 lb-cta"
              style={{
                fontFamily: fonts.sans, fontSize: 15, letterSpacing: "0",
                color: C.ink,
                border: `1px solid ${C.ink}`, padding: "19px 35px", borderRadius: 999,
                fontWeight: 500,
              }}
            >
              See upcoming events ↗
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{ background: C.ink, color: C.cream }}>
        <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
            <div className="md:col-span-7">
              <img
                src={loverballWordmark.url}
                alt="Loverball"
                className="w-[260px] md:w-[340px] h-auto select-none mb-6"
                draggable={false}
                loading="lazy"
                decoding="async"
                style={{ filter: "brightness(0) invert(1)" }}
              />
              <p className="max-w-md" style={{ color: C.inkMuted, fontSize: 15, lineHeight: 1.6 }}>
                The fan community for women who love sports. In beta in Los Angeles —
                early access for LA-based founding members.
              </p>
              <a
                href="mailto:hello@loverball.com"
                className="mt-6 inline-block hover:opacity-80 transition-opacity lb-cta"
                style={{ fontFamily: fonts.sans, fontSize: 15, letterSpacing: "0", color: C.cream, borderBottom: `1px solid ${C.accent}`, paddingBottom: 3 }}
              >
                hello@loverball.com
              </a>
            </div>

            <div className="md:col-span-5 grid grid-cols-2 gap-8">
              {[
                { h: "Loverball", items: [["About", "/about"], ["Membership", "/membership"], ["Contact", "/contact"]] as [string, string][] },
                { h: "Explore", items: [["Feed", "/feed"], ["Events", "/events"], ["Club", "/club"]] as [string, string][] },
              ].map((col) => (
                <div key={col.h} className="flex flex-col gap-4">
                  <span
                    style={{
                      fontFamily: fonts.sans, fontSize: 12, letterSpacing: "0.04em",
                      color: C.inkMuted, fontWeight: 600, textTransform: "uppercase",
                    }}
                  >
                    {col.h}
                  </span>
                  {col.items.map(([label, to]) => (
                    <Link
                      key={label}
                      to={to}
                      className="hover:text-[#E85D26] transition-colors lb-cta"
                      style={{ fontFamily: fonts.serif, fontSize: 20, color: C.cream, letterSpacing: "-0.01em" }}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row md:items-center justify-between gap-6" style={{ borderTop: `1px solid ${C.inkRule}` }}>
            <span style={{ fontFamily: fonts.sans, fontSize: 13, letterSpacing: "0", color: C.inkMuted }}>© 2026 Loverball · Built in LA</span>
            <div className="flex items-center gap-6">
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Loverball on Instagram" className="hover:opacity-100 transition-opacity lb-cta" style={{ color: C.cream, opacity: 0.7 }}>
                <Instagram size={18} />
              </a>
              {[["Privacy", "/privacy"], ["Terms", "/terms"]].map(([l, h]) => (
                <Link key={l} to={h} className="hover:text-[#F5F0E8] transition-colors lb-cta" style={{ fontFamily: fonts.sans, fontSize: 13, letterSpacing: "0", color: C.inkMuted }}>
                  {l}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
