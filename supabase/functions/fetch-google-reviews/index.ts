import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('VITE_GOOGLE_MAPS_API_KEY');
    const placeId = "ChIJXU9TXkDUl0cRbn_fVfXQyYo"; // ZEBIB - Hanau Place ID

    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    console.log('Fetching Google reviews for place:', placeId);

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error_message) {
      throw new Error(`Google API: ${data.error_message}`);
    }

    if (!data.result?.reviews) {
      return new Response(
        JSON.stringify({ reviews: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const allReviews = data.result.reviews;
    
    // Get top-rated (5 stars)
    const topRated = allReviews.filter((r: any) => r.rating === 5).slice(0, 2);
    
    // Get recent reviews (sorted by time)
    const recent = [...allReviews].sort((a: any, b: any) => b.time - a.time).slice(0, 2);
    
    // Get random reviews
    const random = allReviews.sort(() => Math.random() - 0.5).slice(0, 2);
    
    // Combine and remove duplicates based on time
    const combined = [...topRated, ...recent, ...random];
    const uniqueReviews = Array.from(
      new Map(combined.map((r: any) => [r.time, r])).values()
    ).slice(0, 6);

    console.log(`Successfully fetched ${uniqueReviews.length} reviews`);

    return new Response(
      JSON.stringify({ reviews: uniqueReviews }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching Google reviews:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        reviews: [] 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
