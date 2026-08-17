CREATE TABLE IF NOT EXISTS places (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT,
  food_url TEXT,
  map_url TEXT,
  image_url TEXT,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  category TEXT NOT NULL,
  note TEXT,
  latitude REAL,
  longitude REAL,
  created_at TEXT NOT NULL
);
