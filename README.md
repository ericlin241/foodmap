# FoodMap 台灣美食地圖 (FoodMap - Taiwan Gourmet Map)

現代化、高效流暢的互動式美食地圖 Web 應用程式。

解決社群與通訊軟體（如 LINE 群組、Instagram、部落格）分享 Google 地圖景點與食記連結容易被訊息洗版、日後難以檢索與規劃的痛點。

---

## 🌟 核心特色

1. **📍 Google Maps 全格式智慧解析與精確定位**
   - **支援多元 Google 地圖連結格式**：短網址（`maps.app.goo.gl`、`goo.gl/maps`）、地點特徵網址（`!3d!4d`、`!2d!3d`、`CID`）、搜尋與導航連結（`?q=`、`&ll=`、`?daddr=`）、直接座標（`lat, lng`）以及自通訊軟體貼上之夾帶文字。
   - **精準圖釘定位**：後端與前端解析引擎直接提取 Google 地圖原始圖釘店家座標，不再盲目對齊行政區中心。

2. **📱 智慧響應式視角與操作體驗**
   - **手機版視角平衡**：選取店家時，圖釘精準定位於頂部美食圖卡下緣與底部導航列上緣之間的「可見視窗正中間」。
   - **電腦版視角優化**：圖釘偏左下方顯示，留出充裕視野並避免與右上角店家資訊卡片衝突。
   - **縮放拖曳不強制賦歸**：僅在使用者切換店家或變更篩選時執行單次平移；手動縮放（Zoom）或平移（Pan）後，背景資料同步不會再強制重置畫面位置。

3. **🍲 美食食記縮圖自動讀取與一鍵導航**
   - **OpenGraph 自動縮圖**：貼上食記或介紹文章連結，自動解析封面圖作為店家卡片預覽。
   - **一鍵導航與介紹**：直覺切換 Google 地圖即時路線規劃、查看原始食記文章或一鍵複製分享。

4. **🔍 智慧多維度篩選與「今天吃什麼？」轉盤**
   - **台灣 22 縣市 & 368 鄉鎮市區連動選單**。
   - **多條件即時搜尋**：支援店名、備註關鍵字、料理類別與行政區即時過濾。
   - **隨機抽籤轉盤**：根據當前篩選範圍隨機抽選店家，解決選擇困難！
   - **地圖概況統計**：一覽各地區私房名單分佈統計。

5. **⚡ Cloudflare 全端現代架構 & 離線容錯**
   - **前端框架**：Vite + React + Tailwind CSS + Lucide Icons。
   - **地圖引擎**：Leaflet.js + React-Leaflet + OpenStreetMap，流暢無額度負擔。
   - **後端 API & 資料庫**：Cloudflare Pages Functions + Cloudflare D1 Serverless SQL 資料庫。
   - **智慧快取容錯**：具備 LocalStorage 自動同步機制，在離線或網路不穩時依然可流暢瀏覽與暫存。

---

## 🛠️ 技術架構 (Tech Stack)

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React
- **Map Engine**: Leaflet, React-Leaflet, OpenStreetMap
- **Backend / Serverless**: Cloudflare Pages Functions (`/api/places`, `/api/resolve-maps`, `/api/preview`)
- **Database**: Cloudflare D1 (SQLite-compatible Serverless SQL)
- **Deployment & CI/CD**: Cloudflare Pages + GitHub Pages (GitHub Actions)

---

## 📁 專案結構 (Directory Structure)

```text
FoodMap/
├── functions/               # Cloudflare Pages Functions (後端 API)
│   └── api/
│       ├── places.ts        # /api/places GET, POST, PUT, DELETE 端點
│       ├── preview.ts       # /api/preview 網頁 OpenGraph 縮圖解析
│       └── resolve-maps.ts  # /api/resolve-maps Google Maps 連結深度解析
├── migrations/              # Cloudflare D1 資料庫遷移檔
│   └── 0001_initial_schema.sql
├── public/                  # 靜態資源 (圖標、favicon)
├── src/
│   ├── components/          # 模組化 UI 組件
│   │   ├── AddPlaceModal.tsx# 新增/編輯美食地點彈窗 (即時座標解析與驗證)
│   │   ├── AutoFoodImage.tsx# 美食封面與預設圖示組件
│   │   ├── FilterBar.tsx    # 縣市/行政區/類別/關鍵字篩選器
│   │   ├── Header.tsx       # 頂部導航列 (新增、轉盤、統計入口)
│   │   ├── MapView.tsx      # Leaflet 互動地圖 (智慧視角、縮放不賦歸)
│   │   ├── PlaceCard.tsx    # 美食地點卡片 (一鍵導航、複製、編輯、刪除)
│   │   ├── RandomWheel.tsx  # 「今天吃什麼？」美食轉盤抽籤
│   │   └── StatsModal.tsx   # 美食地圖統計數據 (各縣市收藏數)
│   ├── data/
│   │   ├── initialPlaces.ts # 初始資料清單
│   │   └── taiwanDistricts.ts # 台灣各縣市行政區座標資料
│   ├── hooks/
│   │   └── usePlaces.ts     # 整合 D1 API 與 LocalStorage 的 Data Hook
│   ├── types/
│   │   └── index.ts         # TypeScript 型別定義
│   ├── utils/
│   │   ├── geocoding.ts     # 多格式 Google 地圖座標解析與地理編碼
│   │   └── linkPreview.ts   # 網頁 OpenGraph 縮圖抓取工具
│   ├── App.tsx              # 主應用程式 (Desktop 雙欄 + Mobile 視圖切換)
│   ├── index.css            # Tailwind 與自訂動畫樣式
│   └── main.tsx             # React 進入點
├── wrangler.toml            # Cloudflare D1 與 Pages 配置
├── tailwind.config.js       # Tailwind CSS 設定檔
├── package.json
└── README.md
```

---

## 🗄️ 資料庫結構 (Cloudflare D1 Schema)

```sql
CREATE TABLE IF NOT EXISTS places (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT,
  food_url TEXT,
  map_url TEXT,
  image_url TEXT,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  category TEXT DEFAULT '經典小吃',
  note TEXT,
  latitude REAL,
  longitude REAL,
  rating REAL DEFAULT 5.0,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_places_city_district ON places(city, district);
```

---

## 🚀 本地開發與測試 (Local Development)

### 1. 安裝相依套件
```bash
npm install
```

### 2. 啟動 Vite 本地開發伺服器
```bash
npm run dev
```

### 3. 本地編譯檢查
```bash
npm run build
```

---

## ☁️ 部署與發布 (Deployment)

- **GitHub Pages**：推送至 `main` 分支後，GitHub Actions 會自動執行測試、編譯並部署至 GitHub Pages。
- **Cloudflare Pages**：直接連接 GitHub 儲存庫或透過 Wrangler 進行發布，全端 API 與 D1 資料庫自動同步生效。
