-- Thành viên deletion preserves Menu, Kế hoạch, and stored comment author names.
BEGIN;

DO $member_delete_policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'member'
      AND policyname = 'Delete household members'
  ) THEN
    CREATE POLICY "Delete household members" ON public.member
      FOR DELETE TO anon USING (true);
  END IF;
END;
$member_delete_policy$;

GRANT DELETE ON public.member TO anon;

-- The client listens to unfiltered DELETE notices and reloads its current Gia đình.
-- This also enables old-record replication without depending on its RLS payload.
ALTER TABLE public.member REPLICA IDENTITY FULL;

COMMIT;
