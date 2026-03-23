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
import { Loader2, Send, ArrowLeft } from "lucide-react";
import { submitCreatorApplication } from "@/services/adminService";
import type { AccountType } from "@/types";

const CreatorApplication = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const preselectedType = searchParams.get("type") as AccountType | null;

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [accountType, setAccountType] = useState<"team" | "creator" | "organization">(
    (preselectedType && preselectedType !== "member" ? preselectedType : "creator") as "team" | "creator" | "organization"
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
      } else {
        setUserId(user.id);
        // Pre-fill email if available
        if (user.email) setOfficialEmail(user.email);
      }
    };
    checkAuth();
  }, [navigate]);

  const isFormValid = () => {
    return (
      officialEmail.trim() &&
      phoneNumber.trim() &&
      (instagram.trim() || tiktok.trim() || youtube.trim() || twitter.trim()) &&
      (accountType !== "team" && accountType !== "organization" || orgName.trim())
    );
  };

  const handleSubmit = async () => {
    if (!userId || !isFormValid()) return;

    setLoading(true);
    try {
      // First create a basic profile
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        name: orgName || officialEmail.split("@")[0],
        account_type: accountType,
        approval_status: "pending_review",
        official_email: officialEmail,
        phone_number: phoneNumber,
        social_links: {
          instagram: instagram || undefined,
          tiktok: tiktok || undefined,
          youtube: youtube || undefined,
          twitter: twitter || undefined,
        },
        content_bio: contentBio || null,
        org_name: orgName || null,
      } as any, { onConflict: "id" });

      if (profileError) throw profileError;

      // Submit the application
      await submitCreatorApplication({
        user_id: userId,
        account_type: accountType,
        official_email: officialEmail,
        phone_number: phoneNumber,
        social_links: {
          instagram: instagram || "",
          tiktok: tiktok || "",
          youtube: youtube || "",
          twitter: twitter || "",
        },
        content_bio: contentBio || undefined,
        org_name: orgName || undefined,
      });

      toast({
        title: "Application submitted!",
        description: "Your application is under review. We'll notify you once it's been reviewed.",
      });

      navigate("/application-pending");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Professional header */}
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate("/onboarding")} className="text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">LOVERBALL</h1>
            <p className="text-xs text-slate-500 tracking-wider uppercase">Creator Program Application</p>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Hero section */}
        <div className="bg-white border border-slate-200 rounded-xl p-8 mb-8 shadow-sm">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
            Are you a sports content creator or a team and want to feature your content on our platform?
          </h2>
          <p className="text-lg text-slate-600">
            Join our creator program. Apply here.
          </p>
          <div className="mt-4 flex gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Post Events
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              Upload Videos
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
              Build Your Channel
            </span>
          </div>
        </div>

        {/* Application form */}
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-6 pb-4 border-b border-slate-100">
            Application Details
          </h3>

          <div className="space-y-6">
            {/* Account Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Account Type *</Label>
              <Select value={accountType} onValueChange={(v) => setAccountType(v as typeof accountType)}>
                <SelectTrigger className="h-12 bg-white border-slate-300 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="creator">Creator</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="organization">Organization</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Team/Org Name */}
            {(accountType === "team" || accountType === "organization") && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  {accountType === "team" ? "Team Name" : "Organization Name"} *
                </Label>
                <Input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder={accountType === "team" ? "e.g., LA Galaxy" : "e.g., Sports Media Inc."}
                  className="h-12 bg-white border-slate-300 rounded-lg"
                />
              </div>
            )}

            {/* Official Email */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Official Email *</Label>
              <Input
                type="email"
                value={officialEmail}
                onChange={(e) => setOfficialEmail(e.target.value)}
                placeholder="your@email.com"
                className="h-12 bg-white border-slate-300 rounded-lg"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Phone Number *</Label>
              <Input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="(555) 123-4567"
                className="h-12 bg-white border-slate-300 rounded-lg"
              />
            </div>

            {/* Social Media Links */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-slate-700">
                Social Media Links * <span className="text-slate-400 font-normal">(at least one required)</span>
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Instagram</Label>
                  <Input
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@username or URL"
                    className="h-11 bg-white border-slate-300 rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">TikTok</Label>
                  <Input
                    value={tiktok}
                    onChange={(e) => setTiktok(e.target.value)}
                    placeholder="@username or URL"
                    className="h-11 bg-white border-slate-300 rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">YouTube</Label>
                  <Input
                    value={youtube}
                    onChange={(e) => setYoutube(e.target.value)}
                    placeholder="Channel URL"
                    className="h-11 bg-white border-slate-300 rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">X / Twitter</Label>
                  <Input
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder="@username or URL"
                    className="h-11 bg-white border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Bio / Description */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Bio / Description of Content
              </Label>
              <Textarea
                value={contentBio}
                onChange={(e) => setContentBio(e.target.value)}
                placeholder="Tell us about the content you create, the sports you cover, and your audience..."
                rows={4}
                className="bg-white border-slate-300 rounded-lg resize-none"
              />
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-slate-100">
              <Button
                onClick={handleSubmit}
                disabled={loading || !isFormValid()}
                className="w-full h-12 rounded-lg text-sm font-semibold tracking-wider gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    SUBMITTING APPLICATION...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    SUBMIT APPLICATION
                  </>
                )}
              </Button>
              <p className="text-xs text-slate-400 text-center mt-3">
                Your application will be reviewed by our team. You'll be notified once a decision is made.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorApplication;
