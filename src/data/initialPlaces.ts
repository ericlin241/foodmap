import { Place } from '../types';

export const INITIAL_PLACES: Place[] = [
  {
    id: 'place-1',
    name: '林東芳牛肉麵',
    food_url: 'https://hululu.tw/lin-dong-fang/',
    map_url: 'https://maps.app.goo.gl/L7H3ZfQjB5Q8Y4vL7',
    image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80',
    city: '台北市',
    district: '中山區',
    category: '傳統麵食',
    note: '老字號牛肉麵！湯頭濃郁帶有獨門牛油香，半筋半肉超軟嫩，小菜花干必點！',
    latitude: 25.0489,
    longitude: 121.5385,
    created_at: '2026-08-10 12:30:00'
  },
  {
    id: 'place-2',
    name: '阜杭豆漿',
    food_url: 'https://www.walkerland.com.tw/article/view/367890',
    map_url: 'https://maps.app.goo.gl/mE3ZfQjB5Q8Y4vM8',
    image_url: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=800&auto=format&fit=crop&q=80',
    city: '台北市',
    district: '中正區',
    category: '早午餐/豆漿',
    note: '米其林必比登推薦！厚餅夾蛋油條香味撲鼻，鹹豆漿加辣油更是絕配。',
    latitude: 25.0441,
    longitude: 121.5248,
    created_at: '2026-08-11 08:15:00'
  },
  {
    id: 'place-3',
    name: '文章牛肉湯 (安平總店)',
    food_url: 'https://aniseblog.tw/223456',
    map_url: 'https://maps.app.goo.gl/JqB5Q8Y4vL7H3ZfQ8',
    image_url: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=800&auto=format&fit=crop&q=80',
    city: '台南市',
    district: '安平區',
    category: '經典小吃',
    note: '台南在地代表溫體牛肉湯！湯頭甘甜鮮美，肉質粉嫩沾特製醬油膏薑絲。',
    latitude: 22.9995,
    longitude: 120.1685,
    created_at: '2026-08-12 11:20:00'
  },
  {
    id: 'place-4',
    name: '巷仔內私房炭烤秘密基地',
    food_url: 'https://www.instagram.com/p/C3SecretFood/',
    map_url: '', // 示範無 Google 地圖連結，只出現在列表
    image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    city: '台南市',
    district: '中西區',
    category: '夜市必吃',
    note: '在地人推薦的隱藏版炭烤，尚未建立 Google 商家地圖，營業時間請看食記介紹！',
    latitude: null,
    longitude: null,
    created_at: '2026-08-13 18:40:00'
  },
  {
    id: 'place-5',
    name: '宮原眼科 / 醉月樓',
    food_url: 'https://travel.yam.com/article/112233',
    map_url: 'https://maps.app.goo.gl/K8Y4vL7H3ZfQjB5Q1',
    image_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
    city: '台中市',
    district: '中區',
    category: '甜品冰品',
    note: '歷史紅磚建築改建，冰淇淋口味豐富配料超霸氣，拍照打卡吃下午茶非常舒適。',
    latitude: 24.1378,
    longitude: 120.6835,
    created_at: '2026-08-14 15:10:00'
  },
  {
    id: 'place-6',
    name: '海慶海鮮餐廳',
    food_url: 'https://nigi33kimo.pixnet.net/blog/post/456789',
    map_url: 'https://maps.app.goo.gl/W2Y4vL7H3ZfQjB5Q3',
    image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80',
    city: '高雄市',
    district: '苓雅區',
    category: '海鮮熱炒',
    note: '澎湖野生直送海鮮，鮮度破表！招牌墨魚炒飯、金沙中卷、鮮魚米粉湯每桌必點。',
    latitude: 22.6205,
    longitude: 120.3142,
    created_at: '2026-08-15 19:00:00'
  }
];
