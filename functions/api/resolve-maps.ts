// Cloudflare Pages Function to expand Google Maps links of any format and extract exact pin coordinates & address
export const onRequestGet: PagesFunction = async (context) => {
  try {
    const { request } = context;
    const url = new URL(request.url);
    const rawTargetUrl = url.searchParams.get('url');

    if (!rawTargetUrl) {
      return new Response(JSON.stringify({ error: 'url parameter required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Clean target URL if pasted with surrounding text or raw coords
    const urlMatch = rawTargetUrl.match(/https?:\/\/[^\s"'<>]+/i);
    const targetUrl = urlMatch ? urlMatch[0] : rawTargetUrl.trim();

    // Check if input is directly coordinate numbers: "lat, lng" or "lat,lng"
    const directCoordsMatch = targetUrl.match(/^(-?\d{1,2}\.\d+)\s*,\s*(-?\d{2,3}\.\d+)$/);
    if (directCoordsMatch) {
      return new Response(
        JSON.stringify({
          success: true,
          finalUrl: targetUrl,
          latitude: parseFloat(directCoordsMatch[1]),
          longitude: parseFloat(directCoordsMatch[2]),
          source: 'direct_coordinates',
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Helper to search patterns in string
    const searchPatterns = (content: string) => {
      // 1. !3d<lat>!4d<lng> or %213d<lat>%214d<lng>
      const dMatch = content.match(/(?:%21|!)3d(-?\d+\.\d+)(?:%21|!)4d(-?\d+\.\d+)/i);
      if (dMatch) return { lat: parseFloat(dMatch[1]), lng: parseFloat(dMatch[2]), source: 'pin_3d4d' };

      // 2. !2d<lng>!3d<lat> or %212d<lng>%213d<lat>
      const pbMatch = content.match(/(?:%21|!)2d(-?\d+\.\d+)(?:%21|!)3d(-?\d+\.\d+)/i);
      if (pbMatch) return { lat: parseFloat(pbMatch[2]), lng: parseFloat(pbMatch[1]), source: 'pin_2d3d' };

      // 3. Query params: ?q=lat,lng / &ll=lat,lng / &destination=lat,lng / &loc:lat,lng / &daddr=lat,lng
      const queryMatch = content.match(/[?&](?:q|ll|destination|loc:|daddr)=(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/i);
      if (queryMatch) return { lat: parseFloat(queryMatch[1]), lng: parseFloat(queryMatch[2]), source: 'query_param' };

      // 4. Staticmap / Preview center: center=lat,lng or center=lat%2Clng
      const centerMatch = content.match(/center=(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/i);
      if (centerMatch) return { lat: parseFloat(centerMatch[1]), lng: parseFloat(centerMatch[2]), source: 'staticmap_center' };

      // 5. Direct path search: /search/lat,lng
      const searchMatch = content.match(/\/search\/(-?\d{1,2}\.\d+)(?:%2C|,)(-?\d{2,3}\.\d+)/i);
      if (searchMatch) return { lat: parseFloat(searchMatch[1]), lng: parseFloat(searchMatch[2]), source: 'search_path' };

      return null;
    };

    // First search in raw target URL
    const rawCoords = searchPatterns(targetUrl);
    if (rawCoords) {
      return new Response(
        JSON.stringify({
          success: true,
          finalUrl: targetUrl,
          latitude: rawCoords.lat,
          longitude: rawCoords.lng,
          source: rawCoords.source,
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Safely encode URI for Cloudflare Workers fetch
    const encodedTargetUrl = encodeURI(decodeURI(targetUrl));

    // Follow redirects to get final expanded Google Maps URL
    const response = await fetch(encodedTargetUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    const finalUrl = response.url || targetUrl;
    const text = await response.text();

    let lat: number | null = null;
    let lng: number | null = null;
    let address: string | null = null;
    let matchSource = 'unknown';

    // Search in final redirected URL
    const urlCoords = searchPatterns(finalUrl);
    if (urlCoords) {
      lat = urlCoords.lat;
      lng = urlCoords.lng;
      matchSource = urlCoords.source;
    }

    // If not found in URL, search Google Maps preview/place endpoint in HTML
    if (!lat || !lng) {
      const previewMatch = text.match(/\/maps\/preview\/place\?([^"'>\s]+)/i) || text.match(/pb=([^"'>\s]+)/i);
      if (previewMatch) {
        let rawQuery = previewMatch[0].replace(/&amp;/g, '&');
        let pUrl = '';
        if (rawQuery.startsWith('/maps/preview/place')) {
          pUrl = 'https://www.google.com' + rawQuery;
        } else if (rawQuery.startsWith('http')) {
          pUrl = rawQuery;
        } else {
          pUrl = 'https://www.google.com/maps/preview/place?authuser=0&hl=zh-TW&gl=tw&' + rawQuery.replace(/^\?/, '');
        }

        try {
          const pRes = await fetch(encodeURI(decodeURI(pUrl)), {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept-Language': 'zh-TW,zh;q=0.9',
            },
          });
          if (pRes.ok) {
            const pText = await pRes.text();

            // Extract address if available (e.g. ["112臺北市北投區尊賢里尊賢街218巷23弄12號"])
            const addrMatch = pText.match(/\["(\d{3,5}[\u4e00-\u9fa50-9號巷弄路街段里村鄰市縣區鄉鎮\- ]+?)"\]/) ||
                              pText.match(/\["([\u4e00-\u9fa5]{2,3}[市縣][\u4e00-\u9fa5]{2,4}[區鄉鎮市][\u4e00-\u9fa50-9號巷弄路街段里村鄰\- ]+?)"\]/);
            if (addrMatch) {
              address = addrMatch[1];
            }

            const twPair = pText.match(/(2[1-6]\.\d{4,10})[,\s]+(1[1-2][9012]\.\d{4,10})/);
            if (twPair) {
              lat = parseFloat(twPair[1]);
              lng = parseFloat(twPair[2]);
              matchSource = 'preview_place_api';
            } else {
              const pCoordMatch = pText.match(/\[null,null,(-?\d{1,2}\.\d{4,10}),(-?\d{2,3}\.\d{4,10})\]/) ||
                                  pText.match(/\[\d+(?:\.\d+)?,(-?\d{2,3}\.\d{4,10}),(-?\d{1,2}\.\d{4,10})\]/);
              if (pCoordMatch) {
                let pLat = parseFloat(pCoordMatch[1]);
                let pLng = parseFloat(pCoordMatch[2]);
                if (pLat > 100 && pLng < 50) {
                  const temp = pLat;
                  pLat = pLng;
                  pLng = temp;
                }
                lat = pLat;
                lng = pLng;
                matchSource = 'preview_place_api';
              }
            }
          }
        } catch {
          // ignore preview fetch errors
        }
      }
    }

    // Search HTML response body for [null,null,lat,lng]
    if (!lat || !lng) {
      const htmlCoordMatch = text.match(/\[null,null,(-?\d{1,2}\.\d{4,8}),(-?\d{2,3}\.\d{4,8})\]/);
      if (htmlCoordMatch) {
        lat = parseFloat(htmlCoordMatch[1]);
        lng = parseFloat(htmlCoordMatch[2]);
        matchSource = 'html_coord_array';
      }
    }

    // Search staticmap center or patterns inside HTML
    if (!lat || !lng) {
      const htmlCoords = searchPatterns(text);
      if (htmlCoords) {
        lat = htmlCoords.lat;
        lng = htmlCoords.lng;
        matchSource = htmlCoords.source;
      }
    }

    // Fallback to camera viewport @lat,lng in final URL or target URL
    if (!lat || !lng) {
      const finalAtMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/i);
      if (finalAtMatch) {
        lat = parseFloat(finalAtMatch[1]);
        lng = parseFloat(finalAtMatch[2]);
        matchSource = 'camera_viewport';
      } else {
        const directAtMatch = targetUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/i);
        if (directAtMatch) {
          lat = parseFloat(directAtMatch[1]);
          lng = parseFloat(directAtMatch[2]);
          matchSource = 'camera_viewport';
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        finalUrl,
        latitude: lat,
        longitude: lng,
        address,
        source: matchSource,
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
