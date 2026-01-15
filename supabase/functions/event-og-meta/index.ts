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
      .select('id, title, description, image_url, event_date, event_time, venue_name, city')
      .eq('id', eventId)
      .single();

    if (error || !event) {
      console.error('Event not found:', error);
      // Redirect to events page if event not found
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
      year: 'numeric'
    });

    // Format time
    let timeStr = '';
    if (event.event_time) {
      const [hours, minutes] = event.event_time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }

    // Build description
    const locationStr = [event.venue_name, event.city].filter(Boolean).join(', ');
    const description = event.description 
      ? event.description.substring(0, 150) + (event.description.length > 150 ? '...' : '')
      : `Join us on ${formattedDate}${timeStr ? ` at ${timeStr}` : ''}${locationStr ? ` • ${locationStr}` : ''}`;

    // Get image URL - use event image or fallback
    const imageUrl = event.image_url || 'https://loverball-hub.lovable.app/og-image.png';
    
    const title = `${event.title} | Loverball`;
    const eventUrl = `https://loverball-hub.lovable.app/event/${event.id}`;

    // Return HTML with OG meta tags for social media crawlers
    // Real users will be redirected via JavaScript
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${escapeHtml(eventUrl)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Loverball">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${escapeHtml(eventUrl)}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">
  
  <!-- Standard meta -->
  <meta name="description" content="${escapeHtml(description)}">
  
  <!-- Redirect real users to the actual event page -->
  <script>
    window.location.replace("${eventUrl}");
  </script>
  <noscript>
    <meta http-equiv="refresh" content="0;url=${escapeHtml(eventUrl)}">
  </noscript>
</head>
<body>
  <p>Redirecting to <a href="${escapeHtml(eventUrl)}">${escapeHtml(event.title)}</a>...</p>
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
