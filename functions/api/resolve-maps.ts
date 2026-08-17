// Cloudflare Pages Function to expand Google Maps shortlinks and extract exact coordinates
export const onRequestGet: PagesFunction = async (context) => {
  try {
    const { request } = context;
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: 'url parameter required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Follow redirects to get final expanded Google Maps URL
    const response = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const finalUrl = response.url || targetUrl;
    const text = await response.text();

    // 1. Try extracting @lat,lng from final redirected URL
    let lat: number | null = null;
    let lng: number | null = null;

    const atMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      lat = parseFloat(atMatch[1]);
      lng = parseFloat(atMatch[2]);
    } else {
      const dMatch = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
      if (dMatch) {
        lat = parseFloat(dMatch[1]);
        lng = parseFloat(dMatch[2]);
      } else {
        const queryMatch = finalUrl.match(/[?&](?:q|ll|destination)=(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (queryMatch) {
          lat = parseFloat(queryMatch[1]);
          lng = parseFloat(queryMatch[2]);
        }
      }
    }

    // 2. If not in URL, search inside HTML response (window.APP_INITIALIZATION_STATE or meta tags)
    if (!lat || !lng) {
      // Look for [null,null,lat,lng] or [lat,lng] in HTML
      const htmlCoordMatch = text.match(/\[null,null,(-?\d{1,2}\.\d{4,8}),(-?\d{2,3}\.\d{4,8})\]/);
      if (htmlCoordMatch) {
        lat = parseFloat(htmlCoordMatch[1]);
        lng = parseFloat(htmlCoordMatch[2]);
      } else {
        const metaMatch = text.match(/meta itemprop="image" content="[^"]*?center=(-?\d+\.\d+)%2C(-?\d+\.\d+)/);
        if (metaMatch) {
          lat = parseFloat(metaMatch[1]);
          lng = parseFloat(metaMatch[2]);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        finalUrl,
        latitude: lat,
        longitude: lng,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
};
