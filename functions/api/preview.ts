// Cloudflare Pages Function to fetch Open Graph metadata and preview images for any food link
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

    // Direct Image URL
    if (/\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i.test(targetUrl)) {
      return new Response(
        JSON.stringify({
          success: true,
          image: targetUrl,
          title: '',
          description: '',
        }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // YouTube Thumbnail
    const ytMatch = targetUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch && ytMatch[1]) {
      return new Response(
        JSON.stringify({
          success: true,
          image: `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`,
          title: '',
          description: '',
        }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Fetch the target page HTML with User-Agent (mimicking Linklook / browser preview bot)
    const response = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php) Mozilla/5.0 (compatible; LinklookPreview/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
      },
    });

    const finalUrl = response.url || targetUrl;
    const html = await response.text();

    // Extract Open Graph & Meta tags
    let ogImage = '';
    let ogTitle = '';
    let ogDescription = '';

    // 1. og:image or twitter:image
    const imgMatch =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i) ||
      html.match(/<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+name=["']thumbnail["'][^>]+content=["']([^"']+)["']/i);

    if (imgMatch && imgMatch[1]) {
      ogImage = imgMatch[1].trim();
      // Handle relative URL
      if (ogImage.startsWith('/') && !ogImage.startsWith('//')) {
        const parsedBase = new URL(finalUrl);
        ogImage = `${parsedBase.origin}${ogImage}`;
      } else if (ogImage.startsWith('//')) {
        ogImage = `https:${ogImage}`;
      }
    }

    // 2. Title
    const titleMatch =
      html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<title[^>]*>([^<]+)<\/title>/i);

    if (titleMatch && titleMatch[1]) {
      ogTitle = titleMatch[1].trim();
    }

    // 3. Description
    const descMatch =
      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);

    if (descMatch && descMatch[1]) {
      ogDescription = descMatch[1].trim();
    }

    return new Response(
      JSON.stringify({
        success: true,
        image: ogImage,
        title: ogTitle,
        description: ogDescription,
        finalUrl,
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
