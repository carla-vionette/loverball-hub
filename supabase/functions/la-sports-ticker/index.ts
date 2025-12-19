import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// LA Teams Configuration (duplicated here for edge function context)
const LA_D1_COLLEGES = [
  "UCLA Bruins", "USC Trojans", "Pepperdine Waves", "LMU Lions",
  "Cal State Fullerton Titans", "CSUN Matadors", "Long Beach State Beach", "UC Irvine Anteaters"
];

const LA_PRO_TEAMS = [
  "Los Angeles Lakers", "Los Angeles Clippers", "Los Angeles Sparks",
  "Los Angeles Rams", "Los Angeles Chargers",
  "Los Angeles Dodgers", "Los Angeles Angels",
  "Los Angeles Kings", "Anaheim Ducks",
  "LA Galaxy", "LAFC", "Angel City FC", "San Diego Wave FC"
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category = 'both', gender = 'both' } = await req.json().catch(() => ({}));
    
    console.log(`Fetching LA sports ticker - category: ${category}, gender: ${gender}`);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build team list based on filters
    let teamsToInclude: string[] = [];
    
    if (category === 'college' || category === 'both') {
      teamsToInclude = [...teamsToInclude, ...LA_D1_COLLEGES];
    }
    
    if (category === 'pro' || category === 'both') {
      if (gender === 'men') {
        teamsToInclude = [...teamsToInclude, 
          "Los Angeles Lakers", "Los Angeles Clippers",
          "Los Angeles Rams", "Los Angeles Chargers",
          "Los Angeles Dodgers", "Los Angeles Angels",
          "Los Angeles Kings", "Anaheim Ducks",
          "LA Galaxy", "LAFC"
        ];
      } else if (gender === 'women') {
        teamsToInclude = [...teamsToInclude, 
          "Los Angeles Sparks", "Angel City FC", "San Diego Wave FC"
        ];
      } else {
        teamsToInclude = [...teamsToInclude, ...LA_PRO_TEAMS];
      }
    }

    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'America/Los_Angeles'
    });

    const systemPrompt = `You are a sports data service providing ONLY real-time information for Greater Los Angeles area teams. 
Today's date is ${currentDate} (Pacific Time).

ONLY include these teams: ${teamsToInclude.join(', ')}.

Provide current sports information in this exact format for EACH item:
- Live games: "TEAM1 vs TEAM2 | Score: XX-XX | Q3 5:42" or "TEAM1 @ TEAM2 | Score: XX-XX | 2nd Half"
- Final scores (today only): "TEAM1 72-68 TEAM2 | FINAL"
- Upcoming (next 7 days): "TEAM1 vs TEAM2 | Sat Dec 21 7:30 PM PT"
- Headlines: "HEADLINE: Brief news about LA team (max 10 words)"

Rules:
1. ONLY include teams from the list above
2. For college sports, include both men's and women's teams (label: MBB, WBB, FB, etc.)
3. Use PT (Pacific Time) for all game times
4. Current live games first, then today's finals, then upcoming games, then headlines
5. Maximum 15 items total
6. Be realistic about current sports seasons and schedules`;

    const userPrompt = `Generate the current LA sports ticker data. Include live games, today's results, upcoming games (next 7 days), and any major headlines for the specified LA teams. Format each as a single line.`;

    console.log('Calling AI API for LA sports data...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API returned ${response.status}`);
    }

    const aiData = await response.json();
    console.log('AI response received');

    const content = aiData.choices?.[0]?.message?.content || '';
    
    // Parse the response into individual ticker items
    const lines = content
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => {
        // Filter out empty lines, markdown, and lines that don't look like ticker items
        if (!line) return false;
        if (line.startsWith('```')) return false;
        if (line.startsWith('#')) return false;
        if (line.startsWith('[') && line.endsWith(']')) return false;
        if (line.startsWith('-') || line.startsWith('*')) {
          return line.length > 2; // Keep bullet points that have content
        }
        return true;
      })
      .map((line: string) => {
        // Clean up bullet points
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return line.substring(2);
        }
        return line;
      })
      .slice(0, 15); // Max 15 items

    console.log(`Processed ${lines.length} ticker items`);

    return new Response(
      JSON.stringify({ 
        items: lines,
        updatedAt: new Date().toISOString(),
        filters: { category, gender }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in la-sports-ticker:', errorMessage);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        items: ['No live games right now. Check back soon for LA sports updates.'],
        updatedAt: new Date().toISOString()
      }),
      { 
        status: 200, // Return 200 with fallback message
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
