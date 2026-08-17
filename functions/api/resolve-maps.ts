// Cloudflare Pages Function to expand Google Maps shortlinks and extract exact coordinates
export const onRequestGet: PagesFunction = async (context) => {
  try {
    const { request } = context;
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: 'url parameter required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
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

    let lat: number | null = null;
    let lng: number | null = null;

    // 1. Highest Priority: Google Place Pin Exact Coordinates (!3d<lat>!4d<lng>)
    const dMatch = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (dMatch && dMatch[1] && dMatch[2]) {
      lat = parseFloat(dMatch[1]);
      lng = parseFloat(dMatch[2]);
    }

    // 2. Query parameters
    if (!lat || !lng) {
      const queryMatch = finalUrl.match(/[?&](?:q|ll|destination)=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (queryMatch && queryMatch[1] && queryMatch[2]) {
        lat = parseFloat(queryMatch[1]);
        lng = parseFloat(queryMatch[2]);
      }
    }

    // 3. Search path
    if (!lat || !lng) {
      const pathMatch = finalUrl.match(/\/search\/(-?\d{1,2}\.\d+),(-?\d{2,3}\.\d+)/);
      if (pathMatch && pathMatch[1] && pathMatch[2]) {
        lat = parseFloat(pathMatch[1]);
        lng = parseFloat(pathMatch[2]);
      }
    }

    // 4. Viewport @lat,lng
    if (!lat || !lng) {
      const atMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (atMatch && atMatch[1] && atMatch[2]) {
        lat = parseFloat(atMatch[1]);
        lng = parseFloat(atMatch[2]);
      }
    }

    // 5. If still not found, parse HTML initialization state
    if (!lat || !lng) {
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
