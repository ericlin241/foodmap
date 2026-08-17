// Cloudflare Pages Function to expand Google Maps links of any format and extract exact pin coordinates
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
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    const finalUrl = response.url || targetUrl;
    const text = await response.text();

    let lat: number | null = null;
    let lng: number | null = null;

    // Helper to search patterns in string
    const searchPatterns = (content: string) => {
      // 1. !3d<lat>!4d<lng> or %213d<lat>%214d<lng>
      const dMatch = content.match(/(?:%21|!)3d(-?\d+\.\d+)(?:%21|!)4d(-?\d+\.\d+)/i);
      if (dMatch) return { lat: parseFloat(dMatch[1]), lng: parseFloat(dMatch[2]) };

      // 2. !2d<lng>!3d<lat> or %212d<lng>%213d<lat> (e.g. preview place pb string)
      const pbMatch = content.match(/(?:%21|!)2d(-?\d+\.\d+)(?:%21|!)3d(-?\d+\.\d+)/i);
      if (pbMatch) return { lat: parseFloat(pbMatch[2]), lng: parseFloat(pbMatch[1]) };

      // 3. Query params: ?q=lat,lng / &ll=lat,lng / &destination=lat,lng / &loc:lat,lng
      const queryMatch = content.match(/[?&](?:q|ll|destination|loc:)=(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/i);
      if (queryMatch) return { lat: parseFloat(queryMatch[1]), lng: parseFloat(queryMatch[2]) };

      // 4. Staticmap / Preview center: center=lat,lng or center=lat%2Clng
      const centerMatch = content.match(/center=(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/i);
      if (centerMatch) return { lat: parseFloat(centerMatch[1]), lng: parseFloat(centerMatch[2]) };

      // 5. Direct path search
      const searchMatch = content.match(/\/search\/(-?\d{1,2}\.\d+)(?:%2C|,)(-?\d{2,3}\.\d+)/i);
      if (searchMatch) return { lat: parseFloat(searchMatch[1]), lng: parseFloat(searchMatch[2]) };

      // 6. Camera Viewport @lat,lng
      const atMatch = content.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/i);
      if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };

      return null;
    };

    // First search in final redirected URL
    const urlCoords = searchPatterns(finalUrl);
    if (urlCoords) {
      lat = urlCoords.lat;
      lng = urlCoords.lng;
    }

    // If not found in URL, search inside HTML response body
    if (!lat || !lng) {
      const htmlCoords = searchPatterns(text);
      if (htmlCoords) {
        lat = htmlCoords.lat;
        lng = htmlCoords.lng;
      }
    }

    // Secondary HTML search: [null,null,lat,lng] or meta image
    if (!lat || !lng) {
      const htmlCoordMatch = text.match(/\[null,null,(-?\d{1,2}\.\d{4,8}),(-?\d{2,3}\.\d{4,8})\]/);
      if (htmlCoordMatch) {
        lat = parseFloat(htmlCoordMatch[1]);
        lng = parseFloat(htmlCoordMatch[2]);
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
