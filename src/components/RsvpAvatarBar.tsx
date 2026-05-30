import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface RsvpAttendee {
  id: string;
  name: string;
  profile_photo_url: string | null;
}

interface RsvpAvatarBarProps {
  attendees: RsvpAttendee[];
  totalCount?: number;
  maxAvatars?: number;
  size?: "sm" | "md";
  onAvatarClick?: (attendee: RsvpAttendee) => void;
  onViewAllClick?: () => void;
  emptyLabel?: string;
  className?: string;
}

const RsvpAvatarBar: React.FC<RsvpAvatarBarProps> = ({
  attendees,
  totalCount,
  maxAvatars = 5,
  size = "md",
  onAvatarClick,
  onViewAllClick,
  emptyLabel = "Be the first to RSVP",
  className = "",
}) => {
  const count = totalCount ?? attendees.length;
  const visible = attendees.slice(0, maxAvatars);
  const overflow = Math.max(0, count - maxAvatars);

  const avatarSize = size === "sm" ? 28 : 32;
  const fallbackSize = size === "sm" ? 10 : 11;
  const overlap = size === "sm" ? -8 : -10;
  const strokeWidth = size === "sm" ? 2 : 2.5;

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (count === 0) {
    return (
      <div
        className={`flex items-center gap-2 ${className}`}
        style={{ minHeight: avatarSize }}
      >
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: avatarSize,
            height: avatarSize,
            background: "rgba(232,93,47,0.12)",
            border: "1.5px dashed rgba(232,93,47,0.35)",
          }}
        >
          <span
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: fallbackSize,
              fontWeight: 700,
              color: "rgba(232,93,47,0.65)",
            }}
          >
            +
          </span>
        </div>
        <span
          style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: "italic",
            fontSize: size === "sm" ? 12 : 13,
            color: "rgba(248,248,248,0.45)",
            letterSpacing: "0.01em",
          }}
        >
          {emptyLabel}
        </span>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className={`flex items-center gap-2.5 ${className}`}>
        {/* Avatar stack */}
        <div className="flex" style={{ paddingRight: overflow > 0 ? 4 : 0 }}>
          {visible.map((attendee, idx) => (
            <Tooltip key={attendee.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAvatarClick?.(attendee);
                  }}
                  className="relative transition-transform duration-200 hover:scale-110 hover:z-10 focus:outline-none"
                  style={{
                    marginLeft: idx === 0 ? 0 : overlap,
                    zIndex: hoveredIndex === idx ? 20 : 10 - idx,
                  }}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <Avatar
                    style={{
                      width: avatarSize,
                      height: avatarSize,
                      border: `${strokeWidth}px solid #1A1A1C`,
                    }}
                  >
                    <AvatarImage
                      src={attendee.profile_photo_url || undefined}
                      alt={attendee.name}
                      className="object-cover"
                    />
                    <AvatarFallback
                      style={{
                        background:
                          idx % 3 === 0
                            ? "rgba(232,93,47,0.18)"
                            : idx % 3 === 1
                            ? "rgba(232,107,176,0.18)"
                            : "rgba(230,242,90,0.14)",
                        color:
                          idx % 3 === 0
                            ? "#E85D2F"
                            : idx % 3 === 1
                            ? "#E86BB0"
                            : "#C8D94E",
                        fontSize: fallbackSize,
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontWeight: 700,
                      }}
                    >
                      {attendee.name?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                sideOffset={6}
                className="rounded-lg px-2.5 py-1"
                style={{
                  background: "rgba(26,26,28,0.96)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#F8F8F8",
                    letterSpacing: "0.02em",
                  }}
                >
                  {attendee.name}
                </span>
              </TooltipContent>
            </Tooltip>
          ))}

          {/* Overflow badge */}
          {overflow > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewAllClick?.();
              }}
              className="relative flex items-center justify-center rounded-full transition-transform duration-200 hover:scale-110 focus:outline-none"
              style={{
                width: avatarSize,
                height: avatarSize,
                marginLeft: overlap,
                zIndex: 0,
                background: "rgba(232,93,47,0.12)",
                border: `${strokeWidth}px solid #1A1A1C`,
              }}
            >
              <span
                style={{
                  fontFamily: "'Space Mono', ui-monospace, monospace",
                  fontSize: size === "sm" ? 9 : 10,
                  fontWeight: 700,
                  color: "#E85D2F",
                  letterSpacing: "0.02em",
                }}
              >
                +{overflow}
              </span>
            </button>
          )}
        </div>

        {/* Count label */}
        <span
          style={{
            fontFamily: "'Space Mono', ui-monospace, monospace",
            fontSize: size === "sm" ? 10 : 11,
            color: "rgba(248,248,248,0.65)",
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
          }}
        >
          {count} going
        </span>
      </div>
    </TooltipProvider>
  );
};

export default RsvpAvatarBar;
