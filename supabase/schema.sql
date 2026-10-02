-- ==============================================================================
-- COOKING PLANNER PWA - SUPABASE DATABASE SCHEMA
-- Bảng dữ liệu, Ràng buộc CASCADE và Cấu hình Supabase Realtime
-- ==============================================================================

-- 1. BẢNG HOUSEHOLDS (Không gian Gia đình dùng chung)
CREATE TABLE IF NOT EXISTS households (
  code TEXT PRIMARY KEY,
  members TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
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

-- 5. BẢNG PLAN_DAY_COOKS (Phân công người nấu theo ngày trong Kế hoạch)
CREATE TABLE IF NOT EXISTS plan_day_cooks (
  household_code TEXT NOT NULL,
  date TEXT NOT NULL, -- Định dạng chuẩn ISO YYYY-MM-DD
  cook_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (household_code, date)
);

CREATE INDEX IF NOT EXISTS idx_plan_day_cooks_lookup ON plan_day_cooks(household_code, date);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Zero-credential shared access: Truy cập theo Household Code
-- ==============================================================================

ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_day_cooks ENABLE ROW LEVEL SECURITY;

-- Cho phép client đọc/ghi dựa trên anon key
DROP POLICY IF EXISTS "Public access to households" ON households;
CREATE POLICY "Public access to households" ON households FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to dishes" ON dishes;
CREATE POLICY "Public access to dishes" ON dishes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to plan_items" ON plan_items;
CREATE POLICY "Public access to plan_items" ON plan_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to plan_comments" ON plan_comments;
CREATE POLICY "Public access to plan_comments" ON plan_comments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to plan_day_cooks" ON plan_day_cooks;
CREATE POLICY "Public access to plan_day_cooks" ON plan_day_cooks FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- SUPABASE REALTIME REPLICATION
-- Kích hoạt WebSocket broadcasts khi dữ liệu Menu / Kế hoạch / Dặn dò thay đổi
-- ==============================================================================

-- Bật replica full để nhận đầy đủ payload khi xóa / sửa
ALTER TABLE households REPLICA IDENTITY FULL;
ALTER TABLE dishes REPLICA IDENTITY FULL;
ALTER TABLE plan_items REPLICA IDENTITY FULL;
ALTER TABLE plan_comments REPLICA IDENTITY FULL;
ALTER TABLE plan_day_cooks REPLICA IDENTITY FULL;

-- Thêm các bảng vào publication realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'households'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE households;
  END IF;

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
    WHERE pubname = 'supabase_realtime' AND tablename = 'plan_day_cooks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE plan_day_cooks;
  END IF;
END $$;

