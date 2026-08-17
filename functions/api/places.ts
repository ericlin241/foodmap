interface Env {
  DB: D1Database;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

// OPTIONS: Handle CORS Preflight for cross-domain requests (GitHub Pages -> Cloudflare)
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
};

// GET: 查詢所有美食地點
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { env } = context;
    if (!env.DB) {
      return new Response(JSON.stringify({ error: 'D1 Database not bound' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const { results } = await env.DB.prepare(
      'SELECT * FROM places ORDER BY created_at DESC'
    ).all();

    const places = (results || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      food_url: row.food_url || row.url || '',
      map_url: row.map_url || (row.latitude ? row.url : '') || '',
      image_url: row.image_url || '',
      city: row.city,
      district: row.district,
      category: row.category || '經典小吃',
      note: row.note || '',
      latitude: row.latitude !== null && !isNaN(row.latitude) ? Number(row.latitude) : null,
      longitude: row.longitude !== null && !isNaN(row.longitude) ? Number(row.longitude) : null,
      created_at: row.created_at,
    }));

    return new Response(JSON.stringify(places), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        ...CORS_HEADERS,
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
};

// POST: 新增美食地點
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    if (!env.DB) {
      return new Response(JSON.stringify({ error: 'D1 Database not bound' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const data: any = await request.json();

    const id = data.id || 'place-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    const name = data.name;
    const food_url = data.food_url || '';
    const map_url = data.map_url || '';
    const image_url = data.image_url || '';
    const city = data.city || '';
    const district = data.district || '';
    const category = data.category || '經典小吃';
    const note = data.note || '';
    const latitude = data.latitude !== null && data.latitude !== undefined && !isNaN(data.latitude) ? Number(data.latitude) : null;
    const longitude = data.longitude !== null && data.longitude !== undefined && !isNaN(data.longitude) ? Number(data.longitude) : null;
    const created_at = data.created_at || new Date().toISOString();

    if (!name || !food_url || !city) {
      return new Response(JSON.stringify({ error: 'Missing required fields (name, food_url, city)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    await env.DB.prepare(
      `INSERT INTO places (id, name, url, food_url, map_url, image_url, city, district, category, note, latitude, longitude, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(id, name, food_url, food_url, map_url, image_url, city, district, category, note, latitude, longitude, created_at)
      .run();

    return new Response(
      JSON.stringify({ success: true, id, message: 'Place added successfully' }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          ...CORS_HEADERS,
        },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
};

// PUT: 編輯更新美食地點
export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    if (!env.DB) {
      return new Response(JSON.stringify({ error: 'D1 Database not bound' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const data: any = await request.json();
    const id = data.id;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Place ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const name = data.name;
    const food_url = data.food_url || '';
    const map_url = data.map_url || '';
    const image_url = data.image_url || '';
    const city = data.city || '';
    const district = data.district || '';
    const category = data.category || '經典小吃';
    const note = data.note || '';
    const latitude = data.latitude !== null && data.latitude !== undefined && !isNaN(data.latitude) ? Number(data.latitude) : null;
    const longitude = data.longitude !== null && data.longitude !== undefined && !isNaN(data.longitude) ? Number(data.longitude) : null;

    await env.DB.prepare(
      `UPDATE places 
       SET name = ?, url = ?, food_url = ?, map_url = ?, image_url = ?, city = ?, district = ?, category = ?, note = ?, latitude = ?, longitude = ?
       WHERE id = ?`
    )
      .bind(name, food_url, food_url, map_url, image_url, city, district, category, note, latitude, longitude, id)
      .run();

    return new Response(
      JSON.stringify({ success: true, message: 'Place updated successfully' }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...CORS_HEADERS,
        },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
};

// DELETE: 刪除美食地點
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    if (!env.DB) {
      return new Response(JSON.stringify({ error: 'D1 Database not bound' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    await env.DB.prepare('DELETE FROM places WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true, message: 'Place deleted' }), {
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS,
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
};
