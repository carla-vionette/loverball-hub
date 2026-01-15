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
      return new Response(JSON.stringify({ error: 'Event not found' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
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

    // Get image URL (use event image or fallback to OG image)
    const imageUrl = event.image_url || 'https://loverball-hub.lovable.app/og-image.png';

    // Return OG meta data as JSON for the frontend to use
    const ogData = {
      title: `${event.title} | Loverball`,
      description,
      image: imageUrl,
      url: `https://loverball-hub.lovable.app/event/${event.id}`,
      date: formattedDate,
      time: timeStr,
      location: locationStr,
    };

    return new Response(JSON.stringify(ogData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in event-og-meta:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
