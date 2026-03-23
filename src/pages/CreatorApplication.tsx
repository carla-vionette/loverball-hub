import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import loverballLogo from "@/assets/loverball-script-logo.png";
import { motion } from "framer-motion";

type AccountType = "team" | "creator" | "organization";

const CreatorApplication = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [accountType, setAccountType] = useState<AccountType>(
    (searchParams.get("type") as AccountType) || "creator"
  );
  const [officialEmail, setOfficialEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [youtube, setYoutube] = useState("");
  const [twitter, setTwitter] = useState("");
  const [contentBio, setContentBio] = useState("");
  const [orgName, setOrgName] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
      } else {
        setUserId(user.id);
      }
    };
    checkAuth();
  }, [navigate]);

  const isValid = () => {
    if (!officialEmail.trim() || !phoneNumber.trim()) return false;
    if (!instagram.trim() && !tiktok.trim() && !youtube.trim() && !twitter.trim()) return false;
    if ((accountType === "team" || accountType === "organization") && !orgName.trim()) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!userId || !isValid()) return;

    setLoading(true);
    try {
      const socialLinks = {
        instagram: instagram.trim() || null,
        tiktok: tiktok.trim() || null,
        youtube: youtube.trim() || null,
        twitter: twitter.trim() || null,
      };

      // Create the creator application
      const { error: appError } = await supabase
        .from("creator_applications" as any)
        .insert({
          user_id: userId,
          account_type: accountType,
          official_email: officialEmail.trim(),
          phone_number: phoneNumber.trim(),
          social_links: socialLinks,
          content_bio: contentBio.trim() || null,
          org_name: orgName.trim() || null,
        } as any);

      if (appError) throw appError;

      // Update the profile with account type and pending status
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            account_type: accountType,
            approval_status: "pending",
            official_email: officialEmail.trim(),
            phone_number: phoneNumber.trim(),
            social_links: socialLinks,
            content_bio: contentBio.trim() || null,
            org_name: orgName.trim() || null,
            name: orgName.trim() || officialEmail.split("@")[0],
          } as any,
          { onConflict: "id" }
        );

      if (profileError) throw profileError;

      setSubmitted(true);
    } catch (error: any) {
      toast({
        title: "Error submitting application",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 text-center"
        >
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Application Submitted
          </h2>
          <p className="text-slate-600 text-sm mb-6">
            Thank you for applying! Our team will review your application and get
            back to you shortly. You'll receive a notification once your account
            has been approved.
          </p>
          <Button
            onClick={() => navigate("/auth")}
            className="rounded-xl h-12 px-8"
          >
            Back to Sign In
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header bar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 flex items-center justify-center h-16">
          <img src={loverballLogo} alt="Loverball" className="h-16 w-auto" />
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-8 sm:p-10">
            <span className="inline-block bg-white/10 text-white/80 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              Creator Program
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-3">
              Are you a sports content creator or a team and want to feature
              your content on our platform?
            </h1>
            <p className="text-white/70 text-sm sm:text-base">
              Join our creator program. Apply here.
            </p>
          </div>
        </motion.div>

        {/* Application form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8 space-y-6"
        >
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide">
            Application Details
          </h2>

          {/* Account Type */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Account Type *
            </Label>
            <Select
              value={accountType}
              onValueChange={(v) => setAccountType(v as AccountType)}
            >
              <SelectTrigger className="h-12 rounded-xl border-slate-300 bg-slate-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="creator">Creator</SelectItem>
                <SelectItem value="team">Team</SelectItem>
                <SelectItem value="organization">Organization</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Team/Org name */}
          {(accountType === "team" || accountType === "organization") && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {accountType === "team" ? "Team Name" : "Organization Name"} *
              </Label>
              <Input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder={
                  accountType === "team"
                    ? "e.g., LA Galaxy"
                    : "e.g., Women's Sports Foundation"
                }
                className="h-12 rounded-xl border-slate-300 bg-slate-50"
              />
            </div>
          )}

          {/* Official Email */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Official Email *
            </Label>
            <Input
              type="email"
              value={officialEmail}
              onChange={(e) => setOfficialEmail(e.target.value)}
              placeholder="you@yourorg.com"
              className="h-12 rounded-xl border-slate-300 bg-slate-50"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Phone Number *
            </Label>
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="(555) 123-4567"
              className="h-12 rounded-xl border-slate-300 bg-slate-50"
            />
          </div>

          {/* Social Media Links */}
          <div className="space-y-4">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Social Media Links * (at least one required)
            </Label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Instagram</Label>
                <Input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@handle or URL"
                  className="h-11 rounded-xl border-slate-300 bg-slate-50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">TikTok</Label>
                <Input
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  placeholder="@handle or URL"
                  className="h-11 rounded-xl border-slate-300 bg-slate-50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">YouTube</Label>
                <Input
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  placeholder="Channel URL"
                  className="h-11 rounded-xl border-slate-300 bg-slate-50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">X / Twitter</Label>
                <Input
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="@handle or URL"
                  className="h-11 rounded-xl border-slate-300 bg-slate-50"
                />
              </div>
            </div>
          </div>

          {/* Content Bio */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Bio / Description of Content
            </Label>
            <Textarea
              value={contentBio}
              onChange={(e) => setContentBio(e.target.value)}
              placeholder="Tell us about the content you create, your audience, and what you'd bring to the platform..."
              rows={4}
              className="rounded-xl border-slate-300 bg-slate-50 resize-none"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!isValid() || loading}
            className="w-full h-12 rounded-xl text-sm font-semibold uppercase tracking-wider gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Application
              </>
            )}
          </Button>

          <p className="text-xs text-slate-400 text-center">
            Applications are typically reviewed within 24-48 hours.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default CreatorApplication;
