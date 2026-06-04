import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Escape HTML entities for safe insertion into HTML
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const eventId = url.searchParams.get('id');

    if (!eventId) {
      return new Response('Missing event ID', { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    console.log(`Fetching event: ${eventId}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch event data
    const { data: event, error } = await supabase
      .from('events')
      .select('id, title, description, event_date, event_time, venue_name, city, image_url, banner_image, event_type')
      .eq('id', eventId)
      .single();

    if (error || !event) {
      console.error('Event not found:', error);
      return new Response('Event not found', { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    console.log(`Event found: ${event.title}`);

    // Format date nicely
    const eventDate = new Date(event.event_date + 'T00:00:00');
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    // Format time if available
    let timeStr = '';
    if (event.event_time) {
      const [hours, minutes] = event.event_time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }

    // Build OG title with event name, date, and time
    let ogTitle = event.title;
    if (formattedDate) {
      ogTitle += ` | ${formattedDate}`;
    }
    if (timeStr) {
      ogTitle += ` @ ${timeStr}`;
    }
    ogTitle += ' – Loverball';
    
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
      ogDescription = `Join us for an epic ${eventTypeStr}!`;
    }
    
    // Add location if available
    if (locationStr) {
      ogDescription += ` 📍 ${locationStr}`;
    }
    
    // Add a call to action
    ogDescription += ' RSVP to hang with women who love sports.';

    // Get OG image URL - use event image or fallback to branded image
    // IMPORTANT: Must be absolute https URLs for iMessage/WhatsApp crawlers
    const baseUrl = 'https://www.loverball.com';
    const fallbackImage = `${baseUrl}/og-image.png`;

    // Convert relative image URLs to absolute https
    // Prefer the event's own cover photo (image_url), then banner_image, then branded fallback.
    const rawCover = (event.image_url && event.image_url.trim())
      || (event.banner_image && event.banner_image.trim())
      || '';
    let ogImage = fallbackImage;
    if (rawCover) {
      if (rawCover.startsWith('https://')) {
        ogImage = rawCover;
      } else if (rawCover.startsWith('http://')) {
        ogImage = 'https://' + rawCover.slice(7);
      } else {
        ogImage = `${baseUrl}${rawCover.startsWith('/') ? '' : '/'}${rawCover}`;
      }
    }

    // Infer image MIME type for Apple/WhatsApp (helps avoid "file attachment" rendering)
    const lowerImg = ogImage.toLowerCase().split('?')[0];
    let ogImageType = 'image/png';
    if (lowerImg.endsWith('.jpg') || lowerImg.endsWith('.jpeg')) ogImageType = 'image/jpeg';
    else if (lowerImg.endsWith('.webp')) ogImageType = 'image/webp';
    else if (lowerImg.endsWith('.gif')) ogImageType = 'image/gif';

    const eventUrl = `${baseUrl}/e/${event.id}`;
    const imageAlt = `${event.title} – Loverball event`;

    console.log(`OG Title: ${ogTitle}`);
    console.log(`OG Description: ${ogDescription}`);
    console.log(`OG Image: ${ogImage} (${ogImageType})`);

    // Minimal HTML doc — crawlers (Applebot, WhatsApp, facebookexternalhit, Twitterbot, Slackbot)
    // parse the <head>; real browsers follow the meta refresh / inline script to /e/{id}.
    const html = `<!DOCTYPE html>
<html lang="en" prefix="og: https://ogp.me/ns#">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(ogTitle)}</title>
<link rel="canonical" href="${escapeHtml(eventUrl)}">
<meta name="description" content="${escapeHtml(ogDescription)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Loverball">
<meta property="og:url" content="${escapeHtml(eventUrl)}">
<meta property="og:title" content="${escapeHtml(ogTitle)}">
<meta property="og:description" content="${escapeHtml(ogDescription)}">
<meta property="og:image" content="${escapeHtml(ogImage)}">
<meta property="og:image:secure_url" content="${escapeHtml(ogImage)}">
<meta property="og:image:type" content="${ogImageType}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escapeHtml(imageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@loverball">
<meta name="twitter:url" content="${escapeHtml(eventUrl)}">
<meta name="twitter:title" content="${escapeHtml(ogTitle)}">
<meta name="twitter:description" content="${escapeHtml(ogDescription)}">
<meta name="twitter:image" content="${escapeHtml(ogImage)}">
<meta name="twitter:image:alt" content="${escapeHtml(imageAlt)}">
<link rel="image_src" href="${escapeHtml(ogImage)}">
<meta name="apple-mobile-web-app-title" content="Loverball">
<meta http-equiv="refresh" content="0;url=${escapeHtml(eventUrl)}">
</head>
<body>
<p>Redirecting to <a href="${escapeHtml(eventUrl)}">${escapeHtml(event.title)}</a>…</p>
<script>window.location.replace(${JSON.stringify(eventUrl)});</script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: new Headers({
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': String(new TextEncoder().encode(html).length),
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'X-Content-Type-Options': 'nosniff',
        'X-Robots-Tag': 'noindex',
        'Vary': 'User-Agent',
      }),
    });

  } catch (error: unknown) {
    console.error('Error in event-og-meta function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Server error: ${errorMessage}`, { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  }
});
