import { useEffect, useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Wordmark from './Wordmark';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  eventTitle?: string;
  onAuthed?: () => void;
}

const COUNTRIES = [
  { code: '+1',  flag: 'US' },
  { code: '+44', flag: 'UK' },
  { code: '+52', flag: 'MX' },
  { code: '+34', flag: 'ES' },
  { code: '+33', flag: 'FR' },
];

export default function AuthModal({ open, onOpenChange, eventTitle, onAuthed }: Props) {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [country, setCountry] = useState('+1');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) { setStep('phone'); setPhone(''); setCode(''); }
  }, [open]);

  const fullPhone = `${country}${phone.replace(/\D/g, '')}`;

  const sendCode = async () => {
    if (phone.replace(/\D/g, '').length < 7) {
      toast.error('Enter a valid phone number');
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
    setBusy(false);
    if (error) {
      toast.error(error.message.includes('not enabled')
        ? 'Phone sign-in needs to be enabled in your backend settings.'
        : error.message);
      return;
    }
    setStep('code');
    toast.success('Code sent. Check your texts.');
  };

  const verify = async (codeToVerify: string) => {
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: fullPhone, token: codeToVerify, type: 'sms',
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    onAuthed?.();
    onOpenChange(false);
  };

  const onCodeChange = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    if (digits.length === 6) verify(digits);
  };

  const oauth = async (provider: 'google' | 'apple') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.href },
    });
    if (error) toast.error(error.message);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-background border-t border-border rounded-t-2xl px-6 pt-6 pb-8 md:max-w-md md:mx-auto md:rounded-2xl md:border md:my-auto md:h-auto md:bottom-auto md:top-1/2 md:-translate-y-1/2"
      >
        <div className="mb-4"><Wordmark /></div>

        <h2 className="font-serif text-[22px] leading-tight text-foreground mb-1">
          {eventTitle ? `RSVP to ${eventTitle}` : 'Save your spot'}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">Takes 10 seconds. We'll save your spot.</p>

        {step === 'phone' && (
          <>
            <div className="flex gap-2 mb-4">
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="bg-card border border-input rounded-md px-3 text-sm h-12"
              >
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
              </select>
              <Input
                inputMode="tel"
                placeholder="555 123 4567"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="h-12 text-base bg-card"
                autoFocus
              />
            </div>
            <Button
              onClick={sendCode}
              disabled={busy}
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-base"
            >
              {busy ? 'Sending…' : 'Continue'}
            </Button>

            <div className="flex items-center gap-3 my-5 text-xs text-muted-foreground">
              <div className="flex-1 h-px bg-border" /> or <div className="flex-1 h-px bg-border" />
            </div>

            <Button
              onClick={() => oauth('apple')}
              variant="outline"
              className="w-full h-12 bg-foreground text-background border-foreground hover:bg-foreground/90 hover:text-background rounded-md mb-2"
            >
              Continue with Apple
            </Button>
            <Button
              onClick={() => oauth('google')}
              variant="outline"
              className="w-full h-12 bg-card text-foreground rounded-md"
            >
              Continue with Google
            </Button>
          </>
        )}

        {step === 'code' && (
          <>
            <p className="text-sm text-muted-foreground mb-2">Enter the 6-digit code sent to {fullPhone}</p>
            <Input
              inputMode="numeric"
              autoFocus
              value={code}
              onChange={e => onCodeChange(e.target.value)}
              placeholder="123456"
              className="h-14 text-2xl tracking-[0.5em] text-center bg-card font-mono"
              maxLength={6}
            />
            <button
              onClick={() => setStep('phone')}
              className="text-xs text-muted-foreground mt-3 underline-offset-2 hover:underline"
            >
              Use a different number
            </button>
          </>
        )}

        <p className="text-[11px] text-muted-foreground text-center mt-6">
          By continuing you agree to our <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy Policy</a>.
        </p>
      </SheetContent>
    </Sheet>
  );
}
