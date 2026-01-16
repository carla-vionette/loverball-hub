import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const eventId = url.searchParams.get('id');

    if (!eventId) {
      return new Response('Event ID required', { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: event, error } = await supabase
      .from('events')
      .select('id, title, description, image_url, event_date, event_time, venue_name, city, event_type')
      .eq('id', eventId)
      .single();

    if (error || !event) {
      console.error('Event not found:', error);
      return new Response(null, {
        status: 302,
        headers: { 'Location': 'https://loverball-hub.lovable.app/events' },
      });
    }

    // Format date
    const eventDate = new Date(event.event_date);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    const shortDate = eventDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    // Format time
    let timeStr = '';
    if (event.event_time) {
      const [hours, minutes] = event.event_time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }

    // Build OG title - clear format like requested
    const ogTitle = `${event.title} – Loverball Women's Sports Night`;
    
    // Build short, punchy description (1-2 sentences)
    const locationStr = [event.venue_name, event.city].filter(Boolean).join(', ');
    let ogDescription = '';
    
    if (event.description && event.description.length > 20) {
      // Use first sentence of description, max 140 chars
      const firstSentence = event.description.split(/[.!?]/)[0];
      ogDescription = firstSentence.substring(0, 140) + (firstSentence.length > 140 ? '...' : '.');
    } else {
      // Generate a punchy description
      const eventTypeLabels: Record<string, string> = {
        'watch-party': 'watch party',
        'pickup-game': 'pickup game',
        'networking': 'networking mixer',
        'panel': 'panel discussion',
        'social': 'social event',
        'fitness': 'fitness session',
      };
      const eventTypeStr = event.event_type ? eventTypeLabels[event.event_type] || 'event' : 'event';
      ogDescription = `Join us for an epic ${eventTypeStr}! ${formattedDate}${timeStr ? ` at ${timeStr}` : ''}${locationStr ? ` @ ${locationStr}` : ''}.`;
    }
    
    // Add a call to action
    ogDescription += ' RSVP to hang with women who love sports.';

    // Get OG image URL - use event image or fallback to branded image
    const fallbackImage = 'https://loverball-hub.lovable.app/og-image.png';
    const ogImage = event.image_url || fallbackImage;
    
    const eventUrl = `https://loverball-hub.lovable.app/event/${event.id}`;

    console.log('Serving OG meta for event:', event.title);
    console.log('OG Title:', ogTitle);
    console.log('OG Description:', ogDescription);
    console.log('OG Image:', ogImage);

    // Return HTML with OG meta tags for social media crawlers
    // Real users will be redirected via JavaScript
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(ogTitle)}</title>
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="event">
  <meta property="og:url" content="${escapeHtml(eventUrl)}">
  <meta property="og:title" content="${escapeHtml(ogTitle)}">
  <meta property="og:description" content="${escapeHtml(ogDescription)}">
  <meta property="og:image" content="${escapeHtml(ogImage)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(event.title)} - Loverball Event">
  <meta property="og:site_name" content="Loverball">
  <meta property="og:locale" content="en_US">
  
  <!-- Event-specific OG tags -->
  <meta property="event:start_time" content="${event.event_date}${event.event_time ? 'T' + event.event_time : ''}">
  ${event.venue_name ? `<meta property="event:location" content="${escapeHtml(event.venue_name)}">` : ''}
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${escapeHtml(eventUrl)}">
  <meta name="twitter:title" content="${escapeHtml(ogTitle)}">
  <meta name="twitter:description" content="${escapeHtml(ogDescription)}">
  <meta name="twitter:image" content="${escapeHtml(ogImage)}">
  <meta name="twitter:image:alt" content="${escapeHtml(event.title)} - Loverball Event">
  
  <!-- Standard meta -->
  <meta name="description" content="${escapeHtml(ogDescription)}">
  
  <!-- iMessage/WhatsApp rich preview optimization -->
  <link rel="image_src" href="${escapeHtml(ogImage)}">
  
  <!-- Redirect real users to the actual event page -->
  <script>
    window.location.replace("${eventUrl}");
  </script>
  <noscript>
    <meta http-equiv="refresh" content="0;url=${escapeHtml(eventUrl)}">
  </noscript>
</head>
<body style="font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%);">
  <div style="text-align: center; padding: 2rem; background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); max-width: 400px;">
    <h1 style="margin: 0 0 1rem; color: #c44569;">${escapeHtml(event.title)}</h1>
    <p style="color: #666; margin: 0 0 1rem;">${escapeHtml(formattedDate)}${timeStr ? ` • ${timeStr}` : ''}</p>
    ${locationStr ? `<p style="color: #888; margin: 0 0 1.5rem;">📍 ${escapeHtml(locationStr)}</p>` : ''}
    <p style="color: #333;">Redirecting to <a href="${escapeHtml(eventUrl)}" style="color: #c44569; font-weight: 600;">event page</a>...</p>
  </div>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { 
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('Error in event-og-meta:', error);
    return new Response(null, {
      status: 302,
      headers: { 'Location': 'https://loverball-hub.lovable.app/events' },
    });
  }
});

// Helper to escape HTML entities
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
