import { useEventRsvp } from "@/hooks/useEventRsvp";
import EventChatThread from "./EventChatThread";
import { MessageCircle } from "lucide-react";

interface Props {
  eventId: string;
  onScrollToRsvp?: () => void;
}

export default function EventChatPanel({ eventId, onScrollToRsvp }: Props) {
  const { rsvp, loading } = useEventRsvp(eventId);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-black/5 p-6 animate-pulse h-40" />
    );
  }

  if (!rsvp) {
    return (
      <div className="rounded-2xl bg-[#1A1A1A] p-6 text-center space-y-3">
        <MessageCircle className="w-7 h-7 text-[#E8185A] mx-auto" />
        <h4 className="font-['Playfair_Display'] text-xl text-[#FAF5E9]">
          Going chat
        </h4>
        <p className="text-sm font-['Inter'] text-[#FAF5E9]/70 max-w-xs mx-auto">
          RSVP to this event to read and join the conversation with everyone
          going.
        </p>
        <button
          onClick={onScrollToRsvp}
          className="inline-flex items-center px-5 py-2 rounded-full bg-[#E8185A] text-white text-sm font-semibold font-['Inter'] hover:bg-[#E8185A]/90"
        >
          RSVP to join
        </button>
      </div>
    );
  }

  return <EventChatThread eventId={eventId} />;
}
