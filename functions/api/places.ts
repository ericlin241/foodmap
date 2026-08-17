interface Env {
  DB: D1Database;
}

// GET: 查詢所有美食地點
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { env } = context;
    if (!env.DB) {
      return new Response(JSON.stringify({ error: 'D1 Database not bound' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { results } = await env.DB.prepare(
      'SELECT * FROM places ORDER BY created_at DESC'
    ).all();

    return new Response(JSON.stringify(results || []), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data: any = await request.json();

    const id = data.id || 'place-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    const name = data.name;
    const url = data.url || '';
    const image_url = data.image_url || '';
    const city = data.city || '';
    const district = data.district || '';
    const category = data.category || '經典小吃';
    const note = data.note || '';
    const latitude = Number(data.latitude);
    const longitude = Number(data.longitude);
    const rating = Number(data.rating || 5.0);
    const created_at = data.created_at || new Date().toISOString();

    if (!name || !city || isNaN(latitude) || isNaN(longitude)) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await env.DB.prepare(
      `INSERT INTO places (id, name, url, image_url, city, district, category, note, latitude, longitude, rating, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(id, name, url, image_url, city, district, category, note, latitude, longitude, rating, created_at)
      .run();

    return new Response(
      JSON.stringify({ success: true, id, message: 'Place added successfully' }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data: any = await request.json();
    const id = data.id;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Place ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const name = data.name;
    const url = data.url || '';
    const image_url = data.image_url || '';
    const city = data.city || '';
    const district = data.district || '';
    const category = data.category || '經典小吃';
    const note = data.note || '';
    const latitude = Number(data.latitude);
    const longitude = Number(data.longitude);

    await env.DB.prepare(
      `UPDATE places 
       SET name = ?, url = ?, image_url = ?, city = ?, district = ?, category = ?, note = ?, latitude = ?, longitude = ?
       WHERE id = ?`
    )
      .bind(name, url, image_url, city, district, category, note, latitude, longitude, id)
      .run();

    return new Response(
      JSON.stringify({ success: true, message: 'Place updated successfully' }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await env.DB.prepare('DELETE FROM places WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true, message: 'Place deleted' }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
