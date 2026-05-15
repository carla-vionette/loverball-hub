import type { LBUser } from '@/lib/lb';

function initials(name: string | null) {
  if (!name) return '·';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function AttendeePreview({ users, total }: { users: LBUser[]; total: number }) {
  const visible = users.slice(0, 6);
  const extra = Math.max(0, total - visible.length);
  if (total === 0) {
    return <p className="text-sm text-muted-foreground">Be the first to RSVP.</p>;
  }
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        {visible.map(u => (
          <div
            key={u.id}
            className="w-9 h-9 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground overflow-hidden"
            title={u.display_name || ''}
          >
            {u.photo_url
              ? <img src={u.photo_url} alt="" className="w-full h-full object-cover" />
              : <span>{initials(u.display_name)}</span>}
          </div>
        ))}
      </div>
      {extra > 0 && (
        <span className="text-sm text-muted-foreground">+ {extra} other{extra === 1 ? '' : 's'} going</span>
      )}
      {extra === 0 && total > 0 && (
        <span className="text-sm text-muted-foreground">{total} going</span>
      )}
    </div>
  );
}
