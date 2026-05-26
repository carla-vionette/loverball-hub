import React, { useState } from "react";
import { Check, X, Sparkles } from "lucide-react";

const C = {
  bg: "#0a0a0a",
  card: "#1A1A1A",
  cardElev: "#2A2A2A",
  text: "#FAF5E9",
  muted: "#B8B8B8",
  faint: "#6B6B70",
  raspberry: "#F04E23",
  copper: "#E6F25A",
  border: "rgba(250, 245, 233, 0.08)",
  borderStrong: "rgba(250, 245, 233, 0.15)",
  chip: "rgba(250, 245, 233, 0.05)",
};

export interface DraftConfirmModalProps {
  open: boolean;
  memberFirstName: string;
  suggestedOpener?: string;
  draftsLeft: number;
  onClose: () => void;
  onSendOpener?: (text: string) => void;
}

const DraftConfirmModal: React.FC<DraftConfirmModalProps> = ({
  open,
  memberFirstName,
  suggestedOpener,
  draftsLeft,
  onClose,
  onSendOpener,
}) => {
  const [opener, setOpener] = useState(suggestedOpener || "");
  const [editing, setEditing] = useState(false);

  React.useEffect(() => {
    if (open) setOpener(suggestedOpener || "");
  }, [open, suggestedOpener]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center"
      style={{ background: "rgba(5,5,7,0.78)", backdropFilter: "blur(14px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full md:max-w-[440px] rounded-t-3xl md:rounded-3xl p-6 pb-8 animate-in fade-in slide-in-from-bottom-6 duration-300"
        style={{
          background: C.cardElev,
          border: `1px solid ${C.border}`,
          boxShadow: "0 -30px 80px -20px rgba(232,39,111,0.35)",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full"
          style={{ color: C.muted }}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Checkmark circle */}
        <div className="flex justify-center mt-2 mb-5">
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: 56,
              height: 56,
              background: C.raspberry,
              boxShadow: "0 12px 36px -8px rgba(232,39,111,0.6)",
            }}
          >
            <Check size={28} strokeWidth={2.5} color="#0A0A0B" />
          </div>
        </div>

        {/* Headline */}
        <h2
          className="text-center mb-2"
          style={{
            fontFamily: "'Anton', Impact, sans-serif",
            fontSize: 30,
            color: C.text,
            lineHeight: 1.05,
            letterSpacing: "-0.01em",
          }}
        >
          They're on your bench.
        </h2>
        <p
          className="text-center mb-5 px-2"
          style={{
            fontSize: 13,
            lineHeight: 1.5,
            color: C.muted,
          }}
        >
          {memberFirstName} will see you drafted her. If she drafts you
          back, you're a starting XI.
        </p>

        {/* Opener card */}
        {suggestedOpener && (
          <div
            className="rounded-xl p-3 mb-5"
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
            }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={11} color={C.copper} />
              <span
                className="text-[9.5px] uppercase font-semibold"
                style={{
                  fontFamily: "'Poppins', system-ui, sans-serif",
                  letterSpacing: "0.2em",
                  color: C.copper,
                }}
              >
                Suggested opener
              </span>
            </div>
            {editing ? (
              <textarea
                value={opener}
                onChange={(e) => setOpener(e.target.value)}
                rows={3}
                className="w-full bg-transparent outline-none resize-none"
                style={{
                  fontFamily: "'Poppins', system-ui, sans-serif",
                  fontSize: 12.5,
                  lineHeight: 1.55,
                  color: C.text,
                }}
                autoFocus
              />
            ) : (
              <p
                style={{
                  fontFamily: "'Poppins', system-ui, sans-serif",
                  fontSize: 12.5,
                  lineHeight: 1.55,
                  color: C.text,
                }}
              >
                &ldquo;{opener}&rdquo;
              </p>
            )}
            <div className="flex justify-between items-center mt-2.5 pt-2.5" style={{ borderTop: `1px solid ${C.border}` }}>
              <button
                onClick={() => setEditing((v) => !v)}
                className="text-[10px] uppercase font-semibold"
                style={{
                  fontFamily: "'Poppins', system-ui, sans-serif",
                  letterSpacing: "0.16em",
                  color: C.raspberry,
                }}
              >
                {editing ? "Save" : "Rewrite"}
              </button>
              <span
                className="text-[10px] uppercase"
                style={{
                  fontFamily: "'Poppins', system-ui, sans-serif",
                  letterSpacing: "0.16em",
                  color: C.faint,
                }}
              >
                Sends when mutual
              </span>
            </div>
          </div>
        )}

        {/* Got it */}
        <button
          onClick={() => {
            if (onSendOpener && opener.trim()) onSendOpener(opener.trim());
            onClose();
          }}
          className="w-full rounded-full uppercase font-bold transition-opacity active:opacity-80"
          style={{
            fontFamily: "Poppins, system-ui, sans-serif",
            fontSize: 12,
            letterSpacing: "0.18em",
            padding: "14px 18px",
            background: C.raspberry,
            color: "#0A0A0B",
            boxShadow: "0 16px 36px -12px rgba(232,39,111,0.55)",
          }}
        >
          Got it
        </button>

        {/* Counter */}
        <p
          className="text-center mt-4 text-[10px] uppercase"
          style={{
            fontFamily: "'Poppins', system-ui, sans-serif",
            letterSpacing: "0.2em",
            color: C.faint,
          }}
        >
          Drafts left this week: <span style={{ color: C.copper }}>{draftsLeft}</span>
        </p>
      </div>
    </div>
  );
};

export default DraftConfirmModal;
