import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { C, fonts } from "@/lib/editorialTheme";

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

const NotificationBell = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const unread = items.filter((n) => !n.is_read).length;

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id, type, title, body, link, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    setItems(data ?? []);
  };

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    load();
    const channel = supabase
      .channel(`notif:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  };

  const markAllRead = async () => {
    if (!user) return;
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative p-2 transition-colors hover:opacity-80"
        style={{ color: C.text }}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1"
            style={{
              background: "#FFFFFF",
              color: "#0a0a0a",
              fontFamily: fonts.mono,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 mt-3 w-[360px] max-w-[92vw] z-50 overflow-hidden"
            style={{
              background: C.surface,
              border: `1px solid ${C.borderStrong}`,
              borderRadius: 14,
              boxShadow: "0 24px 60px -20px rgba(0,0,0,0.6)",
            }}
          >
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: C.text }}>
                Notifications
              </span>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] uppercase tracking-wider hover:opacity-80"
                    style={{ fontFamily: fonts.mono, color: C.muted }}
                  >
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 hover:opacity-80" style={{ color: C.muted }}>
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-4 py-10 text-center" style={{ fontFamily: fonts.sans, fontSize: 14, color: C.muted }}>
                  No notifications yet.
                </div>
              ) : (
                items.map((n) => {
                  const inner = (
                    <div
                      className="px-4 py-3 flex items-start gap-3 hover:bg-white/[0.03] transition-colors"
                      style={{ borderBottom: `1px solid ${C.border}` }}
                    >
                      <div
                        className="mt-1 w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: n.is_read ? "transparent" : "#FFFFFF" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          style={{
                            fontFamily: fonts.sans,
                            fontSize: 14,
                            color: C.text,
                            fontWeight: n.is_read ? 400 : 600,
                            lineHeight: 1.35,
                          }}
                        >
                          {n.title}
                        </p>
                        {n.body && (
                          <p
                            className="mt-1 truncate"
                            style={{ fontFamily: fonts.sans, fontSize: 13, color: C.muted, lineHeight: 1.4 }}
                          >
                            {n.body}
                          </p>
                        )}
                        <p
                          className="mt-1"
                          style={{
                            fontFamily: fonts.mono,
                            fontSize: 10,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: C.muted,
                          }}
                        >
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {!n.is_read && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            markRead(n.id);
                          }}
                          className="p-1 hover:opacity-80"
                          style={{ color: C.muted }}
                          aria-label="Mark read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                  );
                  return n.link ? (
                    <Link
                      key={n.id}
                      to={n.link}
                      onClick={() => {
                        markRead(n.id);
                        setOpen(false);
                      }}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div key={n.id}>{inner}</div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
