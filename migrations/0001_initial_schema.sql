-- Cloudflare D1 Initial Migration for FoodMap
CREATE TABLE IF NOT EXISTS places (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT,
  image_url TEXT,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  category TEXT DEFAULT '特色小吃',
  note TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  rating REAL DEFAULT 5.0,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_places_city_district ON places(city, district);
CREATE INDEX IF NOT EXISTS idx_places_created_at ON places(created_at DESC);
