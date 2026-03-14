import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft } from "lucide-react";
import loverballLogo from "@/assets/loverball-script-logo.png";
import { z } from "zod";
import WelcomeSplash from "@/components/WelcomeSplash";

const signUpSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signInSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const ACCESS_CODE = '7988';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accessCode, setAccessCode] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [splashName, setSplashName] = useState<string | null>(null);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const redirectTo = searchParams.get('redirect') || '/watch';

  // Check if user came from a password reset link or signup link
  useEffect(() => {
    const isReset = searchParams.get('reset') === 'true';
    const wantsSignup = searchParams.get('signup') === 'true';
    
    if (isReset) {
      setIsResettingPassword(true);
    }
    if (wantsSignup) {
      setIsSignUp(true);
    }
  }, [searchParams]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been successfully reset. You can now sign in.",
      });

      setIsResettingPassword(false);
      setPassword("");
      setConfirmPassword("");
      navigate("/watch");
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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Validate inputs
        const validation = signUpSchema.safeParse({ email, password });
        if (!validation.success) {
          throw new Error(validation.error.errors[0].message);
        }

        // Sign up the user
        const { error, data } = await supabase.auth.signUp({
          email: validation.data.email,
          password: validation.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`
          }
        });
        
        if (error) throw error;
        
        if (data.user) {
          toast({
            title: "Welcome to Loverball!",
            description: "Let's choose your plan.",
          });
          navigate("/plans");
        }
      } else {
        // Validate sign in inputs
        const validation = signInSchema.safeParse({ email, password });
        if (!validation.success) {
          throw new Error(validation.error.errors[0].message);
        }

        const { error, data } = await supabase.auth.signInWithPassword({
          email: validation.data.email,
          password: validation.data.password,
        });
        
        if (error) throw error;

        // Check if profile exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profile) {
          // Check if user has a plan selected
          const profileAny = profile as any;
          if (!profileAny.membership_tier) {
            navigate("/plans");
          } else {
            setSplashName(profile.name);
            setPendingRedirect(redirectTo);
          }
        } else {
          navigate("/plans");
        }
      }
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

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/plans`
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {splashName && pendingRedirect && (
        <WelcomeSplash
          name={splashName}
          onDismiss={() => navigate(pendingRedirect)}
        />
      )}
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-center pt-12 pb-6">
            <img src={loverballLogo} alt="Loverball" className="w-[200px] h-auto" />
          </div>
        </div>
      </nav>

      {/* Main Content - Two Column Layout */}
      <div className="pt-16 min-h-screen grid lg:grid-cols-2">
        {/* Left Column - Branding */}
        <div className="hidden lg:flex flex-col justify-center px-12 xl:px-20 bg-pale-pink relative">
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-primary" />
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="pl-8"
          >
            <p className="text-primary text-sm font-medium tracking-widest mb-6 uppercase">Welcome</p>
            <h1 className="text-4xl xl:text-5xl font-sans font-normal leading-tight mb-6 text-foreground">
              {isResettingPassword ? "Reset Password." : isSignUp ? "Join the Movement." : "Welcome Back."}
            </h1>
            <p className="text-foreground/60 text-sm leading-relaxed max-w-md">
              {isResettingPassword
                ? "Enter your new password below to regain access to your account."
                : isSignUp 
                ? "Create your account to connect with women who share your passion for sports."
                : "Sign in to continue your journey with the community."}
            </p>
          </motion.div>
        </div>

        {/* Right Column - Form */}
        <div className="flex flex-col justify-center px-6 sm:px-12 xl:px-20 py-16">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-md mx-auto w-full"
          >
            {/* Mobile Header */}
            <div className="lg:hidden mb-12">
              <p className="text-primary text-sm font-medium tracking-widest mb-4 uppercase">Welcome</p>
              <h1 className="text-3xl font-sans font-normal leading-tight text-foreground">
                {isResettingPassword ? "Reset Password." : isSignUp ? "Join the Movement." : "Welcome Back."}
              </h1>
            </div>

            {isResettingPassword ? (
              <div className="space-y-8">
                <form onSubmit={handlePasswordReset} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-xs tracking-wider uppercase text-foreground/60">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="rounded-none h-12 border-border bg-background placeholder:text-foreground/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-xs tracking-wider uppercase text-foreground/60">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="rounded-none h-12 border-border bg-background placeholder:text-foreground/30"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full rounded-none h-12 text-sm tracking-wider group" 
                    disabled={loading}
                  >
                    {loading ? "UPDATING..." : "UPDATE PASSWORD"}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </form>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsResettingPassword(false);
                      navigate('/auth');
                    }}
                    className="text-sm text-foreground/60 hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to sign in
                  </button>
                </div>
              </div>
            ) : (
            <div className="space-y-8">
              <Button 
                onClick={handleGoogleAuth}
                variant="outline" 
                className="w-full rounded-none h-12 border-border hover:bg-pale-pink hover:border-primary transition-colors"
                type="button"
              >
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-sm tracking-wider">CONTINUE WITH GOOGLE</span>
              </Button>

              <div className="relative">
                <Separator className="bg-border" />
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4 text-xs text-foreground/40 tracking-wider">
                  OR
                </span>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs tracking-wider uppercase text-foreground/60">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-none h-12 border-border bg-background placeholder:text-foreground/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs tracking-wider uppercase text-foreground/60">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="rounded-none h-12 border-border bg-background placeholder:text-foreground/30"
                  />
                </div>


                <Button 
                  type="submit" 
                  className="w-full rounded-none h-12 text-sm tracking-wider group" 
                  disabled={loading}
                >
                  {loading ? "LOADING..." : isSignUp ? "CREATE ACCOUNT" : "SIGN IN"}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </form>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-foreground/60 hover:text-primary transition-colors"
                >
                  {isSignUp 
                    ? "Already have an account? Sign in" 
                    : "Don't have an account? Sign up"}
                </button>
              </div>
            </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Auth;