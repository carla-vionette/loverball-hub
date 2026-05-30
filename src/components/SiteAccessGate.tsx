import { useState, useEffect, ReactNode } from 'react';

const ACCESS_CODE = '7688';
const STORAGE_KEY = 'loverball_site_access';

const SiteAccessGate = ({ children }: { children: ReactNode }) => {
  const [granted, setGranted] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'granted';
  });
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim() === ACCESS_CODE) {
      localStorage.setItem(STORAGE_KEY, 'granted');
      setGranted(true);
    } else {
      setError(true);
      setCode('');
    }
  };

  if (granted) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold tracking-widest uppercase text-[#1A1A1A] mb-2">
          loverball
        </h1>
        <p className="text-sm text-[#6B6B6B] mb-8">Enter access code to continue</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(false); }}
            placeholder="• • • •"
            className="w-full text-center text-2xl tracking-[0.5em] bg-white border border-[#E8E3DC] rounded-xl px-4 py-4 text-[#1A1A1A] placeholder:text-[#6B6B6B] focus:outline-none focus:border-[#E85D2F] transition-colors"
            autoFocus
          />
          {error && (
            <p className="text-[#E85D2F] text-xs">Invalid code. Try again.</p>
          )}
          <button
            type="submit"
            className="w-full bg-[#E85D2F] text-white font-bold text-sm tracking-widest uppercase py-3.5 rounded-xl hover:opacity-90 transition-opacity"
          >
            Enter
          </button>
        </form>

      </div>
    </div>
  );
};

export default SiteAccessGate;
