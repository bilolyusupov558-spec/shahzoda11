-- ============================================================
-- SHAHZODA RESTORANI - SUPABASE MA'LUMOTLAR BAZASI STRUKTURASI
-- Ushbu SQL kodni Supabase Dashboard -> SQL Editor bo'limiga nusxalab,
-- "Run" tugmasini bosing.
-- ============================================================

-- 1. TAOMLAR JADVALI (dishes)
CREATE TABLE IF NOT EXISTS public.dishes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    category TEXT NOT NULL DEFAULT '2-taom',
    img TEXT,
    "desc" TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. BUYURTMALAR JADVALI (orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    date TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    customer JSONB NOT NULL,
    address JSONB NOT NULL,
    items JSONB NOT NULL,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    delivery NUMERIC NOT NULL DEFAULT 10000,
    discount NUMERIC NOT NULL DEFAULT 0,
    promo_code TEXT,
    total NUMERIC NOT NULL DEFAULT 0,
    change_notice TEXT,
    status TEXT NOT NULL DEFAULT 'Kutilmoqda',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. XARAJATLAR JADVALI (expenses)
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    date TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    "desc" TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    category TEXT NOT NULL DEFAULT 'Boshqa',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. PROMOKOD ISHLATGAN TELEFON RAQAMLAR (used_promo_phones)
CREATE TABLE IF NOT EXISTS public.used_promo_phones (
    phone TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================
-- XAVFSIZLIK SOZLAMALARI (ROW LEVEL SECURITY - RLS)
-- ============================================================
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.used_promo_phones ENABLE ROW LEVEL SECURITY;

-- Barcha jadvallarga anon (sayt foydalanuvchilari) uchun ruxsat berish:
-- (Shahzoda saytidan buyurtma berish, taomlarni ko'rish va admin amallari uchun)

DROP POLICY IF EXISTS "Public access for dishes" ON public.dishes;
CREATE POLICY "Public access for dishes" ON public.dishes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for orders" ON public.orders;
CREATE POLICY "Public access for orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for expenses" ON public.expenses;
CREATE POLICY "Public access for expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for used_promo_phones" ON public.used_promo_phones;
CREATE POLICY "Public access for used_promo_phones" ON public.used_promo_phones FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- REALTIME FUNKSIYASINI YOQISH
-- Buyurtma tushganda yoki taom soni o'zgarganda sahifalar avtomatik yangilanishi uchun:
-- ============================================================
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.dishes, public.orders, public.expenses, public.used_promo_phones;
COMMIT;

-- ============================================================
-- BOSHLANG'ICH TAOMLAR (SEED DATA)
-- Agar jadval bo'sh bo'lsa, asosiy taomlarni qo'shadi:
-- ============================================================
INSERT INTO public.dishes (id, name, price, stock, category, "desc", img)
VALUES
  ('d1', 'Shahzoda To''y Oshi', 38000, 25, '2-taom', 'Maxsus qo''y go''shti, devzira guruch va sariq sabzi', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80'),
  ('d2', 'Yakkabog'' Qozon Kabob', 48000, 18, '2-taom', 'Qarsildoq go''sht, qovurilgan kartoshkalar bilan', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80'),
  ('d3', 'Shohona Qo''y Sho''rva', 32000, 15, '1-taom', 'Tiniq sho''rva, darmonli sabzavotlar va mayin go''sht', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80'),
  ('d4', 'Qo''lda Cho''zilgan Lag''mon', 34000, 20, '1-taom', 'Shirin qayla, qizil qalampir va sarxil ko''katlar', 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80'),
  ('d5', 'Achichiq Salad', 12000, 35, 'salat', 'Yangi pomidor, bodring, piyoz va rayhon', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'),
  ('d6', 'Suzmali Shahzoda Salati', 14000, 22, 'salat', 'Tog'' rayhoni, sarimsoq va muzdek suzma', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80'),
  ('d7', 'Tandir Non (Issiq)', 5000, 50, 'ichimlik', 'Yakkabog'' tandirida pishgan shirmoy non', 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=600&q=80'),
  ('d8', 'Ko''k Choy (Choynakda)', 4000, 100, 'ichimlik', 'Tog'' giyohlari bilan damlangan xushbo''y choy', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80')
ON CONFLICT (id) DO NOTHING;
