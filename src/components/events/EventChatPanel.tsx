import EventChatThread from "./EventChatThread";

interface Props {
  eventId: string;
  onScrollToRsvp?: () => void;
}

export default function EventChatPanel({ eventId }: Props) {
  return <EventChatThread eventId={eventId} />;
}
