-- ==============================================================================
-- COOKING PLANNER PWA - SUPABASE DATABASE SCHEMA
-- Bảng dữ liệu, Ràng buộc CASCADE và Cấu hình Supabase Realtime
-- ==============================================================================

-- 1. BẢNG HOUSEHOLDS (Không gian Gia đình dùng chung)
CREATE TABLE IF NOT EXISTS households (
  code TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. BẢNG DISHES (Món ăn trong Menu gia đình)
CREATE TABLE IF NOT EXISTS dishes (
  id TEXT PRIMARY KEY,
  household_code TEXT NOT NULL,
  name TEXT NOT NULL,
  tag TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_dishes_household_code ON dishes(household_code);

-- 3. BẢNG PLAN_ITEMS (Kế hoạch bữa ăn hàng tuần)
-- Ràng buộc: Khi xóa Món ăn (dishes), tự động xóa sạch khỏi Kế hoạch (ON DELETE CASCADE)
CREATE TABLE IF NOT EXISTS plan_items (
  id TEXT PRIMARY KEY,
  household_code TEXT NOT NULL,
  date TEXT NOT NULL, -- Định dạng chuẩn ISO YYYY-MM-DD
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
  dish_id TEXT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_meal_slot_dish UNIQUE (household_code, date, meal_type, dish_id)
);

CREATE INDEX IF NOT EXISTS idx_plan_items_lookup ON plan_items(household_code, date);
CREATE INDEX IF NOT EXISTS idx_plan_items_dish_id ON plan_items(dish_id);

-- 4. BẢNG PLAN_COMMENTS (Dặn dò, ghi chú cách nấu / đi chợ cho từng Món ăn trong Kế hoạch)
-- Ràng buộc: Khi Món ăn bị gỡ khỏi bữa ăn, các bình luận dặn dò tự động xóa (ON DELETE CASCADE)
CREATE TABLE IF NOT EXISTS plan_comments (
  id TEXT PRIMARY KEY,
  household_code TEXT NOT NULL,
  plan_item_id TEXT NOT NULL REFERENCES plan_items(id) ON DELETE CASCADE,
  author_nickname TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_plan_comments_item ON plan_comments(household_code, plan_item_id);

-- 5. BẢNG MEMBER (Thành viên chung theo Gia đình, chỉ đọc/thêm trong bản đầu)
CREATE TABLE IF NOT EXISTS public.member (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_code TEXT NOT NULL
    CHECK (
      household_code = upper(btrim(household_code))
      AND char_length(household_code) >= 3
      AND household_code ~ '^[A-Z0-9-]+$'
    ),
  name TEXT NOT NULL
    CHECK (name = btrim(name) AND char_length(name) BETWEEN 1 AND 30),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS member_household_name_unique
  ON public.member (household_code, lower(btrim(name)));

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Zero-credential shared access: Truy cập theo Household Code
-- ==============================================================================

ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member ENABLE ROW LEVEL SECURITY;

-- Cho phép client đọc/ghi dựa trên anon key
DROP POLICY IF EXISTS "Public access to households" ON households;
CREATE POLICY "Public access to households" ON households FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to dishes" ON dishes;
CREATE POLICY "Public access to dishes" ON dishes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to plan_items" ON plan_items;
CREATE POLICY "Public access to plan_items" ON plan_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to plan_comments" ON plan_comments;
CREATE POLICY "Public access to plan_comments" ON plan_comments FOR ALL USING (true) WITH CHECK (true);

-- Thành viên không có xác thực cá nhân; client lọc theo household_code.
DO $member_policies$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'member'
      AND policyname = 'Read household members'
  ) THEN
    CREATE POLICY "Read household members" ON public.member
      FOR SELECT TO anon USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'member'
      AND policyname = 'Add household members'
  ) THEN
    CREATE POLICY "Add household members" ON public.member
      FOR INSERT TO anon WITH CHECK (true);
  END IF;
END;
$member_policies$;

GRANT SELECT, INSERT ON public.member TO anon;

-- ==============================================================================
-- SUPABASE REALTIME REPLICATION
-- Kích hoạt WebSocket broadcasts khi dữ liệu Menu / Kế hoạch / Dặn dò thay đổi
-- ==============================================================================

-- Bật replica full để nhận đầy đủ payload khi xóa / sửa
ALTER TABLE dishes REPLICA IDENTITY FULL;
ALTER TABLE plan_items REPLICA IDENTITY FULL;
ALTER TABLE plan_comments REPLICA IDENTITY FULL;

-- Thêm các bảng vào publication realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'dishes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE dishes;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'plan_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE plan_items;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'plan_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE plan_comments;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public' AND tablename = 'member'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.member;
  END IF;
END $$;
