-- Thành viên chung theo Gia đình.
-- Chỉ tạo cấu trúc bảng; không tự tạo Thành viên từ Biệt danh cũ.
-- Áp dụng trong Supabase SQL Editor sau khi xác minh project cooking plan.
BEGIN;

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

-- Cùng một tên được phép xuất hiện ở các Gia đình khác nhau.
CREATE UNIQUE INDEX IF NOT EXISTS member_household_name_unique
  ON public.member (household_code, lower(btrim(name)));

ALTER TABLE public.member ENABLE ROW LEVEL SECURITY;

-- Theo mô hình Mã nhà hiện có: không có xác thực cá nhân.
-- Client lọc dữ liệu bằng household_code; chỉ hỗ trợ đọc và thêm trong bản đầu.
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

DO $member_realtime$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public' AND tablename = 'member'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.member;
  END IF;
END;
$member_realtime$;

COMMIT;
