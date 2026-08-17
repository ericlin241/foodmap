# FoodMap 台灣美食地圖 (FoodMap - Taiwan Gourmet Map)

專為長輩與家庭設計的互動式美食地圖 Web 應用程式。

解決通訊軟體（如 LINE 群組）分享 Google 地圖景點與食記連結容易被訊息洗版、日後難以檢索與規劃的痛點。

---

## 🌟 核心特色

1. **👵👴 長輩友善設計 (Senior-Friendly UI/UX)**
   - **大字體、高對比、超大點擊觸控區**，閱讀輕鬆不吃力。
   - **雙檢視切換**：手機版支援「地圖模式」與「列表模式」一鍵快速切換，以及底部滑動抽屜（Bottom Sheet）。
   - **一鍵導航**：卡片與地圖彈窗內建大按鈕，直接開啟 Google 地圖進行即時路線導航或查看原始評論。

2. **⚡ Cloudflare 全端現代架構**
   - **前端框架**：Vite + React + Tailwind CSS + Lucide Icons。
   - **後端 API**：Cloudflare Pages Functions (`/api/places`)，支援完整的 RESTful API (GET / POST / DELETE)。
   - **資料持久化**：Cloudflare D1 Serverless SQL 資料庫，儲存店名、Google Maps 連結、自訂照片、縣市行政區與推薦備註。
   - **免 API Key 地圖**：採用 Leaflet.js + OpenStreetMap，流暢平滑平移（Fly to），無額外額度費用負擔。

3. **🔍 智慧檢索與多維度聯動篩選**
   - **台灣 22 縣市 & 368 鄉鎮市區連動選單**。
   - **多條件即時搜尋**：店名、備註關鍵字、行政區、甚至隨機抽籤「今天吃什麼！」。
   - **地圖點擊選點**：新增地點時支援直接在地圖上點擊獲取精確經緯度。
   - **分享與複製**：一鍵複製店家資訊與分享至 LINE。

---

## 🛠️ 技術架構 (Tech Stack)

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React
- **Map Engine**: Leaflet, React-Leaflet, OpenStreetMap
- **Backend / Serverless**: Cloudflare Pages Functions
- **Database**: Cloudflare D1 (SQLite-compatible Serverless SQL)
- **Deployment & CI/CD**: Cloudflare Pages + GitHub Actions / Git Integration

---

## 📁 專案結構 (Directory Structure)

```text
FoodMap/
├── functions/               # Cloudflare Pages Functions (後端 API)
│   └── api/
│       ├── [[path]].ts      # 萬用路由處理
│       └── places.ts        # /api/places GET, POST, DELETE 端點
├── migrations/              # Cloudflare D1 資料庫遷移檔
│   └── 0001_initial_schema.sql
├── public/                  # 靜態資源 (圖標、favicon、預設美食封面)
├── src/
│   ├── components/          # 模組化 UI 組件
│   │   ├── AddPlaceModal.tsx# 新增美食地點彈窗 (支援地圖選點)
│   │   ├── FilterBar.tsx    # 縣市/行政區/關鍵字篩選器
│   │   ├── Header.tsx       # 頂部導航列 (含長輩大字模式切換)
│   │   ├── MapView.tsx      # Leaflet 互動地圖組件
│   │   ├── PlaceCard.tsx    # 美食地點卡片 (一鍵導航、複製、刪除)
│   │   ├── PlaceDetailModal.tsx # 美食詳情彈窗
│   │   ├── RandomWheel.tsx  # 「今天吃什麼？」美食轉盤抽籤
│   │   └── StatsModal.tsx   # 美食地圖統計數據 (各縣市收藏數)
│   ├── data/
│   │   ├── initialPlaces.ts # 預設示範資料 (台灣必吃私房名單)
│   │   └── taiwanDistricts.ts # 台灣各縣市行政區座標資料
│   ├── hooks/
│   │   └── usePlaces.ts     # 整合 D1 API 與 LocalStorage Fallback 的 Data Hook
│   ├── types/
│   │   └── index.ts         # TypeScript 型別定義
│   ├── App.tsx              # 主應用程式 (Desktop 雙欄 + Mobile 抽屜/切換)
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
  image_url TEXT,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  category TEXT DEFAULT '小吃',
  note TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
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
> 本地開發模式下，如果尚未綁定 Cloudflare D1，應用程式會自動無縫降級為 **IndexedDB / LocalStorage 本地儲存**，所有新增、刪除、篩選功能皆可完整操作！

### 3. 使用 Wrangler 模擬 Cloudflare D1 全端環境
```bash
# 建立本地 D1 資料庫測試實例
npx wrangler d1 execute foodmap-db --local --file=./migrations/0001_initial_schema.sql

# 啟動 Cloudflare Pages 本地全端伺服器 (包含 Functions & D1)
npx wrangler pages dev dist --d1 DB=foodmap-db
```

---

## ☁️ 部署至 Cloudflare Pages

### 步驟 1：建立 Cloudflare D1 資料庫
```bash
npx wrangler d1 create foodmap-db
```
輸出會得到 `database_id`，請將其填入 `wrangler.toml` 中的 `database_id` 欄位。

### 步驟 2：執行資料庫 Schema 遷移
```bash
npx wrangler d1 execute foodmap-db --remote --file=./migrations/0001_initial_schema.sql
```

### 步驟 3：推送至 GitHub 並在 Cloudflare Pages 綁定
1. 將專案推送到 GitHub。
2. 至 [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages** > **Create application** > **Pages** > 連結 GitHub 專案。
3. 設定建置參數：
   - **Framework Preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. 進入 Pages 專案的 **Settings** > **Functions** > **D1 database bindings**：
   - Variable name: `DB`
   - D1 database: 選擇 `foodmap-db`
5. 點擊 **Save and Deploy** 即可完成自動上線！

---

## 💡 長輩使用貼心指引

1. **收到 LINE 上的 Google 地圖分享連結時**：
   - 複製連結或店名，打開「美食地圖」，按右下角橘色「➕ 新增私房美食」按鈕。
   - 貼上店名與連結，點選縣市與行政區，寫下推薦的小吃（例如「一定要點紅燒牛肉麵、小菜豆干」），按儲存！
2. **要出門吃飯但不知道吃哪家？**
   - 點選上方「🎲 今天吃什麼？」，系統會自動從收藏的美食中隨機抽選一家，並提供一鍵導航！
3. **字體太小看不清楚？**
   - 點擊頂部右上角的「👵 長輩大字模式」，整頁字體與卡片將自動切換為超大尺寸！
