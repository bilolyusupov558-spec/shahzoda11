# SHAHZODA RESTARANI - SUPABASE ULASH QO'LLANMASI 🚀

Ushbu loyihaga Supabase to'liq ulandi! Endi barcha taomlar, mijozlar buyurtmalari, xarajatlar va promokodlar bulutli ma'lumotlar bazasida (PostgreSQL) saqlanadi va **real vaqtda (Realtime)** avtomatik sinxronlanadi.

---

## 1-QADAM: Supabase hisobini ochish va yangi loyiha yaratish
1. [supabase.com](https://supabase.com) saytiga kiring va ro'yxatdan o'ting (yoki GitHub orqali kiring).
2. **"New Project"** (Yangi loyiha) tugmasini bosing:
   - **Name**: `Shahzoda Restarani` (yoki ixtiyoriy nom)
   - **Database Password**: Kuchli parol o'ylab toping va eslab qoling.
   - **Region**: O'zbekistonga eng yaqin server (masalan: `Frankfurt` yoki `Singapore`).
   - **Pricing Plan**: Free (Bepul).
3. **"Create new project"** tugmasini bosing va 1-2 daqiqa kuting.

---

## 2-QADAM: Bazadagi jadvallarni yaratish (SQL Editor)
Loyiha papkasida tayyor **`supabase_schema.sql`** fayli yaratildi.

1. Supabase boshqaruv panelining chap menyusidan **"SQL Editor"** bo'limiga kiring.
2. **"New query"** tugmasini bosing.
3. Loyihadagi `supabase_schema.sql` fayli ichidagi barcha kodlarni nusxalang (Ctrl+A, Ctrl+C).
4. SQL Editor oynasiga qo'ying va pastdagi yashil **"Run"** tugmasini bosing.
5. `Success` xabari chiqadi. Natijada avtomatik ravishda:
   - `dishes` (taomlar va boshlang'ich 8 ta taom)
   - `orders` (mijoz buyurtmalari)
   - `expenses` (admin xarajatlari)
   - `used_promo_phones` (promokod ishlatgan raqamlar)
   - Realtime (jonli yangilanishlar) funksiyasi ishga tushadi!

---

## 3-QADAM: Kalitlarni saytga ulash (config.js)
1. Supabase chap menyusidan pastdagi tishli g'ildirakcha ⚙️ **"Project Settings"** bo'limiga kiring.
2. U yerdan **"API"** bo'limini tanlang.
3. Quyidagi 2 ta qiymatni nusxalab oling:
   - **Project URL**: `https://xxxxxxxxxxxxxxxx.supabase.co`
   - **Project API Keys (anon / public)**: `eyJhbGciOi...`
4. Loyihangizdagi **`config.js`** faylini oching va mos joyga qo'ying:

```javascript
window.ENV = {
  // O'zingizning Supabase loyihangizdan olingan kalitlarni qo'ying:
  SUPABASE_URL: "https://SIZNING_LOYIHA_ID.supabase.co",
  SUPABASE_ANON_KEY: "SIZNING_ANON_KEY",

  ADMIN_PASSWORD: "bahrom12",
  DELIVERY_COST: 10000,
  PROMOS: { ... }
};
```

---

## 4-QADAM: Tayyor!
Saytni brauzerda oching (`index.html`).
- Admin paneliga kirsangiz, yuqori burchakda:
  **`🟢 Supabase: Ulangan`** yozuvi ko'rinadi.
- Biror mijoz buyurtma berganda, admin paneli yoki boshqa telefonlarda sahifani yangilamasdan (refresh qilmasdan) yangi buyurtma darhol paydo bo'ladi!
- Agar Supabase kalitlari hali kiritilmagan bo'lsa, sayt buzilmaydi va avtomatik ravishda **`🟠 Supabase: Lokal rejim`**da ishlashda davom etadi.
