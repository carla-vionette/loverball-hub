import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EventCardRequest {
  title: string;
  date: string;
  time?: string;
  venue?: string;
  city?: string;
  eventType?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, date, time, venue, city, eventType } = await req.json() as EventCardRequest;

    console.log('Generating event card for:', { title, date, time, venue, city, eventType });

    if (!title || !date) {
      return new Response(
        JSON.stringify({ error: 'Title and date are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format the details for the prompt
    const locationText = venue && city ? `${venue}, ${city}` : venue || city || '';
    const typeText = eventType ? eventType.replace('_', ' ').toUpperCase() : 'EVENT';
    
    // Create a prompt for generating an elegant event card
    const prompt = `Create a beautiful, modern social media event card image (1200x630 pixels, 16:9 aspect ratio) with the following design:

DESIGN STYLE:
- Elegant gradient background transitioning from deep coral/salmon pink (#E85D75) to warm peach
- Modern, clean typography
- Subtle geometric patterns or abstract shapes in the background
- Professional event invitation aesthetic
- The Loverball branding feel - feminine, sporty, sophisticated

TEXT TO INCLUDE (centered, well-spaced):
- Small tag at top: "${typeText}"
- Main title (large, bold): "${title}"
- Date line: "${date}"${time ? `\n- Time: "${time}"` : ''}${locationText ? `\n- Location: "${locationText}"` : ''}
- Small footer text: "loverball.com"

TYPOGRAPHY:
- Use elegant sans-serif fonts
- Title should be prominent and eye-catching
- All text should be white or very light colored for contrast
- Good visual hierarchy

Make it look like a premium event invitation that someone would want to share on Instagram or LinkedIn.`;

    console.log('Sending prompt to AI:', prompt);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        modalities: ['image', 'text']
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error('No image in response:', JSON.stringify(data));
      throw new Error('No image generated');
    }

    console.log('Event card generated successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        imageUrl,
        message: 'Event card generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate event card';
    console.error('Error generating event card:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
